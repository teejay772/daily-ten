import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, emptyState, loadState, saveState, recordDay,
  nextUnplayedDay, summary, exportBackup, importBackup, themeMenu, playerDayNumber, canChoose,
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

test('the theme menu groups days by theme, in the order of the score table', () => {
  const menu = themeMenu(emptyState(), dayList);
  assert.deepEqual(menu.map((t) => [t.theme, t.left, t.topics.map((x) => x.entry.id)]), [
    ['Art history', 2, ['day-001', 'day-003']],
    ['Literature', 1, ['day-002']],
  ]);
});

test('a played day is ticked in the menu and no longer counted as left', () => {
  let state = play(emptyState(), dayList[2], 5, 5);
  const art = themeMenu(state, dayList).find((t) => t.theme === 'Art history');
  assert.equal(art.left, 1);
  assert.deepEqual(art.topics.map((x) => x.played), [false, true]);
  state = play(state, dayList[1], 5, 5);
  const literature = themeMenu(state, dayList).find((t) => t.theme === 'Literature');
  assert.equal(literature.left, 0, 'a theme with nothing left stays in the menu');
  assert.equal(literature.topics.length, 1);
});

test('the theme menu copes with odd theme names, a stale history and an empty index', () => {
  assert.deepEqual(themeMenu(emptyState(), []), []);
  const odd = [
    { id: 'd1', number: 2, theme: 'constructor', title: 'A' },
    { id: 'd2', number: 1, theme: '__proto__', title: 'B' },
    { id: 'd3', number: 3, theme: 'constructor', title: 'A' },
  ];
  assert.deepEqual(themeMenu(emptyState(), odd).map((t) => [t.theme, t.left]),
    [['__proto__', 1], ['constructor', 2]]);
  const stale = play(emptyState(), { id: 'gone', number: 9, theme: 'Old', title: 'Gone' }, 5, 5);
  assert.deepEqual(themeMenu(stale, dayList).map((t) => [t.theme, t.left]),
    [['Art history', 2], ['Literature', 1]]);
});

test("a day's number for the players is its place in their own history", () => {
  let state = emptyState();
  assert.equal(playerDayNumber(state, 'day-003'), 1);
  state = play(state, dayList[2], 5, 5);
  assert.equal(playerDayNumber(state, 'day-003'), 1);
  assert.equal(playerDayNumber(state, 'day-001'), 2);
  state = play(state, dayList[0], 5, 5);
  assert.equal(playerDayNumber(state, 'day-001'), 2);
  assert.equal(playerDayNumber(state, 'day-002'), 3);
});

test('choosing is closed only while a paused day holds answers', () => {
  const paused = (dayId, answered) => ({
    ...finished(dayId, 0, 0), index: answered, phase: 'answering',
    results: finished(dayId, 0, 0).results.slice(0, answered),
  });
  assert.equal(canChoose(emptyState(), dayList), true);
  assert.equal(canChoose({ ...emptyState(), inProgress: paused('day-001', 3) }, dayList), false);
  assert.equal(canChoose({ ...emptyState(), inProgress: paused('day-001', 0) }, dayList), true,
    'a day opened by mistake, with nothing answered, does not lock the players in');
  assert.equal(canChoose({ ...emptyState(), inProgress: paused('day-999', 3) }, dayList), true,
    'a paused day that is no longer in the index');
  assert.equal(canChoose({ ...emptyState(), inProgress: { dayId: 'day-001' } }, dayList), true,
    'a damaged paused day with no list of results');
  assert.equal(canChoose(emptyState(), []), false, 'nothing to choose from');
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

test('theme names that collide with built-in object properties are counted like any other', () => {
  let state = emptyState();
  const odd = ['__proto__', 'constructor', 'toString'];
  odd.forEach((theme, i) => {
    state = play(state, { id: `day-odd-${i}`, number: i + 1, theme, title: 'Odd' }, 4, 2);
  });
  const s = summary(state);
  assert.deepEqual(Object.keys(s.byTheme).sort(), [...odd].sort());
  for (const theme of odd) {
    assert.ok(Object.hasOwn(s.byTheme, theme), theme);
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(s.byTheme, theme).value,
      { a: { correct: 4, total: 10 }, b: { correct: 2, total: 10 } },
      theme,
    );
  }
});
