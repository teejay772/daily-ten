# Choose the Theme and the Topic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the home screen of The Daily Ten, under the proposed day, players pick a theme and then one of its topics, and day numbers shown to players become their own count of days played.

**Architecture:** Two small pure functions are added to `js/store.js` and tested with `node --test`: one builds the theme menu from `days/index.json` and the saved history, one gives a day's number for the players. `js/ui.js` gets one new card on the home screen and uses the second function wherever a day number is shown. Nothing changes in the saved data or in the day files.

**Tech Stack:** HTML, CSS, vanilla JavaScript (ES modules), Node 26 built-in test runner. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-20-choose-theme-and-topic-design.md`

## Global Constraints

- All paths are relative to the repository root, `/Users/tommasogioacchini/Documents/Pulse/daily-trivia`.
- Plain HTML, CSS and JavaScript, no build step, no new dependency.
- The list of themes is not written anywhere by hand. It is read from `days/index.json`: a theme appears as soon as its first day is added, with the name used there.
- Saved scores on players' devices must keep working without any conversion: `STORAGE_KEY`, `VERSION` and the shape of a history entry do not change, and `recordDay` keeps storing `number: day.number`.
- Exact wording on the screen: `Choose the theme to play` and `Choose the topic`. All other new text is plain English with short sentences.
- A day is never counted twice, and choosing never changes the score of a day already played. A replay is always practice.
- Only existing CSS tokens (`--ink`, `--ink-soft`, `--card`, `--wall-deep`, `--line`, `--radius`, the `--step-*` sizes). No new colour.
- Text is added with the existing `h()` helper (text nodes), never as HTML.
- Work happens on a branch named `choose-theme`. Commits stay local. Merging to `main`, pushing (which publishes the site) and updating the artifact happen only in Task 3, after the user's go-ahead.

## Review Focus

1. **A theme with an odd name** such as `constructor` or `__proto__` in the index: it is listed and counted like any other. Test in Task 1.
2. **A saved history that holds a day no longer in the index:** no error, no theme invented for it, no negative count. Test in Task 1.
3. **A saved paused day that is no longer in the index:** the two choosing steps must still appear, otherwise the players could never choose again. Check in Task 2, Step 6h.
4. **Long names on a 375 px screen** (live example: "The Hundred Years' War and Joan of Arc"; planned: "Italian cinema, neorealism to Fellini"): the text wraps inside its button and the page never scrolls sideways. Check in Task 2, Step 6e.
5. **A chosen day whose file fails to load:** the home screen comes back with a message that names the topic, and the topic list is closed. Check in Task 2, Step 6i.

---

### Task 1: The theme menu and the players' day number

**Files:**
- Modify: `js/store.js` (add two exports after `nextUnplayedDay`)
- Test: `tests/store.test.js`
- Add to the first commit: `docs/superpowers/specs/2026-11-20-choose-theme-and-topic-design.md`, `docs/superpowers/plans/2026-11-20-choose-theme-and-topic.md`

**Interfaces:**
- Consumes: `state.history` (array of `{ dayId, ... }`), `dayList` (array of `{ id, number, theme, title, file }` from `days/index.json`).
- Produces:
  - `themeMenu(state, dayList)` returns `Array<{ theme: string, left: number, topics: Array<{ entry: object, played: boolean }> }>`. Themes are in the order of `Array.prototype.sort()` on their names, the same order as the score table. Topics are in rising `entry.number`. `left` is the number of topics with `played === false`.
  - `playerDayNumber(state, dayId)` returns a whole number from 1: the place of `dayId` in `state.history` if it was played, otherwise `state.history.length + 1`.

- [ ] **Step 1: Create the branch**

Run: `git switch -c choose-theme`
Expected: `Switched to a new branch 'choose-theme'`

- [ ] **Step 2: Write the failing tests**

Add `themeMenu, playerDayNumber` to the import list of `tests/store.test.js`, then add:

```js
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
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `npm test`
Expected: FAIL, the import of `themeMenu` from `../js/store.js` is not found.

- [ ] **Step 4: Implement `themeMenu(state, dayList)` and `playerDayNumber(state, dayId)` in `js/store.js`**

Group with a `Map`, as `summary` already does, so that a theme named like a built-in object property is safe. Neither function changes its arguments.

- [ ] **Step 5: Run the tests to see them pass**

Run: `npm test`
Expected: `pass 46`, `fail 0` (42 existing tests plus 4 new).

- [ ] **Step 6: Commit**

```bash
git add js/store.js tests/store.test.js docs/superpowers/specs/2026-11-20-choose-theme-and-topic-design.md docs/superpowers/plans/2026-11-20-choose-theme-and-topic.md
git commit -m "Add the theme menu and the players' day number"
```

---

### Task 2: The two choosing steps on the home screen

**Files:**
- Modify: `js/ui.js` (import list; `startApp` state; `openDay`; `todayCard`; `historyCard`; `viewHome`; the header in `viewQuestion`; the header in `viewFinished`; one new function `chooseCard`)
- Modify: `css/app.css` (the `/* ---------- home ---------- */` block)
- Modify: `README.md` (the "Play" list)

**Interfaces:**
- Consumes: `themeMenu(state, dayList)` and `playerDayNumber(state, dayId)` from Task 1; the existing `openDay(entry, { practice })`, `plural(n, one, many)`, `h()`.
- Produces: no new export. One new field on the `app` object: `pickedTheme` (`string | null`, starts `null`).

- [ ] **Step 1: Show the players' own day number everywhere a day number is shown**

Replace each use of a catalogue number with `playerDayNumber(app.state, <day id>)`:

| Place in `js/ui.js` | Text after the change |
|---|---|
| `todayCard`, paused day | `Day N · <theme> · in progress` and `Continue Day N` |
| `todayCard`, proposed day | `Day N · <theme>` and `Play Day N` |
| `historyCard`, first column | the row's place in `app.state.history` plus 1 (the table is shown newest first, so compute it before reversing) |
| `viewQuestion` header | `Day N · <theme>` with ` · practice` added in practice |
| `viewFinished` header | `Day N · <theme> · result` |
| `openDay`, load error | `"<title>" could not be loaded. Check your connection and try again.` with the entry's title in the quotes and no number |

In the "All caught up" card, remove the `Practise Day N again` button and change the sentence to: `New days arrive in weekly batches. Until then you can practise any topic below. Practice does not change the score.`

- [ ] **Step 2: Add `chooseCard()` and place it in `viewHome` directly after `todayCard()`**

`chooseCard()` returns `null` when `dayList` is empty or when a paused day exists **and is found in `dayList`** (the same test `todayCard` uses). Otherwise it returns `section.card.choose` holding:

1. `h2`: `Choose the theme to play`.
2. `div.theme-grid`: one `button.btn.theme-btn` per item of `themeMenu(app.state, dayList)`, with `type="button"`, `data-theme=<theme>`, `aria-pressed` `"true"` or `"false"`, the theme name in a `span`, and a `span.theme-count` showing `left`, or `✓` when `left` is 0. Its `aria-label` is `<theme>, 1 topic left` / `<theme>, N topics left` (use `plural`), or `<theme>, all played`.
3. Only when `app.pickedTheme` names a theme in the menu: `h3` `Choose the topic`, then `div.topic-list` with one row per topic. A topic not yet played is `button.btn.topic` with the title as its text; it calls `openDay(entry)`. A played topic is `div.topic.is-played` with the text `✓ <title>` and a `button.btn.btn-quiet` `Practise` that calls `openDay(entry, { practice: true })`.

Tapping a theme button sets `app.pickedTheme` to that theme, or to `null` if it was already the picked one, then calls `render()` (not `go`, so the page does not jump to the top) and puts the keyboard focus back on the button with the same `data-theme`. Compare `data-theme` values in JavaScript; do not build a CSS selector from a theme name.

`openDay` sets `app.pickedTheme = null` on its first line, so the list is closed whenever the players come back to the home screen.

- [ ] **Step 3: Style the card in `css/app.css`, in the home block**

- `.choose`: grid, gap 16px. Its `h2` and `h3` use the sizes the home cards already use for `h2`.
- `.theme-grid`: grid, gap 10px, four equal columns (`repeat(4, minmax(0, 1fr))`); two equal columns under `@media (max-width: 700px)`.
- `.theme-btn`: flex, space between, gap 10px, text aligned left, `overflow-wrap: anywhere`. With `[aria-pressed="true"]` it takes the colours of `.btn-primary`.
- `.theme-count`: `font-variant-numeric: tabular-nums`, colour `var(--ink-soft)`; inherits the colour when the button is pressed.
- `.topic-list`: grid, gap 8px. `.topic`: full width, text aligned left, `overflow-wrap: anywhere`. `.topic.is-played`: flex, wrap, space between, centre aligned, colour `var(--ink-soft)`, with the same left padding as a button so the titles line up.

- [ ] **Step 4: Add one line to the "Play" list in `README.md`**

`- To pick what you play, tap a theme under "Choose the theme to play", then a topic. The day at the top is only a proposal.`

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: `pass 46`, `fail 0`.

- [ ] **Step 6: Play it in the local preview**

Start the server named `daily-ten` (defined in `../.claude/launch.json`, port 4173). Before changing anything, read `localStorage['daily-ten:v1']` and keep it; put it back at the end (Step 6j). Force-reload the script and style files so the browser does not use old copies. Check each line; all must hold:

- a. With an empty history: the top card says `Play Day 1`; the theme buttons are in alphabetical order, one per theme in the index, each with the number of its days.
- b. Tapping a theme shows `Choose the topic` and that theme's titles in rising day order; tapping the same theme again closes the list; tapping another theme swaps the list.
- c. Start a topic that is not the proposed one. The header reads `Day 1 · <its theme>`. Pause: the home screen shows `Continue Day 1` and no choosing card. Continue and finish the ten questions: the result header reads `Day 1 · <its theme> · result`.
- d. Back home: the top card proposes the lowest catalogue day still unplayed and says `Play Day 2`; the played theme's count is one lower; in its topic list the played topic has `✓` and `Practise`. Practise it: the header says `practice`, and after the ten questions the all-time score and the `Days played` table are unchanged. The table's first column shows `1`.
- e. At 375 px wide, in light and in dark mode: the theme grid has two columns, long titles wrap inside their buttons, and `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
- f. With the keyboard only: Tab reaches a theme button, Enter opens its topics, and the focus is still on that theme button.
- g. With a history that holds every day in the index: the top card says all days are played, every theme shows `✓`, and a topic can be practised from the list.
- h. With `inProgress` set to a session whose `dayId` is `day-999`: the choosing card is visible.
- i. With `window.fetch` replaced by a function that rejects, tap an unplayed topic: the home screen shows `"<title>" could not be loaded. Check your connection and try again.` and the topic list is closed.
- j. No errors in the console. Put the saved value from the start back into `localStorage` and reload.

- [ ] **Step 7: Commit**

```bash
git add js/ui.js css/app.css README.md
git commit -m "Let players choose the theme and the topic on the home screen"
```

---

### Task 3: Publish (only after the user says yes)

**Files:** none changed. This task moves the work to the live site and the artifact.

**Interfaces:**
- Consumes: the two commits on `choose-theme`.
- Produces: `main` on GitHub with the feature, and the artifact at `https://claude.ai/artifact/H1Sv95YhkzmZH699G6wgBQ` with the same three code files.

- [ ] **Step 1: Ask the user for the go-ahead**, with one screenshot of the home screen with a theme open. Stop here until they answer.

- [ ] **Step 2: Merge and push**

```bash
git switch main
git merge --ff-only choose-theme
git push origin main
```

Expected: `main -> main`. The commit author must still be the GitHub noreply address already set in this repository.

- [ ] **Step 3: Check the live site**

Wait until `https://teejay772.github.io/daily-ten/js/ui.js` contains the text `Choose the theme to play`, then open the site and confirm the choosing card is there.

- [ ] **Step 4: Update the artifact**

Read the artifact, then publish `artifact.html` to its URL with `root` set to the repository and `files` listing only `js/store.js`, `js/ui.js` and `css/app.css` (files left out are kept). List the artifact's files afterwards and confirm the three sizes match the local files.

- [ ] **Step 5: Record it** in the project memory file: the feature, the date, and that day numbers shown to players are now their own count.
