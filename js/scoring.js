/**
 * The scoring rule: how many points one player earns for one question.
 *
 * @param {object} outcome
 * @param {boolean} outcome.correct   true when the player chose the right answer
 * @param {boolean} outcome.hintUsed  true when the hint was open at the moment the player locked in
 * @returns {number} a whole number of points, 0 or more
 *
 * Everything else in the game is worked out from this function, including
 * what counts as a perfect day (ten correct answers without the hint).
 */
export function pointsFor({ correct, hintUsed }) {
  if (!correct) return 0;
  if (hintUsed) return 2;
  return 3;
}
