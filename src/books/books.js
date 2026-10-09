// The three books of the series, one per grade. A book opens when the previous story is finished and
// most of that grade's skills are mastered, or when a grown-up opens it from the progress report.
import { SKILL_LIST } from '../math/skills.js';

export const UNLOCK_MASTERY = 0.8;

export const BOOKS = [
  {
    id: 'book1', n: 1, title: 'Aurora Rescue', grade: 4, world: 'Glacier Bay', final: 'ch7', ready: true, travel: 'sail',
    blurb: 'Bring the fading aurora back to a snowy island.', colors: ['#1e2a78', '#38f0d2', '#b483ff'], icon: 'flake',
  },
  {
    id: 'book2', n: 2, title: 'The Ember Isles', grade: 5, world: 'The Ember Isles', final: 'ch7', ready: true, travel: 'sail',
    blurb: 'Sail to a warm volcanic archipelago where the Heart-Ember is cooling.', colors: ['#5a1e3a', '#ff6b35', '#2ec4b6'], icon: 'flame',
  },
  {
    id: 'book3', n: 3, title: 'Skyreach', grade: 6, world: 'Skyreach', final: 'ch7', ready: true, travel: 'fly',
    blurb: 'Glide between floating islands and rebuild the Star Map.', colors: ['#2d2a6e', '#c9b6ff', '#ffb38a'], icon: 'star',
  },
];

export const bookById = (id) => BOOKS.find((b) => b.id === id) ?? BOOKS[0];
export const nextBook = (book) => BOOKS[book.n] ?? null;
// A book's world in the middle of a sentence: "sail to the Ember Isles".
export const placeName = (world) => world.replace(/^The /, 'the ');

// The books a player could sail to from this one right now: open, finished being written, not this one.
export const voyages = (data, tutor, here) => BOOKS.filter((b) => b.id !== here && b.ready && isUnlocked(data, tutor, b));

// What each book teaches: the year before as review, its own grade as the core, and a few previews of the
// next grade for players who race ahead (they open once the domain's easier skills are mastered).
const SCOPE = {
  book1: { grade: 4, review: 3, preview: ['mul_3x2', 'frac_add_unlike', 'dec_place', 'volume', 'order_ops'] },
  book2: { grade: 5, review: 4, preview: ['long_div', 'frac_div', 'dec_ops', 'area_tri', 'exponents', 'mean'] },
  book3: { grade: 6, review: 5, preview: [] },
};

export function bookScope(id) {
  const s = SCOPE[id] ?? SCOPE.book1;
  const preview = new Set(s.preview);
  return { id, grade: s.grade, has: (skill) => skill.grade === s.grade || skill.grade === s.review || preview.has(skill.id) };
}

export const gradeSkills = (grade) => SKILL_LIST.filter((s) => s.grade === grade);

// The saved state for a book: the active book lives at the top level of the save, others in data.books.
function bookState(data, book) {
  const active = data.active ?? 'book1';
  return active === book.id ? data : data.books?.[book.id];
}

// Where a book stands: is its story finished, and how much of its grade is mastered.
export function bookStatus(data, tutor, book) {
  const state = bookState(data, book);
  const storyDone = !!(book.final && state?.q?.[book.final]?.done);
  const skills = gradeSkills(book.grade);
  const missing = skills.filter((s) => !tutor.isMastered(s.id));
  const mastered = skills.length - missing.length;
  return { storyDone, mastered, total: skills.length, pct: skills.length ? mastered / skills.length : 0, missing };
}

export function isUnlocked(data, tutor, book) {
  if (book.n === 1) return true;
  if (data.flags?.unlocked?.includes(book.id)) return true;
  const prev = BOOKS[book.n - 2];
  if (!isUnlocked(data, tutor, prev)) return false;
  const st = bookStatus(data, tutor, prev);
  return st.storyDone && st.pct >= UNLOCK_MASTERY;
}

// How many more skills of the previous grade are needed to reach the unlock line.
export function skillsToGo(st) { return Math.max(0, Math.ceil(st.total * UNLOCK_MASTERY) - st.mastered); }

// A small emblem for each book's cover.
export const BOOK_ICONS = {
  flake: '<svg viewBox="0 0 24 24" class="ico"><g stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="3.3" y1="7" x2="20.7" y2="17"/><line x1="3.3" y1="17" x2="20.7" y2="7"/></g></svg>',
  flame: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-9z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24" class="ico"><polygon points="12,1.5 14.9,8.6 22.5,9.2 16.7,14.2 18.5,21.6 12,17.6 5.5,21.6 7.3,14.2 1.5,9.2 9.1,8.6" fill="currentColor"/></svg>',
  lock: '<svg viewBox="0 0 24 24" class="ico"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
};
