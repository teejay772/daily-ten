// The all-time record: names, history of days played, and a day in progress.
// Nothing here touches the page; storage is passed in so it can be faked in tests.

export const STORAGE_KEY = 'daily-ten:v1';
const VERSION = 1;
const APP = 'daily-ten';

export function emptyState() {
  return { version: VERSION, names: { a: '', b: '' }, history: [], inProgress: null };
}

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isPair = (v, type) => isObject(v) && typeof v.a === type && typeof v.b === type;

function isHistoryEntry(e) {
  return isObject(e)
    && typeof e.dayId === 'string'
    && typeof e.theme === 'string'
    && isPair(e.totals, 'number')
    && Array.isArray(e.results)
    && e.results.every((r) => isObject(r) && isPair(r.correct, 'boolean') && isPair(r.points, 'number'));
}

function isState(s) {
  return isObject(s)
    && s.version === VERSION
    && isPair(s.names, 'string')
    && Array.isArray(s.history)
    && s.history.every(isHistoryEntry);
}

export function loadState(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const probe = `${STORAGE_KEY}:probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    if (raw === null) return { state: emptyState(), persistent: true };
    let saved = null;
    try { saved = JSON.parse(raw); } catch { saved = null; }
    if (!isState(saved)) return { state: emptyState(), persistent: true };
    return {
      state: {
        version: VERSION,
        names: saved.names,
        history: saved.history,
        inProgress: isObject(saved.inProgress) ? saved.inProgress : null,
      },
      persistent: true,
    };
  } catch {
    return { state: emptyState(), persistent: false };
  }
}

export function saveState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function recordDay(state, day, session, playedOn, maxPoints) {
  if (state.history.some((e) => e.dayId === day.id)) return { ...state, inProgress: null };
  const totals = session.results.reduce(
    (sum, r) => ({ a: sum.a + r.points.a, b: sum.b + r.points.b }),
    { a: 0, b: 0 },
  );
  const entry = {
    dayId: day.id,
    number: day.number,
    theme: day.theme,
    title: day.title,
    playedOn,
    maxPoints,
    totals,
    results: session.results,
  };
  return { ...state, history: [...state.history, entry], inProgress: null };
}

export function nextUnplayedDay(state, dayList) {
  const played = new Set(state.history.map((e) => e.dayId));
  const open = dayList.filter((d) => !played.has(d.id)).sort((x, y) => x.number - y.number);
  return open.length > 0 ? open[0] : null;
}

export function summary(state) {
  const out = { daysPlayed: state.history.length, points: { a: 0, b: 0 }, dayWins: { a: 0, b: 0, ties: 0 }, byTheme: {} };
  for (const entry of state.history) {
    out.points.a += entry.totals.a;
    out.points.b += entry.totals.b;
    if (entry.totals.a > entry.totals.b) out.dayWins.a += 1;
    else if (entry.totals.b > entry.totals.a) out.dayWins.b += 1;
    else out.dayWins.ties += 1;
    out.byTheme[entry.theme] ??= { a: { correct: 0, total: 0 }, b: { correct: 0, total: 0 } };
    const theme = out.byTheme[entry.theme];
    for (const r of entry.results) {
      for (const p of ['a', 'b']) {
        theme[p].total += 1;
        if (r.correct[p]) theme[p].correct += 1;
      }
    }
  }
  return out;
}

export function exportBackup(state) {
  return JSON.stringify({
    app: APP,
    version: VERSION,
    state: { version: VERSION, names: state.names, history: state.history, inProgress: null },
  }, null, 2);
}

export function importBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This backup is damaged and cannot be read.');
  }
  if (!isObject(data) || data.app !== APP) throw new Error('This is not a Daily Ten backup.');
  if (data.version !== VERSION) throw new Error('This backup comes from a different version of the game.');
  if (!isState(data.state)) throw new Error('This backup is damaged and cannot be read.');
  return { version: VERSION, names: data.state.names, history: data.state.history, inProgress: null };
}
