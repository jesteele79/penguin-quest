import { emptyTutorState } from '../math/tutor.js';

const KEY = 'penguinquest.save.v2';

// Fields that belong to one book. The active book keeps them at the top level (so the game reads them
// directly); the others are parked in data.books until their book is opened.
export const BOOK_KEYS = [
  'pos', 'q', 'tracked', 'briefed', 'resonance', 'shards', 'progress', 'crystals', 'finale', 'festival',
  'snowflakes', 'seeds', 'chests', 'chicks', 'treasures', 'gloomRespawn', 'medals',
];

export function defaultSave() {
  return {
    v: 3,
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

  fresh(profile) {
    this.data = defaultSave();
    Object.assign(this.data.profile, profile);
    this.data.equipped.scarf = profile.scarf ?? 'coral';
    if (!this.data.owned.includes('scarf:' + this.data.equipped.scarf)) this.data.owned.push('scarf:' + this.data.equipped.scarf);
    this.save();
    return this.data;
  }

  save() {
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

  wipe() {
    try { this.store?.removeItem(KEY); } catch { /* storage blocked */ }
    this.data = defaultSave();
  }
}
