# Choose the theme and the topic: short design

Date: 20 November 2026. Status: approved, built and published on 20 November 2026 (commit `bfd0716`). The 50-day plan at the end was confirmed by the players the same day.

## Why

Until now the game decided what you play: the home screen offered one day, the lowest-numbered day not yet played, so the seven themes always came in the same order. The players want to choose, each day, the theme and the topic. The game's own proposal is fine as a default.

The game is also growing from 7 themes to 16, with a plan of 50 days (see the last section). With 16 themes a fixed weekly order no longer makes sense.

## What the players get

The home screen keeps one proposed day at the top. Under it there are two steps, in the players' words:

```
DAY 15 · GEOPOLITICS
The Cold War                                   [ Play Day 15 ]

Choose the theme to play
  [ Architecture 3 ]  [ Art history 1 ]  [ Cinema 3 ]  [ Economics 3 ]
  [ French history 1 ]  [ Geography 1 ]  ...

Choose the topic                               (after a theme is tapped)
  Cinema
  [ Italian cinema, neorealism to Fellini ]
  [ Chaplin, Hitchcock, Welles ]
  [ The French New Wave ]
```

- Tapping a theme shows that theme's topics. Tapping a topic starts that day.
- The number next to a theme is how many of its topics have not been played.
- A topic already played has a tick. It can be replayed for practice, and a replay never changes the score (this is how practice works today).
- A theme with nothing left to play stays in the list, with a tick, so its topics can still be practised.
- The choice of theme is not remembered between visits: the list starts closed each time.

## Goals

- On any day, pick any day that is written and not yet played, by theme and then by topic.
- Keep the one-tap start for players who do not want to choose.
- Work the same on the GitHub site and in the artifact, on a laptop and on a tablet.

## Not goals

- Typing a topic that does not exist. The game cannot write a checked day on the spot. New topics come from the content plan, which the players steer in chat.
- Any change to scoring, hints, or the questions themselves.
- A separate choice for each player. One choice is made for both.

## Must never happen

- A day counted twice, or the score of a day already played changing because of a choice.
- A theme or topic offered that has no day file behind it.

## Constraints

- Plain HTML, CSS and JavaScript, no build step, no new dependency.
- The list of themes is not written anywhere by hand. It is read from `days/index.json`: a theme appears as soon as its first day is added, with the name used there.
- Saved scores on players' devices must keep working without any conversion.

## Approaches considered

| | What it is | Trade-off |
|---|---|---|
| A | The whole table on the home screen, one row per theme with its topics as buttons | Everything visible at once, but 16 rows make the home screen long |
| B | A separate "Choose a day" screen with themes as tiles | Short home screen and scales to hundreds of days, but two more taps and one more screen |
| **C (chosen)** | Theme names on the home screen; tapping one shows its topics below | Compact and stays on one screen. Topics of different themes are not visible together |

The players chose C, with the two steps named "Choose the theme to play" and "Choose the topic".

## Decisions made by the builder (correct any of these)

1. **What the game proposes.** Still the lowest-numbered day not yet played. Future batches will be numbered so that themes alternate, so the proposal keeps moving between themes.
2. **Day numbers.** Once days can be played in any order, a file number such as "Day 31" on your sixteenth evening is confusing. The number shown to players becomes their own count: "Day 16" is the sixteenth day they play, whatever its topic. Topics are shown by theme and title, without numbers. Days already in the history keep their order.
3. **A paused day.** If a day is paused, the home screen shows "Continue" as it does today, and the two choosing steps are hidden until that day is finished. Only one unfinished day can be saved, so this avoids losing answers.
4. **Theme buttons** are laid out as a grid of equal buttons (four across on a laptop, two on a narrow screen), in alphabetical order, the same order as the score table.
5. **When everything is played**, the top card says so, as today, and the two steps remain for practice.

## Left to the builder

- The exact look of the theme buttons and the topic list, within the existing style.
- How the logic is split: the rule "which themes exist, how many topics are left in each, which topics belong to a theme" should be a small function with no page code in it, covered by tests, next to the existing `nextUnplayedDay`.
- Keyboard and screen-reader behaviour of the two steps.

## How it will be checked

- Unit tests for the new function: themes read from the index, counts of topics left, a played day never offered as new, an empty index.
- The existing tests keep passing, including the saved-score tests.
- A play-through in the local preview: choose a theme, choose a topic, finish the day, see it ticked, practise it, and confirm the score did not change.

## The 50-day plan (a second, separate piece of work)

This is content, written in batches of about seven days, each approved before it goes live. It is listed here because the choosing screen shows it. The players confirmed this table on 20 November 2026. A tick means the day is live.

| Theme | 1 | 2 | 3 |
|---|---|---|---|
| Art history | ✓ Rembrandt and Van Gogh | ✓ Florence in the 1400s | Leonardo, Michelangelo, Raphael |
| Literature | ✓ Pride and Prejudice | ✓ Shakespeare's tragedies | The 19th-century novel |
| Italian history | ✓ From Rome to the Republic | ✓ Communes and maritime republics | The Risorgimento |
| Great books | ✓ Augustine, Confessions | ✓ Dante, Inferno | Homer, Odyssey |
| French history | ✓ Charlemagne to de Gaulle | ✓ The Hundred Years' War | The Revolution and Napoleon |
| Geography | ✓ The world map | ✓ Asia | The Mediterranean |
| Geopolitics | ✓ UN, NATO and the EU | ✓ The UN after 1945 | The Cold War |
| Music | Bach, Mozart, Beethoven | Italian opera, Rossini to Puccini | Jazz and the 20th century |
| Science | Galileo and Newton | Darwin and evolution | Einstein and the atom |
| Philosophy and ideas | Socrates, Plato, Aristotle | The Enlightenment | The great religions |
| Cinema | Italian cinema, neorealism to Fellini | Chaplin, Hitchcock, Welles | The French New Wave |
| Architecture | Greek temples and Roman building | Gothic cathedrals | From Eiffel to Le Corbusier |
| Greek and Roman myths | The gods of Olympus | Heracles, Theseus, Perseus | The Trojan War |
| World history | Egypt and Mesopotamia | The age of exploration | The two World Wars |
| Economics | Money, banks and inflation | Smith, Marx, Keynes | The crises of 1929 and 2008 |
| Technology | The computer and the internet | Artificial intelligence | Space, from Sputnik to today |

That is 48 days. Two mixed days, with questions from every theme, bring the total to 50. The players confirmed "the table"; the mixed days were part of what was shown to them, but they did not speak about them separately, so check with them before writing the first one (Day 25). 34 topic days remain to be written.

### Order of the days still to write

The game proposes the lowest-numbered unplayed day, so the numbers are arranged to move between themes and to bring in the new themes first, which is what the players asked for. "Music 1" means the first topic in the Music row of the table. This order is the builder's call.

| Batch | Days | Content |
|---|---|---|
| 3 | 15 to 21 | Music 1, Science 1, Philosophy and ideas 1, Cinema 1, Architecture 1, Greek and Roman myths 1, World history 1 |
| 4 | 22 to 28 | Economics 1, Technology 1, Art history 3, mixed day (Day 25), Literature 3, Italian history 3, Great books 3 |
| 5 | 29 to 35 | French history 3, Geography 3, Geopolitics 3, Music 2, Science 2, Philosophy and ideas 2, Cinema 2 |
| 6 | 36 to 42 | Architecture 2, Greek and Roman myths 2, World history 2, Economics 2, Technology 2, Music 3, Science 3 |
| 7 | 43 to 50 | Philosophy and ideas 3, Cinema 3, Architecture 3, Greek and Roman myths 3, World history 3, Economics 3, Technology 3, mixed day (Day 50) |

Theme names in the day files must be written exactly as in the first column of the table above, because the choosing screen and the score table group days by that text.
