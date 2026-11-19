import { startApp } from './ui.js';
import { loadState } from './store.js';
import { pointsFor } from './scoring.js';

const root = document.getElementById('app');

async function getJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

function getStorage() {
  try { return window.localStorage; } catch { return undefined; }
}

async function boot() {
  try {
    const index = await getJson('days/index.json');
    const storage = getStorage();
    const { state, persistent } = loadState(storage);
    startApp({
      root,
      dayList: index.days,
      loadDay: (entry) => getJson(entry.file),
      storage,
      state,
      persistent,
      pointsFor,
    });
  } catch (error) {
    console.error(error);
    root.textContent = 'The questions could not be loaded. Check your connection, then reload the page.';
  }
}

boot();
