import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SaveStore, defaultSave, BOOK_KEYS } from '../src/game/save.js';
import { BOOKS, bookStatus, isUnlocked, gradeSkills, UNLOCK_MASTERY } from '../src/books/books.js';
import { Tutor } from '../src/math/tutor.js';

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
