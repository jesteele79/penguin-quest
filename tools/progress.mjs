// Pacing check: simulated strong, average and struggling students play each book's story problem mix, then
// practise until the next book unlocks. Prints how many of the grade's skills each has mastered when the story
// ends and how many more problems the unlock line takes: node tools/progress.mjs
import { Tutor, emptyTutorState } from '../src/math/tutor.js';
import { SKILLS } from '../src/math/skills.js';
import { BOOKS, bookScope, gradeSkills, UNLOCK_MASTERY } from '../src/books/books.js';

// Problems each story serves by domain, counted from a full playthrough of the main chapters (side quests,
// the arcade and practice at the crystals come on top).
const STORY = {
  book1: { lake: 49, grove: 43, huts: 40, cave: 40, ridge: 40 },
  book2: { lake: 44, grove: 41, huts: 41, cave: 40, ridge: 39 },
  book3: { lake: 5, grove: 1, huts: 1, cave: 40, ridge: 46, ratios: 38, neg: 39, stars: 39 },
};

// Chance of a first-try answer: at the book's grade, for review below it, for previews above it; and of
// getting there on a second try.
const STUDENTS = {
  strong: { at: 0.93, below: 0.97, above: 0.8, retry: 0.9 },
  average: { at: 0.8, below: 0.9, above: 0.6, retry: 0.8 },
  struggling: { at: 0.62, below: 0.78, above: 0.4, retry: 0.6 },
};
const SEEDS = [1, 2, 3, 4, 5];

function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

for (const book of BOOKS) {
  const mix = STORY[book.id];
  if (!mix) continue;
  const skills = gradeSkills(book.grade);
  const need = Math.ceil(skills.length * UNLOCK_MASTERY);
  const story = Object.values(mix).reduce((a, b) => a + b, 0);
  const line = BOOKS[book.n] ? 'the next book needs' : 'a next book would need';
  console.log(`\n${book.title} (grade ${book.grade}): the story serves ${story} problems; ${line} ${need} of the ${skills.length} grade ${book.grade} skills mastered`);
  for (const [name, S] of Object.entries(STUDENTS)) {
    const ends = [], extras = [];
    for (const seed of SEEDS) {
      const tutor = new Tutor(emptyTutorState(), book.grade, seed, bookScope(book.id));
      const r = rng(seed * 7919);
      const play = (domain) => {
        const p = tutor.next(domain);
        if (!p) return;
        const g = SKILLS[p.skill].grade, first = r() < (g < book.grade ? S.below : g > book.grade ? S.above : S.at);
        tutor.record(p, { solved: first || r() < S.retry, firstTry: first, hintUsed: false });
      };
      const mastered = () => skills.filter((s) => tutor.isMastered(s.id)).length;
      // The story's problems, its domains interleaved in proportion.
      const left = { ...mix };
      for (let k = 0; k < story; k++) {
        let x = r() * (story - k), d = null;
        for (const [dom, n] of Object.entries(left)) { x -= n; if (x <= 0 && n > 0) { d = dom; break; } }
        d ??= Object.keys(left).find((dom) => left[dom] > 0);
        left[d] -= 1;
        play(d);
      }
      ends.push(mastered());
      // Then practice in the domains with grade skills still to master.
      let extra = 0;
      while (mastered() < need && extra < 2000) {
        const open = [...new Set(skills.filter((s) => !tutor.isMastered(s.id)).map((s) => s.domain))];
        play(open[Math.floor(r() * open.length)]);
        extra++;
      }
      extras.push(extra);
    }
    const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
    console.log(`  ${name.padEnd(10)} mastered when the story ends: ${String(avg(ends)).padStart(2)} (${ends.join(', ')}); more problems to unlock: ${String(avg(extras)).padStart(3)} (${extras.join(', ')})`);
  }
}
