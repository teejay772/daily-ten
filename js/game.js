// One day's play for two players, as plain data.
// Every move returns a new session, or the same session when the move is not allowed.

const PLAYERS = ['a', 'b'];

export function createSession(day) {
  return {
    dayId: day.id,
    index: 0,
    phase: 'answering',
    picks: { a: null, b: null },
    hintOpen: false,
    hintUsed: { a: false, b: false },
    results: [],
  };
}

export function bothLocked(session) {
  return session.picks.a !== null && session.picks.b !== null;
}

export function lockIn(session, player, option) {
  if (session.phase !== 'answering') return session;
  if (!PLAYERS.includes(player)) return session;
  if (!Number.isInteger(option) || option < 0 || option > 3) return session;
  return {
    ...session,
    picks: { ...session.picks, [player]: option },
    // The hint counts against a player when it was open at their latest lock-in.
    hintUsed: { ...session.hintUsed, [player]: session.hintOpen },
  };
}

export function unlock(session, player) {
  if (session.phase !== 'answering') return session;
  if (!PLAYERS.includes(player) || session.picks[player] === null) return session;
  return {
    ...session,
    picks: { ...session.picks, [player]: null },
    hintUsed: { ...session.hintUsed, [player]: false },
  };
}

export function openHint(session) {
  if (session.phase !== 'answering' || session.hintOpen) return session;
  return { ...session, hintOpen: true };
}

function safePoints(pointsFor, outcome) {
  const points = pointsFor(outcome);
  return Number.isFinite(points) && points >= 0 ? points : 0;
}

export function reveal(session, day, pointsFor) {
  if (session.phase !== 'answering' || !bothLocked(session)) return session;
  const question = day.questions[session.index];
  const correct = {
    a: session.picks.a === question.answer,
    b: session.picks.b === question.answer,
  };
  const result = {
    questionId: question.id,
    picks: { ...session.picks },
    correct,
    hintUsed: { ...session.hintUsed },
    points: {
      a: safePoints(pointsFor, { correct: correct.a, hintUsed: session.hintUsed.a }),
      b: safePoints(pointsFor, { correct: correct.b, hintUsed: session.hintUsed.b }),
    },
  };
  return { ...session, phase: 'revealed', results: [...session.results, result] };
}

export function next(session, day) {
  if (session.phase !== 'revealed') return session;
  if (session.index >= day.questions.length - 1) return { ...session, phase: 'finished' };
  return {
    ...session,
    index: session.index + 1,
    phase: 'answering',
    picks: { a: null, b: null },
    hintOpen: false,
    hintUsed: { a: false, b: false },
  };
}

export function totals(session) {
  return session.results.reduce(
    (sum, r) => ({ a: sum.a + r.points.a, b: sum.b + r.points.b }),
    { a: 0, b: 0 },
  );
}

export function maxPoints(day, pointsFor) {
  return day.questions.length * safePoints(pointsFor, { correct: true, hintUsed: false });
}

const KEYS = {
  1: ['a', 0], 2: ['a', 1], 3: ['a', 2], 4: ['a', 3],
  7: ['b', 0], 8: ['b', 1], 9: ['b', 2], 0: ['b', 3],
};

export function keyToPick(key) {
  if (typeof key !== 'string' || key.length !== 1 || !(key in KEYS)) return null;
  const [player, option] = KEYS[key];
  return { player, option };
}
