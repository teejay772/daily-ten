// Everything the players see and touch. Game rules live in game.js, the
// all-time record in store.js; this file only draws them and passes on input.

import {
  createSession, lockIn, unlock, openHint, reveal, next,
  bothLocked, totals, maxPoints, keyToPick,
} from './game.js';
import {
  emptyState, saveState, recordDay, nextUnplayedDay, summary, exportBackup, importBackup,
  themeMenu, playerDayNumber, canChoose,
} from './store.js';
import { latestOnly } from './latest.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const PLAYERS = ['a', 'b'];
const DEFAULT_NAMES = { a: 'Player 1', b: 'Player 2' };

/** Build an element. Text is always added as text nodes, never as HTML. */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  }
  for (const child of children.flat(Infinity)) {
    if (child === false || child === null || child === undefined) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const percent = ({ correct, total }) => (total > 0 ? `${Math.round((100 * correct) / total)}%` : '–');

function isTopLevelPage() {
  try { return window.top === window.self; } catch { return false; }
}

export function startApp({ root, dayList, loadDay, storage, state, persistent, pointsFor }) {
  const app = {
    state,
    persistent,
    view: state.names.a === '' && state.names.b === '' ? 'setup' : 'home',
    day: null,
    session: null,
    practice: false,
    homeError: null,
    pickedTheme: null,    // the theme opened under "Choose the theme to play"
    message: null,        // { tone: 'good' | 'bad' | 'info', text } on the backup screen
    confirm: null,        // { kind: 'restore', incoming } | { kind: 'reset' }
    restoreText: '',
    brokenImages: new Set(),
    imageNode: null,      // { src, node } so the painting is not reloaded on every tap
  };

  const name = (p) => app.state.names[p] || DEFAULT_NAMES[p];
  const nameSpan = (p) => h('span', { class: `name-${p}` }, name(p));

  function persist() {
    if (!saveState(storage, app.state)) app.persistent = false;
  }

  function render() {
    const views = { setup: viewSetup, home: viewHome, question: viewQuestion, finished: viewFinished, backup: viewBackup };
    root.replaceChildren(...views[app.view]());
  }

  function go(view) {
    app.view = view;
    render();
    window.scrollTo(0, 0);
  }

  // ---------- playing a day ----------

  function saveProgress() {
    if (app.practice) return;
    app.state = { ...app.state, inProgress: app.session };
    persist();
  }

  // Two taps can start two loads. Only the day asked for last may open.
  const beginOpening = latestOnly();

  async function openDay(entry, { practice = false, session = null } = {}) {
    const stillWanted = beginOpening();
    app.pickedTheme = null;
    app.homeError = null;
    try {
      const day = await loadDay(entry);
      if (!stillWanted()) return;
      const usable = session && session.dayId === day.id && session.index < day.questions.length
        && session.phase !== 'finished';
      app.day = day;
      app.session = usable ? session : createSession(day);
      app.practice = practice;
      saveProgress();
      go('question');
    } catch (error) {
      console.error(error);
      if (!stillWanted()) return;
      app.homeError = `"${entry.title}" could not be loaded. Check your connection and try again.`;
      go('home');
    }
  }

  function move(change) {
    const before = app.session;
    app.session = change(before);
    if (app.session === before) return;
    saveProgress();
    render();
  }

  function advance() {
    app.session = next(app.session, app.day);
    if (app.session.phase === 'finished') {
      if (!app.practice) {
        app.state = recordDay(app.state, app.day, app.session, today(), maxPoints(app.day, pointsFor));
        persist();
      }
      go('finished');
      return;
    }
    saveProgress();
    render();
    window.scrollTo(0, 0);
  }

  document.addEventListener('keydown', (event) => {
    if (app.view !== 'question' || !app.session || app.session.phase !== 'answering') return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement
      && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
    if (document.querySelector('dialog[open]')) return;
    const pick = keyToPick(event.key);
    if (!pick) return;
    event.preventDefault();
    move((s) => lockIn(s, pick.player, pick.option));
  });

  // ---------- shared pieces ----------

  function masthead(...actions) {
    return h('header', { class: 'masthead' },
      h('div', { class: 'wordmark' }, 'The Daily ', h('em', {}, 'Ten')),
      h('div', { class: 'row' }, actions));
  }

  function nameFields() {
    return h('div', { class: 'fields-2' },
      PLAYERS.map((p) => h('div', { class: 'field' },
        h('label', { for: `name-${p}` }, p === 'a' ? 'Left side of the screen' : 'Right side of the screen'),
        h('input', {
          id: `name-${p}`, name: `name-${p}`, type: 'text', maxlength: '24', autocomplete: 'off',
          placeholder: DEFAULT_NAMES[p], value: app.state.names[p],
        }))));
  }

  function readNames(form) {
    const read = (p) => (new FormData(form).get(`name-${p}`) || '').toString().trim().slice(0, 24) || DEFAULT_NAMES[p];
    return { a: read('a'), b: read('b') };
  }

  // ---------- setup ----------

  function viewSetup() {
    const form = h('form', {
      class: 'stack-lg',
      onsubmit: (event) => {
        event.preventDefault();
        app.state = { ...app.state, names: readNames(event.currentTarget) };
        persist();
        go('home');
      },
    },
      nameFields(),
      h('div', {}, h('button', { class: 'btn btn-primary', type: 'submit' }, 'Start')));

    return [h('main', { class: 'setup card stack-lg' },
      h('div', { class: 'stack' },
        h('p', { class: 'eyebrow' }, 'A daily quiz for two'),
        h('h1', {}, 'The Daily Ten'),
        h('p', {}, 'Ten questions a day, played together on one screen. Each of you locks in an answer, then you reveal it. Who is playing?')),
      form)];
  }

  // ---------- home ----------

  // Days can be played in any order, so the number on the screen is the players' own count.
  const dayNo = (id) => playerDayNumber(app.state, id);

  function pausedDay() {
    return app.state.inProgress
      ? dayList.find((d) => d.id === app.state.inProgress.dayId) || null
      : null;
  }

  function todayCard() {
    const inProgress = pausedDay();

    if (inProgress) {
      const at = Math.min(app.state.inProgress.index + 1, 10);
      return h('section', { class: 'card today' },
        h('p', { class: 'eyebrow' }, `Day ${dayNo(inProgress.id)} · ${inProgress.theme} · in progress`),
        h('h1', {}, inProgress.title),
        h('p', { class: 'meta' }, `You stopped at question ${at} of 10. Your answers so far are saved.`),
        h('div', {}, h('button', {
          class: 'btn btn-primary',
          onclick: () => openDay(inProgress, { session: app.state.inProgress }),
        }, `Continue Day ${dayNo(inProgress.id)}`)));
    }

    const upcoming = nextUnplayedDay(app.state, dayList);
    if (upcoming) {
      return h('section', { class: 'card today' },
        h('p', { class: 'eyebrow' }, `Day ${dayNo(upcoming.id)} · ${upcoming.theme}`),
        h('h1', {}, upcoming.title),
        h('p', { class: 'meta' }, 'Ten questions, about 30 minutes.'),
        h('div', {}, h('button', { class: 'btn btn-primary', onclick: () => openDay(upcoming) }, `Play Day ${dayNo(upcoming.id)}`)));
    }

    if (dayList.length === 0) {
      return h('section', { class: 'card today' },
        h('h1', {}, 'No days yet'),
        h('p', { class: 'meta' }, 'This copy of the game has no question days in it.'));
    }

    return h('section', { class: 'card today' },
      h('p', { class: 'eyebrow' }, 'All caught up'),
      h('h1', {}, dayList.length === 1 ? 'You have played Day 1' : `You have played all ${dayList.length} days`),
      h('p', { class: 'meta' }, 'New days arrive in weekly batches. Until then you can practise any topic below. Practice does not change the score.'));
  }

  function pickTheme(theme) {
    app.pickedTheme = app.pickedTheme === theme ? null : theme;
    render();
    const button = [...root.querySelectorAll('.theme-btn')].find((b) => b.dataset.theme === theme);
    if (button) button.focus();
  }

  function chooseCard() {
    if (!canChoose(app.state, dayList)) return null;
    const menu = themeMenu(app.state, dayList);
    const picked = menu.find((t) => t.theme === app.pickedTheme) || null;
    return h('section', { class: 'card choose' },
      h('h2', {}, 'Choose the theme to play'),
      h('div', { class: 'theme-grid' },
        menu.map((t) => h('button', {
          class: 'btn theme-btn',
          type: 'button',
          'data-theme': t.theme,
          'aria-pressed': picked === t ? 'true' : 'false',
          'aria-label': t.left > 0 ? `${t.theme}, ${plural(t.left, 'topic', 'topics')} left` : `${t.theme}, all played`,
          onclick: () => pickTheme(t.theme),
        },
        h('span', {}, t.theme),
        h('span', { class: 'theme-count' }, t.left > 0 ? t.left : '✓')))),
      picked ? [
        h('h3', {}, 'Choose the topic'),
        h('div', { class: 'topic-list' },
          picked.topics.map(({ entry, played }) => (played
            ? h('div', { class: 'topic is-played' },
              h('span', {}, `✓ ${entry.title}`),
              h('button', {
                class: 'btn btn-quiet',
                type: 'button',
                'aria-label': `Practise ${entry.title}`,
                onclick: () => openDay(entry, { practice: true }),
              }, 'Practise'))
            : h('button', { class: 'btn topic', type: 'button', onclick: () => openDay(entry) }, entry.title)))),
      ] : null);
  }

  function boardCard() {
    const s = summary(app.state);
    const themes = Object.keys(s.byTheme).sort();
    return h('section', { class: 'card board' },
      h('h2', {}, 'All-time score'),
      h('div', { class: 'board-players' },
        PLAYERS.map((p) => h('div', { class: `board-player is-${p}` },
          h('div', { class: 'board-name' }, name(p)),
          h('div', { class: 'board-points' }, s.points[p]),
          h('div', { class: 'board-sub' }, `${s.points[p] === 1 ? 'point' : 'points'} · ${plural(s.dayWins[p], 'day won', 'days won')}`)))),
      s.daysPlayed === 0
        ? h('p', { class: 'empty' }, 'No days played yet. Points, day wins and your accuracy by theme will appear here after Day 1.')
        : [
          h('p', { class: 'board-sub' }, `${plural(s.daysPlayed, 'day', 'days')} played · ${plural(s.dayWins.ties, 'tie', 'ties')}`),
          h('div', { class: 'table-wrap' },
            h('table', {},
              h('thead', {}, h('tr', {},
                h('th', {}, 'Correct answers by theme'),
                h('th', { class: 'n' }, name('a')),
                h('th', { class: 'n' }, name('b')))),
              h('tbody', {}, themes.map((theme) => h('tr', {},
                h('td', {}, theme),
                h('td', { class: 'n' }, `${percent(s.byTheme[theme].a)} (${s.byTheme[theme].a.correct}/${s.byTheme[theme].a.total})`),
                h('td', { class: 'n' }, `${percent(s.byTheme[theme].b)} (${s.byTheme[theme].b.correct}/${s.byTheme[theme].b.total})`)))))),
        ]);
  }

  function historyCard() {
    const rows = app.state.history.map((e, i) => ({ e, place: i + 1 })).reverse();
    if (rows.length === 0) return null;
    return h('section', { class: 'card stack' },
      h('h2', {}, 'Days played'),
      h('div', { class: 'table-wrap' },
        h('table', {},
          h('thead', {}, h('tr', {},
            h('th', {}, 'Day'), h('th', {}, 'Played'), h('th', {}, 'Topic'),
            h('th', { class: 'n' }, name('a')), h('th', { class: 'n' }, name('b')),
            h('th', {}, 'Winner'), h('th', {}, ''))),
          h('tbody', {}, rows.map(({ e, place }) => {
            const entry = dayList.find((d) => d.id === e.dayId);
            const winner = e.totals.a === e.totals.b ? 'Tie' : name(e.totals.a > e.totals.b ? 'a' : 'b');
            return h('tr', {},
              h('td', {}, place),
              h('td', {}, formatDate(e.playedOn)),
              h('td', {}, `${e.theme}: ${e.title}`),
              h('td', { class: 'n' }, e.totals.a),
              h('td', { class: 'n' }, e.totals.b),
              h('td', {}, winner),
              h('td', {}, entry && !app.state.inProgress
                ? h('button', { class: 'btn btn-quiet', onclick: () => openDay(entry, { practice: true }) }, 'Practise')
                : null));
          })))));
  }

  function viewHome() {
    return [
      masthead(h('button', { class: 'btn', onclick: () => { app.message = null; app.confirm = null; go('backup'); } }, 'Names and backup')),
      h('main', { class: 'stack-lg' },
        app.homeError ? h('p', { class: 'notice notice-bad', role: 'alert' }, app.homeError) : null,
        app.persistent ? null : h('p', { class: 'notice' },
          'Scores are not being saved on this device. The browser is blocking storage, so the score will be lost when this page closes.'),
        todayCard(),
        chooseCard(),
        boardCard(),
        historyCard()),
    ];
  }

  // ---------- question ----------

  function openZoom(image) {
    const dialog = h('dialog', { class: 'zoom', 'aria-label': 'Enlarged image' },
      h('img', { src: image.src, alt: image.alt }),
      h('form', { method: 'dialog' }, h('button', { class: 'btn' }, 'Close')));
    dialog.addEventListener('close', () => dialog.remove());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    document.body.append(dialog);
    dialog.showModal();
  }

  function hang(question, revealed) {
    const image = question.image;
    if (!image || app.brokenImages.has(image.src)) return null;
    if (!app.imageNode || app.imageNode.src !== image.src) {
      const img = h('img', { src: image.src, alt: image.alt, width: image.width, height: image.height });
      img.addEventListener('error', () => { app.brokenImages.add(image.src); render(); });
      app.imageNode = {
        src: image.src,
        node: h('button', { class: 'hang-btn', type: 'button', 'aria-label': 'Enlarge the image', onclick: () => openZoom(image) }, img),
      };
    }
    const label = image.label;
    return h('figure', { class: 'hang' },
      app.imageNode.node,
      revealed
        ? h('figcaption', { class: 'placard' },
          label ? [
            h('span', { class: 'placard-artist' }, label.artist),
            h('span', { class: 'placard-title' }, label.title),
            h('span', {}, label.date),
            h('span', {}, label.place),
          ] : null,
          h('span', { class: 'placard-credit' }, image.credit))
        : null);
  }

  function pad(p) {
    const s = app.session;
    const locked = s.picks[p] !== null;
    const keys = p === 'a' ? ['1', '2', '3', '4'] : ['7', '8', '9', '0'];
    return h('section', { class: `pad is-${p}`, 'aria-label': `Answer pad for ${name(p)}` },
      h('div', { class: 'pad-name' }, name(p)),
      locked
        ? h('div', { class: 'pad-locked' },
          h('span', {}, 'Locked in'),
          h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => move((x) => unlock(x, p)) }, 'Change'))
        : h('div', { class: 'pad-buttons' }, LETTERS.map((letter, i) => h('button', {
          class: 'pick', type: 'button', 'aria-label': `${name(p)}: answer ${letter}`,
          onclick: () => move((x) => lockIn(x, p, i)),
        }, letter))),
      h('div', { class: 'pad-status' },
        locked
          ? (s.hintUsed[p] ? 'Locked in after the hint.' : 'Your choice is hidden until the reveal.')
          : h('span', { class: 'pad-keys' }, 'Or press ', keys.map((k, i) => [i > 0 ? ' ' : null, h('kbd', {}, k)]))));
  }

  function optionRow(question, i, result) {
    if (!result) {
      return h('li', { class: 'option' },
        h('span', { class: 'option-letter' }, LETTERS[i]),
        h('span', {}, question.options[i]));
    }
    const isAnswer = i === question.answer;
    const pickedBy = PLAYERS.filter((p) => result.picks[p] === i);
    const cls = isAnswer ? 'option is-correct' : (pickedBy.length > 0 ? 'option is-wrong-pick' : 'option');
    return h('li', { class: cls },
      h('span', { class: 'option-letter' }, LETTERS[i]),
      h('span', {}, question.options[i]),
      h('span', { class: 'option-tags' },
        isAnswer ? h('span', { class: 'tag tag-good' }, 'Correct answer') : null,
        pickedBy.map((p) => h('span', { class: `tag name-${p}` }, name(p)))));
  }

  function verdict(p, result) {
    const right = result.correct[p];
    const points = result.points[p];
    return h('li', { class: `verdict is-${p}` },
      h('span', {},
        h('strong', { class: `name-${p}` }, name(p)), ` chose ${LETTERS[result.picks[p]]}: `,
        h('strong', { class: right ? 'is-good' : 'is-bad' }, right ? 'correct' : 'wrong'),
        result.hintUsed[p] ? ', with the hint' : ''),
      h('span', { class: 'verdict-points' }, points > 0 ? `+${plural(points, 'point', 'points')}` : '0 points'));
  }

  function viewQuestion() {
    const { day, session } = app;
    const question = day.questions[session.index];
    const revealed = session.phase === 'revealed';
    const result = revealed ? session.results[session.results.length - 1] : null;
    const score = totals(session);
    const figure = hang(question, revealed);
    const isLast = session.index === day.questions.length - 1;
    const ready = bothLocked(session);

    const bar = h('header', { class: 'qbar' },
      h('div', {},
        h('p', { class: 'eyebrow' }, `Day ${dayNo(day.id)} · ${day.theme}${app.practice ? ' · practice' : ''}`),
        h('strong', {}, `Question ${session.index + 1} of ${day.questions.length}`)),
      h('div', { class: 'qbar-score num' },
        PLAYERS.map((p) => h('span', { class: `name-${p}` }, `${name(p)} ${score[p]}`))),
      h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => go('home') },
        app.practice ? 'Stop practising' : 'Pause and go home'));

    const body = revealed
      ? [
        h('ul', { class: 'verdicts' }, PLAYERS.map((p) => verdict(p, result))),
        h('div', { class: 'know' }, h('h3', {}, 'Did you know'), h('p', {}, question.explanation)),
        h('p', { class: 'sources' }, 'Sources: ',
          question.sources.map((s, i) => [i > 0 ? ', ' : null,
            h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.label)])),
        h('div', {}, h('button', { class: 'btn btn-primary', type: 'button', onclick: advance },
          isLast ? 'See the result' : 'Next question')),
      ]
      : [
        h('div', { class: 'hint' },
          session.hintOpen
            ? [
              h('p', { class: 'eyebrow' }, 'Hint'),
              h('p', { class: 'hint-text' }, question.hint),
              h('p', { class: 'hint-note' }, 'Anyone who locks in from now on scores as hinted.'),
            ]
            : [
              h('div', {}, h('button', { class: 'btn', type: 'button', onclick: () => move(openHint) }, 'Show the hint')),
              h('p', { class: 'hint-note' }, 'The hint lowers the points for whoever has not locked in yet.'),
            ]),
        h('div', { class: 'pads' }, PLAYERS.map(pad)),
        h('div', { class: 'row' },
          h('button', {
            class: 'btn btn-primary', type: 'button', disabled: !ready,
            onclick: () => move((s) => reveal(s, day, pointsFor)),
          }, 'Reveal the answer'),
          ready ? null : h('span', { class: 'hint-note' }, 'Waiting for both of you to lock in.')),
      ];

    return [
      bar,
      h('main', { class: figure ? 'question' : 'question no-image' },
        figure,
        h('section', { class: 'card label' },
          h('h1', { class: 'label-q' }, question.question),
          h('ol', { class: 'options' }, question.options.map((_, i) => optionRow(question, i, result))),
          body)),
    ];
  }

  // ---------- end of day ----------

  function viewFinished() {
    const { day, session } = app;
    const score = totals(session);
    const max = maxPoints(day, pointsFor);
    const headline = score.a === score.b
      ? 'The day is a tie'
      : [nameSpan(score.a > score.b ? 'a' : 'b'), ' wins the day'];
    const mark = (r, p) => h('td', { class: `n ${r.correct[p] ? 'is-good' : 'is-bad'}` },
      `${r.correct[p] ? 'Correct' : 'Wrong'}${r.hintUsed[p] ? ' (hint)' : ''} · ${r.points[p]}`);

    return [
      masthead(),
      h('main', { class: 'stack-lg' },
        h('section', { class: 'card final stack-lg' },
          h('div', { class: 'stack' },
            h('p', { class: 'eyebrow' }, `Day ${dayNo(day.id)} · ${day.theme} · result`),
            h('h1', {}, headline)),
          app.practice
            ? h('p', { class: 'notice' }, 'This was a practice round. The all-time score has not changed.')
            : null,
          h('div', { class: 'board-players' },
            PLAYERS.map((p) => h('div', { class: `board-player is-${p}` },
              h('div', { class: 'board-name' }, name(p)),
              h('div', { class: 'board-points' }, score[p]),
              h('div', { class: 'board-sub' }, `out of ${max}`)))),
          h('div', { class: 'table-wrap' },
            h('table', {},
              h('thead', {}, h('tr', {},
                h('th', {}, 'Question'),
                h('th', { class: 'n' }, name('a')),
                h('th', { class: 'n' }, name('b')))),
              h('tbody', {}, session.results.map((r, i) => h('tr', {},
                h('td', {}, `${i + 1}. ${day.questions[i].question}`),
                mark(r, 'a'), mark(r, 'b')))))),
          h('div', {}, h('button', { class: 'btn btn-primary', type: 'button', onclick: () => go('home') }, 'Back to home')))),
    ];
  }

  // ---------- names and backup ----------

  function say(tone, text) { app.message = { tone, text }; }

  async function copyBackup() {
    const text = exportBackup(app.state);
    try {
      await navigator.clipboard.writeText(text);
      say('good', 'Backup copied. Paste it somewhere safe, such as a note or an email to yourself.');
      render();
    } catch {
      say('info', 'Copying was blocked here. The backup text is selected: copy it with Ctrl+C or Cmd+C.');
      render();
      const box = document.getElementById('backup-text');
      if (box) { box.focus(); box.select(); }
    }
  }

  function downloadBackup() {
    const url = URL.createObjectURL(new Blob([exportBackup(app.state)], { type: 'application/json' }));
    const link = h('a', { href: url, download: `daily-ten-backup-${today()}.json` });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say('good', 'Backup file saved to your downloads.');
    render();
  }

  function tryRestore() {
    try {
      const incoming = importBackup(app.restoreText);
      app.confirm = { kind: 'restore', incoming };
      app.message = null;
    } catch (error) {
      app.confirm = null;
      say('bad', `${error.message} Nothing was changed.`);
    }
    render();
  }

  function confirmBox() {
    if (!app.confirm) return null;
    const have = app.state.history.length;
    const cancel = h('button', { class: 'btn', type: 'button', onclick: () => { app.confirm = null; render(); } }, 'Keep my scores');
    if (app.confirm.kind === 'restore') {
      const incoming = app.confirm.incoming;
      return h('div', { class: 'notice stack', role: 'alert' },
        h('p', {}, `Restoring replaces the ${plural(have, 'day', 'days')} on this device with the ${plural(incoming.history.length, 'day', 'days')} in the backup.`),
        h('div', { class: 'row' },
          h('button', {
            class: 'btn btn-primary', type: 'button',
            onclick: () => {
              app.state = incoming;
              app.confirm = null;
              app.restoreText = '';
              persist();
              say('good', `Restored ${plural(incoming.history.length, 'day', 'days')} from the backup.`);
              render();
            },
          }, 'Replace with the backup'),
          cancel));
    }
    return h('div', { class: 'notice notice-bad stack', role: 'alert' },
      h('p', {}, `This erases all ${plural(have, 'day', 'days')} of history and both scores. It cannot be undone unless you have a backup.`),
      h('div', { class: 'row' },
        h('button', {
          class: 'btn btn-danger', type: 'button',
          onclick: () => {
            app.state = { ...emptyState(), names: app.state.names };
            app.confirm = null;
            persist();
            say('good', 'All scores were erased.');
            render();
          },
        }, 'Yes, erase everything'),
        cancel));
  }

  function viewBackup() {
    const tone = { good: 'notice notice-good', bad: 'notice notice-bad', info: 'notice' };
    return [
      masthead(h('button', { class: 'btn', type: 'button', onclick: () => go('home') }, 'Back to home')),
      h('main', { class: 'stack-lg' },
        app.message ? h('p', { class: tone[app.message.tone], role: 'status' }, app.message.text) : null,
        confirmBox(),

        h('section', { class: 'card stack' },
          h('h2', {}, 'Names'),
          h('form', {
            class: 'stack',
            onsubmit: (event) => {
              event.preventDefault();
              app.state = { ...app.state, names: readNames(event.currentTarget) };
              persist();
              say('good', 'Names saved.');
              render();
            },
          }, nameFields(), h('div', {}, h('button', { class: 'btn', type: 'submit' }, 'Save names')))),

        h('section', { class: 'card stack' },
          h('h2', {}, 'Back up the score'),
          h('p', {}, 'The score is kept in this browser on this device. Keep a copy so that a new laptop or a cleared browser does not cost you your history.'),
          h('div', { class: 'field' },
            h('label', { for: 'backup-text' }, 'Your backup'),
            h('textarea', { id: 'backup-text', readonly: true, rows: '5' }, exportBackup(app.state))),
          h('div', { class: 'row' },
            h('button', { class: 'btn btn-primary', type: 'button', onclick: copyBackup }, 'Copy backup'),
            isTopLevelPage()
              ? h('button', { class: 'btn', type: 'button', onclick: downloadBackup }, 'Download backup file')
              : null)),

        h('section', { class: 'card stack' },
          h('h2', {}, 'Restore a backup'),
          h('div', { class: 'field' },
            h('label', { for: 'restore-text' }, 'Paste the backup text here'),
            h('textarea', {
              id: 'restore-text', rows: '5',
              oninput: (event) => { app.restoreText = event.currentTarget.value; },
            }, app.restoreText)),
          h('div', { class: 'field' },
            h('label', { for: 'restore-file' }, 'Or choose a backup file'),
            h('input', {
              id: 'restore-file', type: 'file', accept: '.json,application/json,text/plain',
              onchange: async (event) => {
                const file = event.currentTarget.files[0];
                if (!file) return;
                app.restoreText = await file.text();
                tryRestore();
              },
            })),
          h('div', {}, h('button', { class: 'btn', type: 'button', onclick: tryRestore }, 'Restore from this text'))),

        h('section', { class: 'card stack' },
          h('h2', {}, 'Start again'),
          h('p', {}, 'Erase the history and both scores on this device. Names are kept.'),
          h('div', {}, h('button', {
            class: 'btn btn-danger', type: 'button',
            onclick: () => { app.confirm = { kind: 'reset' }; app.message = null; render(); window.scrollTo(0, 0); },
          }, 'Reset all scores')))),
    ];
  }

  render();
}
