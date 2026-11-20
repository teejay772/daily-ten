import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestOnly } from '../js/latest.js';

test('only the newest of several overlapping requests is still wanted', () => {
  const begin = latestOnly();
  const first = begin();
  assert.equal(first(), true);
  const second = begin();
  assert.equal(first(), false, 'an older request must not take effect when it arrives late');
  assert.equal(second(), true);
  const third = begin();
  assert.equal(second(), false);
  assert.equal(third(), true);
});

test('two trackers do not affect each other', () => {
  const beginA = latestOnly();
  const beginB = latestOnly();
  const a = beginA();
  beginB();
  beginB();
  assert.equal(a(), true);
});
