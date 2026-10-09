import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SaveStore, defaultSave, BOOK_KEYS } from '../src/game/save.js';
import { BOOKS, bookStatus, isUnlocked, gradeSkills, UNLOCK_MASTERY, bookScope } from '../src/books/books.js';
import { Tutor, emptyTutorState } from '../src/math/tutor.js';
import { SKILLS, DOMAIN_ORDER } from '../src/math/skills.js';

test('switching books parks one book and restores the other', () => {
  const store = new SaveStore();
  const d = store.data;
  assert.equal(d.active, 'book1');
  d.q.ch0 = { done: true, step: 4 };
  d.crystals.lake = true;
  d.coins = 120;
  store.switchBook('book2');
  assert.equal(d.active, 'book2');
  assert.deepEqual(d.q, {}, 'book 2 starts with no quests');
  assert.equal(d.crystals.lake, false, 'book 2 starts with fresh world state');
  assert.equal(d.coins, 120, 'coins belong to the child, not the book');
  assert.ok(d.books.book1.q.ch0.done, 'book 1 is parked');
  store.switchBook('book1');
  assert.ok(d.q.ch0.done && d.crystals.lake, 'book 1 comes back intact');
  assert.equal(d.books.book1, undefined, 'the active book is not also parked');
  for (const k of BOOK_KEYS) assert.ok(k in defaultSave(), `${k} has a default`);
});

test('the next book opens after the story and 80% mastery, or by a grown-up', () => {
  const data = defaultSave();
  data.profile.grade = 4;
  const tutor = new Tutor(data.tutor, 4, 1);
  const book2 = BOOKS[1];
  assert.equal(isUnlocked(data, tutor, BOOKS[0]), true);
  assert.equal(isUnlocked(data, tutor, book2), false);
  data.q.ch7 = { done: true };
  assert.equal(isUnlocked(data, tutor, book2), false, 'story alone is not enough');
  const skills = gradeSkills(4);
  const need = Math.ceil(skills.length * UNLOCK_MASTERY);
  skills.slice(0, need).forEach((s) => { data.tutor.skills[s.id] = { m: 0.9, n: 6, c: 5, s: 3, t: 0, assumed: false }; });
  assert.ok(bookStatus(data, tutor, BOOKS[0]).pct >= UNLOCK_MASTERY);
  assert.equal(isUnlocked(data, tutor, book2), true);
  assert.equal(isUnlocked(data, tutor, BOOKS[2]), false, 'book 3 still needs book 2');
  const fresh = defaultSave();
  fresh.flags.unlocked = ['book2'];
  assert.equal(isUnlocked(fresh, new Tutor(fresh.tutor, 4, 1), book2), true, 'grown-up override');
});

test('each book teaches its own grade, with review below and a few previews above', () => {
  const t1 = new Tutor(emptyTutorState(), 4, 9, bookScope('book1'));
  const t2 = new Tutor(emptyTutorState(), 4, 9, bookScope('book2'));
  const seen1 = new Set(), seen2 = new Set();
  for (const d of DOMAIN_ORDER) {
    for (let i = 0; i < 60; i++) {
      // A subject with nothing at a book's grades (ratios before grade 6) simply has no problems there.
      const p1 = t1.next(d); if (p1) { seen1.add(p1.skill); t1.record(p1, { solved: true, firstTry: true, hintUsed: false }); }
      const p2 = t2.next(d); if (p2) seen2.add(p2.skill);
    }
  }
  for (const id of seen1) assert.ok(SKILLS[id].grade <= 4 || ['mul_3x2', 'frac_add_unlike', 'dec_place', 'volume', 'order_ops'].includes(id), `book 1 served ${id}`);
  assert.ok([...seen1].some((id) => SKILLS[id].grade === 5), 'a strong player reaches book 1 previews');
  for (const id of seen2) assert.ok([4, 5].includes(SKILLS[id].grade), `book 2 served ${id} before its previews could open`);
  assert.ok([...seen2].some((id) => SKILLS[id].grade === 5), 'book 2 opens grade 5 for a 4th grader');
  assert.equal(t2.isUnlocked(SKILLS.mul_facts), false, 'grade 3 is not part of book 2');
});

// Typed-answer games (the cheer-up battle, the boss) ask for these domains in every book.
test('every book can always serve a typed problem for the battles', () => {
  for (const id of ['book1', 'book2', 'book3']) {
    for (const grade of [4, 5, 6]) {
      const t = new Tutor(emptyTutorState(), grade, 11, bookScope(id));
      // The hard case: the only skills free of a waiting lesson are ones that never ask for typing.
      t.lessonGate = (sid) => !['write_expr', 'inequality', 'equiv_expr', 'expr_read'].includes(sid);
      for (const domain of ['lake', 'ridge']) {
        for (let i = 0; i < 60; i++) {
          const p = t.next(domain, { format: 'input' });
          assert.ok(p && p.format === 'input', `${id} grade ${grade}: no typed ${domain} problem`);
        }
      }
    }
  }
});
