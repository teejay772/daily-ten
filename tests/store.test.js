import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, emptyState, loadState, saveState, recordDay,
  nextUnplayedDay, summary, exportBackup, importBackup,
} from '../js/store.js';

const fakeStorage = () => {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: (k) => { data.delete(k); },
  };
};
const brokenStorage = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
  removeItem() { throw new Error('blocked'); },
};

const dayList = [
  { id: 'day-001', number: 1, theme: 'Art history', title: 'One' },
  { id: 'day-002', number: 2, theme: 'Literature', title: 'Two' },
  { id: 'day-003', number: 3, theme: 'Art history', title: 'Three' },
];
// A finished session in which a gets `aRight` questions right and b gets `bRight`, 3 points each.
const finished = (dayId, aRight, bRight) => ({
  dayId, index: 9, phase: 'finished',
  picks: { a: 0, b: 0 }, hintOpen: false, hintUsed: { a: false, b: false },
  results: Array.from({ length: 10 }, (_, i) => ({
    questionId: `${dayId}-q${i + 1}`,
    picks: { a: 0, b: 0 },
    correct: { a: i < aRight, b: i < bRight },
    hintUsed: { a: false, b: false },
    points: { a: i < aRight ? 3 : 0, b: i < bRight ? 3 : 0 },
  })),
});
const play = (state, day, aRight, bRight) =>
  recordDay(state, day, finished(day.id, aRight, bRight), '2026-11-19', 30);

test('an empty state has the documented shape', () => {
  assert.deepEqual(emptyState(), { version: 1, names: { a: '', b: '' }, history: [], inProgress: null });
});

test('state round-trips through storage, including a day in progress', () => {
  const storage = fakeStorage();
  const state = { ...play(emptyState(), dayList[0], 7, 4), names: { a: 'Ada', b: 'Ben' } };
  state.inProgress = { dayId: 'day-002', index: 4, phase: 'answering', picks: { a: 2, b: null },
    hintOpen: true, hintUsed: { a: true, b: false }, results: [] };
  assert.equal(saveState(storage, state), true);
  assert.ok(storage.getItem(STORAGE_KEY));
  assert.deepEqual(loadState(storage), { state, persistent: true });
});

test('blocked storage still gives a playable, non-persistent state', () => {
  assert.deepEqual(loadState(brokenStorage), { state: emptyState(), persistent: false });
  assert.deepEqual(loadState(undefined), { state: emptyState(), persistent: false });
  assert.equal(saveState(brokenStorage, emptyState()), false);
  assert.equal(saveState(undefined, emptyState()), false);
});

test('unreadable saved data yields an empty state', () => {
  for (const junk of ['not json', '{}', '{"version":2,"history":[]}', '[]', 'null']) {
    const storage = fakeStorage();
    storage.setItem(STORAGE_KEY, junk);
    assert.deepEqual(loadState(storage).state, emptyState(), junk);
  }
});

test('recording a day adds one history entry and clears the day in progress', () => {
  const before = { ...emptyState(), inProgress: finished('day-001', 7, 4) };
  const after = play(before, dayList[0], 7, 4);
  assert.equal(after.inProgress, null);
  assert.equal(after.history.length, 1);
  const entry = after.history[0];
  assert.deepEqual(
    { ...entry, results: entry.results.length },
    { dayId: 'day-001', number: 1, theme: 'Art history', title: 'One',
      playedOn: '2026-11-19', maxPoints: 30, totals: { a: 21, b: 12 }, results: 10 },
  );
  assert.equal(before.history.length, 0, 'the old state is untouched');
});

test('a replay of a recorded day does not change the score', () => {
  const once = play(emptyState(), dayList[0], 7, 4);
  const twice = play(once, dayList[0], 10, 10);
  assert.deepEqual(twice.history, once.history);
});

test('the next unplayed day is the lowest number not in the history', () => {
  let state = emptyState();
  assert.equal(nextUnplayedDay(state, dayList).id, 'day-001');
  state = play(state, dayList[0], 5, 5);
  assert.equal(nextUnplayedDay(state, dayList).id, 'day-002');
  state = play(play(state, dayList[2], 5, 5), dayList[1], 5, 5);
  assert.equal(nextUnplayedDay(state, dayList), null);
  assert.equal(nextUnplayedDay(emptyState(), []), null);
});

test('the summary adds up points, day wins, ties and accuracy by theme', () => {
  let state = emptyState();
  assert.deepEqual(summary(state), {
    daysPlayed: 0, points: { a: 0, b: 0 }, dayWins: { a: 0, b: 0, ties: 0 }, byTheme: {},
  });
  state = play(state, dayList[0], 7, 4);   // Art history: a wins
  state = play(state, dayList[1], 3, 9);   // Literature: b wins
  state = play(state, dayList[2], 6, 6);   // Art history: tie
  assert.deepEqual(summary(state), {
    daysPlayed: 3,
    points: { a: 48, b: 57 },
    dayWins: { a: 1, b: 1, ties: 1 },
    byTheme: {
      'Art history': { a: { correct: 13, total: 20 }, b: { correct: 10, total: 20 } },
      Literature: { a: { correct: 3, total: 10 }, b: { correct: 9, total: 10 } },
    },
  });
});

test('a backup restores to the same score, without the day in progress', () => {
  const state = { ...play(emptyState(), dayList[0], 7, 4), names: { a: 'Ada', b: 'Ben' } };
  const text = exportBackup({ ...state, inProgress: finished('day-002', 1, 1) });
  assert.equal(typeof text, 'string');
  assert.deepEqual(importBackup(text), state);
});

test('a wrong or damaged backup is refused with a readable message', () => {
  const good = JSON.parse(exportBackup(play(emptyState(), dayList[0], 7, 4)));
  const broken = structuredClone(good);
  delete broken.state.history[0].totals;
  const wrongVersion = { ...good, version: 99 };
  const cases = [
    ['hello', /damaged/],
    ['', /damaged/],
    ['{}', /not a Daily Ten backup/],
    ['[1,2]', /not a Daily Ten backup/],
    ['null', /not a Daily Ten backup/],
    [JSON.stringify(wrongVersion), /different version/],
    [JSON.stringify(broken), /damaged/],
    [JSON.stringify({ ...good, state: { ...good.state, history: 'x' } }), /damaged/],
  ];
  for (const [text, pattern] of cases) {
    assert.throws(() => importBackup(text), pattern, text.slice(0, 30));
  }
});
