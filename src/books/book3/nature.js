// Skyreach plants and stones: puffy pastel cloud-trees, flowering bushes, pale rocks along the rims, crystal
// clusters on the workshop island and the Starwell, and little islets of grass and rock floating over the
// clouds with roots trailing beneath them.
import * as THREE from 'three';
import { mergeColored, mat, jitter } from '../../core/geo.js';
import { lambert } from '../../core/materials.js';
import { Rng } from '../../core/rng.js';
import { canopyTreeGeometry, bushGeometry, fernGeometry, rockGeometry } from '../book2/nature.js';
import { islandAt } from './shape.js';
import {
  LOC, WORLD_RADIUS, CRYSTALS, SNOWFLAKES, CHESTS, GLOOM_SPOTS, CHICK_SPOTS, NURSERY, PATROL_BOARD, FESTIVAL, SLALOM,
  PINWHEELS, GAUGES, GEARS, PRISMS, SCOPES, BRIDGES, UPDRAFTS, WATER_Y, TREASURE_CLUES, gridToWorld, COTTAGES, cottageRadius, LAMPS,
} from './layout.js';

const SOFT_RIM = { color: 0xf0e8ff, power: 2.6, strength: 0.22 };

// ------------------------------------------------------------ where things may grow
const CLEAR = [
  { ...LOC.home, r: 15 }, { ...LOC.arrival, r: 12 }, { ...LOC.camp, r: 7 }, { ...LOC.counter, r: 5 }, { ...LOC.tower, r: 12 },
  { ...LOC.vale, r: 12 }, { ...LOC.liftView, r: 8 }, { ...LOC.arena, r: 11 }, { ...LOC.well2, r: 4 }, { ...LOC.dome, r: 16 }, { ...LOC.clockFace, r: 8 },
  { ...LOC.kiln, r: 16 }, { ...LOC.scope, r: 12 }, { ...LOC.spire, r: 16 }, { ...LOC.meadow, r: 14 }, { x: LOC.rocco.x - 6, z: LOC.rocco.z - 4, r: 6 }, { x: LOC.rocco.x - 4, z: LOC.rocco.z + 2, r: 7 },
  { ...NURSERY, r: 9 }, { ...PATROL_BOARD, r: 4 }, { ...FESTIVAL, r: 12 }, { x: LOC.dock.x1 - 12, z: LOC.dock.z, r: 6 },
];
for (const c of Object.values(CRYSTALS)) CLEAR.push({ ...c, r: 8 });
for (const [x, z] of [...SNOWFLAKES, ...CHESTS, ...CHICK_SPOTS, ...PINWHEELS, ...GAUGES, ...GEARS, ...PRISMS, ...SCOPES]) CLEAR.push({ x, z, r: 4 });
for (const g of GLOOM_SPOTS) CLEAR.push({ x: g.x, z: g.z, r: 6 });
for (const t of TREASURE_CLUES) CLEAR.push({ ...gridToWorld(t.gx, t.gy), r: 6 });
COTTAGES.forEach(([x, z], i) => CLEAR.push({ x, z, r: cottageRadius(i) + 1.6 }));
for (const [x, z] of LAMPS) CLEAR.push({ x, z, r: 1.8 });
for (const B of BRIDGES) for (const [x, z] of [B.from, B.to]) CLEAR.push({ x, z, r: 8 });
for (const U of UPDRAFTS) CLEAR.push({ x: U.x, z: U.z, r: 6 });
for (let k = 0; k <= 64; k += 4) {
  const dx = SLALOM.toward.x - SLALOM.top.x, dz = SLALOM.toward.z - SLALOM.top.z, l = Math.hypot(dx, dz);
  CLEAR.push({ x: SLALOM.top.x + (dx / l) * k, z: SLALOM.top.z + (dz / l) * k, r: 7 });
}
const isClear = (x, z) => CLEAR.every((c) => (x - c.x) ** 2 + (z - c.z) ** 2 >= c.r * c.r);

// A crystal cluster: a few tall faceted points leaning out from a common root.
function crystalClusterGeometry(seed, color) {
  const rng = new Rng(seed);
  const parts = [];
  const n = rng.int(3, 6);
  for (let k = 0; k < n; k++) {
    const h = rng.float(0.8, 2.2), r = rng.float(0.18, 0.34);
    const a = rng.float(0, Math.PI * 2), tilt = k ? rng.float(0.2, 0.6) : 0.05;
    const g = new THREE.CylinderGeometry(0, r, h, 5);
    g.translate(0, h / 2, 0);
    parts.push({ geo: g, color: k % 2 ? color : 0xffffff, matrix: mat(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2, Math.sin(a) * tilt, 0, -Math.cos(a) * tilt) });
  }
  return mergeColored(parts);
}

// A small floating islet: a grassy top, a rocky cone underneath and a few hanging roots.
function isletGeometry(seed) {
  const rng = new Rng(seed);
  const top = new THREE.CylinderGeometry(1, 0.95, 0.35, 10);
  const under = new THREE.ConeGeometry(0.95, 1.6, 9);
  jitter(under, 0.12, seed);
  const parts = [
    { geo: top, color: 0x7fd8a8, matrix: mat(0, 0, 0) },
    { geo: under, color: 0x9a8070, matrix: mat(0, -0.95, 0, Math.PI, 0, 0) },
  ];
  for (let k = 0; k < 4; k++) {
    const a = rng.float(0, Math.PI * 2), d = rng.float(0.3, 0.7), l = rng.float(0.6, 1.4);
    parts.push({ geo: new THREE.CylinderGeometry(0.03, 0.05, l, 4), color: 0x6a5a3a, matrix: mat(Math.cos(a) * d, -0.9 - l / 2, Math.sin(a) * d) });
  }
  return mergeColored(parts);
}

export function buildNature(ctx) {
  const { scene, terrain, collision } = ctx;
  const rng = new Rng(4040);
  const e = new THREE.Euler(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), m4 = new THREE.Matrix4();
  const place = (mesh, list, colR = 0) => {
    list.forEach((t, i) => {
      e.set(t.rx ?? 0, t.ry, 0); q.setFromEuler(e);
      v.set(t.x, t.y, t.z); s.set(t.s, t.s * (t.sy ?? 1), t.s);
      m4.compose(v, q, s);
      mesh.setMatrixAt(i, m4);
      if (colR && Math.hypot(t.x, t.z) < WORLD_RADIUS + 4) collision.addCircle(t.x, t.z, colR * t.s, 'tree');
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  };
  const spacing = new Map();
  const near = (x, z, d) => {
    const i = Math.floor(x / 4), j = Math.floor(z / 4);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      for (const p of spacing.get(`${i + a},${j + b}`) ?? []) if ((p.x - x) ** 2 + (p.z - z) ** 2 < d * d) return true;
    }
    return false;
  };
  const claim = (x, z) => { const k = `${Math.floor(x / 4)},${Math.floor(z / 4)}`; if (!spacing.has(k)) spacing.set(k, []); spacing.get(k).push({ x, z }); };
  // Somewhere on an island top, away from the rim, the paths and everything that needs room.
  const onTop = (x, z, margin) => {
    const at = islandAt(x, z);
    return at && at.d < -margin && terrain.slopeAt(x, z) < 0.8 && terrain.roadDistanceAt(x, z) > 3 && isClear(x, z);
  };

  // ---- Cloud-trees: round puffy canopies in mint, lilac and peach.
  const trees = [[], [], []];
  for (let k = 0; k < 9000 && trees.flat().length < 130; k++) {
    const x = rng.float(-150, 150), z = rng.float(-140, 160);
    // Guild Town keeps its middle open around the cottages and the plaza.
    if (!onTop(x, z, 4) || near(x, z, 6.5) || Math.hypot(x - LOC.home.x, z - LOC.home.z) < 30) continue;
    const at = islandAt(x, z);
    if (at.id === 'well' || at.id === 'clock') continue;
    claim(x, z);
    const kind = at.id === 'wind' ? rng.int(0, 1) : at.id === 'valley' ? 0 : at.id === 'crystal' ? 1 : rng.int(0, 2);
    trees[kind].push({ x, z, y: terrain.heightAt(x, z) - 0.2, s: rng.float(0.85, 1.3), ry: rng.float(0, Math.PI * 2) });
  }
  const foliage = lambert({ vertexColors: true }, SOFT_RIM);
  const treeGeos = [canopyTreeGeometry(21, 0x6ac89a, 0x8ae0b4), canopyTreeGeometry(25, 0xc8a0f0, 0xdcc0ff), canopyTreeGeometry(29, 0xffb8a0, 0xffd0b8)];
  trees.forEach((list, i) => { const m = new THREE.InstancedMesh(treeGeos[i], foliage, list.length); m.receiveShadow = true; place(m, list, 0.6); ctx.shadowCasters.add(m); });

  // ---- Bushes, flowers and ferns.
  const smalls = [[], [], [], []];
  for (let k = 0; k < 12000 && smalls.flat().length < 700; k++) {
    const x = rng.float(-150, 150), z = rng.float(-140, 160);
    if (!onTop(x, z, 2) || terrain.roadDistanceAt(x, z) < 2.2) continue;
    smalls[rng.int(0, 3)].push({ x, z, y: terrain.heightAt(x, z) - 0.05, s: rng.float(0.7, 1.2), ry: rng.float(0, 6) });
  }
  const smallGeos = [bushGeometry(5, [0xffb8d8, 0xffffff]), bushGeometry(9, [0xb8d8ff, 0xd8b8ff]), bushGeometry(13, [0xffe08a, 0xffb8a0]), fernGeometry(19)];
  smalls.forEach((list, i) => place(new THREE.InstancedMesh(smallGeos[i], foliage, list.length), list));

  // ---- Rocks: pale stones along the rims and on the cliffs.
  const rocks = [[], []];
  for (let k = 0; k < 6000 && rocks.flat().length < 160; k++) {
    const x = rng.float(-150, 150), z = rng.float(-140, 160);
    const at = islandAt(x, z);
    if (!at || at.d < -6 || !isClear(x, z) || terrain.roadDistanceAt(x, z) < 3) continue;
    const h = terrain.heightAt(x, z);
    if (h < 1) continue;
    const s0 = rng.float(0.5, 1.4);
    rocks[rng.int(0, 1)].push({ x, z, y: h - s0 * 0.3, s: s0, sy: rng.float(0.7, 1.1), ry: rng.float(0, 6) });
  }
  const rockMat = lambert({ vertexColors: true, flatShading: true }, SOFT_RIM);
  const rockGeos = [rockGeometry(37, 0xd8d4e8, 0xa8a2c0), rockGeometry(41, 0xc8c0d8, 0x8a8298)];
  rocks.forEach((list, i) => {
    const m = new THREE.InstancedMesh(rockGeos[i], rockMat, list.length);
    m.receiveShadow = true;
    place(m, list);
    for (const t of list) if (t.s > 0.9) { const c = collision.addCircle(t.x, t.z, t.s * 0.85, 'rock'); c.top = t.y + t.s * t.sy * 0.7; }
    ctx.shadowCasters.add(m);
  });

  // ---- Crystals: on the workshop island and around the Starwell.
  const crystals = [[], []];
  for (let k = 0; k < 4000 && crystals.flat().length < 70; k++) {
    const x = rng.float(-40, 120), z = rng.float(-120, 160);
    const at = islandAt(x, z);
    if (!at || (at.id !== 'crystal' && at.id !== 'well') || at.d > -1.5 || !isClear(x, z) || terrain.roadDistanceAt(x, z) < 2.5) continue;
    crystals[at.id === 'well' ? 1 : 0].push({ x, z, y: terrain.heightAt(x, z) - 0.1, s: rng.float(0.8, 1.6), ry: rng.float(0, 6) });
  }
  const crystalMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x2a2048, flatShading: true, transparent: true, opacity: 0.9 });
  const crystalGeos = [crystalClusterGeometry(3, 0xc8a0ff), crystalClusterGeometry(7, 0x9fd8ff)];
  crystals.forEach((list, i) => place(new THREE.InstancedMesh(crystalGeos[i], crystalMat, list.length), list, 0.5));

  // ---- Floating islets: drifting gently over the clouds between the big islands.
  const islets = [];
  for (let k = 0; k < 4000 && islets.length < 46; k++) {
    const a = rng.float(0, Math.PI * 2), r = rng.float(30, 200);
    const x = Math.cos(a) * r, z = Math.sin(a) * r + 20;
    if (islandAt(x, z) || terrain.heightAt(x, z) > WATER_Y - 5) continue;
    if (islets.some((o) => Math.hypot(o.x - x, o.z - z) < 14)) continue;
    islets.push({ x, z, y: rng.float(8, 54), s: rng.float(1.5, 4.5), ry: rng.float(0, 6), phase: rng.float(0, 6) });
  }
  const isletMesh = new THREE.InstancedMesh(isletGeometry(11), lambert({ vertexColors: true }, SOFT_RIM), islets.length);
  isletMesh.castShadow = true;
  place(isletMesh, islets);
  ctx.animated.push((dt, t) => {
    islets.forEach((o, i) => {
      e.set(0, o.ry + t * 0.02, 0); q.setFromEuler(e);
      v.set(o.x, o.y + Math.sin(t * 0.4 + o.phase) * 0.6, o.z); s.setScalar(o.s);
      m4.compose(v, q, s);
      isletMesh.setMatrixAt(i, m4);
    });
    isletMesh.instanceMatrix.needsUpdate = true;
  });
  return { trees, rocks, islets };
}
