import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pointsFor } from '../js/scoring.js';

const cases = [
  { correct: true, hintUsed: false },
  { correct: true, hintUsed: true },
  { correct: false, hintUsed: false },
  { correct: false, hintUsed: true },
];

test('every outcome scores a whole number that is not negative', () => {
  for (const c of cases) {
    const p = pointsFor(c);
    assert.ok(Number.isInteger(p) && p >= 0, `${JSON.stringify(c)} gave ${p}`);
  }
});

test('a correct answer without the hint is worth something', () => {
  assert.ok(pointsFor({ correct: true, hintUsed: false }) > 0);
});

test('the hint never makes a correct answer worth more', () => {
  assert.ok(pointsFor({ correct: true, hintUsed: false }) >= pointsFor({ correct: true, hintUsed: true }));
});

test('a wrong answer never beats a correct one', () => {
  for (const hintUsed of [false, true]) {
    assert.ok(pointsFor({ correct: false, hintUsed }) <= pointsFor({ correct: true, hintUsed }));
  }
});
