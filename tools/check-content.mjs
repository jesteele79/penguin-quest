// Verifies that quest sites sit somewhere sensible: on land (or in water for buoys), walkable, reachable.
import { Terrain } from '../src/world/terrain.js';
import * as L from '../src/world/layout.js';

const t = new Terrain();
const rows = [];
const check = (group, x, z, { water = false, maxSlope = 0.9 } = {}) => {
  const h = t.heightAt(x, z), s = t.slopeAt(x, z), r = Math.hypot(x, z);
  const problems = [];
  if (water && h > -1.2) problems.push(`not deep water (h=${h.toFixed(1)})`);
  if (!water && h < 0.3) problems.push(`in water (h=${h.toFixed(1)})`);
  if (!water && s > maxSlope) problems.push(`steep (${s.toFixed(2)})`);
  if (r > L.WORLD_RADIUS - 4) problems.push(`outside world (r=${r.toFixed(0)})`);
  if (Math.hypot(x - L.LOC.spire.x, z - L.LOC.spire.z) < 16) problems.push('inside spire shield');
  rows.push({ group, x, z, h: +h.toFixed(1), slope: +s.toFixed(2), ok: problems.length ? '✗ ' + problems.join(', ') : 'ok' });
};

L.SNOWFLAKES.forEach(([x, z]) => check('flake', x, z));
L.CHESTS.forEach(([x, z]) => check('chest', x, z));
L.GLOOM_SPOTS.forEach((g) => check('gloom', g.x, g.z));
L.BUOYS.forEach(([x, z]) => check('buoy', x, z, { water: true }));
L.SURVEY.forEach(([x, z]) => check('survey', x, z));
L.BEACONS.forEach(([x, z]) => check('beacon', x, z, { maxSlope: 1.0 }));
L.BEDS.forEach(([x, z]) => check('bed', x, z));
L.SEEDS.forEach(([x, z]) => check('seed', x, z));
L.CHICK_SPOTS.forEach(([x, z]) => check('chick', x, z));
L.TREASURE_CLUES.forEach((c) => { const w = L.gridToWorld(c.gx, c.gy); check(`treasure(${c.gx},${c.gy})`, w.x, w.z); });
for (const k of ['NURSERY', 'PATROL_BOARD', 'CAULDRON', 'FESTIVAL']) check(k, L[k].x, L[k].z);
check('slalom-top', L.SLALOM.top.x, L.SLALOM.top.z);
check('slalom-end', L.SLALOM.top.x + (L.SLALOM.toward.x - L.SLALOM.top.x) * 1.9, L.SLALOM.top.z + (L.SLALOM.toward.z - L.SLALOM.top.z) * 1.9);
for (const k of ['purl', 'nestle', 'kingSpot']) check(k, L.LOC[k].x, L.LOC[k].z);

const bad = rows.filter((r) => r.ok !== 'ok');
console.table(bad.length ? bad : rows.slice(0, 5));
console.log(`${rows.length} positions checked, ${bad.length} problems`);

// Things you press E at must not sit on top of each other, or one steals the other's prompt.
const spots = [];
const add = (name, x, z) => spots.push({ name, x, z });
L.CHESTS.forEach(([x, z], i) => add(`chest${i}`, x, z));
L.BEACONS.forEach(([x, z], i) => add(`beacon${i}`, x, z));
L.SURVEY.forEach(([x, z], i) => add(`survey${i}`, x, z));
L.BEDS.forEach(([x, z], i) => add(`bed${i}`, x, z));
L.BUOYS.forEach(([x, z], i) => add(`buoy${i}`, x, z));
L.GLOOM_SPOTS.forEach((g, i) => add(`gloom${i}`, g.x, g.z));
L.CHICK_SPOTS.forEach(([x, z], i) => add(`chick${i}`, x, z));
L.TREASURE_CLUES.forEach((c, i) => { const w = L.gridToWorld(c.gx, c.gy); add(`treasure${i}`, w.x, w.z); });
Object.entries(L.CRYSTALS).forEach(([k, c]) => { add(`crystal-${k}`, c.x, c.z); add(`legend-${k}`, c.x + 4.5, c.z + 4.5); });
for (const k of ['professor', 'fern', 'mittens', 'counter', 'purl', 'nestle', 'pebble', 'skipper', 'easel']) add(k, L.LOC[k].x, L.LOC[k].z);
for (const k of ['PATROL_BOARD', 'CAULDRON']) add(k, L[k].x, L[k].z);
add('slalomTop', L.SLALOM.top.x, L.SLALOM.top.z);
const close = [];
for (let i = 0; i < spots.length; i++) {
  for (let j = i + 1; j < spots.length; j++) {
    const a = spots[i], b = spots[j];
    const d = Math.hypot(a.x - b.x, a.z - b.z);
    const pair = `${a.name}/${b.name}`;
    if (d < 6 && pair !== `crystal-${a.name.split('-')[1]}/legend-${a.name.split('-')[1]}`) close.push({ pair, d: +d.toFixed(1) });
  }
}
if (close.length) console.table(close);
console.log(`${spots.length} interaction spots, ${close.length} too close together`);
// Slalom profile: height along the course.
const dx = L.SLALOM.toward.x - L.SLALOM.top.x, dz = L.SLALOM.toward.z - L.SLALOM.top.z, len = Math.hypot(dx, dz);
const prof = [];
for (let d = 0; d <= 60; d += 6) prof.push(t.heightAt(L.SLALOM.top.x + (dx / len) * d, L.SLALOM.top.z + (dz / len) * d).toFixed(1));
console.log('slalom heights every 6 units:', prof.join(' '));
