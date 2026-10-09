import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSave, backupFile, readBackup, freshStart, RELEASE } from '../src/game/save.js';

// A stand-in for window.localStorage.
function fakeStorage(entries = {}) {
  const m = new Map(Object.entries(entries));
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    keys: () => [...m.keys()],
  };
}

test('a backup file brings back the whole save, every book', () => {
  const save = defaultSave();
  save.profile.name = 'Sam';
  save.coins = 321;
  save.active = 'book2';
  save.books.book1 = { q: { ch7: { done: true } } };
  const back = readBackup(backupFile(save, new Date('2026-10-09T12:00:00Z')));
  assert.equal(back.data.profile.name, 'Sam');
  assert.equal(back.data.coins, 321);
  assert.equal(back.data.active, 'book2');
  assert.deepEqual(back.data.books.book1, { q: { ch7: { done: true } } });
  assert.equal(back.saved.toISOString(), '2026-10-09T12:00:00.000Z');
});

test('anything that is not a backup is refused, and an old one is filled out', () => {
  for (const text of ['not json', '{}', '[1,2]', JSON.stringify({ app: 'other', save: defaultSave() }), JSON.stringify({ app: 'penguin-quest', save: { coins: 5 } })]) {
    assert.throws(() => readBackup(text), /not a Penguin Quest backup/);
  }
  const thin = readBackup(JSON.stringify({ app: 'penguin-quest', save: { profile: { name: 'Ana' }, active: 'book9' } }));
  assert.equal(thin.data.profile.name, 'Ana');
  assert.equal(thin.data.active, 'book1');
  assert.ok(thin.data.tutor && thin.data.settings, 'missing parts come from a fresh save');
  assert.ok(thin.data.release >= RELEASE, 'a loaded backup is not cleared as pre-1.0 on the next start');
});

test('version 1.0 starts fresh: older saves and leftovers go, the lock stays', () => {
  const old = fakeStorage({
    'penguinquest.save.v2': JSON.stringify({ v: 3, active: 'book2', coins: 999 }),
    'penguinquest.save': '{"old":true}',
    'penguinquest.lock': '4321',
    'something.else': 'keep me',
  });
  assert.equal(freshStart(old), true);
  assert.deepEqual(old.keys().sort(), ['penguinquest.lock', 'something.else']);

  const broken = fakeStorage({ 'penguinquest.save.v2': '{not json' });
  freshStart(broken);
  assert.equal(broken.getItem('penguinquest.save.v2'), null);

  const current = fakeStorage({ 'penguinquest.save.v2': JSON.stringify(defaultSave()) });
  assert.equal(freshStart(current), false);
  assert.ok(current.getItem('penguinquest.save.v2'), 'a 1.0 save is kept');
  assert.equal(freshStart(null), false);
});
