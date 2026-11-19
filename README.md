# The Daily Ten

A daily trivia game for two players on one shared screen. Ten questions a day, each with a hint and four answers. Both players lock in an answer in secret, then reveal it. The game keeps a score for each day and an all-time score.

Themes rotate through art history, literature, Italian history, great books, French history, geography and geopolitics. Day 1 is Rembrandt and Van Gogh.

## Play

Open the site, enter two names, and press "Play Day 1".

- On a laptop the left player answers with keys `1 2 3 4` and the right player with `7 8 9 0`.
- On a tablet each player taps their own row of A B C D buttons.
- The score is saved in the browser on the device you play on. Use "Names and backup" to keep a copy.

## How it is built

Plain HTML, CSS and JavaScript with no build step and no dependencies.

| Path | What it holds |
|---|---|
| `index.html` | The page |
| `css/app.css` | All styles, light and dark |
| `js/scoring.js` | The scoring rule: 3 points correct, 2 with the hint, 0 wrong |
| `js/game.js` | The rules of one day's play |
| `js/store.js` | The saved score, the summary and backups |
| `js/ui.js` | The screens |
| `days/` | One JSON file per day, listed in `days/index.json` |
| `images/` | Local copies of the pictures |
| `docs/design-draft.md` | The design |

## Add a day

1. Add `days/day-00N.json` in the same shape as `days/day-001.json`: ten questions, four options each, a hint, an explanation and at least one source.
2. Add its entry to `days/index.json`.
3. Run the tests, which check every day file:

```bash
npm test
```

## Run it locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Images

Every image is a faithful reproduction of a public-domain work, taken from Wikimedia Commons. The artist, title, date and holding museum are shown under each picture after the answer is revealed.
