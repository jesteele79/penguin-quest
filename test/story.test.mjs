import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAMES } from '../src/game/games.js';
import { G } from '../src/core/state.js';

const BOOKS = {
  book1: {
    story: await import('../src/books/book1/story.js'),
    cast: await import('../src/books/book1/cast.js'),
    hooks: (await import('../src/books/book1/hooks.js')).HOOKS,
  },
  book2: {
    story: await import('../src/books/book2/story.js'),
    cast: await import('../src/books/book2/cast.js'),
    hooks: (await import('../src/books/book2/hooks.js')).HOOKS,
  },
};

// Every step of every quest, main and side.
function* steps(story) {
  for (const q of [...story.MAIN, ...story.SIDE]) for (const s of q.steps) yield [q.id, s];
}

// Lines are [speaker, text] pairs inside steps, briefings and outros.
function speakers(story) {
  const out = new Set();
  const walk = (o) => {
    if (!Array.isArray(o)) { if (o && typeof o === 'object') Object.values(o).forEach(walk); return; }
    if (o.length === 2 && typeof o[0] === 'string' && typeof o[1] === 'string') out.add(o[0]);
    else o.forEach(walk);
  };
  walk(story.MAIN);
  walk(story.SIDE);
  return out;
}

for (const [id, B] of Object.entries(BOOKS)) {
  test(`${id}: every speaker is in the cast`, () => {
    for (const s of speakers(B.story)) assert.ok(s === '' || s in B.cast.NPCS, `${s} speaks but is not in the cast`);
    for (const [q, s] of steps(B.story)) if (s.npc) assert.ok(s.npc in B.cast.NPCS, `${q} talks to unknown ${s.npc}`);
  });

  test(`${id}: every game and anchor a quest names exists`, () => {
    G.npcs = { get: () => ({ pos: { x: 0, z: 0 } }) };
    const ctx = new Proxy({}, { get: () => ({ x: 0, z: 0, waterEnd: { x: 0, z: 0 }, landEnd: { x: 0, z: 0 } }) });
    for (const [q, s] of steps(B.story)) {
      if (s.type === 'game') assert.ok(GAMES[s.game], `${q} plays unknown game ${s.game}`);
      if (s.run) assert.ok(GAMES[s.run], `${q} runs unknown game ${s.run}`);
      if (s.at) assert.ok(B.hooks.anchor(s.at, ctx), `${q} goes to unknown place ${s.at}`);
    }
    for (const key of B.hooks.gameAnchors) assert.ok(B.hooks.anchor(key, ctx), `game anchor ${key} has no place`);
  });

  test(`${id}: site sets point at real places`, () => {
    for (const [name, set] of Object.entries(B.story.SITE_SETS)) {
      if (set.npcs) for (const n of set.npcs) assert.ok(n in B.cast.NPCS, `${name} visits unknown ${n}`);
      if (set.points) assert.ok(set.points.length > 0 && set.points.every((p) => p.every(Number.isFinite)), `${name} has bad points`);
    }
  });
}

const L2 = await import('../src/books/book2/layout.js');
const shape2 = await import('../src/books/book2/shape.js');
const { HOP } = await import('../src/books/book2/lavahop.js');
const { TRAIL } = await import('../src/books/book2/snorkel.js');

test('book2: things you walk to are on dry ground, never in the lava', () => {
  const { SITE_SETS } = BOOKS.book2.story;
  const spots = [
    ...L2.SNOWFLAKES.map(([x, z]) => ['sea glass', x, z]),
    ...L2.CHESTS.map(([x, z]) => ['chest', x, z]),
    ...L2.CHICK_SPOTS.map(([x, z]) => ['hatchling', x, z]),
    ...L2.GLOOM_SPOTS.map(({ x, z }) => ['sootling', x, z]),
    ...Object.entries(L2.CRYSTALS).map(([k, { x, z }]) => [`vent ${k}`, x, z]),
    ...Object.entries(BOOKS.book2.cast.NPCS).filter(([, n]) => n.pos).map(([k, n]) => [`npc ${k}`, n.pos.x, n.pos.z]),
    ...Object.entries(SITE_SETS).filter(([, s]) => s.points && s.kind !== 'coral').flatMap(([k, s]) => s.points.map(([x, z]) => [k, x, z])),
  ];
  for (const [what, x, z] of spots) {
    const h = shape2.rawHeight(x, z);
    const onIsle = Math.hypot(x - L2.LOC.lavaPool.isle.x, z - L2.LOC.lavaPool.isle.z) < L2.LOC.lavaPool.isle.r;
    assert.ok(h > -0.9, `${what} at (${x}, ${z}) is too deep to wade (${h.toFixed(2)})`);
    assert.ok(onIsle || L2.poolDist(x, z) > 1, `${what} at (${x}, ${z}) is in the lava pool`);
  }
});

test('book2: the Lava Hop stones stand in lava and the last row reaches the island', () => {
  const P = L2.LOC.lavaPool;
  P.rows.forEach((x, i) => {
    for (const drift of [-HOP.DRIFT[i], 0, HOP.DRIFT[i]]) {
      for (const k of [-1, 0, 1]) {
        const z = P.z + drift + k * HOP.LANE;
        assert.ok(L2.poolDist(x, z) < -HOP.R * 0.6, `row ${i + 1} stone at (${x}, ${z.toFixed(1)}) is on the bank`);
        assert.ok(Math.hypot(x - P.isle.x, z - P.isle.z) > P.isle.r + HOP.R, `row ${i + 1} stone overlaps the island`);
      }
    }
    if (i > 0) assert.ok(x - P.rows[i - 1] < 2 * HOP.R + 2.2, `rows ${i} and ${i + 1} are too far apart to hop`);
  });
  const last = P.rows[P.rows.length - 1];
  assert.ok(P.isle.x - P.isle.r - last < HOP.R + 2.2, 'the island is a short hop from the last row');
  assert.ok(L2.poolDist(L2.LOC.lavaStart.x, L2.LOC.lavaStart.z) > 0, 'the hop starts on the bank');
  assert.ok(P.rows[0] - HOP.R - (P.x - P.a) < 4.5, 'the first row is a short hop from the bank');
});

test('book2: every snorkel ring floats in water deep enough to swim', () => {
  TRAIL.ROWS.forEach((s, i) => {
    const F = TRAIL.frame(s);
    for (const off of [-TRAIL.LANE - TRAIL.RING, -TRAIL.LANE, 0, TRAIL.LANE, TRAIL.LANE + TRAIL.RING]) {
      const h = shape2.rawHeight(F.x + F.nx * off, F.z + F.nz * off);
      assert.ok(h < -1.0, `ring row ${i + 1} at offset ${off} is too shallow (${h.toFixed(2)})`);
    }
  });
});
