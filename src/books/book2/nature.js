// Ember Isles plants and stones: leaning palms on the beaches, round-canopy jungle and blossom trees inland,
// ferns and flowering bushes, black volcanic rock, and bright coral under the lagoon water.
import * as THREE from 'three';
import { mergeColored, mat, jitter } from '../../core/geo.js';
import { lambert } from '../../core/materials.js';
import { Rng } from '../../core/rng.js';
import { createNoise2D, makeFbm } from '../../core/noise.js';
import { smoothstep } from '../../core/mathutil.js';
import { coastSD } from './shape.js';
import {
  LOC, WORLD_RADIUS, CRYSTALS, SNOWFLAKES, CHESTS, GLOOM_SPOTS, CHICK_SPOTS, NURSERY, PATROL_BOARD, CAULDRON,
  FESTIVAL, SLALOM, VALVES, CRATES, LAMPS, TIDE_POOLS, poolDist,
} from './layout.js';

const fbm = makeFbm(createNoise2D(4711));
const WARM_RIM = { color: 0xffd6b8, power: 2.8, strength: 0.18 };

// ------------------------------------------------------------ shapes
export function palmGeometry(seed) {
  const rng = new Rng(seed);
  const parts = [];
  const segs = 7, H = rng.float(6.4, 8.6), bend = rng.float(0.05, 0.11);
  let x = 0, y = 0, tilt = 0.04;
  for (let i = 0; i < segs; i++) {
    const h = H / segs, r0 = 0.3 - i * 0.02, r1 = r0 - 0.02;
    parts.push({ geo: new THREE.CylinderGeometry(r1, r0, h * 1.06, 7), color: i % 2 ? 0x8f6d4a : 0x7a5a3c, matrix: mat(x + Math.sin(tilt) * h / 2, y + Math.cos(tilt) * h / 2, 0, 0, 0, -tilt) });
    x += Math.sin(tilt) * h; y += Math.cos(tilt) * h;
    tilt += bend;
  }
  const fronds = 8;
  for (let k = 0; k < fronds; k++) {
    const a = (k / fronds) * Math.PI * 2 + rng.float(-0.2, 0.2);
    const len = rng.float(2.7, 3.5), droop = rng.float(0.3, 0.75);
    const g = new THREE.SphereGeometry(0.5, 7, 4);
    g.scale(len, 0.1, 0.5);
    g.translate(len * 0.48, 0, 0);
    parts.push({ geo: g, color: k % 2 ? 0x3f9b4b : 0x5bb85a, matrix: mat(x, y + 0.05, 0, 0, a, -droop) });
  }
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    parts.push({ geo: new THREE.SphereGeometry(0.22, 6, 5), color: 0x6b4a2a, matrix: mat(x + Math.cos(a) * 0.25, y - 0.25, Math.sin(a) * 0.25) });
  }
  return mergeColored(parts);
}

export function canopyTreeGeometry(seed, leaf, leaf2) {
  const rng = new Rng(seed);
  const H = rng.float(3.2, 4.4);
  const parts = [{ geo: new THREE.CylinderGeometry(0.2, 0.34, H, 6), color: 0x6b4a32, matrix: mat(0, H / 2, 0) }];
  const blobs = 4;
  for (let k = 0; k < blobs; k++) {
    const a = (k / blobs) * Math.PI * 2 + rng.float(0, 1);
    const r = k === 0 ? rng.float(1.6, 2.0) : rng.float(1.1, 1.5);
    const d = k === 0 ? 0 : rng.float(0.9, 1.3);
    const g = new THREE.IcosahedronGeometry(r, 1);
    jitter(g, 0.18, seed + k);
    g.scale(1, 0.82, 1);
    parts.push({ geo: g, color: k % 2 ? leaf : leaf2, matrix: mat(Math.cos(a) * d, H + (k === 0 ? 0.6 : rng.float(-0.2, 0.4)), Math.sin(a) * d) });
  }
  return mergeColored(parts);
}

export function bushGeometry(seed, flowers) {
  const rng = new Rng(seed);
  const parts = [];
  for (let k = 0; k < 3; k++) {
    const g = new THREE.IcosahedronGeometry(rng.float(0.5, 0.8), 0);
    jitter(g, 0.12, seed * 3 + k);
    parts.push({ geo: g, color: k === 1 ? 0x3d8f45 : 0x4ea552, matrix: mat(rng.float(-0.5, 0.5), 0.45, rng.float(-0.5, 0.5), 0, 0, 0, 1, 0.75, 1) });
  }
  if (flowers) {
    for (let k = 0; k < 7; k++) {
      const a = rng.float(0, Math.PI * 2), d = rng.float(0.2, 0.75);
      parts.push({ geo: new THREE.IcosahedronGeometry(0.16, 0), color: flowers[k % flowers.length], matrix: mat(Math.cos(a) * d, rng.float(0.75, 1.05), Math.sin(a) * d) });
    }
  }
  return mergeColored(parts);
}

export function fernGeometry(seed) {
  const rng = new Rng(seed);
  const parts = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + rng.float(-0.2, 0.2);
    const g = new THREE.SphereGeometry(0.5, 6, 3);
    g.scale(1.6, 0.06, 0.32);
    g.translate(0.75, 0, 0);
    parts.push({ geo: g, color: k % 2 ? 0x2f8a40 : 0x48a54c, matrix: mat(0, 0.25, 0, 0, a, rng.float(0.35, 0.7)) });
  }
  return mergeColored(parts);
}

export function rockGeometry(seed, top, side) {
  let g = new THREE.IcosahedronGeometry(1, 1);
  jitter(g, 0.42, seed);
  g.scale(1, 0.7, 1);
  g = g.index ? g.toNonIndexed() : g;
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const T = new THREE.Color(top), S = new THREE.Color(side);
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
    const cc = n.y > 0.45 ? T : S;
    for (let k = 0; k < 3; k++) col.set([cc.r, cc.g, cc.b], (i + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export function coralGeometry(seed, color) {
  const rng = new Rng(seed);
  const parts = [];
  if (seed % 3 === 0) {
    const g = new THREE.IcosahedronGeometry(0.8, 1);
    jitter(g, 0.12, seed);
    g.scale(1, 0.62, 1);
    parts.push({ geo: g, color, matrix: mat(0, 0.3, 0) });
  } else {
    for (let k = 0; k < 6; k++) {
      const a = rng.float(0, Math.PI * 2), tilt = rng.float(0.15, 0.6), h = rng.float(0.8, 1.6);
      const m = mat(Math.cos(a) * 0.15, h / 2 * Math.cos(tilt), Math.sin(a) * 0.15, Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
      parts.push({ geo: new THREE.CylinderGeometry(0.08, 0.13, h, 5), color, matrix: m });
      const tip = new THREE.Vector3(0, h / 2, 0).applyMatrix4(m);
      parts.push({ geo: new THREE.IcosahedronGeometry(0.16, 0), color: 0xfff1d6, matrix: mat(tip.x, tip.y, tip.z) });
    }
  }
  return mergeColored(parts);
}

// ------------------------------------------------------------ where things may grow
const CLEAR = [
  { ...LOC.home, r: 24 }, { ...LOC.harbor, r: 24 }, { ...LOC.forge, r: 14 }, { ...LOC.camp2, r: 11 }, { ...LOC.temple, r: 12 },
  { ...LOC.cliffs, r: 10 }, { ...LOC.arena, r: 10 }, { ...LOC.isa, r: 6 }, { ...LOC.tortuga, r: 6 }, { ...LOC.lumi, r: 6 }, { ...LOC.rocco, r: 5 },
  { ...FESTIVAL, r: 15 }, { ...NURSERY, r: 6 }, { ...PATROL_BOARD, r: 5 }, { ...CAULDRON, r: 5 },
];
for (const c of Object.values(CRYSTALS)) CLEAR.push({ ...c, r: 7 });
for (const [x, z] of [...SNOWFLAKES, ...CHESTS, ...CHICK_SPOTS, ...VALVES, ...CRATES, ...LAMPS, ...TIDE_POOLS]) CLEAR.push({ x, z, r: 4 });
for (const g of GLOOM_SPOTS) CLEAR.push({ x: g.x, z: g.z, r: 7 });
for (let k = 0; k <= 66; k += 4) {
  const dx = SLALOM.toward.x - SLALOM.top.x, dz = SLALOM.toward.z - SLALOM.top.z, l = Math.hypot(dx, dz);
  CLEAR.push({ x: SLALOM.top.x + (dx / l) * k, z: SLALOM.top.z + (dz / l) * k, r: 8 });
}
const isClear = (x, z) => poolDist(x, z) > 6 && CLEAR.every((c) => (x - c.x) ** 2 + (z - c.z) ** 2 >= c.r * c.r);
const volcanoD = (x, z) => Math.hypot(x - LOC.volcano.x, z - LOC.volcano.z);

export function buildNature(ctx) {
  const { scene, terrain, collision } = ctx;
  const rng = new Rng(808);
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
  const ok = (x, z, gap) => isClear(x, z) && terrain.roadDistanceAt(x, z) > 4 && !near(x, z, gap);

  // ---- Palms: along every beach, leaning out toward the sea.
  const palms = [[], [], []];
  for (let k = 0; k < 9000 && palms.flat().length < 260; k++) {
    const x = rng.float(-200, 200), z = rng.float(-200, 200);
    const h = terrain.heightAt(x, z);
    if (h < 0.55 || h > 3.6) continue;
    const sd = coastSD(x, z);
    const reef = Math.hypot(x - LOC.lagoon.x, z - LOC.lagoon.z) > LOC.lagoon.r && h < 1.2;
    if (!(sd > -18 && sd < -1) && !reef) continue;
    if (terrain.slopeAt(x, z) > 0.7 || !ok(x, z, 3.6)) continue;
    claim(x, z);
    palms[rng.int(0, 2)].push({ x, z, y: h - 0.15, s: rng.float(0.85, 1.25), ry: rng.float(0, Math.PI * 2) });
  }
  // ---- Jungle: round canopies inland, blossom trees in sunny patches.
  const trees = [[], [], []];
  for (let k = 0; k < 16000 && trees.flat().length < 520; k++) {
    const x = rng.float(-190, 190), z = rng.float(-190, 190);
    if (Math.hypot(x, z) > WORLD_RADIUS + 10) continue;
    const h = terrain.heightAt(x, z);
    if (h < 3.4 || volcanoD(x, z) < 50 || terrain.slopeAt(x, z) > 0.85) continue;
    const dens = 0.25 + 0.75 * smoothstep(-0.1, 0.45, fbm(x * 0.02, z * 0.02, 3));
    if (rng.next() > dens * 0.6 || !ok(x, z, 4.2)) continue;
    claim(x, z);
    const kind = fbm(x * 0.05 + 3, z * 0.05, 2) > 0.38 ? rng.int(1, 2) : 0;
    trees[kind].push({ x, z, y: h - 0.2, s: rng.float(0.85, 1.35), ry: rng.float(0, Math.PI * 2) });
  }
  // Far islands get palms too, so the horizon reads as more islands.
  for (let k = 0; k < 4000 && palms.flat().length < 330; k++) {
    const a = rng.float(0, Math.PI * 2), r = rng.float(196, 232);
    const x = Math.cos(a) * r, z = Math.sin(a) * r, h = terrain.heightAt(x, z);
    if (h < 1 || h > 14) continue;
    palms[rng.int(0, 2)].push({ x, z, y: h - 0.2, s: rng.float(1.1, 1.5), ry: rng.float(0, 6) });
  }

  const foliage = lambert({ vertexColors: true }, WARM_RIM);
  palms.forEach((list, i) => { const m = new THREE.InstancedMesh(palmGeometry(31 + i * 7), foliage, list.length); m.receiveShadow = true; place(m, list, 0.45); ctx.shadowCasters.add(m); });
  const treeGeos = [canopyTreeGeometry(5, 0x2f8a42, 0x3c9e4b), canopyTreeGeometry(9, 0xff86b0, 0xffb3cc), canopyTreeGeometry(13, 0xffa64d, 0xffcf6e)];
  trees.forEach((list, i) => { const m = new THREE.InstancedMesh(treeGeos[i], foliage, list.length); m.receiveShadow = true; place(m, list, 0.6); ctx.shadowCasters.add(m); });

  // ---- Bushes, flowers and ferns: small, no collision.
  const smalls = [[], [], [], []];
  for (let k = 0; k < 12000 && smalls.flat().length < 900; k++) {
    const x = rng.float(-185, 185), z = rng.float(-185, 185);
    const h = terrain.heightAt(x, z);
    if (h < 1.6 || volcanoD(x, z) < 40 || terrain.slopeAt(x, z) > 1.0 || !isClear(x, z) || terrain.roadDistanceAt(x, z) < 2.2) continue;
    smalls[rng.int(0, 3)].push({ x, z, y: h - 0.05, s: rng.float(0.7, 1.3), ry: rng.float(0, 6) });
  }
  const smallGeos = [bushGeometry(3, null), bushGeometry(7, [0xff4f6b, 0xff8fb0]), bushGeometry(11, [0xffd23d, 0xff9a3c]), fernGeometry(17)];
  smalls.forEach((list, i) => place(new THREE.InstancedMesh(smallGeos[i], foliage, list.length), list));

  // ---- Rocks: black basalt on the volcano and cliffs, pale boulders on the beaches.
  const rocks = [[], [], []];
  for (let k = 0; k < 7000 && rocks.flat().length < 300; k++) {
    const x = rng.float(-195, 195), z = rng.float(-195, 195);
    const h = terrain.heightAt(x, z);
    if (h < -0.4 || !isClear(x, z) || terrain.roadDistanceAt(x, z) < 3) continue;
    const slope = terrain.slopeAt(x, z), dv = volcanoD(x, z);
    const volc = dv < 66 && rng.chance(0.55), cliff = slope > 0.9 && rng.chance(0.5), beach = h < 2 && rng.chance(0.05);
    if (!volc && !cliff && !beach) continue;
    const s0 = rng.float(0.5, 1.9) * (slope > 1 ? 1.3 : 1);
    rocks[beach && !volc ? 2 : rng.int(0, 1)].push({ x, z, y: h - s0 * (slope > 0.9 ? 0.5 : 0.25), s: s0, sy: rng.float(0.7, 1.2), ry: rng.float(0, 6) });
  }
  const rockMat = lambert({ vertexColors: true, flatShading: true }, WARM_RIM);
  const rockGeos = [rockGeometry(3, 0x4a4246, 0x2e282c), rockGeometry(19, 0x5a4a46, 0x3a3034), rockGeometry(29, 0xd9c7a6, 0xa89478)];
  rocks.forEach((list, i) => {
    const m = new THREE.InstancedMesh(rockGeos[i], rockMat, list.length);
    m.receiveShadow = true;
    place(m, list);
    for (const t of list) if (t.s > 0.9 && Math.hypot(t.x, t.z) < WORLD_RADIUS + 3) { const c = collision.addCircle(t.x, t.z, t.s * 0.85, 'rock'); c.top = t.y + t.s * t.sy * 0.7; }
    ctx.shadowCasters.add(m);
  });

  // ---- Coral: bright under the lagoon water and along the shallow shelf.
  const CORAL_COLORS = [0xff6fa5, 0xff8a3d, 0xb97aff, 0xffd23d, 0x4fe0c4];
  const coral = CORAL_COLORS.map(() => []);
  for (let k = 0; k < 6000 && coral.flat().length < 220; k++) {
    const lagoon = rng.chance(0.7);
    const a = rng.float(0, Math.PI * 2);
    const r = lagoon ? rng.float(2, LOC.lagoon.r) : rng.float(60, 190);
    const x = lagoon ? LOC.lagoon.x + Math.cos(a) * r : Math.cos(a) * r, z = lagoon ? LOC.lagoon.z + Math.sin(a) * r : Math.sin(a) * r;
    const h = terrain.heightAt(x, z);
    if (h > -0.6 || h < -3.5) continue;
    coral[rng.int(0, CORAL_COLORS.length - 1)].push({ x, z, y: h - 0.1, s: rng.float(0.6, 1.3), ry: rng.float(0, 6) });
  }
  const coralMat = lambert({ vertexColors: true, emissive: 0x221018 }, false);
  coral.forEach((list, i) => place(new THREE.InstancedMesh(coralGeometry(i + 1, CORAL_COLORS[i]), coralMat, list.length), list));
  return { palms, trees, rocks };
}
