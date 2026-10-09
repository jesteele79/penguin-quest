import { emptyTutorState } from '../math/tutor.js';

const KEY = 'penguinquest.save.v2';
// The grown-up lock lives apart from the saved game, so resetting progress or loading a backup keeps it.
const LOCK_KEY = 'penguinquest.lock';
// Saves made by release 1 (version 1.0) and later carry this mark. Anything older is cleared once (freshStart).
export const RELEASE = 1;

// Fields that belong to one book. The active book keeps them at the top level (so the game reads them
// directly); the others are parked in data.books until their book is opened.
export const BOOK_KEYS = [
  'pos', 'q', 'tracked', 'briefed', 'resonance', 'shards', 'progress', 'crystals', 'finale', 'festival',
  'snowflakes', 'seeds', 'chests', 'chicks', 'treasures', 'gloomRespawn', 'medals',
];

export function defaultSave() {
  return {
    v: 3,
    release: RELEASE,
    created: Date.now(),
    active: 'book1',
    books: {},
    profile: { name: 'Pip', grade: 4, scarf: 'coral' },
    settings: { music: 0.5, sfx: 0.8, voice: 1, quality: 'auto', gentle: false, readAloud: false, bigText: false, textSize: 1, easyRead: false, textSpeed: 'normal', reduceMotion: null, showTrail: true, pace: 'daily' },
    pos: null,
    q: {},
    tracked: null,
    briefed: {},
    resonance: { lake: 0, grove: 0, huts: 0, cave: 0, ridge: 0 },
    shards: { lake: 0, grove: 0, huts: 0, cave: 0, ridge: 0 },
    progress: { charge: { lake: 0, grove: 0, huts: 0, cave: 0, ridge: 0 } },
    crystals: { lake: false, grove: false, huts: false, cave: false, ridge: false },
    finale: false,
    festival: false,
    snowflakes: [],
    seeds: [],
    chests: [],
    chicks: { found: [], home: [] },
    treasures: [],
    gloomRespawn: {},
    coins: 0,
    stars: 0,
    owned: ['scarf:coral', 'trail:snow', 'sled:null', 'buddy:null', 'hat:null'],
    equipped: { scarf: 'coral', hat: null, trail: 'snow', sled: null, buddy: null },
    medals: {},
    patrol: { day: null, tasks: [], streak: 0, lastDone: null, best: 0, allDone: false },
    counters: { glooms: 0, gloomSpots: [], fish: 0, served: 0, slide: 0, swim: 0, chests: 0, chartDays: [], inARow: 0, bestInARow: 0 },
    tutor: emptyTutorState(),
    lessons: {},
    stats: { playSeconds: 0, sessions: 0, lastPlayed: 0 },
    flags: {},
  };
}

function deepMerge(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    if (over && typeof over === 'object') {
      for (const k of Object.keys(over)) out[k] = k in base ? deepMerge(base[k], over[k]) : over[k];
    }
    return out;
  }
  return over === undefined ? base : over;
}

function storage() {
  try {
    const s = window.localStorage;
    const probe = '__pq_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export class SaveStore {
  constructor() {
    this.store = storage();
    this.data = defaultSave();
  }

  get persistent() { return !!this.store; }

  exists() {
    try { return !!this.store?.getItem(KEY); } catch { return false; }
  }

  peek() {
    try {
      const raw = this.store?.getItem(KEY);
      return raw ? deepMerge(defaultSave(), JSON.parse(raw)) : null;
    } catch { return null; }
  }

  load() {
    const d = this.peek();
    this.data = d ?? defaultSave();
    return this.data;
  }

  // A new adventure starts in Book 1 unless a test asks for another book.
  fresh(profile, book = 'book1') {
    this.data = defaultSave();
    this.data.active = book;
    Object.assign(this.data.profile, profile);
    this.data.equipped.scarf = profile.scarf ?? 'coral';
    if (!this.data.owned.includes('scarf:' + this.data.equipped.scarf)) this.data.owned.push('scarf:' + this.data.equipped.scarf);
    this.save();
    return this.data;
  }

  save() {
    if (this.closed) return false;
    try {
      this.data.stats.lastPlayed = Date.now();
      this.store?.setItem(KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.warn('Could not save progress.', e);
      return false;
    }
  }

  // Park the active book's state and bring another book's state (or a fresh one) to the top level.
  switchBook(id) {
    const d = this.data;
    const from = d.active ?? 'book1';
    if (id === from) return d;
    const fresh = defaultSave();
    d.books = d.books ?? {};
    d.books[from] = JSON.parse(JSON.stringify(Object.fromEntries(BOOK_KEYS.map((k) => [k, d[k]]))));
    const next = d.books[id];
    for (const k of BOOK_KEYS) d[k] = next && k in next ? next[k] : fresh[k];
    delete d.books[id];
    d.active = id;
    return d;
  }

  // Wiping and restoring are followed by a reload: nothing this page still holds may be written back on the way
  // out (the game saves as the page hides).
  wipe() {
    try { this.store?.removeItem(KEY); } catch { /* storage blocked */ }
    this.data = defaultSave();
    this.closed = true;
  }

  // A backup file: the whole save (every book), marked so a stray file is not mistaken for one.
  backupText() {
    try {
      const raw = this.store?.getItem(KEY);
      return raw ? backupFile(JSON.parse(raw)) : null;
    } catch { return null; }
  }

  restore(data) {
    try { this.store?.setItem(KEY, JSON.stringify(data)); } catch { return false; }
    this.data = data;
    this.closed = true;
    return true;
  }
}

export function backupFile(save, when = new Date()) {
  return JSON.stringify({ app: 'penguin-quest', release: RELEASE, saved: when.toISOString(), save }, null, 1);
}

// The save in a backup file, filled out to the current shape. Throws a message fit to show a grown-up.
export function readBackup(text) {
  let file;
  try { file = JSON.parse(text); } catch { throw new Error('That file is not a Penguin Quest backup.'); }
  if (file?.app !== 'penguin-quest' || !file.save || typeof file.save !== 'object' || !file.save.profile) {
    throw new Error('That file is not a Penguin Quest backup.');
  }
  const data = deepMerge(defaultSave(), file.save);
  if (!['book1', 'book2', 'book3'].includes(data.active)) data.active = 'book1';
  data.release = Math.max(RELEASE, Number(data.release) || 0);
  return { data, saved: file.saved ? new Date(file.saved) : null };
}

// Version 1.0 starts everyone fresh: a save from before it (no release mark), or one that cannot be read, is
// erased once, with anything else an older version left in storage. The grown-up lock stays. Runs before
// anything reads the save, since the save also picks which book's world gets built.
export function freshStart(store) {
  if (!store) return false;
  try {
    let release = 0;
    try { release = Number(JSON.parse(store.getItem(KEY) ?? 'null')?.release) || 0; } catch { release = 0; }
    if (release >= RELEASE) return false;
    const old = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k?.startsWith('penguinquest.') && k !== LOCK_KEY) old.push(k);
    }
    old.forEach((k) => store.removeItem(k));
    return old.length > 0;
  } catch { return false; }
}

// The grown-up lock: a four-digit PIN, or none.
export const lock = {
  get() { try { return storage()?.getItem(LOCK_KEY) || null; } catch { return null; } },
  set(pin) { try { storage()?.setItem(LOCK_KEY, pin); return true; } catch { return false; } },
  clear() { try { storage()?.removeItem(LOCK_KEY); } catch { /* storage blocked */ } },
};
