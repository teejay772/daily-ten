import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession, lockIn, unlock, openHint, reveal, next,
  bothLocked, totals, maxPoints, keyToPick,
} from '../js/game.js';

const day = {
  id: 'day-test',
  questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i + 1}`, answer: i % 4 })),
};
const stubRule = ({ correct, hintUsed }) => (correct ? (hintUsed ? 1 : 5) : 0);

test('a new session starts at the first question with nothing locked', () => {
  const s = createSession(day);
  assert.deepEqual(s, {
    dayId: 'day-test', index: 0, phase: 'answering',
    picks: { a: null, b: null }, hintOpen: false,
    hintUsed: { a: false, b: false }, results: [],
  });
  assert.equal(bothLocked(s), false);
});

test('sessions are plain JSON', () => {
  let s = lockIn(createSession(day), 'a', 2);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('moves return a new session and leave the old one alone', () => {
  const s0 = createSession(day);
  const s1 = lockIn(s0, 'a', 1);
  assert.notEqual(s1, s0);
  assert.equal(s0.picks.a, null);
  assert.equal(s1.picks.a, 1);
});

test('lockIn ignores bad players and bad options', () => {
  const s = createSession(day);
  assert.equal(lockIn(s, 'c', 1), s);
  assert.equal(lockIn(s, 'a', 4), s);
  assert.equal(lockIn(s, 'a', -1), s);
  assert.equal(lockIn(s, 'a', 1.5), s);
  assert.equal(lockIn(s, 'a', '1'), s);
});

test('hint used is the state of the hint at the latest lock-in', () => {
  let s = createSession(day);
  s = lockIn(s, 'a', 0);          // before the hint
  s = openHint(s);
  s = lockIn(s, 'b', 0);          // after the hint
  assert.deepEqual(s.hintUsed, { a: false, b: true });
  s = unlock(s, 'a');
  assert.equal(s.picks.a, null);
  s = lockIn(s, 'a', 1);          // re-locked after seeing the hint
  assert.deepEqual(s.hintUsed, { a: true, b: true });
});

test('reveal needs both players locked', () => {
  let s = lockIn(createSession(day), 'a', 0);
  assert.equal(reveal(s, day, stubRule), s);
  s = lockIn(s, 'b', 3);
  assert.equal(bothLocked(s), true);
  const r = reveal(s, day, stubRule);
  assert.equal(r.phase, 'revealed');
  assert.deepEqual(r.results, [{
    questionId: 'q1',
    picks: { a: 0, b: 3 },
    correct: { a: true, b: false },
    hintUsed: { a: false, b: false },
    points: { a: 5, b: 0 },
  }]);
});

test('nothing can change after the reveal', () => {
  let s = lockIn(lockIn(createSession(day), 'a', 0), 'b', 0);
  s = reveal(s, day, stubRule);
  assert.equal(lockIn(s, 'a', 1), s);
  assert.equal(unlock(s, 'a'), s);
  assert.equal(openHint(s), s);
  assert.equal(reveal(s, day, stubRule), s);
});

test('next only works after a reveal and clears the question state', () => {
  let s = createSession(day);
  assert.equal(next(s, day), s);
  s = openHint(s);
  s = lockIn(lockIn(s, 'a', 0), 'b', 0);
  s = next(reveal(s, day, stubRule), day);
  assert.equal(s.index, 1);
  assert.equal(s.phase, 'answering');
  assert.deepEqual(s.picks, { a: null, b: null });
  assert.equal(s.hintOpen, false);
  assert.deepEqual(s.hintUsed, { a: false, b: false });
});

test('a rule that returns nonsense scores zero instead of breaking the day', () => {
  let s = lockIn(lockIn(createSession(day), 'a', 0), 'b', 0);
  s = reveal(s, day, () => undefined);
  assert.deepEqual(s.results[0].points, { a: 0, b: 0 });
});

test('a full day: a is always right, b is right with the hint on even questions', () => {
  let s = createSession(day);
  for (let i = 0; i < 10; i += 1) {
    const answer = day.questions[i].answer;
    s = lockIn(s, 'a', answer);
    s = openHint(s);
    s = lockIn(s, 'b', i % 2 === 0 ? answer : (answer + 1) % 4);
    s = reveal(s, day, stubRule);
    s = next(s, day);
  }
  assert.equal(s.phase, 'finished');
  assert.equal(s.results.length, 10);
  assert.deepEqual(totals(s), { a: 50, b: 5 });
  assert.equal(maxPoints(day, stubRule), 50);
  assert.equal(next(s, day), s);
});

test('number keys map to the two players', () => {
  assert.deepEqual(keyToPick('1'), { player: 'a', option: 0 });
  assert.deepEqual(keyToPick('4'), { player: 'a', option: 3 });
  assert.deepEqual(keyToPick('7'), { player: 'b', option: 0 });
  assert.deepEqual(keyToPick('0'), { player: 'b', option: 3 });
  for (const key of ['5', '6', 'a', 'Enter', '', '12']) assert.equal(keyToPick(key), null);
});
