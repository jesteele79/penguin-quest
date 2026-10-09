// Skyreach buildings and props: Guild Town's round cottages and plaza, the mooring mast with Cinder's airship,
// the Glider Guild's windmills and launch tower, the balloon lift in the Cloud Valleys, the Clockwork
// Observatory, the Crystal Workshop and the Star Guild.
import * as THREE from 'three';
import { lambert } from '../../core/materials.js';
import { mat } from '../../core/geo.js';
import { signTexture, awningTexture, heightBoardTexture, woodTexture } from '../../core/textures.js';
import { PropBatch, buildPier, addSignpost, worldMat, shadowed, faceYaw, toWorld } from '../../world/structures.js';
import { LOC, PATROL_BOARD, NURSERY, ISLANDS, LAMPS, COTTAGES, cottageRadius } from './layout.js';
import { gearGeometry } from './gear.js';

const NO_CAP = null;
const WOOD = 0x8a5c38, WOOD_D = 0x5e3a22, STONE = 0xd8d4e4, STONE_D = 0xa8a2c0, BRASS = 0xc89a3a;
const ROOFS = [0x6a7ad8, 0xe86a8a, 0x4ab8a8, 0xf0a040, 0x9a6ad8, 0x5aa9e6];
const WALLS = [0xfff4e6, 0xf0f4ff, 0xfff0f4, 0xf4fff0];

const ground = (ctx, x, z) => ctx.terrain.heightAt(x, z);

// A street lamp: a slim post with a glowing glass globe.
function lamp(ctx, x, z, h = 3.2) {
  const y = ground(ctx, x, z);
  ctx.batch.add(new THREE.CylinderGeometry(0.08, 0.12, h, 6), 0x3a3a52, mat(x, y + h / 2, z));
  ctx.batch.add(new THREE.SphereGeometry(0.34, 10, 8), 0xfff2c8, mat(x, y + h + 0.2, z));
  ctx.glow.add(x, y + h + 0.2, z, 0xffd9a0, 3.2, 0.7);
  ctx.lanterns.push({ x, y: y + h + 0.3, z, intensity: 30 });
  ctx.terrainMesh.userData.addWarmth(x, z, 6, 0.55);
  ctx.collision.addCircle(x, z, 0.3, 'lamp');
}

// A round sky cottage: a pale drum, a tall cone roof, a round door and two round windows. Faces +z.
function cottage(ctx, x, z, yaw, k, r = 2.6) {
  const y = ground(ctx, x, z);
  const b = ctx.batch;
  const wall = WALLS[k % WALLS.length], roof = ROOFS[k % ROOFS.length];
  b.add(new THREE.CylinderGeometry(r, r * 1.05, 3.2, 18), wall, worldMat(x, y, z, yaw, 0, 1.6, 0));
  b.add(new THREE.CylinderGeometry(r * 1.07, r * 1.07, 0.3, 18), STONE_D, worldMat(x, y, z, yaw, 0, 0.15, 0));
  b.add(new THREE.ConeGeometry(r * 1.32, 3.1, 18), roof, worldMat(x, y, z, yaw, 0, 4.7, 0));
  b.add(new THREE.SphereGeometry(0.22, 8, 6), 0xffd166, worldMat(x, y, z, yaw, 0, 6.35, 0));
  b.add(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 14, 1, false, 0, Math.PI), WOOD_D, worldMat(x, y, z, yaw, 0, 1.15, r - 0.02, Math.PI / 2, 0, -Math.PI / 2));
  b.add(new THREE.BoxGeometry(1.24, 1.15, 0.12), WOOD_D, worldMat(x, y, z, yaw, 0, 0.58, r - 0.02));
  for (const s of [-1, 1]) {
    const a = s * 0.75;
    b.add(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 12), 0xffe9a8, worldMat(x, y, z, yaw, Math.sin(a) * (r - 0.03), 2.2, Math.cos(a) * (r - 0.03), Math.PI / 2, 0, 0));
  }
  ctx.glow.add(...toArr(toWorld(x, z, yaw, 0, r + 0.4), y + 2.2), 0xffd9a0, 2.4, 0.45);
  const c = ctx.collision.addCircle(x, z, r + 0.2, 'cottage');
  c.top = y + 3.3;
}
const toArr = (p, y) => [p.x, y, p.z];

// The Sky Patrol board.
function patrolBoard(ctx) {
  const { x, z } = PATROL_BOARD;
  const y = ground(ctx, x, z);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = faceYaw(x, z, LOC.start.x, LOC.start.z);
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3, 6), lambert({ color: 0x7b5236 })); post.position.set(s * 1.3, 1.5, 0); g.add(post); }
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.8, 0.14), lambert({ color: 0x6a7ab8 }));
  board.position.y = 2.1;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.55), lambert({ map: signTexture(['Sky Patrol']) }, false));
  sign.position.set(0, 3.25, 0.09);
  g.add(board, sign);
  const paper = new THREE.MeshLambertMaterial({ color: 0xfff6e0, emissive: 0x332a10 });
  [-0.85, 0, 0.85].forEach((px, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), paper); p.position.set(px, 2.05 + (i === 1 ? 0.08 : 0), 0.08); p.rotation.z = (i - 1) * 0.08; g.add(p); });
  ctx.scene.add(g);
  ctx.collision.addCircle(x, z, 1.5, 'board');
}

// Nimbus's cloud candy stall.
function stall(ctx) {
  const { x, z } = LOC.counter;
  const y = ground(ctx, x, z);
  const yaw = -Math.PI / 2;
  const b = ctx.batch;
  for (const [lx, lz] of [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]]) b.add(new THREE.CylinderGeometry(0.08, 0.09, 2.6, 6), 0xf0f0ff, worldMat(x, y, z, yaw, lx, 1.3, lz));
  b.add(new THREE.BoxGeometry(3.0, 1.0, 0.8), 0xb8c8f0, worldMat(x, y, z, yaw, 0, 0.5, 0.75));
  b.add(new THREE.BoxGeometry(3.2, 0.12, 1.0), 0xffffff, worldMat(x, y, z, yaw, 0, 1.06, 0.75));
  for (let i = 0; i < 5; i++) b.add(new THREE.SphereGeometry(0.22, 8, 6), [0xffb8d8, 0xb8d8ff, 0xffffff][i % 3], worldMat(x, y, z, yaw, -1.1 + i * 0.55, 1.35, 0.75));
  const aw = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 2.4), lambert({ map: awningTexture(), color: 0xff8fc8 }, { strength: 0.1 }));
  aw.position.set(x, y + 2.7, z);
  aw.rotation.set(0.18, yaw, 0, 'YXZ');
  shadowed(aw);
  ctx.scene.add(aw);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), lambert({ map: signTexture(['Cloud Candy']) }, false));
  const p = toWorld(x, z, yaw, 0, 1.2);
  sign.position.set(p.x, y + 2.25, p.z);
  sign.rotation.y = yaw;
  ctx.scene.add(sign);
  ctx.collision.addCircle(x, z, 1.5, 'stall');
}

// The Professor's camp: a striped tent, a brass telescope on a tripod and the sky chart table.
function camp(ctx) {
  const C = LOC.camp, b = ctx.batch;
  const y = ground(ctx, C.x, C.z);
  const yaw = faceYaw(C.x, C.z, LOC.start.x, LOC.start.z);
  b.add(new THREE.ConeGeometry(2.4, 3.2, 6), 0xf2e6c8, worldMat(C.x, y, C.z, yaw, 0, 1.6, 0));
  b.add(new THREE.ConeGeometry(2.45, 0.5, 6, 1, true), 0xd8333f, worldMat(C.x, y, C.z, yaw, 0, 0.9, 0));
  ctx.collision.addCircle(C.x, C.z, 2.2, 'tent');
  const T = { x: LOC.professor.x + 3, z: LOC.professor.z - 2 };
  const ty = ground(ctx, T.x, T.z);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    b.add(new THREE.CylinderGeometry(0.05, 0.06, 2.0, 5), WOOD_D, mat(T.x + Math.cos(a) * 0.45, ty + 0.95, T.z + Math.sin(a) * 0.45, Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25));
  }
  b.add(new THREE.CylinderGeometry(0.16, 0.24, 1.8, 10), BRASS, mat(T.x, ty + 2.2, T.z, 0.9, 0.6, 0));
  ctx.collision.addCircle(T.x, T.z, 0.8, 'telescope');
  const E = LOC.easel;
  const ey = ground(ctx, E.x, E.z);
  b.add(new THREE.BoxGeometry(2.2, 0.12, 1.4), WOOD, mat(E.x, ey + 1.0, E.z));
  for (const [lx, lz] of [[-0.9, -0.5], [0.9, -0.5], [-0.9, 0.5], [0.9, 0.5]]) b.add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 5), WOOD_D, mat(E.x + lx, ey + 0.5, E.z + lz));
  b.add(new THREE.BoxGeometry(1.6, 0.02, 1.0), 0x2a2f7a, mat(E.x, ey + 1.07, E.z));
  ctx.collision.addCircle(E.x, E.z, 1.2, 'table');
}

// The mooring mast, Cinder's airship riding beside it, and the high pier for cloud fishing.
function mooring(ctx) {
  const A = LOC.arrival, b = ctx.batch;
  const y = ground(ctx, A.x, A.z);
  const H = 15;
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(new THREE.CylinderGeometry(0.12, 0.16, H, 6), 0x6a6a7a, mat(A.x + lx, y + H / 2, A.z + lz, -lz * 0.05, 0, lx * 0.05));
  for (let k = 1; k < 5; k++) b.add(new THREE.BoxGeometry(2.1, 0.12, 2.1), 0x8a8a9a, mat(A.x, y + k * 3, A.z));
  b.add(new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12), 0xd8333f, mat(A.x, y + H + 0.2, A.z));
  ctx.glow.add(A.x, y + H + 0.6, A.z, 0xff6a5a, 3, 0.8);
  ctx.collision.addCircle(A.x, A.z, 1.6, 'mast');
  // The airship: a patched balloon, fins, a little gondola and a propeller.
  const ship = new THREE.Group();
  const balloon = shadowed(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), lambert({ color: 0xe8c89a }, { color: 0xffd6b8, strength: 0.2 })), true, false);
  balloon.scale.set(7.5, 3.4, 3.4);
  ship.add(balloon);
  for (let k = 0; k < 3; k++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 4, 24), lambert({ color: 0xb04a3a }));
    band.scale.set(3.4, 3.4, 1);
    band.position.x = -3 + k * 3;
    band.rotation.y = Math.PI / 2;
    ship.add(band);
  }
  for (const s of [-1, 1]) { const fin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.8), lambert({ color: 0xb04a3a })); fin.position.set(-7, 0, s * 1.2); fin.rotation.x = s * 0.6; ship.add(fin); }
  const gondola = shadowed(new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 1.6), lambert({ color: 0x8a5c38 })));
  gondola.position.y = -4.8;
  ship.add(gondola);
  for (const [gx, gz] of [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.6, 4), lambert({ color: 0x3a2a20 }));
    rope.position.set(gx, -2.8, gz);
    ship.add(rope);
  }
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 0.28), lambert({ color: 0x5a5a64 }));
  prop.position.set(-2.2, -4.8, 0);
  ship.add(prop);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });
  for (let k = 0; k < 6; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), lampMat); l.position.set(-3 + k * 1.2, -2.3 - Math.sin(k) * 0.3, 1.9); ship.add(l); }
  ship.position.set(A.x + 9, y + 11, A.z + 2);
  ship.rotation.y = 0.2;
  ctx.scene.add(ship);
  ctx.airship = ship;
  ctx.animated.push((dt, t) => { ship.position.y = y + 11 + Math.sin(t * 0.6) * 0.4; ship.rotation.z = Math.sin(t * 0.4) * 0.03; prop.rotation.x = t * 8; });
  ctx.dock = buildPier(ctx, { x: LOC.dock.x1, z: LOC.dock.z, dirX: -1, dirZ: 0, w: LOC.dock.w, top: LOC.dock.top, cap: NO_CAP });
}

// Wren's nesting bank: a grassy mound full of round burrow doors.
function nursery(ctx) {
  const N = NURSERY, b = ctx.batch;
  const y = ground(ctx, N.x, N.z);
  // The mound sits back from the road to the Cloud Valleys bridge, its burrow doors facing the road.
  const M = { x: N.x - 3, z: N.z - 4.5 };
  b.add(new THREE.SphereGeometry(4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0x6ac48a, mat(M.x, y - 0.4, M.z, 0, 0, 0, 1, 0.55, 1));
  for (let k = 0; k < 4; k++) {
    const a = -0.9 + k * 0.6;
    b.add(new THREE.CircleGeometry(0.42, 12), 0x2a2030, mat(M.x + Math.sin(a) * 3.6, y + 0.7, M.z + Math.cos(a) * 3.6, 0, a, 0));
  }
  ctx.collision.addCircle(M.x, M.z, 3.6, 'burrows');
}

// The Glider Guild: a launch tower with a ramp to its deck, windmills and kites over the meadow.
function windGardens(ctx) {
  const T = LOC.tower, b = ctx.batch;
  const y = ground(ctx, T.x, T.z);
  const H = 10, D = 3.2;
  for (const [lx, lz] of [[-D, -D], [D, -D], [-D, D], [D, D]]) b.add(new THREE.CylinderGeometry(0.22, 0.28, H, 7), WOOD_D, mat(T.x + lx, y + H / 2, T.z + lz));
  for (let k = 1; k <= 3; k++) {
    b.add(new THREE.BoxGeometry(D * 2 + 0.4, 0.14, 0.14), WOOD, mat(T.x, y + k * 3, T.z - D));
    b.add(new THREE.BoxGeometry(D * 2 + 0.4, 0.14, 0.14), WOOD, mat(T.x, y + k * 3, T.z + D));
  }
  const plankMat = lambert({ map: woodTexture(), color: 0xf0d8bc }, { strength: 0.15 });
  const deck = shadowed(new THREE.Mesh(new THREE.BoxGeometry(D * 2 + 1, 0.3, D * 2 + 1), plankMat));
  deck.position.set(T.x, y + H, T.z);
  ctx.scene.add(deck);
  ctx.collision.addPlatform({ kind: 'box', x: T.x, z: T.z, hw: D + 0.5, hd: D + 0.5, rot: 0, top: y + H + 0.15 });
  for (const [lx, lz] of [[-D, -D], [D, -D], [-D, D], [D, D]]) ctx.collision.addCircle(T.x + lx, T.z + lz, 0.35, 'tower-leg');
  // A flag of the Glider Guild on the deck, at the corner off to the side of the flight line.
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 4, 5), 0xeeeeee, mat(T.x - D, y + H + 2, T.z + D));
  b.add(new THREE.BoxGeometry(1.6, 0.9, 0.04), 0xffb000, mat(T.x - D - 0.85, y + H + 3.5, T.z + D));
  // Two ramps zig-zag up the east side.
  const rampTo = (x0, z0, y0, x1, z1, y1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0);
    ctx.collision.addPlatform({ kind: 'box', x: (x0 + x1) / 2, z: (z0 + z1) / 2, hw: 1.0, hd: len / 2, rot: yaw, top: y0, top1: y1 });
    const pitch = -Math.atan((y1 - y0) / len);
    const plank = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, len + 0.3), plankMat));
    plank.position.set((x0 + x1) / 2, (y0 + y1) / 2 - 0.1, (z0 + z1) / 2);
    plank.rotation.set(pitch, yaw, 0, 'YXZ');
    ctx.scene.add(plank);
    for (const t of [0.25, 0.75]) b.add(new THREE.CylinderGeometry(0.1, 0.12, y0 + (y1 - y0) * t - y, 5), WOOD_D, mat(x0 + (x1 - x0) * t, (y + y0 + (y1 - y0) * t) / 2, z0 + (z1 - z0) * t));
  };
  const ex = T.x + D + 1.6;
  rampTo(ex, T.z + 12, y + 0.1, ex, T.z + 1, y + H / 2);
  rampTo(ex, T.z + 1, y + H / 2, ex - 0.2, T.z - D - 0.4, y + H / 2);
  rampTo(ex - 1.8, T.z - D - 0.4, y + H / 2, T.x + D + 0.4, T.z - D + 4.6, y + H + 0.15);
  ctx.towerTop = { x: T.x, z: T.z, y: y + H + 0.15 };
  // Windmills with turning sails.
  ctx.windmills = [];
  for (const [x, z] of [[-122, 10], [-80, -28], [-112, 22]]) {
    const wy = ground(ctx, x, z);
    b.add(new THREE.CylinderGeometry(1.4, 2.0, 7, 10), 0xf4f0e8, mat(x, wy + 3.5, z));
    b.add(new THREE.ConeGeometry(1.8, 1.8, 10), 0x6a7ad8, mat(x, wy + 7.9, z));
    const sails = new THREE.Group();
    sails.position.set(x, wy + 6.4, z);
    sails.rotation.y = faceYaw(x, z, ISLANDS.wind.x, ISLANDS.wind.z);
    const sailMat = lambert({ color: 0xfff4e6 }, { strength: 0.15 });
    const hub = new THREE.Group();
    hub.position.z = 1.6;
    for (let k = 0; k < 4; k++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 0.08), sailMat);
      arm.position.y = 2.2;
      const pivot = new THREE.Group();
      pivot.rotation.z = (k * Math.PI) / 2;
      pivot.add(arm);
      hub.add(pivot);
    }
    sails.add(hub);
    ctx.scene.add(sails);
    ctx.windmills.push(hub);
    ctx.collision.addCircle(x, z, 2.0, 'windmill');
  }
  // Kites over the meadow, tugging on their strings.
  const kites = [];
  for (let k = 0; k < 5; k++) {
    const sx = LOC.meadow.x - 10 + k * 5, sz = LOC.meadow.z + (k % 2) * 6;
    const sy = ground(ctx, sx, sz);
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 4), WOOD_D, mat(sx, sy + 0.4, sz));
    const kite = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), lambert({ color: ROOFS[k] }, { strength: 0.2 }));
    kite.scale.set(0.9, 1.3, 0.12);
    ctx.scene.add(kite);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1, 3), new THREE.MeshBasicMaterial({ color: 0xf0f0f0, transparent: true, opacity: 0.45 }));
    ctx.scene.add(string);
    kites.push({ kite, string, base: new THREE.Vector3(sx, sy + 0.8, sz), phase: k * 1.3 });
  }
  const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
  ctx.animated.push((dt, t) => {
    for (const h of ctx.windmills) h.rotation.z = t * 0.9;
    for (const k of kites) {
      k.kite.position.set(k.base.x + 3 + Math.sin(t * 0.7 + k.phase) * 1.5, k.base.y + 8 + Math.sin(t * 1.1 + k.phase) * 1.2, k.base.z - 4);
      k.kite.rotation.set(0.3, 0.4, Math.sin(t * 1.3 + k.phase) * 0.3);
      d.subVectors(k.kite.position, k.base);
      k.string.position.copy(k.base).addScaledVector(d, 0.5);
      k.string.scale.set(1, d.length(), 1);
      k.string.quaternion.setFromUnitVectors(up, d.normalize());
    }
  });
}

// The Cloud Valleys: a misty stone well, the stone circle where Hushlings gather, and the balloon lift.
function cloudValleys(ctx) {
  const b = ctx.batch;
  const Wl = LOC.well2;
  const wy = ground(ctx, Wl.x, Wl.z);
  b.add(new THREE.CylinderGeometry(1.6, 1.8, 1.1, 14, 1, true), STONE_D, mat(Wl.x, wy + 0.55, Wl.z));
  b.add(new THREE.TorusGeometry(1.7, 0.18, 6, 20), STONE, mat(Wl.x, wy + 1.1, Wl.z, Math.PI / 2));
  b.add(new THREE.CircleGeometry(1.5, 16), 0xe8e8ff, mat(Wl.x, wy + 0.8, Wl.z, -Math.PI / 2));
  ctx.collision.addCircle(Wl.x, Wl.z, 1.9, 'well');
  const A = LOC.arena;
  const ay = ground(ctx, A.x, A.z);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = A.x + Math.cos(a) * 8, z = A.z + Math.sin(a) * 8;
    b.add(new THREE.BoxGeometry(1.0, 2.4 + (i % 2) * 0.6, 0.7), STONE, mat(x, ground(ctx, x, z) + 1.1, z, 0, -a, 0));
    ctx.collision.addCircle(x, z, 0.7, 'standing-stone');
  }
  b.add(new THREE.CylinderGeometry(2.2, 2.4, 0.3, 16), STONE_D, mat(A.x, ay + 0.15, A.z));
  // The balloon lift: a landing reaching out over the clouds, a tall mast marked every metre above and below
  // the cloud line (the clouds hide the part below zero), and a basket that rides it.
  const L = LOC.lift, E = LOC.vale;
  const dl = Math.hypot(L.x - E.x, L.z - E.z), ox = (L.x - E.x) / dl, oz = (L.z - E.z) / dl;
  const rx = -oz, rz = ox;
  const deck = ground(ctx, E.x, E.z) + 0.2;
  buildPier(ctx, { x: L.x - ox * 0.4, z: L.z - oz * 0.4, dirX: -ox, dirZ: -oz, w: 2.8, top: deck, cap: NO_CAP });
  const bottom = -10, top = 14;
  b.add(new THREE.CylinderGeometry(0.22, 0.26, top - bottom, 8), 0xe8e4f0, mat(L.x, (top + bottom) / 2, L.z));
  for (let m = bottom; m <= top; m++) {
    b.add(new THREE.CylinderGeometry(0.34, 0.34, m === 0 ? 0.3 : 0.08, 10), m === 0 ? 0xffd166 : m < 0 ? 0x6a8ad8 : 0xf0a0c0, mat(L.x, m, L.z));
  }
  b.add(new THREE.SphereGeometry(0.4, 10, 8), 0xffd166, mat(L.x, top + 0.3, L.z));
  ctx.collision.addCircle(L.x, L.z, 0.6, 'lift-mast');
  // The basket hangs beside the mast on a sliding collar, big enough for a penguin to ride. Its origin is
  // the basket floor.
  const dx = rx * 3.0 + ox * 2.2, dz = rz * 3.0 + oz * 2.2, R = Math.hypot(dx, dz);
  const basket = new THREE.Group();
  const bk = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.0, 1.6, 18), lambert({ map: woodTexture(), color: 0xf0d0a8 }, { strength: 0.15 })));
  bk.position.y = 0.8;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.14, 6, 28), lambert({ color: WOOD_D }));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 1.6;
  const balloon = shadowed(new THREE.Mesh(new THREE.SphereGeometry(3.0, 22, 16), lambert({ color: 0xff8fc8 }, { strength: 0.2 })), true, false);
  balloon.position.y = 7.6;
  balloon.scale.y = 1.12;
  const band = new THREE.Mesh(new THREE.TorusGeometry(3.02, 0.18, 6, 36), lambert({ color: 0xfff1b0 }));
  band.rotation.x = Math.PI / 2;
  band.position.y = 7.6;
  basket.add(bk, lip, balloon, band);
  const ropeMat = lambert({ color: 0x6a4a30 });
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    const from = new THREE.Vector3(Math.cos(a) * 2.2, 1.6, Math.sin(a) * 2.2), to = new THREE.Vector3(Math.cos(a) * 1.6, 4.75, Math.sin(a) * 1.6);
    const d = to.clone().sub(from);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, d.length(), 4), ropeMat);
    rope.position.copy(from).add(to).multiplyScalar(0.5);
    rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    basket.add(rope);
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 6, 14), lambert({ color: BRASS }));
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.0, -R);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, R - 2.65, 5), lambert({ color: WOOD_D }));
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, 1.0, -(R + 1.75) / 2);
  basket.add(collar, arm);
  basket.rotation.y = Math.atan2(dx, dz);
  basket.position.set(L.x + dx, deck, L.z + dz);
  ctx.scene.add(basket);
  // The height board on the landing, turned toward where the lift is watched from: a number line from -10
  // to 14 with an arrow that follows the basket, even down in the clouds.
  const view = LOC.liftView;
  const B = { x: L.x - ox * 1.7 - rx * 1.05, z: L.z - oz * 1.7 - rz * 1.05 };
  const yaw = Math.atan2(view.x - B.x, view.z - B.z);
  const BW = 1.4, BH = 5.6, by = deck + 0.5 + BH / 2;
  const board = new THREE.Group();
  board.position.set(B.x, by, B.z);
  board.rotation.y = yaw;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), lambert({ map: heightBoardTexture(bottom, top) }, { strength: 0.1 }));
  face.position.z = 0.07;
  const back = shadowed(new THREE.Mesh(new THREE.BoxGeometry(BW + 0.12, BH + 0.12, 0.12), lambert({ color: WOOD })));
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 3), new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(-BW / 2 + 0.22, 0, 0.12);
  board.add(back, face, arrow);
  ctx.scene.add(board);
  for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.08, 0.1, by + BH / 2 - deck, 6), WOOD_D, worldMat(B.x, deck, B.z, yaw, s * (BW / 2 + 0.1), (by + BH / 2 - deck) / 2, -0.05));
  const pad = (40 / 768) * BH;
  ctx.animated.push(() => {
    const v = Math.max(bottom, Math.min(top, basket.position.y));
    arrow.position.y = -BH / 2 + pad + ((v - bottom) / (top - bottom)) * (BH - pad * 2);
  });
  ctx.lift = { x: L.x, z: L.z, out: { x: ox, z: oz }, view, ground: deck, basket, bottom, top };
}

// The Clockwork Observatory: a brass dome, three great gears and the clock tower that faces the town.
function clockwork(ctx) {
  const b = ctx.batch;
  const D = LOC.dome;
  const y = ground(ctx, D.x, D.z);
  b.add(new THREE.CylinderGeometry(6, 6.4, 5, 24), 0xf0e6d0, mat(D.x, y + 2.5, D.z));
  b.add(new THREE.SphereGeometry(6.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0x4ab8a8, mat(D.x, y + 5, D.z));
  b.add(new THREE.BoxGeometry(1.6, 6.4, 0.6), 0x2a3a4a, mat(D.x, y + 7.4, D.z + 2.6, -0.5, 0, 0));
  b.add(new THREE.CylinderGeometry(0.7, 0.9, 5, 12), BRASS, mat(D.x, y + 10, D.z + 1.6, 0.9, 0, 0));
  b.add(new THREE.BoxGeometry(2.0, 2.6, 0.14), WOOD_D, mat(D.x - 6.05, y + 1.3, D.z, 0, Math.PI / 2, 0));
  const c = ctx.collision.addCircle(D.x, D.z, 6.4, 'dome');
  c.top = y + 11;
  ctx.gears = [];
  const gearMat = lambert({ vertexColors: true }, { color: 0xffe0a0, strength: 0.25 });
  for (const [x, z, r, sp] of [[D.x - 3, D.z - 11, 3.2, 0.5], [D.x + 3.4, D.z - 11.6, 2.2, -0.73], [D.x + 7, D.z - 8, 1.5, 1.07]]) {
    const gy = ground(ctx, x, z);
    const g = new THREE.Mesh(gearGeometry(r, { thick: 0.5, tooth: [0.5, 0.5, 0.6], toothR: r + 0.2, hub: 0x7a5a32, hubThick: 0.7 }), gearMat);
    g.rotation.x = Math.PI / 2;
    g.position.set(x, gy + r + 0.6, z);
    g.castShadow = true;
    ctx.scene.add(g);
    b.add(new THREE.BoxGeometry(0.6, r + 0.6, 0.6), 0x7a5a32, mat(x, gy + (r + 0.6) / 2, z - 0.6));
    ctx.collision.addCircle(x, z, r * 0.7, 'gear');
    ctx.gears.push({ g, sp, turning: 0.2 });
  }
  // The clock tower.
  const C = LOC.clockFace;
  const cy = ground(ctx, C.x, C.z);
  const cx = C.x + 4;
  b.add(new THREE.BoxGeometry(4, 13, 4), 0xf0e6d0, mat(cx, cy + 6.5, C.z));
  b.add(new THREE.ConeGeometry(3.2, 3.2, 4), 0x4ab8a8, mat(cx, cy + 14.6, C.z, 0, Math.PI / 4, 0));
  b.add(new THREE.CylinderGeometry(1.7, 1.7, 0.2, 28), 0xfff8e8, mat(cx - 2.05, cy + 10, C.z, 0, 0, Math.PI / 2));
  b.add(new THREE.TorusGeometry(1.75, 0.12, 6, 28), BRASS, mat(cx - 2.12, cy + 10, C.z, 0, Math.PI / 2, 0));
  const hands = new THREE.Group();
  hands.position.set(cx - 2.25, cy + 10, C.z);
  const handMat = new THREE.MeshBasicMaterial({ color: 0x2a2a3a });
  const hour = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.12), handMat); hour.geometry.translate(0, 0.45, 0);
  const minute = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.08), handMat); minute.geometry.translate(0, 0.7, 0);
  hands.add(hour, minute);
  hands.rotation.y = -Math.PI / 2;
  ctx.scene.add(hands);
  ctx.clock = { hour, minute, running: false };
  ctx.collision.addCircle(cx, C.z, 2.6, 'clock-tower');
  ctx.animated.push((dt, t) => {
    for (const g of ctx.gears) g.g.rotation.y += dt * g.sp * g.turning;
    if (ctx.clock.running) { minute.rotation.x = -t * 0.6; hour.rotation.x = -t * 0.05; }
  });
}

// The Crystal Workshop: a glass-roofed shed with a chimney, the kiln, racks of glass and the build stones.
function crystalWorkshop(ctx) {
  const b = ctx.batch;
  const K = LOC.kiln;
  const ky = ground(ctx, K.x, K.z);
  b.add(new THREE.SphereGeometry(2.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xb8a8c8, mat(K.x, ky, K.z));
  b.add(new THREE.CylinderGeometry(0.5, 0.6, 3.2, 8), STONE_D, mat(K.x + 1, ky + 3, K.z - 0.6));
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.8, 14), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
  const yaw = faceYaw(K.x, K.z, LOC.rocco.x, LOC.rocco.z);
  const mp = toWorld(K.x, K.z, yaw, 0, 2.38);
  mouth.position.set(mp.x, ky + 0.8, mp.z);
  mouth.rotation.y = yaw;
  ctx.scene.add(mouth);
  ctx.glow.add(mp.x, ky + 0.9, mp.z, 0xffa040, 4, 0.8);
  ctx.lanterns.push({ x: mp.x, y: ky + 1.2, z: mp.z, intensity: 45 });
  ctx.terrainMesh.userData.addWarmth(mp.x, mp.z, 6, 0.8);
  ctx.collision.addCircle(K.x, K.z, 2.5, 'kiln');
  // The shed.
  const S = { x: K.x - 12, z: K.z + 4 };
  const sy = ground(ctx, S.x, S.z);
  const syaw = faceYaw(S.x, S.z, LOC.rocco.x, LOC.rocco.z);
  b.add(new THREE.BoxGeometry(6, 3.4, 4.4), 0xf0e8f8, worldMat(S.x, sy, S.z, syaw, 0, 1.7, 0));
  b.add(new THREE.BoxGeometry(6.6, 0.3, 5.0), 0x9a8ac8, worldMat(S.x, sy, S.z, syaw, 0, 3.55, 0));
  b.add(new THREE.BoxGeometry(5.6, 1.4, 4.0), 0xbfe8ff, worldMat(S.x, sy, S.z, syaw, 0, 4.3, 0));
  b.add(new THREE.CylinderGeometry(0.4, 0.5, 3, 8), STONE_D, worldMat(S.x, sy, S.z, syaw, 2.2, 5.5, -1.2));
  ctx.collision.addCircle(S.x, S.z, 3.3, 'shed');
  // Glass racks.
  for (let k = 0; k < 3; k++) {
    const x = K.x - 5 + k * 2.2, z = K.z - 6;
    const ry = ground(ctx, x, z);
    b.add(new THREE.BoxGeometry(1.8, 0.1, 0.6), WOOD, mat(x, ry + 1.0, z));
    for (let i = 0; i < 3; i++) b.add(new THREE.CylinderGeometry(0.14, 0.18, 0.5, 8), [0x9fe8ff, 0xffb8e8, 0xd8b8ff][(i + k) % 3], mat(x - 0.5 + i * 0.5, ry + 1.3, z));
  }
  // The build stones, for the workshop builder and the sculpture contest.
  const P = { x: LOC.rocco.x - 6, z: LOC.rocco.z - 4 };
  const py = ground(ctx, P.x, P.z);
  b.add(new THREE.BoxGeometry(7, 0.3, 7), 0xe0dcf0, mat(P.x, py + 0.15, P.z));
  ctx.buildPad = { x: P.x, z: P.z, y: py + 0.3, yaw: 0, size: 6.4 };
}

// The Star Guild: a round hall under a great telescope dome.
function starGuild(ctx) {
  const b = ctx.batch;
  const S = LOC.scope;
  const y = ground(ctx, S.x, S.z);
  b.add(new THREE.CylinderGeometry(5, 5.4, 4.5, 24), 0xe8e4f8, mat(S.x + 6, y + 2.25, S.z - 4));
  b.add(new THREE.SphereGeometry(5.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0x2a2f7a, mat(S.x + 6, y + 4.5, S.z - 4));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    b.add(new THREE.SphereGeometry(0.12, 6, 4), 0xffe9a8, mat(S.x + 6 + Math.cos(a) * 3.5, y + 7.6 + Math.sin(k * 1.7) * 0.6, S.z - 4 + Math.sin(a) * 3.5));
  }
  b.add(new THREE.CylinderGeometry(0.9, 1.1, 6, 12), BRASS, mat(S.x + 6, y + 9, S.z - 2.6, 0.7, 0, 0));
  const c = ctx.collision.addCircle(S.x + 6, S.z - 4, 5.4, 'guild-hall');
  c.top = y + 9.6;
  // A ring of benches where the guild counts stars.
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    b.add(new THREE.BoxGeometry(2.2, 0.5, 0.6), WOOD, mat(S.x + Math.cos(a) * 4.5, ground(ctx, S.x + Math.cos(a) * 4.5, S.z + Math.sin(a) * 4.5) + 0.4, S.z + Math.sin(a) * 4.5, 0, -a, 0));
  }
}

export function buildStructures(ctx) {
  const { scene } = ctx;
  ctx.animated = ctx.animated || [];
  ctx.batch = new PropBatch();
  ctx.lanternGlass = [];
  const H = LOC.home;
  // Guild Town: round cottages around the plaza, lamps along the paths.
  COTTAGES.forEach(([x, z, k], i) => cottage(ctx, x, z, faceYaw(x, z, H.x, H.z), k + i, cottageRadius(i)));
  for (const [x, z] of LAMPS) lamp(ctx, x, z);
  const fy = ctx.terrain.heightAt(H.x, H.z + 4);
  ctx.batch.add(new THREE.CylinderGeometry(2.6, 2.9, 0.6, 20), STONE_D, mat(H.x, fy + 0.3, H.z + 4));
  ctx.batch.add(new THREE.CylinderGeometry(0.2, 0.25, 4.5, 8), 0xf0f0ff, mat(H.x, fy + 2.5, H.z + 4));
  const pin = new THREE.Group();
  pin.position.set(H.x, fy + 4.8, H.z + 4);
  const pinMat = [0xff5c8a, 0xffd23d, 0x5aa9e6, 0x39d98a].map((c) => lambert({ color: c }));
  for (let k = 0; k < 4; k++) { const blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 0.05), pinMat[k]); blade.position.y = 0.8; const p = new THREE.Group(); p.rotation.z = (k * Math.PI) / 2; p.add(blade); pin.add(p); }
  scene.add(pin);
  ctx.collision.addCircle(H.x, H.z + 4, 2.6, 'fountain');
  ctx.animated.push((dt, t) => { pin.rotation.z = t * 2.2; });
  camp(ctx);
  stall(ctx);
  patrolBoard(ctx);
  nursery(ctx);
  mooring(ctx);
  windGardens(ctx);
  cloudValleys(ctx);
  clockwork(ctx);
  crystalWorkshop(ctx);
  starGuild(ctx);
  addSignpost(ctx, -2, 84, [{ text: 'Wind Gardens', tx: -98, tz: -4 }, { text: 'Cloud Valleys', tx: -104, tz: 100 }, { text: 'Crystal Workshop', tx: 84, tz: 128 }], NO_CAP);
  addSignpost(ctx, 20, 70, [{ text: 'Clockwork Observatory', tx: 106, tz: 28 }, { text: 'Star Guild', tx: 76, tz: -88 }], NO_CAP);
  ctx.finishBatch = () => {
    scene.add(ctx.batch.build(lambert({ vertexColors: true }, { color: 0xe8e0ff, power: 2.6, strength: 0.18 })));
  };
  return ctx;
}
