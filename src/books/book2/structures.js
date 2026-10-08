// Ember Isles buildings and props: the Arrival Beach camp, two piers, the harbor town, Rocco's Lava Forge,
// Keeper Lumi's lighthouse, the Sunken Temple, Isa's reef station and Cinder's hidden camp with his airship.
import * as THREE from 'three';
import { lambert } from '../../core/materials.js';
import { mat } from '../../core/geo.js';
import { signTexture, awningTexture } from '../../core/textures.js';
import { PropBatch, addLantern, buildPier, addCrate, addBarrel, addSignpost, worldMat, shadowed, faceYaw, toWorld } from '../../world/structures.js';
import { LOC, WATER_Y, PATROL_BOARD, CAULDRON } from './layout.js';

const NO_CAP = null;
const WOOD = 0x8a5c38, WOOD_D = 0x5e3a22, THATCH = 0xd9b26a, THATCH_D = 0xb58d4c, STONE = 0x8c8478, STONE_D = 0x6a645c, CANVAS = 0xf2e6c8;

function ground(ctx, x, z) { return ctx.terrain.heightAt(x, z); }

// A tiki torch: a pole with a little fire on top, lighting the ground around it.
export function addTorch(ctx, x, z, h = 2.4) {
  const y = ground(ctx, x, z);
  ctx.batch.add(new THREE.CylinderGeometry(0.09, 0.12, h, 6), 0x6b4428, mat(x, y + h / 2, z));
  ctx.batch.add(new THREE.CylinderGeometry(0.22, 0.14, 0.4, 6), 0x3a2a20, mat(x, y + h + 0.1, z));
  ctx.torchFlames.push(new THREE.Vector3(x, y + h + 0.45, z));
  ctx.glow.add(x, y + h + 0.5, z, 0xffa040, 2.0, 0.5);
  ctx.lanterns.push({ x, y: y + h + 0.6, z, intensity: 32 });
  ctx.terrainMesh.userData.addWarmth(x, z, 7, 0.8);
  ctx.collision.addCircle(x, z, 0.3, 'torch');
}

// A hut on stilts with a palm-thatch roof. Faces +z in local space.
function stiltHut(ctx, x, z, yaw, { w = 4.2, d = 3.6, stilt = 1.0, color = 0xe8d2a8 } = {}) {
  const y = ground(ctx, x, z);
  const b = ctx.batch;
  const floorY = y + stilt;
  for (const [lx, lz] of [[-w / 2 + 0.2, -d / 2 + 0.2], [w / 2 - 0.2, -d / 2 + 0.2], [-w / 2 + 0.2, d / 2 - 0.2], [w / 2 - 0.2, d / 2 - 0.2]]) {
    b.add(new THREE.CylinderGeometry(0.14, 0.16, stilt + 0.6, 6), WOOD_D, worldMat(x, y - 0.3, z, yaw, lx, (stilt + 0.6) / 2, lz));
  }
  b.add(new THREE.BoxGeometry(w + 0.6, 0.2, d + 1.4), WOOD, worldMat(x, floorY, z, yaw, 0, 0.1, 0.4));
  b.add(new THREE.BoxGeometry(w, 2.1, d), color, worldMat(x, floorY, z, yaw, 0, 1.25, 0));
  b.add(new THREE.BoxGeometry(1.0, 1.5, 0.08), WOOD_D, worldMat(x, floorY, z, yaw, 0, 0.95, d / 2 + 0.02));
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.7, 0.6, 0.08), 0x6fc6d8, worldMat(x, floorY, z, yaw, s * w * 0.3, 1.45, d / 2 + 0.02));
  const roof = new THREE.ConeGeometry(Math.hypot(w, d) * 0.62, 1.9, 4, 1);
  b.add(roof, THATCH, worldMat(x, floorY, z, yaw, 0, 3.25, 0, 0, Math.PI / 4, 0));
  b.add(new THREE.ConeGeometry(Math.hypot(w, d) * 0.64, 0.25, 4, 1, true), THATCH_D, worldMat(x, floorY, z, yaw, 0, 2.38, 0, 0, Math.PI / 4, 0));
  const c = ctx.collision.addCircle(x, z, Math.max(w, d) * 0.55, 'hut');
  c.top = floorY + 2.3;
}

// A market stall: four posts, a counter and a striped awning.
function stall(ctx, x, z, yaw, label, stripe = 0xff6a4a) {
  const y = ground(ctx, x, z);
  const b = ctx.batch;
  for (const [lx, lz] of [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]]) b.add(new THREE.CylinderGeometry(0.08, 0.09, 2.6, 6), WOOD_D, worldMat(x, y, z, yaw, lx, 1.3, lz));
  b.add(new THREE.BoxGeometry(3.0, 1.0, 0.8), WOOD, worldMat(x, y, z, yaw, 0, 0.5, 0.75));
  b.add(new THREE.BoxGeometry(3.2, 0.12, 1.0), 0xf0e0c0, worldMat(x, y, z, yaw, 0, 1.06, 0.75));
  const aw = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 2.4), lambert({ map: awningTexture(), color: stripe }, { strength: 0.1 }));
  aw.position.set(x, y + 2.7, z);
  aw.rotation.set(0.18, yaw, 0, 'YXZ');
  shadowed(aw);
  ctx.scene.add(aw);
  if (label) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), lambert({ map: signTexture([label]) }, false));
    const p = toWorld(x, z, yaw, 0, 1.2);
    sign.position.set(p.x, y + 2.25, p.z);
    sign.rotation.y = yaw;
    ctx.scene.add(sign);
  }
  ctx.collision.addCircle(x, z, 1.5, 'stall');
}

function boat(ctx, x, z, yaw, color = 0xe8604a) {
  const b = ctx.batch;
  const y = WATER_Y + 0.15;
  b.add(new THREE.CylinderGeometry(0.9, 0.55, 4.2, 8, 1, false, 0, Math.PI), color, worldMat(x, y, z, yaw, 0, 0.1, 0, Math.PI / 2, 0, Math.PI));
  b.add(new THREE.BoxGeometry(1.6, 0.1, 3.6), WOOD, worldMat(x, y, z, yaw, 0, 0.12, 0));
  b.add(new THREE.CylinderGeometry(0.06, 0.07, 3.6, 5), WOOD_D, worldMat(x, y, z, yaw, 0, 1.9, 0.3));
  b.add(new THREE.ConeGeometry(1.0, 2.6, 3, 1), 0xf8f0dc, worldMat(x, y, z, yaw, 0.45, 2.2, 0.3, 0, Math.PI / 2, 0, 0.25, 1, 1));
}

function buildCamp(ctx) {
  const { scene, batch } = ctx;
  const C = LOC.camp;
  const y = ground(ctx, C.x, C.z);
  const yaw = faceYaw(C.x, C.z, LOC.start.x, LOC.start.z);
  // The Professor's tent: canvas over a ridge pole, with an orange stripe.
  const tent = new THREE.Group();
  const canvas = lambert({ color: CANVAS }, { strength: 0.15 });
  const tri = new THREE.Shape();
  tri.moveTo(-1.95, 0); tri.lineTo(1.95, 0); tri.lineTo(0, 2.55); tri.closePath();
  const tentGeo = new THREE.ExtrudeGeometry(tri, { depth: 4.2, bevelEnabled: false });
  tentGeo.translate(0, 0, -2.1);
  tent.add(shadowed(new THREE.Mesh(tentGeo, canvas)));
  const door = new THREE.Shape();
  door.moveTo(-0.7, 0); door.lineTo(0.7, 0); door.lineTo(0, 1.5); door.closePath();
  const doorMesh = new THREE.Mesh(new THREE.ShapeGeometry(door), lambert({ color: 0x5a3a28 }, false));
  doorMesh.position.set(0, 0.01, 2.12);
  tent.add(doorMesh);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 4.3), lambert({ color: 0xff8a3d }));
  stripe.position.set(0, 2.5, 0);
  tent.add(stripe);
  tent.position.set(C.x, y, C.z);
  tent.rotation.y = yaw;
  scene.add(tent);
  ctx.collision.addCircle(C.x, C.z, 2.4, 'tent');
  // Radio mast with a blinking light: the Professor's line home.
  const m = toWorld(C.x, C.z, yaw, 3.2, -1.2);
  batch.add(new THREE.CylinderGeometry(0.06, 0.1, 6.5, 6), 0x9aa2b0, mat(m.x, y + 3.25, m.z));
  batch.add(new THREE.BoxGeometry(1.2, 0.08, 0.08), 0x9aa2b0, mat(m.x, y + 5.8, m.z, 0, yaw, 0));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3a3a }));
  lamp.position.set(m.x, y + 6.6, m.z);
  scene.add(lamp);
  ctx.animated.push((dt, t) => { lamp.visible = Math.sin(t * 3) > 0.2; });
  ctx.collision.addCircle(m.x, m.z, 0.3, 'mast');
  // Campfire ring with logs to sit on.
  const f = toWorld(C.x, C.z, yaw, 0, 5.5);
  const fy = ground(ctx, f.x, f.z);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; batch.add(new THREE.DodecahedronGeometry(0.32, 0), 0x4a4246, mat(f.x + Math.cos(a) * 1.1, fy + 0.15, f.z + Math.sin(a) * 1.1, a, a, 0)); }
  batch.add(new THREE.CylinderGeometry(0.16, 0.18, 1.8, 7), 0x5a3520, mat(f.x, fy + 0.25, f.z, 0, 0.5, Math.PI / 2));
  batch.add(new THREE.CylinderGeometry(0.16, 0.18, 1.8, 7), 0x5a3520, mat(f.x, fy + 0.35, f.z, 0, -0.9, Math.PI / 2));
  ctx.torchFlames.push(new THREE.Vector3(f.x, fy + 0.55, f.z), new THREE.Vector3(f.x + 0.18, fy + 0.5, f.z - 0.1));
  ctx.glow.add(f.x, fy + 1.0, f.z, 0xff9a40, 4.5, 0.7);
  ctx.lanterns.push({ x: f.x, y: fy + 1.6, z: f.z, intensity: 55 });
  ctx.terrainMesh.userData.addWarmth(f.x, f.z, 11, 1.0);
  ctx.collision.addCircle(f.x, f.z, 1.4, 'campfire');
  for (const [lx, lz, r] of [[-3, 0.6, 0.3], [2.8, 1.6, -0.6]]) {
    const p = toWorld(f.x, f.z, yaw, lx, lz);
    batch.add(new THREE.CylinderGeometry(0.28, 0.3, 2.6, 8), 0x7a5232, mat(p.x, ground(ctx, p.x, p.z) + 0.28, p.z, 0, yaw + r, Math.PI / 2));
  }
  for (const [lx, lz] of [[-5, 3], [5, 3], [-6, -3], [6, -3]]) { const p = toWorld(C.x, C.z, yaw, lx, lz + 4); addTorch(ctx, p.x, p.z); }
  // The kids' sandcastle.
  const k = LOC.kids;
  const ky = ground(ctx, k.x + 2, k.z - 3);
  batch.add(new THREE.CylinderGeometry(1.2, 1.4, 0.8, 8), 0xe6cf94, mat(k.x + 2, ky + 0.4, k.z - 3));
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; batch.add(new THREE.CylinderGeometry(0.32, 0.36, 1.3, 8), 0xe6cf94, mat(k.x + 2 + Math.cos(a) * 1.05, ky + 0.65, k.z - 3 + Math.sin(a) * 1.05)); }
  batch.add(new THREE.ConeGeometry(0.5, 0.9, 8), 0xe6cf94, mat(k.x + 2, ky + 1.25, k.z - 3));
  batch.add(new THREE.BoxGeometry(0.4, 0.25, 0.02), 0xff4f6b, mat(k.x + 2.18, ky + 1.95, k.z - 3));
  batch.add(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 4), 0x3a2a20, mat(k.x + 2, ky + 1.8, k.z - 3));
}

function buildHarbor(ctx) {
  const H = LOC.harbor;
  stiltHut(ctx, H.x - 12, H.z + 12, faceYaw(H.x - 12, H.z + 12, H.x, H.z), { color: 0xf4d9b0 });
  stiltHut(ctx, H.x + 6, H.z + 16, faceYaw(H.x + 6, H.z + 16, H.x, H.z), { color: 0xc9e8e0 });
  stiltHut(ctx, H.x - 4, H.z - 14, faceYaw(H.x - 4, H.z - 14, H.x, H.z), { color: 0xf8c8b8 });
  stall(ctx, LOC.counter.x, LOC.counter.z, faceYaw(LOC.counter.x, LOC.counter.z, H.x - 8, H.z + 2), "Chef Marlo's", 0xff6a4a);
  stall(ctx, LOC.shelldon.x + 2, LOC.shelldon.z + 2, faceYaw(LOC.shelldon.x, LOC.shelldon.z, H.x, H.z), 'Shells & Trades', 0x3fb8e0);
  // Marlo's big cooking pot.
  const p = CAULDRON;
  const py = ground(ctx, p.x, p.z);
  ctx.batch.add(new THREE.CylinderGeometry(1.1, 0.85, 1.2, 14), 0x3a3436, mat(p.x, py + 0.75, p.z));
  ctx.batch.add(new THREE.TorusGeometry(1.1, 0.08, 6, 16), 0x5a5054, mat(p.x, py + 1.35, p.z, Math.PI / 2));
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; ctx.batch.add(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 5), 0x2a2224, mat(p.x + Math.cos(a) * 0.9, py + 0.4, p.z + Math.sin(a) * 0.9, Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2)); }
  ctx.torchFlames.push(new THREE.Vector3(p.x, py + 0.2, p.z));
  ctx.glow.add(p.x, py + 0.3, p.z, 0xff8a3a, 2.4, 0.5);
  ctx.collision.addCircle(p.x, p.z, 1.3, 'pot');
  for (const [dx, dz] of [[-6, 4], [-8, 6], [9, -6]]) addCrate(ctx, H.x + dx, H.z + dz, dx * 0.1, 1, 0, NO_CAP);
  for (const [dx, dz] of [[-7, 2], [10, -3], [11, -5]]) addBarrel(ctx, H.x + dx, H.z + dz, NO_CAP);
  for (const [dx, dz] of [[-10, -4], [4, 6], [14, 8], [-2, 20]]) addTorch(ctx, H.x + dx, H.z + dz);
  ctx.dock = buildPier(ctx, { x: LOC.dock.x1, z: LOC.dock.z, dirX: -1, dirZ: 0, w: LOC.dock.w, top: LOC.dock.top, cap: NO_CAP });
  boat(ctx, LOC.dock.x1 - 5, LOC.dock.z + 4.5, 0.1, 0xe8604a);
  boat(ctx, LOC.dock.x1 - 11, LOC.dock.z - 4.8, -0.2, 0x3a8ad8);
}

function buildForge(ctx) {
  const F = LOC.forge;
  const y = ground(ctx, F.x, F.z);
  const yaw = faceYaw(F.x, F.z, LOC.rocco.x, LOC.rocco.z + 6);
  const b = ctx.batch;
  b.add(new THREE.BoxGeometry(7, 3.4, 5), STONE_D, worldMat(F.x, y, F.z, yaw, 0, 1.7, -1.5));
  b.add(new THREE.BoxGeometry(7.4, 0.4, 5.4), 0x4a4044, worldMat(F.x, y, F.z, yaw, 0, 3.55, -1.5));
  b.add(new THREE.CylinderGeometry(0.9, 1.2, 6.5, 8), STONE, worldMat(F.x, y, F.z, yaw, 2.2, 6.4, -2.6));
  b.add(new THREE.BoxGeometry(1.6, 1.4, 0.3), 0x2a1a14, worldMat(F.x, y, F.z, yaw, -1.2, 1.1, 1.05));
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
  const mp = toWorld(F.x, F.z, yaw, -1.2, 1.22);
  mouth.position.set(mp.x, y + 1.05, mp.z);
  mouth.rotation.y = yaw;
  ctx.scene.add(mouth);
  ctx.glow.add(mp.x, y + 1.2, mp.z, 0xff7a2a, 4.5, 0.8);
  ctx.lanterns.push({ x: mp.x, y: y + 1.6, z: mp.z, intensity: 50 });
  ctx.terrainMesh.userData.addWarmth(mp.x, mp.z, 8, 1);
  // Anvil and glass rods cooling on a rack.
  const a = toWorld(F.x, F.z, yaw, 2.2, 3);
  b.add(new THREE.BoxGeometry(0.7, 0.7, 0.5), 0x3a3a40, mat(a.x, y + 0.35, a.z, 0, yaw, 0));
  b.add(new THREE.BoxGeometry(1.3, 0.35, 0.6), 0x4a4a52, mat(a.x, y + 0.85, a.z, 0, yaw, 0));
  ctx.collision.addCircle(a.x, a.z, 0.8, 'anvil');
  const c = ctx.collision.addCircle(F.x, F.z, 3.6, 'forge');
  c.top = y + 3.7;
  ctx.forgeSmoke = toWorld(F.x, F.z, yaw, 2.2, -2.6);
  ctx.forgeSmoke.y = y + 9.8;
  for (const [lx, lz] of [[-4.5, 3], [4.5, 3]]) { const p = toWorld(F.x, F.z, yaw, lx, lz); addTorch(ctx, p.x, p.z); }
}

function buildLighthouse(ctx) {
  const L = LOC.lighthouse;
  const y = ground(ctx, L.x, L.z);
  const b = ctx.batch;
  b.add(new THREE.CylinderGeometry(2.6, 3.0, 1.2, 12), STONE, mat(L.x, y + 0.6, L.z));
  for (let i = 0; i < 5; i++) b.add(new THREE.CylinderGeometry(1.95 - i * 0.14, 2.1 - i * 0.14, 2.6, 14), i % 2 ? 0xe2433f : 0xf6f0e6, mat(L.x, y + 1.2 + 1.3 + i * 2.6, L.z));
  const top = y + 1.2 + 13;
  b.add(new THREE.CylinderGeometry(2.2, 2.2, 0.3, 14), 0x3a3a44, mat(L.x, top + 0.15, L.z));
  b.add(new THREE.ConeGeometry(1.6, 1.4, 14), 0xe2433f, mat(L.x, top + 3.0, L.z));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1.9, 12), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
  glass.position.set(L.x, top + 1.25, L.z);
  ctx.scene.add(glass);
  ctx.lighthouseLamp = ctx.glow.add(L.x, top + 1.3, L.z, 0xffe0a0, 12, 0.6);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(5, 60, 16, 1, true), beamMat);
  beam.geometry.translate(0, -30, 0);
  beam.geometry.rotateZ(Math.PI / 2);
  const pivot = new THREE.Group();
  pivot.position.set(L.x, top + 1.3, L.z);
  pivot.add(beam);
  ctx.scene.add(pivot);
  ctx.lighthouse = { pivot, beamMat, on: false, setOn(v) { this.on = v; beam.visible = v; } };
  ctx.lighthouse.setOn(false);
  ctx.animated.push((dt, t) => { pivot.rotation.y = t * 0.6; });
  const c = ctx.collision.addCircle(L.x, L.z, 3.0, 'lighthouse');
  c.top = top + 4;
}

function buildTemple(ctx) {
  const T = LOC.temple;
  const y = ground(ctx, T.x, T.z);
  const b = ctx.batch;
  const tiers = [[13, 1.6], [9.5, 1.6], [6, 1.6]];
  let h = y - 0.4;
  tiers.forEach(([s, th], i) => {
    b.add(new THREE.BoxGeometry(s, th, s), i % 2 ? STONE : 0x9a927e, mat(T.x, h + th / 2, T.z));
    b.add(new THREE.BoxGeometry(s + 0.3, 0.2, s + 0.3), 0x6f8a5a, mat(T.x, h + th, T.z));
    ctx.collision.addPlatform({ kind: 'box', x: T.x, z: T.z, hw: s / 2, hd: s / 2, rot: 0, top: h + th });
    h += th;
  });
  // A staircase up the south face, each step resting on the ground below it.
  for (let k = 0; k < 6; k++) {
    const top = y - 0.4 + (k + 1) * 0.8, sz = T.z + 10 - k * 1.3;
    const bottom = ground(ctx, T.x, sz) - 0.5;
    b.add(new THREE.BoxGeometry(2.6, top - bottom, 1.3), 0xa49c86, mat(T.x, (top + bottom) / 2, sz));
    ctx.collision.addPlatform({ kind: 'box', x: T.x, z: sz, hw: 1.3, hd: 0.65, rot: 0, top });
  }
  // Broken columns standing in the shallows.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const cx = T.x + Math.cos(a) * 21, cz = T.z + Math.sin(a) * 21;
    const cy = Math.min(ground(ctx, cx, cz), WATER_Y) - 0.5;
    const ch = 2.5 + (i % 3) * 1.4;
    b.add(new THREE.CylinderGeometry(0.55, 0.62, ch, 10), 0xb8b09a, mat(cx, cy + ch / 2, cz));
    b.add(new THREE.BoxGeometry(1.5, 0.35, 1.5), 0xa49c86, mat(cx, cy + ch + 0.17, cz));
    ctx.collision.addCircle(cx, cz, 0.7, 'column');
  }
  ctx.templeTop = new THREE.Vector3(T.x, h, T.z);
  ctx.buildPad = { x: T.x + 10, z: T.z - 8, y: ground(ctx, T.x + 10, T.z - 8) + 0.3, yaw: 0, size: 6.4 };
}

function buildStation(ctx) {
  const S = LOC.station;
  stiltHut(ctx, S.x, S.z, faceYaw(S.x, S.z, LOC.isa.x, LOC.isa.z), { stilt: 2.4, color: 0xc8ecf0, w: 4.6, d: 4 });
  ctx.station = buildPier(ctx, { x: S.x + 4, z: S.z, dirX: 1, dirZ: 0, w: 2.6, top: 1.1, cap: NO_CAP });
}

function buildCinderCamp(ctx) {
  const C = LOC.camp2;
  const y = ground(ctx, C.x, C.z);
  const b = ctx.batch;
  // A patched tent, a workbench and a coil of brass pipe.
  b.add(new THREE.ConeGeometry(2.4, 3.0, 6), 0x7a6a58, mat(C.x - 3, y + 1.5, C.z - 2));
  b.add(new THREE.BoxGeometry(2.4, 0.9, 1.0), WOOD, mat(C.x + 2, y + 0.45, C.z + 1, 0, 0.4, 0));
  b.add(new THREE.TorusGeometry(0.8, 0.14, 6, 16), 0xc89a3a, mat(C.x + 3.6, y + 0.3, C.z - 1.5, Math.PI / 2));
  ctx.collision.addCircle(C.x - 3, C.z - 2, 2.2, 'tent');
  ctx.collision.addCircle(C.x + 2, C.z + 1, 1.3, 'bench');
  // The airship: a patched balloon and a little boat hanging under it, tied down with ropes.
  const ship = new THREE.Group();
  const balloon = shadowed(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), lambert({ color: 0xd8b58a }, { color: 0xffd6b8, strength: 0.2 })), true, false);
  balloon.scale.set(7, 3.2, 3.2);
  ship.add(balloon);
  for (const s of [-1, 1]) { const fin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.6), lambert({ color: 0xb04a3a })); fin.position.set(-6.5, 0, s * 1.1); fin.rotation.x = s * 0.6; ship.add(fin); }
  const gondola = shadowed(new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 1.4), lambert({ color: 0x8a5c38 })));
  gondola.position.y = -4.6;
  ship.add(gondola);
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.25), lambert({ color: 0x5a5a64 }));
  prop.position.set(-2, -4.6, 0);
  ship.add(prop);
  ship.position.set(C.x + 4, y + 13, C.z + 6);
  ship.rotation.y = 0.8;
  ctx.scene.add(ship);
  ctx.airship = ship;
  ctx.animated.push((dt, t) => { ship.position.y = y + 13 + Math.sin(t * 0.6) * 0.5; ship.rotation.z = Math.sin(t * 0.4) * 0.04; prop.rotation.x = t * 9; });
  addTorch(ctx, C.x + 4, C.z - 4, 2.0);
}

function buildPatrolBoard(ctx) {
  const { x, z } = PATROL_BOARD;
  const y = ground(ctx, x, z);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.atan2(LOC.start.x - x, LOC.start.z - z);
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3, 6), lambert({ color: 0x7b5236 })); post.position.set(s * 1.3, 1.5, 0); g.add(post); }
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.8, 0.14), lambert({ color: 0x8a5c38 }));
  board.position.y = 2.1;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.55), lambert({ map: signTexture(['Island Patrol']) }, false));
  sign.position.set(0, 3.25, 0.09);
  g.add(board, sign);
  const paper = new THREE.MeshLambertMaterial({ color: 0xfff6e0, emissive: 0x332a10 });
  [-0.85, 0, 0.85].forEach((px, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), paper); p.position.set(px, 2.05 + (i === 1 ? 0.08 : 0), 0.08); p.rotation.z = (i - 1) * 0.08; g.add(p); });
  ctx.scene.add(g);
  ctx.collision.addCircle(x, z, 1.5, 'board');
}

export function buildStructures(ctx) {
  const { scene } = ctx;
  ctx.animated = ctx.animated || [];
  ctx.batch = new PropBatch();
  ctx.lanternGlass = [];
  ctx.torchFlames = [];

  buildCamp(ctx);
  buildHarbor(ctx);
  buildForge(ctx);
  buildLighthouse(ctx);
  buildTemple(ctx);
  buildStation(ctx);
  buildCinderCamp(ctx);
  buildPatrolBoard(ctx);
  ctx.launch = buildPier(ctx, { x: LOC.arrival.x, z: LOC.arrival.z1 + 18, dirX: 0, dirZ: -1, w: LOC.arrival.w, top: LOC.arrival.top, cap: NO_CAP });
  boat(ctx, LOC.arrival.x + 4.5, LOC.arrival.z1 + 14, 0.05, 0x3a8ad8);

  addSignpost(ctx, -12, 84, [{ text: 'Lava Forge', tx: -44, tz: -52 }, { text: 'Sunken Temple', tx: -98, tz: 132 }, { text: 'Harbor Market', tx: 120, tz: 30 }], NO_CAP);
  addSignpost(ctx, -36, 22, [{ text: 'Coral Lagoon', tx: -138, tz: 18 }, { text: 'Lava Forge', tx: -44, tz: -52 }], NO_CAP);
  addSignpost(ctx, 98, 24, [{ text: 'Lighthouse Cliffs', tx: 104, tz: -104 }, { text: 'Arrival Beach', tx: 0, tz: 100 }], NO_CAP);

  // Torch fire: one instanced cone mesh for every flame on the islands, flickering together.
  const flameGeo = new THREE.ConeGeometry(0.2, 0.62, 7);
  flameGeo.translate(0, 0.31, 0);
  const flames = new THREE.InstancedMesh(flameGeo, new THREE.MeshBasicMaterial({ color: 0xffb048, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false }), 96);
  flames.count = 0;
  flames.frustumCulled = false;
  scene.add(flames);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
  ctx.finishBatch = () => {
    flames.count = Math.min(96, ctx.torchFlames.length);
    scene.add(ctx.batch.build(lambert({ vertexColors: true }, { color: 0xffd6b8, power: 2.8, strength: 0.15 })));
  };
  ctx.animated.push((dt, t) => {
    for (let i = 0; i < flames.count; i++) {
      const p = ctx.torchFlames[i];
      const k = 1 + Math.sin(t * (9 + (i % 5) * 2.3) + i) * 0.2 + Math.sin(t * 23 + i * 5) * 0.08;
      e.set(0, t * (1 + (i % 3) * 0.4), 0); q.setFromEuler(e);
      sc.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
      m4.compose(p, q, sc);
      flames.setMatrixAt(i, m4);
    }
    flames.instanceMatrix.needsUpdate = true;
  });
  return ctx;
}
