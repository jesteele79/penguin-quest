import * as THREE from 'three';
import { mergeColored, mat, jitter } from '../core/geo.js';
import { lambert, crystalMaterial } from '../core/materials.js';
import { Rng } from '../core/rng.js';
import { createNoise2D, makeFbm } from '../core/noise.js';
import { smoothstep } from '../core/mathutil.js';
import {
  LOC, WORLD_RADIUS, CRYSTALS, SNOWFLAKES, CHESTS, GLOOM_SPOTS, SURVEY, BEACONS, BEDS, SEEDS, CHICK_SPOTS,
  NURSERY, PATROL_BOARD, CAULDRON, FESTIVAL, SLALOM, TREASURE_CLUES, gridToWorld,
} from './layout.js';

const fbm = makeFbm(createNoise2D(777));

export const CRYSTAL_COLORS = {
  green: 0x4dffa0,
  cyan: 0x45e2ff,
  violet: 0xb07bff,
  pink: 0xff78d2,
  gloom: 0x6a4ab8,
};

function pineGeometry(slim) {
  const green = slim ? 0x23586a : 0x1c4b58;
  const tiers = slim
    ? [[1.1, 1.35, 2.3], [2.3, 1.05, 2.1], [3.4, 0.78, 1.9], [4.4, 0.5, 1.6]]
    : [[1.0, 1.75, 2.3], [2.2, 1.35, 2.0], [3.2, 0.98, 1.8], [4.1, 0.62, 1.5]];
  const parts = [{ geo: new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6), color: 0x4a3328, matrix: mat(0, 0.75, 0) }];
  tiers.forEach(([y, r, h], i) => {
    parts.push({ geo: new THREE.ConeGeometry(r, h, 9, 1), color: green, matrix: mat(0, y + h / 2, 0, 0, i * 0.4, 0) });
    parts.push({ geo: new THREE.ConeGeometry(r * 0.82, h * 0.52, 9, 1), color: 0xeef5ff, matrix: mat(0, y + h * 0.76, 0, 0, i * 0.4 + 0.35, 0) });
  });
  return mergeColored(parts);
}

function deadTreeGeometry() {
  const c = 0x3a3150;
  return mergeColored([
    { geo: new THREE.CylinderGeometry(0.12, 0.3, 4, 5), color: c, matrix: mat(0, 2, 0) },
    { geo: new THREE.CylinderGeometry(0.05, 0.12, 1.8, 4), color: c, matrix: mat(0.5, 3.0, 0, 0, 0, -0.9) },
    { geo: new THREE.CylinderGeometry(0.05, 0.1, 1.4, 4), color: c, matrix: mat(-0.4, 2.4, 0.2, 0.3, 0, 0.9) },
    { geo: new THREE.CylinderGeometry(0.04, 0.09, 1.2, 4), color: c, matrix: mat(0.1, 3.6, -0.35, -0.8, 0, 0.2) },
  ]);
}

function rockGeometry(seed) {
  let g = new THREE.IcosahedronGeometry(1, 1);
  jitter(g, 0.38, seed);
  g.scale(1, 0.72, 1);
  g = g.index ? g.toNonIndexed() : g;
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const snow = new THREE.Color(0xeef4ff), rock = new THREE.Color(0x6a78ad), rockD = new THREE.Color(0x4d5889);
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
    const cc = n.y > 0.5 ? snow : n.y > 0.0 ? rock : rockD;
    for (let k = 0; k < 3; k++) col.set([cc.r, cc.g, cc.b], (i + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export function clusterGeometry(seed, big = false) {
  const rng = new Rng(seed);
  const geos = [];
  const n = big ? 8 : rng.int(5, 7);
  for (let i = 0; i < n; i++) {
    const main = i === 0;
    const h = (main ? rng.float(1.9, 2.4) : rng.float(0.8, 1.6)) * (big ? 1.5 : 1);
    const r = (main ? 0.34 : rng.float(0.15, 0.27)) * (big ? 1.4 : 1);
    const a = rng.float(0, Math.PI * 2);
    const d = main ? 0 : rng.float(0.25, 0.6) * (big ? 1.5 : 1);
    const tilt = main ? rng.float(0, 0.15) : rng.float(0.25, 0.6);
    const m = mat(Math.cos(a) * d, -0.1, Math.sin(a) * d, Math.sin(a) * tilt, rng.float(0, 3), -Math.cos(a) * tilt);
    const body = new THREE.CylinderGeometry(r, r * 0.8, h * 0.72, 6, 1);
    body.translate(0, h * 0.36, 0);
    const tip = new THREE.ConeGeometry(r, h * 0.28, 6, 1);
    tip.translate(0, h * 0.86, 0);
    geos.push({ geo: body, matrix: m, color: 0xffffff }, { geo: tip, matrix: m, color: 0xffffff });
  }
  const g = mergeColored(geos);
  const pos = g.attributes.position, col = g.attributes.color;
  const top = big ? 3.6 : 2.4;
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp(pos.getY(i) / top, 0, 1);
    const v = 0.3 + 0.7 * t;
    col.setXYZ(i, v, v, Math.min(1, v * 1.05));
  }
  return g;
}

// Keep-clear zones for trees (key areas and paths).
const CLEAR = [
  { x: LOC.home.x, z: LOC.home.z, r: 30 },
  { x: LOC.grove.x, z: LOC.grove.z, r: 18 },
  { x: LOC.huts.x, z: LOC.huts.z, r: 26 },
  { x: 100, z: 119, r: 19 },
  { x: LOC.spire.x, z: LOC.spire.z, r: 18 },
  { x: -52, z: -4, r: 12 },
  { x: 0, z: 58, r: 9 },
  { x: LOC.skipper.x, z: LOC.skipper.z, r: 8 },
];

for (const [x, z] of [...SNOWFLAKES, ...CHESTS, ...SEEDS, ...CHICK_SPOTS]) CLEAR.push({ x, z, r: 4 });
for (const [x, z] of [...SURVEY, ...BEACONS, ...BEDS]) CLEAR.push({ x, z, r: 6 });
for (const g of GLOOM_SPOTS) CLEAR.push({ x: g.x, z: g.z, r: 7 });
for (const p of [NURSERY, PATROL_BOARD, CAULDRON, LOC.purl, LOC.nestle]) CLEAR.push({ x: p.x, z: p.z, r: 5 });
CLEAR.push({ x: FESTIVAL.x, z: FESTIVAL.z, r: 14 });
for (const t of TREASURE_CLUES) { const w = gridToWorld(t.gx, t.gy); CLEAR.push({ x: w.x, z: w.z, r: 6 }); }
// Keep the sled slalom lane free of trees.
for (let k = 0; k <= 60; k += 4) {
  const dx = SLALOM.toward.x - SLALOM.top.x, dz = SLALOM.toward.z - SLALOM.top.z, l = Math.hypot(dx, dz);
  CLEAR.push({ x: SLALOM.top.x + (dx / l) * k, z: SLALOM.top.z + (dz / l) * k, r: 9 });
}

function isClear(x, z) {
  for (const c of CLEAR) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return false;
  return true;
}

function onRidge(x, z) {
  const R = LOC.ridge;
  return Math.hypot((x - R.x) / (R.rx + 4), (z - R.z) / (R.rz + 4)) < 1;
}

export function buildNature(ctx) {
  const { scene, terrain, collision, glow } = ctx;
  const rng = new Rng(2024);

  // ---- Trees ----
  const pines = [[], []];
  const spacing = new Map();
  const cellKey = (x, z) => `${Math.floor(x / 3.4)},${Math.floor(z / 3.4)}`;
  const tooClose = (x, z) => {
    const i = Math.floor(x / 3.4), j = Math.floor(z / 3.4);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const list = spacing.get(`${i + a},${j + b}`);
      if (list) for (const p of list) if ((p.x - x) ** 2 + (p.z - z) ** 2 < 3.3 ** 2) return true;
    }
    return false;
  };
  const deadTrees = [];
  for (let attempt = 0; attempt < 16000 && pines[0].length + pines[1].length < 720; attempt++) {
    const x = rng.float(-205, 205), z = rng.float(-205, 205);
    const r = Math.hypot(x, z);
    if (r > 205) continue;
    const h = terrain.heightAt(x, z);
    if (h < 1.1) continue;
    const slope = terrain.slopeAt(x, z);
    if (slope > (r > WORLD_RADIUS ? 1.6 : 1.0)) continue;
    if (!isClear(x, z)) continue;
    if (terrain.roadDistanceAt(x, z) < 4.5) continue;
    if (onRidge(x, z)) {
      if (rng.chance(0.03) && deadTrees.length < 26) deadTrees.push({ x, z, y: h, s: rng.float(0.8, 1.3), ry: rng.float(0, 6) });
      continue;
    }
    let density = 0.18 + 0.82 * smoothstep(-0.05, 0.4, fbm(x * 0.017, z * 0.017, 3));
    const dg = Math.hypot(x - LOC.grove.x, z - LOC.grove.z);
    if (dg > 18 && dg < 42) density = Math.max(density, 0.9);
    if (r > 150) density = Math.max(density, 0.75);
    if (rng.next() > density * 0.5) continue;
    if (tooClose(x, z)) continue;
    const key = cellKey(x, z);
    if (!spacing.has(key)) spacing.set(key, []);
    spacing.get(key).push({ x, z });
    const s = rng.float(0.8, 1.7) * (r > 150 ? 1.2 : 1);
    pines[rng.chance(0.4) ? 1 : 0].push({ x, z, y: h - 0.2, s, ry: rng.float(0, Math.PI * 2) });
  }

  const treeMat = lambert({ vertexColors: true }, { strength: 0.25, power: 3 });
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const placeInstances = (mesh, list, withColliders, colR = 0.55) => {
    list.forEach((t, i) => {
      e.set(0, t.ry, 0); q.setFromEuler(e);
      v.set(t.x, t.y, t.z); sc.set(t.s, t.s * (t.sy ?? 1), t.s);
      m4.compose(v, q, sc);
      mesh.setMatrixAt(i, m4);
      if (withColliders && Math.hypot(t.x, t.z) < WORLD_RADIUS + 4) collision.addCircle(t.x, t.z, colR * t.s, 'tree');
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  };
  pines.forEach((list, k) => {
    const mesh = new THREE.InstancedMesh(pineGeometry(k === 1), treeMat, list.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    placeInstances(mesh, list, true);
    scene.add(mesh);
  });
  if (deadTrees.length) {
    const dm = new THREE.InstancedMesh(deadTreeGeometry(), lambert({ vertexColors: true }, { color: 0x9a6bff, strength: 0.5 }), deadTrees.length);
    dm.castShadow = true;
    placeInstances(dm, deadTrees, true, 0.4);
    scene.add(dm);
    ctx.deadTrees = dm;
  }

  // ---- Rocks ----
  const rockGeos = [rockGeometry(3), rockGeometry(11), rockGeometry(29)];
  const rockLists = [[], [], []];
  for (let attempt = 0; attempt < 5000 && rockLists.flat().length < 230; attempt++) {
    const x = rng.float(-200, 200), z = rng.float(-200, 200);
    const r = Math.hypot(x, z);
    if (r > 200) continue;
    const h = terrain.heightAt(x, z);
    if (h < -0.5) continue;
    if (!isClear(x, z) || terrain.roadDistanceAt(x, z) < 3) continue;
    const slope = terrain.slopeAt(x, z);
    const wantsRock = (slope > 0.5 && r < 170) || (r > 160 && rng.chance(0.3)) || rng.chance(0.25);
    if (!wantsRock) continue;
    const s = rng.float(0.5, 2.0) * (r > 165 ? 1.6 : 1) * (slope > 1 ? 1.3 : 1);
    rockLists[rng.int(0, 2)].push({ x, z, y: h - s * (slope > 0.9 ? 0.55 : 0.25), s, sy: rng.float(0.7, 1.2), ry: rng.float(0, 6) });
  }
  const rockMat = lambert({ vertexColors: true, flatShading: true }, { strength: 0.3 });
  rockLists.forEach((list, k) => {
    const mesh = new THREE.InstancedMesh(rockGeos[k], rockMat, list.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    list.forEach((t, i) => {
      e.set(0, t.ry, 0); q.setFromEuler(e);
      v.set(t.x, t.y, t.z); sc.set(t.s, t.s * t.sy, t.s);
      m4.compose(v, q, sc);
      mesh.setMatrixAt(i, m4);
      if (t.s > 0.9 && Math.hypot(t.x, t.z) < WORLD_RADIUS + 3) {
        const c = collision.addCircle(t.x, t.z, t.s * 0.85, 'rock');
        c.top = t.y + t.s * t.sy * 0.7;
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  });

  // ---- Crystal clusters ----
  const clusters = { green: [], cyan: [], violet: [], pink: [], gloom: [] };
  const addCluster = (kind, x, z, s, yOff = 0) => {
    const y = terrain.heightAt(x, z) + yOff;
    clusters[kind].push({ x, z, y: y - 0.15, s, ry: rng.float(0, 6) });
    if (Math.hypot(x, z) < WORLD_RADIUS) collision.addCircle(x, z, 0.7 * s, 'crystal');
    const glowCol = kind === 'gloom' ? 0x7a4ad8 : CRYSTAL_COLORS[kind];
    glow.add(x, y + 1.2 * s, z, glowCol, 6 * s, kind === 'gloom' ? 0.5 : 0.85);
  };
  const ring = (kind, cx, cz, r0, r1, count, s0, s1) => {
    let placed = 0;
    for (let a = 0; a < 200 && placed < count; a++) {
      const ang = rng.float(0, Math.PI * 2), d = rng.float(r0, r1);
      const x = cx + Math.cos(ang) * d, z = cz + Math.sin(ang) * d;
      if (terrain.roadDistanceAt(x, z) < 3) continue;
      const h = terrain.heightAt(x, z);
      if (h < 0.2) continue;
      addCluster(kind, x, z, rng.float(s0, s1));
      placed++;
    }
  };
  // Lake shore: in the image the glowing crystals sit right at the water's edge.
  for (let k = 0; k < 14; k++) {
    const ang = (k / 14) * Math.PI * 2 + rng.float(-0.2, 0.2);
    let x = 0, z = 0;
    for (let d = 40; d < 95; d += 0.5) {
      x = Math.cos(ang) * d; z = Math.sin(ang) * d;
      if (terrain.heightAt(x, z) > 0.35) break;
    }
    if (terrain.roadDistanceAt(x, z) < 3 || Math.hypot(x - LOC.launch.x0, z - 56) < 8 || Math.hypot(x + 52, z + 4) < 10) continue;
    addCluster(k % 3 === 0 ? 'cyan' : 'green', x, z, rng.float(0.9, 1.5));
  }
  ring('green', LOC.grove.x, LOC.grove.z, 9, 17, 8, 0.9, 1.6);
  ring('cyan', LOC.grove.x, LOC.grove.z, 12, 22, 8, 0.8, 1.4);
  ring('violet', 104, 124, 4, 11, 9, 0.8, 1.6);
  ring('pink', LOC.huts.x, LOC.huts.z, 24, 30, 5, 0.7, 1.1);
  ring('gloom', LOC.ridge.x, LOC.ridge.z, 12, 30, 10, 0.8, 1.5);
  ring('violet', LOC.spire.x, LOC.spire.z, 10, 16, 10, 0.9, 1.7);
  for (let k = 0; k < 26; k++) {
    const x = rng.float(-165, 165), z = rng.float(-165, 165);
    if (Math.hypot(x, z) > 170 || terrain.heightAt(x, z) < 1 || !isClear(x, z) || terrain.roadDistanceAt(x, z) < 4 || onRidge(x, z)) continue;
    addCluster(rng.pick(['green', 'cyan', 'violet', 'pink']), x, z, rng.float(0.7, 1.3));
  }
  const clusterGeo = clusterGeometry(5);
  ctx.crystalMeshes = {};
  for (const [kind, list] of Object.entries(clusters)) {
    if (!list.length) continue;
    const mesh = new THREE.InstancedMesh(clusterGeo, crystalMaterial(CRYSTAL_COLORS[kind], kind === 'gloom' ? 0.35 : 0.7), list.length);
    mesh.castShadow = true;
    placeInstances(mesh, list, false);
    scene.add(mesh);
    ctx.crystalMeshes[kind] = mesh;
  }
  return { pines, rocks: rockLists, clusters };
}

export { CRYSTALS };
