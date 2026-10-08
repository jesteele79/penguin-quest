import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../core/state.js';
import { el, $$, arrowNav, escapeHTML, readable } from '../ui/dom.js';
import { ICON, portraitSVG } from '../ui/icons.js';
import { drawMarker } from '../ui/hud.js';
import { SHOP, findItem, SLOT_NAMES, inWardrobe, REGION_INFO } from './content.js';
import { MAIN, SIDE, RESONANCE_NEED } from './questdata.js';
import { DOMAINS, DOMAIN_ORDER } from '../math/skills.js';
import { REGION_COLORS } from '../core/materials.js';
import { REGIONS, WORLD_HALF, GRID } from '../world/layout.js';
import { orbitShot } from './minigames/common.js';
import { BOOKS, BOOK_ICONS, bookStatus, isUnlocked, skillsToGo, UNLOCK_MASTERY, bookById, nextBook, placeName } from '../books/books.js';
import { T } from '../books/terms.js';
import { ACTIVE } from '../books/active.js';
import { BOOK } from '../books/current.js';
import { LESSONS } from '../math/lessons.js';
import { SKILLS } from '../math/skills.js';

const NAME_IDEAS = ['Pip', 'Waddles', 'Frosty', 'Nova', 'Pebble', 'Blizzard', 'Sprinkles', 'Tux', 'Iggy', 'Aurora', 'Flipper', 'Comet'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

class Screen {
  constructor(cls) {
    this.root = el('div', { class: `screen ${cls}`, role: 'dialog' });
    this.cls = cls;
    // The 3D world stops (and keeps its last frame) behind full-screen menus: saves battery and heat.
    this.freezesWorld = true;
  }

  enter() {
    G.uiRoot.append(this.root);
    this.render();
    G.player.frozen = true;
    G.hud.setPrompt(null);
    requestAnimationFrame(() => {
      this.root.classList.add('show');
      this.focusFirst();
    });
  }

  focusFirst() {
    const f = this.root.querySelector('[autofocus]') || this.root.querySelector('button:not([disabled]), input');
    f?.focus();
  }

  exit() {
    this.root.classList.remove('show');
    const r = this.root;
    setTimeout(() => r.remove(), 250);
  }

  close() { G.audio.play('close'); popActivity(this); }

  onKey(e, inField) {
    if (e.key === 'Escape') { e.preventDefault(); this.close(); return; }
    if (!inField) arrowNav(this.root, e);
  }

  render() {}
}

function btn(label, onclick, cls = '', attrs = {}) {
  return el('button', { class: `btn ${cls}`, type: 'button', onclick: (e) => { G.audio.play('click'); onclick(e); }, ...attrs, html: label });
}

function chapterNumber(d) {
  const done = MAIN.filter((m) => d.q?.[m.id]?.done).length;
  return Math.min(7, done);
}

// ------------------------------------------------------------ Title
export class TitleScreen extends Screen {
  constructor(onContinue, onNew) {
    super('title-screen');
    this.onContinue = onContinue;
    this.onNew = onNew;
  }

  render() {
    const d = G.save.peek();
    this.root.innerHTML = '';
    const menu = el('div', { class: 'title-menu' });
    if (d) {
      const crystals = Object.values(d.crystals).filter(Boolean).length;
      const ch = chapterNumber(d);
      const where = d.festival ? T.legend : ch === 0 ? 'Prologue' : `Chapter ${ch}`;
      menu.append(btn(`<span class="big">Continue</span><span class="small">${escapeHTML(d.profile.name)} · ${where} · ${crystals} of 5 ${T.crystals}</span>`, () => this.onContinue(), 'primary title-btn', { autofocus: true }));
      menu.append(btn('<span class="big">New Adventure</span>', () => this.confirmNew(), 'title-btn'));
    } else {
      menu.append(btn('<span class="big">Start Adventure</span>', () => this.onNew(), 'primary title-btn', { autofocus: true }));
    }
    menu.append(btn('<span class="big">Settings</span>', () => pushActivity(new SettingsScreen()), 'title-btn'));
    this.root.append(
      el('div', { class: 'logo' },
        el('div', { class: 'logo-1', text: 'Penguin Quest' }),
        el('div', { class: `logo-2 logo-${ACTIVE}`, text: bookById(ACTIVE).title }),
        el('div', { class: 'logo-3', html: '<span>✦</span> An open-world math adventure <span>✦</span>' })),
      menu,
      bookShelf(d),
      el('div', { class: 'title-foot' },
        btn('For grown-ups', () => pushActivity(new GrownupsScreen()), 'ghost small'),
        el('span', { class: 'title-hint', html: 'Use <kbd>↑</kbd><kbd>↓</kbd> and <kbd>Enter</kbd>, or click' })),
    );
  }

  confirmNew() {
    pushActivity(new ConfirmScreen('Start a new adventure?', 'This replaces the saved game, including the Grown-ups progress report.', 'Start over', () => this.onNew()));
  }

  onKey(e, inField) { if (!inField) arrowNav(this.root, e); }
  close() {}
}

// Switching books parks this book's progress in the save and reloads the page into the other book's world.
function switchToBook(id) {
  G.audio.play('open');
  if (G.inGame) G.saveNow();
  const data = G.save.peek();
  if (!data) return;
  G.save.data = data;
  G.save.switchBook(id);
  G.save.save();
  location.reload();
}

// Captain Flipper's boat or Cinder's airship: travel to another open book. The world fades and the page
// reloads there.
export class VoyageScreen extends Screen {
  constructor(bookId, onDecline) {
    super('voyage-screen');
    this.book = bookById(bookId);
    this.onDecline = onDecline;
  }

  render() {
    const b = this.book;
    const home = b.id === 'book1';
    this.root.innerHTML = '';
    this.root.style.cssText = `--c1:${b.colors[0]};--c2:${b.colors[1]};--c3:${b.colors[2]}`;
    this.root.append(el('div', { class: 'panel voyage-panel' },
      el('div', { class: 'voyage-cover', html: `<span class="book-emblem">${BOOK_ICONS[b.icon]}</span><span class="book-num">Book ${b.n}</span>` }),
      el('h1', { text: `${b.travel === 'fly' ? 'Fly' : 'Sail'}${home ? ' home' : ''} to ${placeName(b.world)}?` }),
      el('p', { class: 'note', text: `${b.title}: ${b.blurb}` }),
      el('p', { class: 'note', text: 'Your adventure here is saved, and you can come back any time.' }),
      el('div', { class: 'row end' },
        btn('Not yet', () => { this.onDecline?.(); this.close(); }, 'ghost'),
        btn(b.travel === 'fly' ? 'Take off!' : 'Set sail!', () => this.sail(), 'primary', { autofocus: true }))));
  }

  sail() {
    G.audio.play('whoosh');
    this.root.classList.add('sailing');
    this.root.querySelector('.voyage-panel').replaceChildren(
      el('div', { class: 'voyage-boat', html: '<svg viewBox="0 0 64 40"><path d="M6 26 L58 26 L50 36 L14 36 Z" fill="#8a5c38"/><rect x="31" y="4" width="2.5" height="22" fill="#5a3a22"/><path d="M34 6 L52 22 L34 22 Z" fill="#fff4ec"/><path d="M30 8 L16 22 L30 22 Z" fill="#ff5a4e"/><path d="M0 38 Q8 34 16 38 T32 38 T48 38 T64 38" stroke="#7fe0d0" stroke-width="2.5" fill="none"/></svg>' }),
      el('h1', { text: `${this.book.travel === 'fly' ? 'Flying' : 'Sailing'} to ${placeName(this.book.world)}...` }));
    setTimeout(() => switchToBook(this.book.id), 1600);
  }
}

// The series shelf on the title screen: the book being played, and what opens the next ones.
function bookShelf(d) {
  const data = d ?? G.save.data;
  const tutor = G.makeTutor(data);
  const shelf = el('div', { class: 'book-shelf', 'aria-label': 'The Penguin Quest books' });
  for (const book of BOOKS) {
    const open = isUnlocked(data, tutor, book);
    const current = book.id === (data.active ?? 'book1');
    // A saved game can step into any open, finished book; its own progress waits on the shelf.
    const canSwitch = !!d && open && book.ready && !current;
    let note;
    if (current) note = d ? 'Now playing' : 'Start here';
    else if (!book.ready) note = open ? 'Unlocked! Coming soon' : 'Coming soon';
    else note = open ? (data.books?.[book.id] ? 'Continue this book' : 'Ready to play') : 'Locked';
    let detail = '';
    if (!open && book.n > 1) {
      const prev = BOOKS[book.n - 2];
      const st = bookStatus(data, tutor, prev);
      const togo = skillsToGo(st);
      detail = !isUnlocked(data, tutor, prev) ? `Opens after Book ${prev.n}`
        : !st.storyDone ? `Finish ${prev.title}${togo ? ` and master ${togo} more skills` : ''}`
          : `Master ${togo} more grade ${prev.grade} skill${togo === 1 ? '' : 's'}`;
    }
    shelf.append(el(canSwitch ? 'button' : 'div', {
      class: `book-card ${open ? 'open' : 'locked'} ${current ? 'current' : ''} ${canSwitch ? 'switch' : ''}`,
      type: canSwitch ? 'button' : undefined,
      onclick: canSwitch ? () => switchToBook(book.id) : undefined,
      style: `--c1:${book.colors[0]};--c2:${book.colors[1]};--c3:${book.colors[2]}`,
      html: `<div class="book-cover"><span class="book-emblem">${BOOK_ICONS[book.icon]}</span><span class="book-num">Book ${book.n}</span></div>
        <div class="book-info"><div class="book-title">${book.title}</div><div class="book-grade">Grade ${book.grade} math</div>
        <div class="book-note">${open ? '' : BOOK_ICONS.lock} ${note}</div>${detail ? `<div class="book-detail">${detail}</div>` : ''}</div>`,
    }));
  }
  return shelf;
}

// ------------------------------------------------------------ New game
export class NewGameScreen extends Screen {
  constructor(onStart) {
    super('newgame-screen');
    this.onStart = onStart;
    this.grade = 4;
    this.scarf = 'coral';
  }

  render() {
    this.root.innerHTML = '';
    const nameInput = el('input', { id: 'pq-name', class: 'name-input', maxlength: 14, value: 'Pip', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Penguin name' });
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.root.querySelector('.grade-btn.sel')?.focus(); } });
    this.nameInput = nameInput;
    const grades = el('div', { class: 'choice-row', 'data-cols': 3 });
    for (const g of [4, 5, 6]) grades.append(btn(`<span class="big">${g}th</span><span class="small">grade</span>`, () => { this.grade = g; this.sync(); }, `grade-btn ${g === this.grade ? 'sel' : ''}`, { 'data-grade': g }));
    const scarves = el('div', { class: 'choice-row', 'data-cols': 4 });
    for (const id of ['coral', 'ocean', 'mint', 'sunny']) {
      const it = findItem('scarf', id);
      scarves.append(btn(`<span class="swatch" style="background:${it.css}"></span><span class="small">${it.name}</span>`, () => { this.scarf = id; this.sync(); }, `scarf-btn ${id === this.scarf ? 'sel' : ''}`, { 'data-scarf': id }));
    }
    this.preview = el('div', { class: 'ng-portrait' });
    this.root.append(el('div', { class: 'panel ng-panel' },
      el('h1', { text: 'A new adventure' }),
      el('div', { class: 'ng-grid' },
        this.preview,
        el('div', { class: 'ng-fields' },
          el('label', { for: 'pq-name', text: "What's your penguin's name?" }),
          el('div', { class: 'name-row' }, nameInput, btn('Surprise me', () => { nameInput.value = NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)]; }, 'ghost small')),
          el('div', { class: 'label', text: 'What grade are you in?' }), grades,
          el('p', { class: 'note', text: 'Not sure? Pick your grade. The game adjusts to you as you play.' }),
          el('div', { class: 'label', text: 'Pick a scarf' }), scarves)),
      el('div', { class: 'ng-actions' },
        btn('Back', () => this.close(), 'ghost'),
        btn('Start the adventure!', () => this.start(), 'primary'))));
    this.sync();
    setTimeout(() => { nameInput.focus(); nameInput.select(); }, 60);
  }

  sync() {
    $$('.grade-btn', this.root).forEach((b) => b.classList.toggle('sel', Number(b.dataset.grade) === this.grade));
    $$('.scarf-btn', this.root).forEach((b) => b.classList.toggle('sel', b.dataset.scarf === this.scarf));
    this.preview.innerHTML = portraitSVG({ accent: findItem('scarf', this.scarf).css });
  }

  start() {
    const name = (this.nameInput.value || 'Pip').replace(/[<>]/g, '').trim().slice(0, 14) || 'Pip';
    popActivity(this);
    this.onStart({ name, grade: this.grade, scarf: this.scarf });
  }
}

// ------------------------------------------------------------ Confirm
export class ConfirmScreen extends Screen {
  constructor(title, body, yes, onYes) {
    super('confirm-screen');
    Object.assign(this, { title, body, yes, onYes });
  }

  render() {
    this.root.innerHTML = '';
    this.root.append(el('div', { class: 'panel confirm-panel' },
      el('h2', { text: this.title }), el('p', { text: this.body }),
      el('div', { class: 'row' }, btn('Cancel', () => this.close(), 'ghost', { autofocus: true }), btn(this.yes, () => { popActivity(this); this.onYes(); }, 'danger'))));
  }
}

// ------------------------------------------------------------ Pause
export class PauseScreen extends Screen {
  constructor() { super('pause-screen'); }

  render() {
    const d = G.save.data;
    const crystals = Object.values(d.crystals).filter(Boolean).length;
    const mins = Math.round(d.stats.playSeconds / 60);
    this.root.innerHTML = '';
    const menu = el('div', { class: 'menu-list' },
      btn('Resume', () => this.close(), 'primary', { autofocus: true }),
      btn('Journal <kbd>J</kbd>', () => { popActivity(this); pushActivity(new JournalScreen()); }),
      btn('Map <kbd>M</kbd>', () => { popActivity(this); pushActivity(new MapScreen()); }),
      btn('Wardrobe', () => pushActivity(new ShopScreen(false))),
      btn('Skill Book', () => pushActivity(new SkillBookScreen())),
      btn('Settings', () => pushActivity(new SettingsScreen())),
      btn('For grown-ups', () => pushActivity(new GrownupsScreen())),
      btn('Save and quit to title', () => { G.saveNow(); popActivity(this); G.toTitle(); }, 'ghost'));
    this.root.append(el('div', { class: 'panel pause-panel' },
      el('h1', { text: 'Paused' }),
      el('div', { class: 'pause-stats' },
        el('span', { html: `${ICON.crystal('#4dffa0', true)} ${crystals} / 5 ${T.crystals}` }),
        el('span', { html: `${ICON.flake} ${d.snowflakes.length} / 30` }),
        el('span', { html: `${ICON.fish} ${d.coins}` }),
        el('span', { html: `${ICON.star} ${d.stars}` }),
        el('span', { text: `${mins} min played` })),
      menu,
      el('p', { class: 'note', text: G.save.persistent ? 'Your progress saves automatically.' : 'This browser is blocking saving, so progress will be lost when the page closes.' })));
  }
}

// ------------------------------------------------------------ Settings
export class SettingsScreen extends Screen {
  constructor() { super('settings-screen'); }

  render() {
    const s = G.save.data.settings;
    this.root.innerHTML = '';
    const slider = (id, label, key) => {
      const input = el('input', { id, type: 'range', min: 0, max: 1, step: 0.05, value: s[key] });
      input.addEventListener('input', () => { s[key] = Number(input.value); G.applySettings(); });
      return el('div', { class: 'set-row' }, el('label', { for: id, text: label }), input);
    };
    const toggle = (id, label, key, note) => {
      const b = btn(s[key] ? 'On' : 'Off', () => { s[key] = !s[key]; b.textContent = s[key] ? 'On' : 'Off'; b.classList.toggle('on', s[key]); b.setAttribute('aria-pressed', String(s[key])); G.applySettings(); }, `toggle ${s[key] ? 'on' : ''}`, { id, 'aria-pressed': String(!!s[key]) });
      return el('div', { class: 'set-row' }, el('div', {}, el('label', { for: id, text: label }), note ? el('div', { class: 'note', text: note }) : null), b);
    };
    const choice = (label, note, key, options) => {
      const seg = el('div', { class: 'seg', 'data-cols': options.length });
      for (const [value, text] of options) {
        seg.append(btn(text, () => { s[key] = value; G.applySettings(); this.render(); this.root.querySelector(`[data-k="${key}:${String(value)}"]`)?.focus(); },
          s[key] === value ? 'sel' : '', { 'data-k': `${key}:${String(value)}`, 'aria-pressed': String(s[key] === value) }));
      }
      return el('div', { class: 'set-row' }, el('div', {}, el('div', { class: 'label', text: label }), note ? el('div', { class: 'note', text: note }) : null), seg);
    };
    if (s.textSize === undefined) s.textSize = s.bigText ? 1.25 : 1;
    const quality = el('div', { class: 'seg', 'data-cols': 4 });
    for (const q of ['auto', 'low', 'medium', 'high']) {
      quality.append(btn(cap(q), () => { s.quality = q; G.applySettings(true); this.render(); this.root.querySelector(`[data-q="${q}"]`)?.focus(); }, s.quality === q ? 'sel' : '', { 'data-q': q }));
    }
    this.root.append(el('div', { class: 'panel settings-panel' },
      el('h1', { text: 'Settings' }),
      slider('set-music', 'Music', 'music'),
      slider('set-sfx', 'Sound effects', 'sfx'),
      slider('set-voice', 'Read-aloud voice', 'voice'),
      el('div', { class: 'set-row' }, el('div', {}, el('div', { class: 'label', text: 'Graphics' }), el('div', { class: 'note', text: G.qualityNote() })), quality),
      toggle('set-gentle', 'Gentle mode', 'gentle', `${T.glooms} wait patiently in battles.`),
      toggle('set-read', 'Read aloud', 'readAloud', 'Questions and story lines are read out loud.'),
      choice('Text size', null, 'textSize', [[1, '100%'], [1.25, '125%'], [1.5, '150%']]),
      toggle('set-easy', 'Easy reading', 'easyRead', 'Wider spacing and cream pages for questions and stories.'),
      choice('Story text speed', null, 'textSpeed', [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']]),
      choice('Motion', 'Fewer bounces, no shaking or freeze-frames.', 'reduceMotion', [[null, 'Auto'], [false, 'Full'], [true, 'Reduced']]),
      toggle('set-trail', 'Golden guide trail', 'showTrail', 'Sparkles that lead to your next goal. G toggles it.'),
      el('div', { class: 'row end' }, btn('Done', () => this.close(), 'primary'))));
  }

  close() { G.saveSoon(); super.close(); }
}

// ------------------------------------------------------------ Map
export class MapScreen extends Screen {
  constructor() { super('map-screen'); }

  render() {
    this.root.innerHTML = '';
    const size = Math.min(window.innerHeight * 0.82, window.innerWidth * 0.6, 760);
    const treasure = G.quests.active('sq_map');
    // With the treasure map the whole square grid must show, so the map is not cut to a circle.
    const canvas = el('canvas', { width: 760, height: 760, class: `map-canvas${treasure ? ' treasure' : ''}`, style: { width: `${size}px`, height: `${size}px` } });
    const clue = treasure ? G.treasure.objective({ text: (n, c) => `Treasure ${n + 1}: ${c}` }).text : null;
    const legend = el('div', { class: 'map-legend' },
      el('h2', { text: bookById(ACTIVE).world }),
      el('div', { class: 'legend-row', html: '<span class="lg-player"></span> You' }),
      el('div', { class: 'legend-row', html: `${ICON.star} Next goal` }),
      el('div', { class: 'legend-row', html: `${ICON.crystal('#4dffa0', true)} ${T.crystalName}` }),
      el('div', { class: 'legend-row', html: '<span class="lg-npc"></span> Friend' }),
      el('div', { class: 'legend-row', html: '<span class="lg-new"></span> Friend with a new quest' }),
      el('div', { class: 'legend-row', html: '<span class="lg-site"></span> Quest spot' }),
      treasure ? el('div', { class: 'map-clue', html: `<b>Treasure map</b><br>${escapeHTML(clue)}<br><span class="note">Count across for x, then up for y.</span>` }) : null,
      el('p', { class: 'note', html: 'Close with <kbd>M</kbd> or <kbd>Esc</kbd>' }),
      btn('Close', () => this.close(), 'primary'));
    this.root.append(el('div', { class: 'panel map-panel' }, canvas, legend));
    this.draw(canvas, treasure);
  }

  draw(canvas, grid) {
    const c = canvas.getContext('2d'), W = canvas.width;
    const src = WORLD_HALF * 0.86;
    const s = W / (src * 2);
    const X = (x) => W / 2 + x * s, Z = (z) => W / 2 + z * s;
    c.fillStyle = '#0b1033'; c.fillRect(0, 0, W, W);
    const img = G.mapImage;
    const k = img.width / (WORLD_HALF * 2);
    c.save();
    if (!grid) { c.beginPath(); c.arc(W / 2, W / 2, W / 2 - 6, 0, Math.PI * 2); c.clip(); }
    c.drawImage(img, (WORLD_HALF - src) * k, (WORLD_HALF - src) * k, src * 2 * k, src * 2 * k, 0, 0, W, W);
    c.restore();
    if (grid) {
      c.strokeStyle = 'rgba(255, 209, 102, 0.8)';
      c.lineWidth = 2;
      for (let i = 0; i <= GRID.n; i++) {
        const x = X(GRID.x0 + i * GRID.cell), z = Z(GRID.z0 - i * GRID.cell);
        c.beginPath(); c.moveTo(x, Z(GRID.z0)); c.lineTo(x, Z(GRID.z0 - GRID.n * GRID.cell)); c.stroke();
        c.beginPath(); c.moveTo(X(GRID.x0), z); c.lineTo(X(GRID.x0 + GRID.n * GRID.cell), z); c.stroke();
      }
      // Big outlined numbers just inside the edges, so they stay readable over snow.
      c.font = '700 26px Fredoka, sans-serif';
      c.textBaseline = 'middle';
      c.lineWidth = 6;
      c.strokeStyle = 'rgba(11,16,51,0.95)';
      c.fillStyle = '#ffd166';
      const label = (t, x, y) => { c.strokeText(t, x, y); c.fillText(t, x, y); };
      c.textAlign = 'center';
      for (let i = 0; i <= GRID.n; i++) label(String(i), X(GRID.x0 + i * GRID.cell), Math.min(W - 16, Z(GRID.z0) - 14));
      c.textAlign = 'left';
      for (let i = 1; i <= GRID.n; i++) label(String(i), Math.max(8, X(GRID.x0) + 6), Z(GRID.z0 - i * GRID.cell));
      c.textBaseline = 'alphabetic';
    }
    for (const m of G.quests.markers(true)) {
      c.save(); c.translate(X(m.x), Z(m.z)); c.scale(1.2, 1.2); drawMarker(c, m.kind, false, m.color); c.restore();
    }
    // Place names go over the markers so a vent or a friend never hides one.
    c.font = '600 19px Fredoka, sans-serif';
    c.textAlign = 'center';
    for (const r of REGIONS) {
      c.fillStyle = 'rgba(11,16,51,0.72)';
      const w = c.measureText(r.name).width + 16;
      c.fillRect(X(r.x) - w / 2, Z(r.z) - 42, w, 26);
      c.fillStyle = '#eef5ff';
      c.fillText(r.name, X(r.x), Z(r.z) - 23);
    }
    const p = G.player.pos;
    c.save();
    c.translate(X(p.x), Z(p.z));
    c.rotate(Math.PI - G.player.yaw);
    c.fillStyle = '#ff5a4e'; c.strokeStyle = '#fff'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, -16); c.lineTo(11, 12); c.lineTo(0, 6); c.lineTo(-11, 12); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }

  onKey(e, inField) {
    if (e.code === 'KeyM') { e.preventDefault(); this.close(); return; }
    super.onKey(e, inField);
  }
}

// ------------------------------------------------------------ Journal
export class JournalScreen extends Screen {
  constructor(tab = 'story') {
    super('journal-screen');
    this.tab = tab;
  }

  render() {
    this.root.innerHTML = '';
    const tabs = el('div', { class: 'tabs', role: 'tablist', 'data-cols': 6 });
    for (const [id, label] of [['story', 'Story'], ['side', 'Side quests'], ['patrol', T.patrol], ['collect', 'Collections'], ['lessons', 'Lessons'], ['chats', 'Chats']]) {
      tabs.append(btn(label, () => { this.tab = id; this.render(); this.root.querySelector(`[data-tab="${id}"]`)?.focus(); }, this.tab === id ? 'sel' : '', { 'data-tab': id, role: 'tab' }));
    }
    const body = el('div', { class: 'journal-body' });
    body.innerHTML = { story: () => this.story(), side: () => this.side(), patrol: () => this.patrol(), collect: () => this.collect(), chats: () => this.chats(), lessons: () => this.lessons() }[this.tab]();
    body.addEventListener('click', (e) => {
      const lesson = e.target.closest('[data-lesson]');
      if (lesson) { G.audio.play('click'); G.lesson(lesson.dataset.lesson); return; }
      const b = e.target.closest('[data-track]');
      if (!b) return;
      const id = b.dataset.track;
      G.save.data.tracked = G.save.data.tracked === id ? null : id;
      G.audio.play('click');
      G.saveSoon();
      this.render();
    });
    this.root.append(el('div', { class: 'panel journal-panel' },
      el('div', { class: 'row between' }, el('h1', { text: T.journal }), btn('Close', () => this.close(), 'primary')),
      tabs, body));
  }

  stepList(def, q) {
    return `<ol class="steps">${def.steps.map((st, i) => {
      const done = q && (q.done || q.step > i);
      const cur = q && !q.done && q.step === i;
      let text = '';
      if (cur) text = G.quests.objectiveFor(def.id).text;
      else text = stepSummary(st);
      return `<li class="${done ? 'done' : cur ? 'cur' : ''}">${done ? '✓ ' : ''}${escapeHTML(text)}${st.shard ? ' <span class="shard">shard</span>' : ''}</li>`;
    }).join('')}</ol>`;
  }

  // Every lesson the child can open: ones already seen, and ones for skills that are open now.
  lessons() {
    const seen = G.save.data.lessons ?? {};
    const rows = Object.entries(LESSONS).filter(([id]) => seen[id] || G.tutor.isUnlocked(SKILLS[id])).map(([id, L]) => {
      const s = SKILLS[id];
      const done = seen[id] && !seen[id].skipped;
      return `<div class="lesson-row"><div><b>${escapeHTML(L.title)}</b><div class="note">${escapeHTML(DOMAINS[s.domain].name)} · grade ${s.grade}</div></div>
        <span class="pill ${done ? 'ok' : 'dim'}">${done ? 'Learned' : 'New'}</span><button class="btn small" data-lesson="${id}">${done ? 'Watch again' : 'Start'}</button></div>`;
    });
    return `<p class="note">Short lessons from your friends. Open one any time to learn or review an idea.</p>${rows.join('') || '<p class="note">Lessons appear here as new ideas open up.</p>'}`;
  }

  // Everything friends said recently, newest first, so nothing important is missed.
  chats() {
    const lines = G.dialog.log;
    const notes = G.toasts.log.slice(0, 12);
    if (!lines.length && !notes.length) return '<p class="note">Nothing yet. Go say hello to someone!</p>';
    const chat = lines.map((l) => `<div class="chat-line"><b style="color:${l.accent ? readable(l.accent) : 'var(--lantern)'}">${escapeHTML(l.who || 'Story')}</b> ${escapeHTML(l.text)}</div>`).join('');
    const news = notes.length ? `<h2>Recent messages</h2>${notes.map((n) => `<div class="chat-line note">${n.html}</div>`).join('')}` : '';
    return `<h2>Recent chats</h2>${chat}${news}`;
  }

  story() {
    const s = G.save.data;
    return MAIN.map((def) => {
      const q = s.q[def.id];
      const region = REGIONS.find((r) => r.id === def.region);
      const color = REGION_COLORS[def.region]?.css ?? '#ffd166';
      let status;
      if (q?.done) status = '<span class="pill ok">Complete</span>';
      else if (q) status = '<span class="pill warn">In progress</span>';
      else if (G.quests.chapterOpen(def)) status = '<span class="pill">Starting now</span>';
      else if (def.chapter > 0 && G.quests.done(MAIN[def.chapter - 1].id)) status = '<span class="pill dim">Opens tomorrow</span>';
      else status = '<span class="pill dim">Locked</span>';
      const shards = ['lake', 'grove', 'huts', 'cave', 'ridge'].includes(def.region)
        ? `<div class="shard-row">${[0, 1, 2].map((i) => `<span class="shard-pip ${i < (s.shards[def.region] || 0) ? 'on' : ''}" style="--c:${color}"></span>`).join('')} ${T.shard}s · Resonance ${Math.min(RESONANCE_NEED, Math.floor(s.resonance[def.region] || 0))}/${RESONANCE_NEED}</div>` : '';
      const tracked = s.tracked === def.id;
      return `<section class="quest-card ${q && !q.done ? 'active' : ''}" style="--c:${color}">
        <div class="qc-head"><h3>${escapeHTML(def.title)}</h3>${status}</div>
        <p class="note">${escapeHTML(def.blurb)}${region ? ` · ${escapeHTML(region.name)}` : ''}</p>
        ${shards}
        ${q && !q.done ? this.stepList(def, q) : ''}
        ${q && !q.done ? `<button class="btn small ${tracked ? 'sel' : ''}" data-track="${def.id}">${tracked ? 'Tracking' : 'Track this'}</button>` : ''}
      </section>`;
    }).join('') + this.nextBook();
  }

  // What it takes to open the next book, shown under the last chapter.
  nextBook() {
    const s = G.save.data;
    const cur = bookById(s.active ?? 'book1'), next = nextBook(cur);
    if (!next) return '';
    const st = bookStatus(s, G.tutor, cur);
    const open = isUnlocked(s, G.tutor, next);
    const pct = Math.round(st.pct * 100);
    const togo = skillsToGo(st);
    const tick = (ok) => (ok ? '✓' : '○');
    return `<section class="quest-card next-book" style="--c:${next.colors[1]}">
      <div class="qc-head"><h3>Next: Book ${next.n}, ${escapeHTML(next.title)}</h3>${open ? '<span class="pill ok">Unlocked</span>' : '<span class="pill dim">Locked</span>'}</div>
      <p class="note">${escapeHTML(next.blurb)} Grade ${next.grade} math.${!next.ready ? ' Coming soon!' : open ? ` ${next.travel === 'fly' ? 'Cinder is ready to fly' : 'Captain Flipper is ready to sail'} you there!` : ''}</p>
      <ul class="steps">
        <li class="${st.storyDone ? 'done' : ''}">${tick(st.storyDone)} Finish ${escapeHTML(cur.title)}</li>
        <li class="${togo === 0 ? 'done' : ''}">${tick(togo === 0)} Master ${Math.round(UNLOCK_MASTERY * 100)}% of the grade ${cur.grade} skills (${st.mastered} of ${st.total})</li>
      </ul>
      <div class="mini-track wide"><div style="width:${pct}%"></div></div>
      ${togo && st.missing.length ? `<p class="note">Practise at a restored ${T.crystal} to master: ${st.missing.slice(0, 4).map((x) => escapeHTML(x.name)).join(', ')}${st.missing.length > 4 ? ', and more' : ''}.</p>` : ''}
    </section>`;
  }

  side() {
    const s = G.save.data;
    return SIDE.map((def) => {
      const q = s.q[def.id];
      let status, detail = '';
      if (q?.done) status = '<span class="pill ok">Complete</span>';
      else if (q) { status = '<span class="pill warn">In progress</span>'; detail = `<p class="obj">${escapeHTML(G.quests.objectiveFor(def.id).text)}</p>`; }
      else if (G.quests.sideOpen(def)) status = `<span class="pill new">Talk to ${escapeHTML(G.npcs.get(def.giver).def.name)}</span>`;
      else status = `<span class="pill dim">After ${escapeHTML(MAIN.find((m) => m.id === def.after)?.title.split(':')[0] ?? 'later')}</span>`;
      const tracked = s.tracked === def.id;
      return `<section class="quest-card side ${q && !q.done ? 'active' : ''}">
        <div class="qc-head"><h3>${escapeHTML(def.title)}</h3>${status}</div>
        <p class="note">${escapeHTML(def.blurb)}</p>${detail}
        ${q && !q.done ? `<button class="btn small ${tracked ? 'sel' : ''}" data-track="${def.id}">${tracked ? 'Tracking' : 'Track this'}</button>` : ''}
      </section>`;
    }).join('');
  }

  patrol() {
    G.patrol.ensureToday();
    const p = G.save.data.patrol;
    if (!G.quests.done('ch0')) return `<p class="note">The ${T.patrol} opens after the Professor's warm-up.</p>`;
    const tasks = p.tasks.map((t) => {
      const pct = Math.round((100 * Math.min(t.progress, t.need)) / t.need);
      return `<div class="task ${t.done ? 'done' : ''}"><div class="task-top"><span>${t.done ? '✓ ' : ''}${escapeHTML(t.text)}</span><span class="num">${Math.floor(Math.min(t.progress, t.need))}/${t.need}</span></div><div class="gu-track"><div class="gu-fill" style="width:${pct}%;background:#ffd166"></div></div></div>`;
    }).join('');
    return `<div class="patrol">
      <p>Three new tasks every day. Each one earns <b>10 fish coins</b> and an <b>Aurora Star</b>. Finish all three to keep your streak going!</p>
      ${tasks}
      <div class="patrol-stats"><span>${ICON.star} <b>${G.save.data.stars}</b> Aurora Stars</span><span>Streak: <b>${p.streak}</b> day${p.streak === 1 ? '' : 's'}</span><span>Best: <b>${p.best}</b></span></div>
      <p class="note">Spend Aurora Stars on special gear in the Wardrobe. Streak bonuses at 3, 7, 14 and 30 days.</p>
    </div>`;
  }

  collect() {
    const s = G.save.data;
    const m = s.medals;
    const medal = (key, label, fmt) => {
      const x = m[key];
      return `<div class="coll"><span>${label}</span><span>${x?.medal ? `<span class="medal ${x.medal}">${cap(x.medal)}</span> ${fmt ? fmt(x.best) : ''}` : '<span class="note">Not yet</span>'}</span></div>`;
    };
    return `<div class="coll-grid">
      <div class="coll"><span>${ICON.flake} ${T.Flakes}</span><b>${s.snowflakes.length} / 30</b></div>
      <div class="coll"><span>Treasure chests</span><b>${s.chests.length} / 12</b></div>
      <div class="coll"><span>Lost chicks home</span><b>${s.chicks.home.length} / 8</b></div>
      <div class="coll"><span>Pirate treasures</span><b>${s.treasures.length} / 4</b></div>
      <div class="coll"><span>${T.gloom} spots cheered</span><b>${s.counters.gloomSpots.length} / 8</b></div>
      <div class="coll"><span>${T.glooms} cheered up</span><b>${s.counters.glooms}</b></div>
      <div class="coll"><span>Fish caught</span><b>${s.counters.fish}</b></div>
      <div class="coll"><span>Best answer streak</span><b>${s.counters.bestInARow} in a row</b></div>
    </div>
    <h3>Medals</h3>
    <div class="coll-grid">
      ${medal('slalom', 'Sledding Hill Slalom', (b) => `${b}s`)}
      ${medal('fishing:tourney', 'Big Fish Tournament', (b) => `${b} misses`)}
      ${medal('market:rush', 'Snack Shack Rush')}
      ${medal('architect:sculpt', 'Snow Sculpture Contest')}
    </div>`;
  }

  onKey(e, inField) {
    if (e.code === 'KeyJ') { e.preventDefault(); this.close(); return; }
    super.onKey(e, inField);
  }
}

function stepSummary(st) {
  // Only site steps have a site count (the prologue's snowflake step crashed the journal here).
  const total = st.type === 'sites' ? G.sites?.count(st.set) ?? 0 : st.type === 'collect' ? G.pickups?.total(st.set) ?? 0 : st.need ?? 0;
  const t = typeof st.text === 'function' ? st.text(0, total, '') : st.text;
  if (st.type === 'crystal') return `${T.charge} and ${T.wake.toLowerCase()} the ${T.crystalName}`;
  return (t || '').replace(/\s*\(0\/\d+\)$/, '').replace(/\(0\/\d+\)/, '');
}

// Lessons the child has had, newest first, for the progress report.
function lessonRows(data) {
  const rows = Object.entries(data.lessons ?? {}).sort((a, b) => b[1].t - a[1].t)
    .map(([id, l]) => `<tr><td>${new Date(l.t).toLocaleDateString()}</td><td>${escapeHTML(LESSONS[id]?.title ?? id)}</td><td>${escapeHTML(SKILLS[id]?.cc ?? '')}</td><td>${l.skipped ? 'Skipped' : 'Finished'}</td></tr>`);
  return rows.length ? `<table><thead><tr><th>Date</th><th>Lesson</th><th>Standard</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>`
    : '<p class="note">No lessons yet. A lesson starts when a new idea above grade level comes up, or after a worked solution.</p>';
}

// ------------------------------------------------------------ Wardrobe / shop
export class ShopScreen extends Screen {
  constructor(buyMode) {
    super('shop-screen');
    this.freezesWorld = false;
    this.buyMode = buyMode;
    this.tab = 'scarf';
  }

  enter() {
    super.enter();
    const p = G.player;
    // Find a clear angle (away from the shopkeeper the player is facing), then turn the penguin
    // toward the camera so the new gear is seen from the front.
    const shot = orbitShot(p.pos, { radius: 7, height: 1.9, lookUp: 1.3, shift: 2.6, fov: 45, prefer: -Math.PI / 2 - p.yaw });
    p.yaw = Math.atan2(shot.pos.x - p.pos.x, shot.pos.z - p.pos.z);
    p.model.root.rotation.y = p.yaw;
    G.cam.setShot(shot, 0.9);
  }

  exit() { super.exit(); G.cam.release(0.9); G.applyLook(); }

  owned(slot, id) { return G.save.data.owned.includes(`${slot}:${id}`); }

  render() {
    const d = G.save.data;
    this.root.innerHTML = '';
    const tabs = el('div', { class: 'tabs', role: 'tablist', 'data-cols': 5 });
    for (const slot of Object.keys(SLOT_NAMES)) {
      tabs.append(btn(SLOT_NAMES[slot], () => { this.tab = slot; this.render(); this.root.querySelector(`[data-tab="${slot}"]`)?.focus(); }, this.tab === slot ? 'sel' : '', { 'data-tab': slot, role: 'tab' }));
    }
    const grid = el('div', { class: 'shop-grid', 'data-cols': 3 });
    const here = d.active ?? 'book1';
    const rank = (it) => (!it.book ? 0 : it.book === here ? 1 : 2);
    const items = SHOP[this.tab].filter((it) => inWardrobe(d, this.tab, it)).sort((a, b) => rank(a) - rank(b));
    for (const it of items) {
      const owned = this.owned(this.tab, it.id);
      const equipped = d.equipped[this.tab] === it.id;
      let status;
      if (equipped) status = '<span class="tag on">Wearing</span>';
      else if (owned) status = '<span class="tag">Owned</span>';
      else if (it.stars) status = `<span class="price">${ICON.star} ${it.stars}</span>`;
      else if (it.price === null) status = `<span class="tag how">${howToGet(it, here)}</span>`;
      else status = `<span class="price">${ICON.fish} ${it.price}</span>`;
      const swatch = this.tab === 'scarf' ? `<span class="swatch big" style="background:${it.css}"></span>`
        : this.tab === 'trail' ? `<span class="swatch big trail" style="background:linear-gradient(90deg,${it.colors.map((c) => '#' + c.toString(16).padStart(6, '0')).join(',')})"></span>`
          : this.tab === 'hat' ? `<span class="hat-ico">${hatIcon(it.id)}</span>`
            : this.tab === 'sled' ? `<span class="hat-ico">${sledIcon(it)}</span>`
              : `<span class="hat-ico">${buddyIcon(it.id)}</span>`;
      const card = btn(`${swatch}<span class="name">${it.name}</span>${status}`, () => this.choose(it), `shop-card ${equipped ? 'equipped' : ''}`);
      card.addEventListener('focus', () => this.preview(it));
      card.addEventListener('mouseenter', () => this.preview(it));
      grid.append(card);
    }
    this.msg = el('div', { class: 'shop-msg', 'aria-live': 'polite' });
    this.root.append(el('div', { class: 'panel shop-panel' },
      el('div', { class: 'shop-head' },
        el('div', {}, el('h1', { text: this.buyMode ? BOOK.shop.title : 'Wardrobe' }),
          el('p', { class: 'note', text: this.buyMode ? 'Buy with fish coins or Aurora Stars, then wear it!' : `Wear anything you own. ${BOOK.shop.where}` })),
        el('div', { class: 'coins-big', html: `${ICON.fish} <span>${d.coins}</span> ${ICON.star} <span>${d.stars}</span>` })),
      tabs, grid, this.msg,
      el('div', { class: 'row end' }, btn('Done', () => this.close(), 'primary'))));
  }

  preview(it) { G.applyLook({ ...G.save.data.equipped, [this.tab]: it.id }); }

  choose(it) {
    const d = G.save.data;
    const slot = this.tab;
    if (this.owned(slot, it.id)) {
      d.equipped[slot] = it.id;
      G.applyLook();
      G.audio.play('chime');
      this.say(`Now using: ${it.name}`);
    } else if (!it.stars && it.price === null) {
      this.say(howToGet(it, d.active ?? 'book1'));
      G.audio.play('wrong');
      return;
    } else if (!this.buyMode) {
      this.say(BOOK.shop.where);
      return;
    } else if (it.stars ? d.stars < it.stars : d.coins < it.price) {
      this.say(it.stars ? `You need ${it.stars - d.stars} more Aurora Stars. Finish ${T.patrol} tasks to earn them!` : `You need ${it.price - d.coins} more fish coins. Solve puzzles to earn more!`);
      G.audio.play('wrong');
      return;
    } else {
      if (it.stars) d.stars -= it.stars; else d.coins -= it.price;
      d.owned.push(`${slot}:${it.id}`);
      d.equipped[slot] = it.id;
      G.applyLook();
      G.audio.play('register');
      this.say(`You got the ${it.name}!`);
    }
    G.saveSoon();
    const focusName = it.name;
    this.render();
    $$('.shop-card', this.root).find((b) => b.textContent.includes(focusName))?.focus();
  }

  say(text) { if (this.msg) this.msg.textContent = text; }
}

// A prize from another book says which book it comes from.
const howToGet = (it, here) => (it.book && it.book !== here ? `In ${bookById(it.book).title}: ${it.how}` : it.how);

function hatIcon(id) {
  const c = {
    null: '<circle cx="24" cy="26" r="14" fill="none" stroke="#8fa0d8" stroke-width="3"/><line x1="14" y1="36" x2="34" y2="16" stroke="#8fa0d8" stroke-width="3"/>',
    beanie: '<path d="M8 32 Q10 10 24 10 Q38 10 40 32 Z" fill="#3aa0ff"/><rect x="7" y="30" width="34" height="7" rx="3" fill="#fff"/><circle cx="24" cy="9" r="5" fill="#fff"/>',
    earmuffs: '<path d="M10 28 Q24 2 38 28" stroke="#dde3f0" stroke-width="4" fill="none"/><circle cx="10" cy="30" r="7" fill="#ff7ab8"/><circle cx="38" cy="30" r="7" fill="#ff7ab8"/>',
    headphones: '<path d="M10 28 Q24 2 38 28" stroke="#2b2f45" stroke-width="4" fill="none"/><rect x="4" y="24" width="10" height="14" rx="4" fill="#2b2f45"/><rect x="34" y="24" width="10" height="14" rx="4" fill="#2b2f45"/><rect x="6" y="27" width="6" height="8" rx="2" fill="#45e6ff"/><rect x="36" y="27" width="6" height="8" rx="2" fill="#45e6ff"/>',
    tophat: '<rect x="14" y="6" width="20" height="24" rx="2" fill="#1a1a24"/><rect x="6" y="30" width="36" height="5" rx="2" fill="#1a1a24"/><rect x="14" y="24" width="20" height="5" fill="#d8333f"/>',
    pirate: '<path d="M4 30 Q24 2 44 30 Q24 24 4 30 Z" fill="#222230"/><circle cx="24" cy="21" r="3.5" fill="#fff"/>',
    wizard: '<path d="M24 2 L36 34 L12 34 Z" fill="#4b3bb8"/><rect x="6" y="33" width="36" height="4" rx="2" fill="#4b3bb8"/><circle cx="22" cy="20" r="2" fill="#ffe27a"/><circle cx="27" cy="27" r="1.6" fill="#ffe27a"/>',
    viking: '<path d="M10 32 Q12 12 24 12 Q36 12 38 32 Z" fill="#a6b0c4"/><path d="M10 26 Q2 18 6 8 Q8 18 14 22 Z" fill="#fff4dc"/><path d="M38 26 Q46 18 42 8 Q40 18 34 22 Z" fill="#fff4dc"/>',
    party: '<path d="M24 4 L34 36 L14 36 Z" fill="#ff5ab0"/><circle cx="24" cy="4" r="4" fill="#ffe14d"/>',
    crown: '<path d="M8 34 L8 16 L16 24 L24 12 L32 24 L40 16 L40 34 Z" fill="#ffcc3d"/><circle cx="24" cy="28" r="3" fill="#4de1ff"/>',
    hibiscus: '<g fill="#ff5c8a"><circle cx="24" cy="12" r="7"/><circle cx="34" cy="20" r="7"/><circle cx="30" cy="31" r="7"/><circle cx="18" cy="31" r="7"/><circle cx="14" cy="20" r="7"/></g><circle cx="24" cy="22" r="4" fill="#ffd166"/>',
    souwester: '<path d="M10 30 Q12 10 24 10 Q36 10 38 30 Z" fill="#ffc83d"/><path d="M4 30 Q24 24 44 30 Q46 36 38 37 L10 37 Q2 36 4 30 Z" fill="#f2b42a"/>',
    chef: '<circle cx="15" cy="15" r="8" fill="#fff"/><circle cx="24" cy="10" r="9" fill="#fff"/><circle cx="33" cy="15" r="8" fill="#fff"/><rect x="12" y="16" width="24" height="18" rx="3" fill="#fff"/><rect x="12" y="29" width="24" height="5" fill="#e6e9f2"/>',
    crest: '<path d="M10 32 Q8 18 2 12 Q14 16 18 26 Z M38 32 Q40 18 46 12 Q34 16 30 26 Z" fill="#ffd23d"/><path d="M18 30 Q22 12 24 4 Q26 12 30 30 Z" fill="#1a1a24"/>',
    sunhat: '<ellipse cx="24" cy="30" rx="21" ry="6" fill="#f0d9a0"/><path d="M13 30 Q14 14 24 14 Q34 14 35 30 Z" fill="#f6e4b4"/><rect x="13" y="25" width="22" height="4" fill="#ff7a5c"/>',
    aviator: '<path d="M10 32 Q12 8 24 8 Q36 8 38 32 Z" fill="#8a5a3a"/><ellipse cx="9" cy="34" rx="4" ry="6" fill="#8a5a3a"/><ellipse cx="39" cy="34" rx="4" ry="6" fill="#8a5a3a"/><circle cx="18" cy="18" r="5" fill="#bfe8ff" stroke="#9a9aa8" stroke-width="2.5"/><circle cx="30" cy="18" r="5" fill="#bfe8ff" stroke="#9a9aa8" stroke-width="2.5"/>',
    propeller: '<path d="M10 34 Q12 12 24 12 Q36 12 38 34 Z" fill="#5aa9e6"/><rect x="9" y="30" width="30" height="5" rx="2.5" fill="#ffd23d"/><rect x="23" y="5" width="2" height="7" fill="#3a3a48"/><rect x="12" y="3" width="12" height="3" rx="1.5" fill="#ff5c5c"/><rect x="24" y="3" width="12" height="3" rx="1.5" fill="#39d98a"/>',
    starhood: '<path d="M8 36 Q8 6 26 6 Q38 6 42 22 Q44 30 42 36 Q24 28 8 36 Z" fill="#2a2f7a"/><circle cx="43" cy="12" r="3" fill="#ffe27a"/><circle cx="18" cy="20" r="1.6" fill="#fff1b0"/><circle cx="28" cy="14" r="1.6" fill="#fff1b0"/><circle cx="33" cy="25" r="1.6" fill="#fff1b0"/>',
    goggles: '<rect x="4" y="18" width="40" height="5" rx="2" fill="#6a4a30"/><circle cx="16" cy="21" r="8" fill="#c89a3a"/><circle cx="32" cy="21" r="8" fill="#c89a3a"/><circle cx="16" cy="21" r="5" fill="#7fd6ff"/><circle cx="32" cy="21" r="5" fill="#7fd6ff"/>',
  };
  return `<svg viewBox="0 0 48 40" class="hat-svg">${c[id] ?? c.null}</svg>`;
}

function sledIcon(it) {
  if (!it.id) return hatIcon(null);
  const col = '#' + (it.color ?? 0x9a6a44).toString(16).padStart(6, '0');
  return `<svg viewBox="0 0 48 40" class="hat-svg"><rect x="6" y="20" width="34" height="7" rx="3" fill="${col}"/><path d="M40 27 Q47 25 44 16" stroke="${col}" stroke-width="4" fill="none"/><rect x="8" y="30" width="32" height="3" rx="1" fill="#3a3a48"/></svg>`;
}

function buddyIcon(id) {
  if (!id) return hatIcon(null);
  if (id === 'chick') return '<svg viewBox="0 0 48 40" class="hat-svg"><ellipse cx="24" cy="24" rx="12" ry="13" fill="#7d869f"/><ellipse cx="24" cy="28" rx="8" ry="8" fill="#e6e9f2"/><circle cx="20" cy="20" r="2.2" fill="#111"/><circle cx="28" cy="20" r="2.2" fill="#111"/><path d="M22 24 L26 24 L24 27 Z" fill="#ff9d2e"/></svg>';
  if (id === 'hatchling') return '<svg viewBox="0 0 48 40" class="hat-svg"><ellipse cx="22" cy="26" rx="14" ry="9" fill="#6f8f46"/><path d="M14 24 L22 20 L30 24 L22 29 Z" fill="#9ab866"/><circle cx="38" cy="22" r="6" fill="#9ad0b0"/><circle cx="40" cy="21" r="1.6" fill="#111"/><ellipse cx="12" cy="33" rx="4" ry="2.5" fill="#9ad0b0"/><ellipse cx="32" cy="33" rx="4" ry="2.5" fill="#9ad0b0"/></svg>';
  if (id === 'puffling') return '<svg viewBox="0 0 48 40" class="hat-svg"><circle cx="24" cy="23" r="13" fill="#5a5e6e"/><ellipse cx="24" cy="27" rx="8" ry="8" fill="#d8dbe6"/><circle cx="20" cy="20" r="2.2" fill="#111"/><circle cx="28" cy="20" r="2.2" fill="#111"/><path d="M22 24 L26 24 L24 27 Z" fill="#2a2a30"/><circle cx="20" cy="9" r="3" fill="#5a5e6e"/><circle cx="25" cy="8" r="3" fill="#5a5e6e"/></svg>';
  if (id === 'cloudlet') return '<svg viewBox="0 0 48 40" class="hat-svg"><circle cx="17" cy="24" r="9" fill="#e8e4ff"/><circle cx="27" cy="19" r="11" fill="#f4f0ff"/><circle cx="34" cy="26" r="8" fill="#e8e4ff"/><path d="M21 22 Q23 20 25 22 M29 22 Q31 20 33 22" stroke="#4a4670" stroke-width="2" fill="none"/></svg>';
  if (id === 'sparkle') return '<svg viewBox="0 0 48 40" class="hat-svg"><circle cx="24" cy="22" r="13" fill="#ff9a3c"/><circle cx="21" cy="8" r="4" fill="#ffb86a"/><path d="M17 20 Q19 17 21 20 M27 20 Q29 17 31 20" stroke="#3a1a10" stroke-width="2" fill="none"/><circle cx="24" cy="22" r="17" fill="none" stroke="#ffd166" stroke-opacity="0.5" stroke-width="2"/></svg>';
  return '<svg viewBox="0 0 48 40" class="hat-svg"><circle cx="24" cy="22" r="13" fill="#ff78d2"/><path d="M17 20 Q19 17 21 20 M27 20 Q29 17 31 20" stroke="#1a1333" stroke-width="2" fill="none"/><circle cx="24" cy="22" r="17" fill="none" stroke="#ffd166" stroke-opacity="0.5" stroke-width="2"/></svg>';
}

// ------------------------------------------------------------ Skill book (kid view)
export class SkillBookScreen extends Screen {
  constructor() { super('skills-screen'); }

  render() {
    this.root.innerHTML = '';
    const cards = el('div', { class: 'book-grid' });
    for (const dom of DOMAIN_ORDER) {
      const sum = G.tutor.domainSummary(dom);
      // Subjects this book does not teach at all (ratios before grade 6) stay off the page.
      if (!sum.rows.some((r) => r.inBook)) continue;
      const color = REGION_COLORS[dom]?.css ?? '#ffd166';
      const rows = sum.rows.filter((r) => r.unlocked);
      const next = rows.find((r) => !r.mastered);
      const list = rows.map((r) => {
        const stars = r.mastered ? 3 : r.m >= 0.55 ? 2 : r.attempts > 0 ? 1 : 0;
        return `<li><span class="stars">${[0, 1, 2].map((i) => (i < stars ? ICON.star : ICON.starEmpty)).join('')}</span><span>${r.name}</span></li>`;
      }).join('');
      cards.append(el('section', { class: 'book-card', style: { '--c': color } },
        el('h3', { text: DOMAINS[dom].name }),
        el('div', { class: 'place', text: REGION_INFO[dom]?.name ?? (dom === 'stars' ? T.dataPlace : DOMAINS[dom].place) }),
        el('ul', { html: list }),
        el('div', { class: 'next', text: next ? `Next up: ${next.name}` : 'Everything here is mastered!' })));
    }
    this.root.append(el('div', { class: 'panel book-panel' },
      el('div', { class: 'row between' }, el('h1', { text: 'Skill Book' }), btn('Close', () => this.close(), 'primary')),
      el('p', { class: 'note', text: 'Stars grow as you solve problems on your first try. Three stars means mastered.' }),
      cards));
  }
}

// ------------------------------------------------------------ Grown-ups dashboard
export class GrownupsScreen extends Screen {
  constructor() { super('grownups-screen'); }

  render() {
    const d = G.save.peek() ?? G.save.data;
    const live = G.save.data;
    const data = G.inGame ? live : d;
    const tut = G.inGame ? G.tutor : G.makeTutor(data);
    const st = data.tutor;
    const acc = st.totals.problems ? Math.round((100 * st.totals.firstTry) / st.totals.problems) : 0;
    const mins = Math.round(data.stats.playSeconds / 60);
    const days = Object.keys(st.days).sort().slice(-7);
    this.root.innerHTML = '';
    const domainBars = DOMAIN_ORDER.map((dom) => {
      const s = tut.domainSummary(dom);
      const pct = Math.round(s.mastery * 100);
      return `<div class="gu-bar"><div class="gu-bar-label"><span>${DOMAINS[dom].name}</span><span class="num">${pct}%</span></div><div class="gu-track"><div class="gu-fill" style="width:${pct}%;background:${REGION_COLORS[dom]?.css ?? '#ffd166'}"></div></div></div>`;
    }).join('');
    const skillRows = DOMAIN_ORDER.flatMap((dom) => tut.domainSummary(dom).rows.map((r) => {
      const status = r.mastered ? (r.assumed ? 'Assumed known' : 'Mastered') : !r.inBook ? `In Book ${Math.max(1, r.grade - 3)}` : !r.unlocked ? 'Locked (above grade)' : r.attempts ? 'Practicing' : 'Not started';
      const cls = r.mastered ? 'ok' : !r.unlocked ? 'dim' : r.attempts ? 'warn' : '';
      return `<tr class="${cls}"><td>${r.name}</td><td>${r.cc}</td><td class="num">${r.grade}</td><td class="num">${r.attempts}</td><td class="num">${r.attempts ? Math.round((100 * r.firstTry) / r.attempts) + '%' : '–'}</td><td><div class="mini-track"><div style="width:${Math.round(r.m * 100)}%"></div></div></td><td><span class="pill ${cls}">${status}</span></td></tr>`;
    })).join('');
    const mistakes = st.mistakes.slice(-12).reverse().map((m) => `<tr><td>${new Date(m.t).toLocaleDateString()}</td><td>${escapeHTML(m.text)}</td><td>${escapeHTML(m.given || '')}</td><td>${escapeHTML(m.correct)}</td></tr>`).join('');
    const chaptersDone = MAIN.filter((m) => data.q[m.id]?.done).length;
    const setVal = (fn) => { fn(live); if (!G.inGame) { const dd = G.save.peek(); if (dd) { fn(dd); G.save.data = dd; G.save.save(); } } else G.saveSoon(); this.render(); };
    const gradeSel = el('div', { class: 'seg', 'data-cols': 3 });
    for (const g of [4, 5, 6]) gradeSel.append(btn(`Grade ${g}`, () => setVal((x) => { x.profile.grade = g; if (G.inGame) G.tutor.setGrade(g); }), data.profile.grade === g ? 'sel' : ''));
    const bookRows = BOOKS.slice(1).map((b) => {
      const forced = !!data.flags?.unlocked?.includes(b.id);
      const prev = BOOKS[b.n - 2];
      const st = bookStatus(data, tut, prev);
      const note = !b.ready ? `Coming soon. It opens after ${prev.title} with ${Math.round(UNLOCK_MASTERY * 100)}% of grade ${prev.grade} skills mastered (now ${st.mastered} of ${st.total}).`
        : isUnlocked(data, tut, b) ? 'Open.' : `Opens after ${prev.title} with ${Math.round(UNLOCK_MASTERY * 100)}% of grade ${prev.grade} skills mastered (now ${st.mastered} of ${st.total}).`;
      return el('div', { class: 'set-row' },
        el('div', {}, el('div', { class: 'label', text: `Book ${b.n}: ${b.title} (grade ${b.grade})` }), el('div', { class: 'note', text: note })),
        btn(forced ? 'Opened early' : 'Open early', () => setVal((x) => { x.flags.unlocked = [...new Set([...(x.flags.unlocked ?? []), b.id])]; }), forced ? 'sel' : '', b.ready ? {} : { disabled: true }));
    });
    const paceSel = el('div', { class: 'seg', 'data-cols': 2 });
    paceSel.append(btn('One chapter per day', () => setVal((x) => { x.settings.pace = 'daily'; }), data.settings.pace !== 'free' ? 'sel' : ''));
    paceSel.append(btn('No limit', () => setVal((x) => { x.settings.pace = 'free'; }), data.settings.pace === 'free' ? 'sel' : ''));

    this.root.append(el('div', { class: 'panel gu-panel' },
      el('div', { class: 'row between' }, el('h1', { text: `Progress report: ${data.profile.name}` }), btn('Close', () => this.close(), 'primary', { autofocus: true })),
      el('div', { class: 'gu-tiles' },
        el('div', { class: 'tile', html: `<div class="num big">${mins}</div><div>minutes played</div>` }),
        el('div', { class: 'tile', html: `<div class="num big">${st.totals.problems}</div><div>problems solved</div>` }),
        el('div', { class: 'tile', html: `<div class="num big">${acc}%</div><div>right on the first try</div>` }),
        el('div', { class: 'tile', html: `<div class="num big">${chaptersDone}/${MAIN.length}</div><div>story chapters done</div>` })),
      el('h2', { text: 'Mastery by subject' }),
      el('div', { class: 'gu-bars', html: domainBars }),
      el('h2', { text: 'Last 7 play days' }),
      el('div', { class: 'gu-days', html: days.length ? days.map((k) => `<div class="day"><div class="num">${st.days[k].problems}</div><div class="bar" style="height:${Math.min(100, st.days[k].problems * 3)}px"></div><div class="lbl">${k.slice(5)}</div></div>`).join('') : '<p class="note">No practice yet.</p>' }),
      el('h2', { text: 'Recent mistakes' }),
      el('div', { class: 'table-wrap', html: mistakes ? `<table><thead><tr><th>Date</th><th>Question</th><th>Answered</th><th>Correct</th></tr></thead><tbody>${mistakes}</tbody></table>` : '<p class="note">No mistakes yet.</p>' }),
      el('h2', { text: 'Lessons' }),
      el('div', { class: 'table-wrap', html: lessonRows(data) }),
      el('h2', { text: 'Every skill (Common Core codes)' }),
      el('div', { class: 'table-wrap', html: `<table class="skills"><thead><tr><th>Skill</th><th>Standard</th><th>Grade</th><th>Tries</th><th>First try</th><th>Mastery</th><th>Status</th></tr></thead><tbody>${skillRows}</tbody></table>` }),
      el('h2', { text: 'Settings for grown-ups' }),
      el('div', { class: 'set-row' }, el('div', {}, el('div', { class: 'label', text: 'Grade level' }), el('div', { class: 'note', text: 'Skills below this grade start as review. Skills above it open once the grade-level skills are mastered.' })), gradeSel),
      el('div', { class: 'set-row' }, el('div', {}, el('div', { class: 'label', text: 'Story pace' }), el('div', { class: 'note', text: 'With one chapter per day, the next chapter opens the morning after the last one is finished. Side quests, the daily patrol and practice are always open.' })), paceSel),
      el('h2', { text: 'Books' }),
      ...bookRows,
      el('div', { class: 'row' },
        btn('Copy report', () => this.copy(data, tut), ''),
        btn('Reset all progress', () => pushActivity(new ConfirmScreen('Reset all progress?', 'This erases the saved game and the practice history on this device. It cannot be undone.', 'Erase everything', () => { G.save.wipe(); location.reload(); })), 'danger ghost')),
      el('p', { class: 'note copy-note', 'aria-live': 'polite' })));
  }

  copy(d, tut) {
    const st = d.tutor;
    const lines = [`Penguin Quest progress: ${d.profile.name} (grade ${d.profile.grade})`,
      `Problems: ${st.totals.problems}, first-try: ${st.totals.problems ? Math.round((100 * st.totals.firstTry) / st.totals.problems) : 0}%, minutes: ${Math.round(d.stats.playSeconds / 60)}`];
    for (const dom of DOMAIN_ORDER) {
      const s = tut.domainSummary(dom);
      lines.push(`\n${DOMAINS[dom].name}: ${Math.round(s.mastery * 100)}% mastered`);
      for (const r of s.rows) if (r.attempts) lines.push(`  ${r.cc} ${r.name}: ${r.attempts} tries, ${Math.round((100 * r.firstTry) / r.attempts)}% first try${r.mastered ? ', mastered' : ''}`);
    }
    const text = lines.join('\n');
    const note = this.root.querySelector('.copy-note');
    navigator.clipboard?.writeText(text).then(() => { note.textContent = 'Report copied. Paste it into an email or note.'; })
      .catch(() => { note.textContent = 'Copying is blocked here. Select the table text and copy it instead.'; });
  }
}
