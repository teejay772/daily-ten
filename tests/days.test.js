import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

const index = readJson('days/index.json');

test('the index lists at least one day, numbered from 1 without gaps', () => {
  assert.ok(Array.isArray(index.days) && index.days.length >= 1);
  index.days.forEach((d, i) => assert.equal(d.number, i + 1));
  assert.equal(new Set(index.days.map((d) => d.id)).size, index.days.length);
});

for (const entry of index.days) {
  test(`${entry.id} is a complete, playable day`, () => {
    assert.ok(existsSync(join(root, entry.file)), `${entry.file} is missing`);
    const day = readJson(entry.file);
    for (const key of ['id', 'number', 'theme', 'title']) {
      assert.equal(day[key], entry[key], `${key} differs from the index`);
    }
    assert.equal(day.questions.length, 10);
    assert.equal(new Set(day.questions.map((q) => q.id)).size, 10);

    for (const q of day.questions) {
      const where = `${q.id}: `;
      assert.ok(['easy', 'medium', 'hard'].includes(q.difficulty), where + 'difficulty');
      assert.ok(q.question.trim().length > 0, where + 'question');
      assert.equal(q.options.length, 4, where + 'four options');
      assert.equal(new Set(q.options.map((o) => o.trim())).size, 4, where + 'distinct options');
      q.options.forEach((o) => assert.ok(o.trim().length > 0, where + 'empty option'));
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, where + 'answer');
      assert.ok(q.hint.trim().length > 0, where + 'hint');
      assert.ok(q.explanation.trim().length > 0, where + 'explanation');
      assert.ok(
        !q.hint.toLowerCase().includes(q.options[q.answer].toLowerCase()),
        where + 'the hint contains the answer',
      );
      if (q.image !== null) {
        assert.ok(existsSync(join(root, q.image.src)), where + `${q.image.src} is missing`);
        assert.ok(q.image.alt.trim().length > 0, where + 'alt');
        assert.ok(q.image.credit.trim().length > 0, where + 'credit');
        assert.ok(q.image.width > 0 && q.image.height > 0, where + 'image size');
      }
      assert.ok(q.sources.length >= 1, where + 'sources');
      q.sources.forEach((s) => {
        assert.ok(s.label.trim().length > 0, where + 'source label');
        assert.ok(s.url.startsWith('https://'), where + 'source url');
      });
    }
    assert.ok(new Set(day.questions.map((q) => q.answer)).size > 1, 'all answers in one position');
  });
}
