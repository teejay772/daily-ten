# The Daily Ten: draft for your approval

Draft of 19 November 2026. "The Daily Ten" is a working title; rename it freely.

This draft has two parts: how the game works, and the ten questions for Day 1. Nothing is built yet. Anything marked **my call** is a choice I made for you that you can overrule.

## 1. What it is, and why

A trivia website for the two of you, played together on one shared screen for about 30 minutes a day. The purpose is to refresh what you once knew about art history, literature, the great books, Italian and French history, geography and geopolitics, and to keep it fun enough that you are still playing on day 125.

**Goals**

- Ten questions a day, each with a hint and four answers.
- Both of you answer, then the answer is revealed with a short explanation.
- A score for each day and an all-time score that survives hundreds of days.
- The real paintings (and portraits, maps, title pages) shown large.
- Pleasant and simple to use.

**What would make it a failure**

- Wrong "facts". Every question is checked against a source, and popular myths are avoided or turned into questions.
- Losing the all-time score. The score has a backup button.
- One of you running so far ahead that the other stops caring. See the scoreboard.

## 2. How a day works

1. **Home.** Shows the next day to play ("Day 1: Rembrandt and Van Gogh"), the all-time scoreboard, and the history of past days.
2. **Question.** The painting is shown large, with the question and four answers below it. Each of you has your own row of A, B, C, D buttons, one on the left of the screen and one on the right.
3. **Lock in.** When you choose an answer, your side shows only "Locked in". Your choice stays hidden until you have both locked in, so the second player cannot copy the first. When you are both locked in, a "Reveal" button appears. Until it is pressed, either of you can tap "Change" to unlock and choose again, which covers a slip of the finger.
   - **On a tablet** you tap your own row of buttons. The other player can see where your finger goes, so the rule of the house is not to look.
   - **On a laptop** each of you has your own keys, which keeps the choice private: the left player uses 1, 2, 3, 4 and the right player uses 7, 8, 9, 0. The buttons also work with the mouse.
4. **Hint.** One hint per question, opened by either of you. It is a memory nudge, not a removal of wrong answers. Whoever has not locked in when the hint opens earns fewer points for that question.
5. **Reveal.** The right answer lights up, each player's choice is shown, and a two-sentence "Did you know" explains it. The image credit appears here, so the caption cannot give the answer away.
6. **End of day.** The day's score, who won the day, and the updated all-time score.

```
┌──────────────────────────────────────────────────────────┐
│  Day 1 · Art history · Question 3 of 10       Anna 6  Tom 5 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                  [ the painting, large ]                 │
│                                                          │
│  This painting, Rembrandt's only seascape, was stolen    │
│  in 1990 and is still missing. Which museum was it       │
│  taken from?                                             │
│                                                          │
│   A  The Metropolitan Museum of Art, New York            │
│   B  The Isabella Stewart Gardner Museum, Boston         │
│   C  The National Gallery, London                        │
│   D  The Art Institute of Chicago                        │
│                                                          │
│  Anna  [A] [B] [C] [D]      [ Hint ]      [A] [B] [C] [D]  Tom │
│        Locked in                          choosing...    │
└──────────────────────────────────────────────────────────┘
```

(The names are placeholders. The game asks for your two names the first time you open it.)

**My calls**

- **Days are numbered, not tied to the calendar.** You always play the next unplayed day. If you miss an evening, nothing is lost and no day is skipped. The date you played is recorded in the history.
- **A past day can be replayed for practice.** A replay does not change the score.
- **No timer and no speed bonus.** You are meant to talk about the answers.

## 3. Scoring and the scoreboard

**Points per question (my call, based on the research):**

| Result | Points |
|---|---|
| Correct, without the hint | 3 |
| Correct, after the hint was opened | 2 |
| Wrong | 0 |

A perfect day is 30 points. I have set the scoring rule aside as a small piece for you to write yourself during the build (about five lines), so you can make this choice your own.

**How the scoring rule fits in (my calls):**

- The rule is one small function. It is told whether the answer was correct and whether the hint was open, and it returns the points. The table above is the starting suggestion.
- The game is not finished until that function is written; I build everything around it and hand you that one piece.
- The history stores what happened on each question (the answer chosen, right or wrong, hint or not) as well as the points. Past days keep the points they earned. If you change the rule on day 40, it applies from day 40.
- The "perfect day" figure is worked out from the rule, not fixed at 30.

**The scoreboard shows three things:**

- **All-time points** for each of you.
- **Day wins** for each of you (and ties). This keeps the game alive when one of you leads on points, because every new day is a fresh contest.
- **Accuracy by theme**, for example "Art history 74%, Geopolitics 52%", so you can each see what you are refreshing well and what you are not.

**The history** is a table with one row per day played: day number, date, theme, both scores and the winner. After 125 days it has 125 rows.

**Where the score lives.** In the browser of the device you play on. A backup can be copied as text or, on the GitHub site, downloaded as a file, and "Restore" loads it again, for example on a new laptop. (The artifact preview cannot download files, so there the backup is copy and paste only.) A day in progress is also saved, so reloading the page by accident resumes at the same question. "Reset" asks twice before erasing anything.

## 4. Themes

Seven themes in rotation, one per day (my call, following the research):

| Day in the cycle | Theme | Week 1 topic | Material ready |
|---|---|---|---|
| 1 | Art history | Rembrandt and Van Gogh | 10 questions, in this draft |
| 2 | Literature | Jane Austen, *Pride and Prejudice* | 10 candidates researched |
| 3 | Italian history | From Rome to the Republic | 10 candidates researched |
| 4 | Great books | Saint Augustine, *Confessions* | 10 candidates researched |
| 5 | French history | From Charlemagne to de Gaulle | 10 candidates researched |
| 6 | Geography | The world map | 8 candidates researched |
| 7 | Geopolitics | UN, NATO and the EU | 8 candidates researched |

The research also produced a four-week calendar of 28 named topics, 48 history and geography sub-topics that could each fill a day, and 20 further authors (Dante, Machiavelli, Manzoni, Molière, Voltaire, Hugo, Flaubert, Proust, Tolstoy and others). These are in the research report.

**How new days get made.** Each day is one small file of ten questions. Day 1 ships with the game. I write further days in batches of a week, checked the same way, and you approve each batch before it goes in.

## 5. Day 1: Rembrandt and Van Gogh

Ten questions, nine paintings. The correct answer is in bold. Difficulty is my estimate: 4 easy, 5 medium, 1 hard.

### Question 1 (easy)

*Image: The Night Watch, 1642.*

**Rembrandt's The Night Watch (1642) is a group portrait. Who are the people in it?**

- A. Surgeons of the Amsterdam surgeons' guild
- **B. Members of an Amsterdam civic guard company**
- C. Directors of the Dutch East India Company
- D. Dutch naval officers before a sea battle

**Hint:** They carry muskets, pikes and a banner, but they are citizens of one city district, led by a captain dressed in black.

**Did you know:** Rembrandt never called it "The Night Watch"; the name is first recorded in 1797. The Rijksmuseum credits him with being the first to paint a group portrait in which the sitters are in action.

Sources: [Rijksmuseum](https://www.rijksmuseum.nl/en/collection/SK-C-5), [Rijksmuseum, 10 things](https://www.rijksmuseum.nl/en/stories/10-things/story/10-things-about-rembrandt-s-night-watch)

### Question 2 (hard)

*Image: The Night Watch again.*

**In 1715 The Night Watch was moved to Amsterdam's Town Hall. What was done to the painting so that it would fit its new place?**

- A. It was split into two separate paintings
- B. A smaller copy was hung in its place
- **C. Pieces were cut off the canvas**
- D. A wall of the hall was demolished

**Hint:** Look at the left edge of the picture: the scene once continued further.

**Did you know:** Strips were cut from the canvas so that it would fit between two doors, the widest from the left side, and they have never been found. A small 17th-century copy attributed to Gerrit Lundens shows the full composition.

Sources: [Rijksmuseum, 10 things](https://www.rijksmuseum.nl/en/stories/10-things/story/10-things-about-rembrandt-s-night-watch), [Wikipedia](https://en.wikipedia.org/wiki/The_Night_Watch)

### Question 3 (medium)

*Image: The Anatomy Lesson of Dr Nicolaes Tulp, 1632.*

**Who commissioned Rembrandt's The Anatomy Lesson of Dr Nicolaes Tulp (1632)?**

- **A. The Surgeons' Guild of Amsterdam**
- B. The medical faculty of Leiden University
- C. The stadtholder's court in The Hague
- D. The family of the dead man

**Hint:** The men watching are not students; they belonged to the professional body that paid for the picture.

**Did you know:** Rembrandt was about 25 and had just moved to Amsterdam. The body is that of Aris Kindt, a criminal who had been hanged. The painting now hangs in the Mauritshuis in The Hague.

Sources: [Mauritshuis text, Google Arts & Culture](https://artsandculture.google.com/asset/de-anatomische-les-van-dr-nicolaes-tulp-rijn-rembrandt-van/NgHTJ5BKCD6gEg), [Leiden University](https://www.universiteitleiden.nl/en/dossiers/rembrandt-and-leiden-university/seven-canvases/the-anatomy-lesson-of-dr-nicolaes-tulp)

### Question 4 (medium)

*Image: Christ in the Storm on the Sea of Galilee, 1633.*

**This painting, Rembrandt's only seascape, was stolen in 1990 and is still missing. Which museum was it taken from?**

- A. The Metropolitan Museum of Art, New York
- **B. The Isabella Stewart Gardner Museum, Boston**
- C. The National Gallery, London
- D. The Art Institute of Chicago

**Hint:** It is a small museum in a New England city, built to look like a Venetian palace.

**Did you know:** On 18 March 1990 two men dressed as police officers took 13 works. None has been recovered. The empty frames still hang in the museum, which offers a reward of 10 million dollars.

Sources: [Isabella Stewart Gardner Museum](https://www.gardnermuseum.org/theft), [Wikipedia](https://en.wikipedia.org/wiki/The_Storm_on_the_Sea_of_Galilee)

### Question 5 (medium)

*Image: Self-Portrait, 1659 (National Gallery of Art, Washington).*

**Rembrandt painted this self-portrait in 1659. What had happened to him in the years just before?**

- A. He had been made court painter in The Hague
- B. He had returned from years of study in Italy
- C. He had just married Saskia van Uylenburgh
- **D. He had gone insolvent and lost his house**

**Hint:** The large Amsterdam house he had moved into in 1639 was no longer his.

**Did you know:** Rembrandt declared himself insolvent in 1656, and his house and collection were sold to pay his creditors. He never travelled abroad, and he painted himself throughout his life: around 40 painted self-portraits are known.

Sources: [National Gallery of Art text, Google Arts & Culture](https://artsandculture.google.com/asset/self-portrait/-gHQe8vbiHn2xw), [Wikipedia](https://en.wikipedia.org/wiki/Rembrandt)

### Question 6 (medium)

*Image: The Potato Eaters, 1885.*

**Where in the Netherlands did Van Gogh paint The Potato Eaters in 1885?**

- A. Zundert
- B. The Hague
- **C. Nuenen**
- D. Amsterdam

**Hint:** A village in Brabant where his father was the pastor in the 1880s. It is not the village where Vincent was born.

**Did you know:** Van Gogh meant the picture as a showpiece, but it was criticised for its dark colours and clumsy figures. Two years later he still told his sister it was the best thing he had done.

Sources: [Van Gogh Museum](https://www.vangoghmuseum.nl/en/collection/s0005V1962)

### Question 7 (easy)

*Image: Sunflowers, 1888 (National Gallery, London).*

**Van Gogh painted his Sunflowers in Arles in August 1888 to decorate his house before a fellow painter came to stay. Who was the guest?**

- A. Paul Cézanne
- B. Henri de Toulouse-Lautrec
- C. Georges Seurat
- **D. Paul Gauguin**

**Hint:** The two shared the Yellow House in the autumn of 1888, until a violent quarrel just before Christmas.

**Did you know:** Van Gogh hung two of the sunflower pictures in the guest room. He painted seven versions of sunflowers in a vase in 1888 and 1889; one was destroyed in the Second World War.

Sources: [National Gallery, London](https://www.nationalgallery.org.uk/paintings/vincent-van-gogh-sunflowers)

### Question 8 (easy)

*Image: Self-Portrait with Bandaged Ear, 1889.*

**In Self-Portrait with Bandaged Ear (1889), what hangs on the wall behind Van Gogh?**

- A. One of his Sunflowers paintings
- **B. A Japanese print**
- C. A portrait of Gauguin
- D. A map of Provence

**Hint:** He collected hundreds of these, and admired their bold colours.

**Did you know:** The injured ear was his left one. It looks like the right because he painted himself in a mirror. He made the picture in January 1889, about a week after leaving hospital.

Sources: [The Courtauld](https://courtauld.ac.uk/highlights/self-portrait-with-bandaged-ear/)

### Question 9 (easy)

*Image: The Starry Night, 1889.*

**Where was Van Gogh living when he painted The Starry Night in June 1889?**

- A. In the Yellow House in Arles
- B. In his brother Theo's flat in Paris
- **C. In an asylum at Saint-Rémy-de-Provence**
- D. At an inn in Auvers-sur-Oise

**Hint:** He had left Arles the month before, and the window of his room had iron bars.

**Did you know:** The sky is based on the view from his window, but the village is invented, and its church spire looks more Dutch than Provençal. The painting has been at the Museum of Modern Art in New York since 1941.

Sources: [MoMA text, Google Arts & Culture](https://artsandculture.google.com/asset/the-starry-night/bgEuwDxel93-Pg), [Wikipedia](https://en.wikipedia.org/wiki/The_Starry_Night)

### Question 10 (medium)

*Image: Wheatfield with Crows, 1890.*

**Which popular claim about Wheatfield with Crows (1890) does the Van Gogh Museum call a persistent myth?**

- **A. That it was his last painting**
- B. That Gauguin painted the crows
- C. That it was painted from his asylum window
- D. That it was sold for a high price in his lifetime

**Hint:** The myth is about when he painted it.

**Did you know:** Van Gogh painted it in Auvers-sur-Oise in July 1890, in the last weeks of his life, but he made several more works after it. He died on 29 July 1890, aged 37.

Sources: [Van Gogh Museum](https://www.vangoghmuseum.nl/en/collection/s0149V1962)

### Spares

Eight more checked questions are ready if you want to swap any of the above: Rembrandt's birthplace, Saskia, The Return of the Prodigal Son, The Jewish Bride, The Bedroom, Café Terrace at Night, Almond Blossom, and The Red Vineyard (the "only painting he ever sold" story, which is not quite true).

## 6. How it gets built

**Approaches considered**

| Approach | What it means | Verdict |
|---|---|---|
| A plain web page | Ordinary web files with no installs and no server. Questions sit in small data files, one per day. The score is saved in the browser, with a backup button. | **Chosen.** It runs the same as an artifact and on GitHub, and adding a day means adding one file. |
| An app framework | The same game built with a toolkit such as React, which needs a build step before each update. | Rejected. More moving parts and upkeep for a game of this size. |
| An online database | Scores stored on a server so that any device sees them. | Rejected for now. You play on one screen, so it adds accounts and setup for nothing you need. It can be added later if you start playing on two phones. |

**Parts**

- **The game page.** Home, question, reveal, end of day, scoreboard and history.
- **The day files.** One per day: theme, title, and ten questions, each with four answers, the correct one, the hint, the explanation and the sources. An image and its credit are optional. Art history days have a painting on every question. On other days a question has an image when a free one exists (a portrait, a map, a title page), and otherwise uses a text-only layout with the question set larger.
- **The images.** Copies are stored with the game at about 1,280 pixels wide, not loaded from Wikimedia each time. Every image is public domain. I will look at each one before it goes in, to make sure it shows the painting without a frame or museum wall.
- **The score store.** Saved on your device, with download and restore.

**The look (my call).** Like a small museum guide: a calm background, the painting as the hero of the screen, a serif typeface for questions, large buttons that work on a laptop or a tablet. It follows your device's light or dark setting.

**Publishing.** First as an artifact for you to try. Then, with your go-ahead, to GitHub under your account `teejay772`, switched on as a website (GitHub Pages). On GitHub's free plan the website must be public: anyone with the link could open the game and see the questions, but never your scores, which stay on your device. I will ask before creating anything on GitHub.

## 7. Not in the first version

- **Missed questions coming back.** The memory research supports bringing a missed question back about a week later and again about a month later. It needs a few weeks of days to draw from, so I would add it once you have played two weeks.
- **Playing on two phones.** See the online database above.
- **Streaks, badges and seasons.** Easy to add later if you want more competition.
- **Languages other than English.**

## 8. What you should know about the research

- **Day 1 is the best-sourced part.** Most facts come from the museums that hold the paintings. I re-checked the three weakest (the 1990 theft, Rembrandt's insolvency, and Van Gogh's remark about The Jewish Bride). The first two held up. The third rests on a friend's recollection published in 1912, so I moved that question to the spares.
- **History and geography are checked against English Wikipedia only**, because Britannica and several official sites blocked automated reading. Each batch gets a second source before it goes into the game.
- **The scoring and hint advice is partly opinion.** Research supports explanations after each answer and bringing missed questions back. Nothing peer-reviewed exists on how to score a friendly two-player game or what a hint should cost.
- **Not yet done:** nobody has looked at the image files themselves; only their licences and sizes were checked.

The research notes (four files, with every source and image record) are in `research_notes/Trivia game content research/`. A single report that pulls them together is being written to `reports/Trivia game content research.md`.
