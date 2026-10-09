import * as THREE from 'three';
import { lambert } from '../core/materials.js';
import { mergeColored, mat } from '../core/geo.js';
import {
  iglooTexture, woodTexture, flagTexture, signTexture, doorTexture, doorwayTexture, awningTexture, glowTexture,
} from '../core/textures.js';
import { LOC, WATER_Y } from '../books/book1/layout.js';
import { clamp } from '../core/mathutil.js';

export const faceYaw = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);

export function toWorld(x, z, yaw, lx, lz) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return { x: x + lx * c + lz * s, z: z - lx * s + lz * c };
}

function shadowed(m, cast = true, receive = true) {
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

// Collects small vertex-colored props in world space and merges them into one draw call.
export class PropBatch {
  constructor() { this.parts = []; }
  add(geo, color, matrix) { this.parts.push({ geo, color, matrix }); }
  build(material) {
    const g = mergeColored(this.parts);
    const m = shadowed(new THREE.Mesh(g, material));
    m.name = 'props';
    return m;
  }
}

function worldMat(x, y, z, yaw, lx, ly, lz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  const outer = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
  return outer.multiply(mat(lx, ly, lz, rx, ry, rz, sx, sy, sz));
}

export function addLantern(ctx, x, z, height = 2.2, y0 = null) {
  const { terrain, glow, batch } = ctx;
  const base = y0 ?? terrain.heightAt(x, z);
  batch.add(new THREE.CylinderGeometry(0.08, 0.11, height, 6), 0x4a3020, mat(x, base + height / 2, z));
  batch.add(new THREE.BoxGeometry(0.46, 0.08, 0.46), 0x2a2a30, mat(x, base + height + 0.02, z));
  batch.add(new THREE.ConeGeometry(0.36, 0.3, 4), 0x2a2a30, mat(x, base + height + 0.62, z, 0, Math.PI / 4, 0));
  ctx.lanternGlass.push(mat(x, base + height + 0.25, z));
  glow.add(x, base + height + 0.26, z, 0xffc46a, 3.0, 0.85);
  ctx.lanterns.push({ x, y: base + height + 0.4, z, intensity: 30 });
  ctx.terrainMesh.userData.addWarmth(x, z, 7.5, 0.85);
  ctx.collision.addCircle(x, z, 0.3, 'lantern');
}

export function addFence(ctx, pts) {
  const { terrain, batch, collision } = ctx;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / 2.2));
    const yaw = Math.atan2(bx - ax, bz - az);
    for (let i = 0; i <= n; i++) {
      if (k > 0 && i === 0) continue;
      const x = ax + ((bx - ax) * i) / n, z = az + ((bz - az) * i) / n;
      const y = terrain.heightAt(x, z);
      batch.add(new THREE.CylinderGeometry(0.11, 0.13, 1.5, 6), 0x6b4428, mat(x, y + 0.7, z));
      batch.add(new THREE.SphereGeometry(0.16, 6, 4), 0xf4f8ff, mat(x, y + 1.48, z, 0, 0, 0, 1, 0.5, 1));
      if (i < n) {
        const x2 = ax + ((bx - ax) * (i + 1)) / n, z2 = az + ((bz - az) * (i + 1)) / n;
        const y2 = terrain.heightAt(x2, z2);
        const seg = Math.hypot(x2 - x, z2 - z);
        const mx = (x + x2) / 2, mz = (z + z2) / 2, my = (y + y2) / 2;
        const pitch = Math.atan2(y2 - y, seg);
        for (const hgt of [0.55, 1.1]) {
          batch.add(new THREE.BoxGeometry(0.1, 0.16, seg), 0x7d5232, mat(mx, my + hgt, mz, -pitch, yaw, 0));
        }
      }
    }
    for (let s = 0; s <= len; s += 0.8) collision.addCircle(ax + ((bx - ax) * s) / len, az + ((bz - az) * s) / len, 0.35, 'fence');
  }
}

function addSnowman(ctx, x, z, yaw, hat = null) {
  const { terrain, batch, collision } = ctx;
  const y = terrain.heightAt(x, z);
  const w = (lx, ly, lz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => worldMat(x, y, z, yaw, lx, ly, lz, rx, ry, rz, sx, sy, sz);
  batch.add(new THREE.SphereGeometry(1.1, 16, 12), 0xf6f9ff, w(0, 0.95, 0));
  batch.add(new THREE.SphereGeometry(0.8, 16, 12), 0xf6f9ff, w(0, 2.45, 0));
  batch.add(new THREE.SphereGeometry(0.56, 16, 12), 0xf6f9ff, w(0, 3.55, 0));
  for (const s of [-1, 1]) batch.add(new THREE.SphereGeometry(0.07, 6, 4), 0x151520, w(s * 0.2, 3.68, 0.5));
  batch.add(new THREE.ConeGeometry(0.09, 0.55, 8), 0xff8a2a, w(0, 3.52, 0.78, Math.PI / 2));
  for (let i = 0; i < 3; i++) batch.add(new THREE.SphereGeometry(0.08, 6, 4), 0x151520, w(0, 2.2 + i * 0.3, 0.78 - Math.abs(i - 1) * 0.04));
  for (const s of [-1, 1]) batch.add(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 5), 0x5a3a22, w(s * 1.2, 2.7, 0, 0, 0, s * 1.0));
  batch.add(new THREE.TorusGeometry(0.58, 0.14, 8, 18), 0xe8434b, w(0, 3.1, 0, Math.PI / 2));
  if (hat === 'bucket') batch.add(new THREE.CylinderGeometry(0.38, 0.46, 0.55, 12), 0x4a86d8, w(0, 4.15, 0, 0.15));
  if (hat === 'top') {
    batch.add(new THREE.CylinderGeometry(0.34, 0.36, 0.7, 12), 0x1a1a24, w(0, 4.35, 0));
    batch.add(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 14), 0x1a1a24, w(0, 4.02, 0));
  }
  collision.addCircle(x, z, 1.15, 'snowman');
}

function addCrate(ctx, x, z, yaw, s = 1, stackY = 0, cap = 0xf4f8ff) {
  const y = ctx.terrain.heightAt(x, z) + stackY;
  ctx.batch.add(new THREE.BoxGeometry(1.2 * s, 1.2 * s, 1.2 * s), 0x8a5c38, worldMat(x, y, z, yaw, 0, 0.6 * s, 0));
  ctx.batch.add(new THREE.BoxGeometry(1.24 * s, 0.14 * s, 1.24 * s), 0x5e3a22, worldMat(x, y, z, yaw, 0, 1.1 * s, 0));
  if (cap !== null) ctx.batch.add(new THREE.BoxGeometry(1.1 * s, 0.1 * s, 1.1 * s), cap, worldMat(x, y, z, yaw, 0, 1.24 * s, 0));
  if (!stackY) {
    const c = ctx.collision.addCircle(x, z, 0.85 * s, 'crate');
    c.top = y + 1.2 * s;
  }
}

function addBarrel(ctx, x, z, cap = 0xf4f8ff) {
  const y = ctx.terrain.heightAt(x, z);
  ctx.batch.add(new THREE.CylinderGeometry(0.55, 0.5, 1.25, 12), 0x8a5c38, mat(x, y + 0.62, z));
  for (const h of [0.25, 1.0]) ctx.batch.add(new THREE.TorusGeometry(0.55, 0.04, 4, 16), 0x3a3a44, mat(x, y + h, z, Math.PI / 2));
  if (cap !== null) ctx.batch.add(new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), cap, mat(x, y + 1.2, z, 0, 0, 0, 1, 0.3, 1));
  ctx.collision.addCircle(x, z, 0.65, 'barrel');
}

function addLog(ctx, x, z, yaw, len = 3) {
  const y = ctx.terrain.heightAt(x, z);
  ctx.batch.add(new THREE.CylinderGeometry(0.35, 0.38, len, 10), 0x6b4428, worldMat(x, y, z, yaw, 0, 0.35, 0, 0, 0, Math.PI / 2));
  ctx.batch.add(new THREE.BoxGeometry(len * 0.8, 0.12, 0.45), 0xf4f8ff, worldMat(x, y, z, yaw, 0, 0.72, 0));
  const c = toWorld(x, z, yaw, len * 0.3, 0), d = toWorld(x, z, yaw, -len * 0.3, 0);
  for (const p of [c, d]) { const col = ctx.collision.addCircle(p.x, p.z, 0.5, 'log'); col.top = y + 0.75; }
}

// Waving cloth flag on a pole.
function addFlag(ctx, x, z, kind, height = 6.5, yaw = 0) {
  const { scene, terrain, batch, collision } = ctx;
  const y = terrain.heightAt(x, z);
  batch.add(new THREE.CylinderGeometry(0.09, 0.12, height, 8), 0x6b4428, mat(x, y + height / 2, z));
  batch.add(new THREE.SphereGeometry(0.2, 10, 8), 0xffcc4d, mat(x, y + height + 0.1, z));
  collision.addCircle(x, z, 0.3, 'flag');
  const W = 2.6, H = 1.6;
  const geo = new THREE.PlaneGeometry(W, H, 12, 6);
  geo.translate(W / 2, 0, 0);
  const base = geo.attributes.position.array.slice();
  const cloth = shadowed(new THREE.Mesh(geo, lambert({ map: flagTexture(kind), side: THREE.DoubleSide }, { strength: 0.2 })), true, false);
  cloth.position.set(x + 0.05, y + height - H / 2 - 0.1, z);
  cloth.rotation.y = yaw;
  scene.add(cloth);
  const phase = Math.random() * 10;
  ctx.animated.push((dt, t) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const u = base[i] / W;
      p[i + 2] = Math.sin(base[i] * 1.9 - t * 4.2 + phase) * 0.22 * u + Math.sin(base[i + 1] * 2 + t * 3) * 0.05 * u;
      p[i + 1] = base[i + 1] - u * u * 0.18;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  });
}

function addSignpost(ctx, x, z, entries, cap = 0xf4f8ff) {
  const { scene, terrain, batch, collision } = ctx;
  const y = terrain.heightAt(x, z);
  batch.add(new THREE.CylinderGeometry(0.12, 0.15, 3.6, 6), 0x5e3a22, mat(x, y + 1.8, z));
  if (cap !== null) batch.add(new THREE.SphereGeometry(0.2, 8, 6), cap, mat(x, y + 3.62, z, 0, 0, 0, 1, 0.5, 1));
  collision.addCircle(x, z, 0.35, 'sign');
  entries.forEach((e, i) => {
    const tex = signTexture([e.text]);
    const board = new THREE.Group();
    const planeGeo = new THREE.PlaneGeometry(2.8, 0.7);
    const m = lambert({ map: tex }, { strength: 0.15 });
    const front = new THREE.Mesh(planeGeo, m);
    front.position.set(1.45, 0, 0.07);
    const back = new THREE.Mesh(planeGeo, m);
    back.position.set(1.45, 0, -0.07);
    back.rotation.y = Math.PI;
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 3), lambert({ color: 0x6b4428 }));
    tip.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
    tip.position.set(2.95, 0, 0);
    const slab = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 0.12), lambert({ color: 0x6b4428 })));
    slab.position.set(1.45, 0, 0);
    board.add(slab, front, back, tip);
    board.position.set(x, y + 3.0 - i * 0.85, z);
    board.rotation.y = Math.atan2(-(e.tz - z), e.tx - x);
    scene.add(board);
  });
}

function buildIgloo(ctx) {
  const { scene, terrain, collision, glow } = ctx;
  const { x, z } = LOC.igloo;
  const yaw = faceYaw(x, z, LOC.professor.x, LOC.professor.z);
  const y = terrain.heightAt(x, z) - 0.25;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = yaw;
  scene.add(g);
  const tex = iglooTexture();
  const iceMat = lambert({ map: tex }, { strength: 0.35, color: 0xbfe0ff });
  g.add(shadowed(new THREE.Mesh(new THREE.SphereGeometry(6, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), iceMat)));
  const tunnel = new THREE.CylinderGeometry(2.6, 2.6, 4.4, 20, 1, true, Math.PI / 2, Math.PI);
  tunnel.rotateX(Math.PI / 2);
  const tun = shadowed(new THREE.Mesh(tunnel, lambert({ map: tex, side: THREE.DoubleSide }, { strength: 0.3, color: 0xbfe0ff })));
  tun.position.set(0, 0, 6.6);
  g.add(tun);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.62, 24, 1, 0, Math.PI), lambert({ color: 0xeaf4ff }));
  ring.position.set(0, 0, 8.8);
  g.add(ring);
  const door = new THREE.Mesh(new THREE.CircleGeometry(1.76, 24, 0, Math.PI), new THREE.MeshLambertMaterial({
    map: doorTexture(), emissiveMap: doorTexture(), emissive: 0xffffff, emissiveIntensity: 0.45,
  }));
  door.position.set(0, 0, 8.6);
  g.add(door);
  const snowRing = new THREE.Mesh(new THREE.TorusGeometry(6.05, 0.8, 8, 40), lambert({ color: 0xf2f7ff }));
  snowRing.rotation.x = Math.PI / 2;
  snowRing.scale.set(1, 1, 0.45);
  snowRing.position.y = 0.1;
  g.add(snowRing);

  // Telescope on the roof, aimed at the aurora.
  const brass = lambert({ color: 0xd4a24c }, { strength: 0.4 });
  const scope = new THREE.Group();
  scope.position.set(0.6, 5.7, -0.6);
  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 5), lambert({ color: 0x4a3020 }));
    const a = (i / 3) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 0.35, 0.7, Math.sin(a) * 0.35);
    leg.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    scope.add(leg);
  }
  const tube = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 2.8, 16), brass));
  tube.position.set(0, 1.9, -0.2);
  tube.rotation.x = -0.85;
  scope.add(tube);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({ color: 0x9fe8ff }));
  lens.position.set(0, 2.85, -1.35);
  lens.rotation.x = -0.85 - Math.PI / 2;
  scope.add(lens);
  g.add(scope);
  ctx.telescope = scope;

  collision.addCircle(x, z, 6.3, 'igloo');
  for (const lz of [5.6, 7.8]) { const p = toWorld(x, z, yaw, 0, lz); collision.addCircle(p.x, p.z, 2.7, 'igloo'); }
  for (const s of [-1, 1]) { const p = toWorld(x, z, yaw, s * 3.4, 8.9); addLantern(ctx, p.x, p.z, 2.0); }
  const doorW = toWorld(x, z, yaw, 0, 8.7);
  glow.add(doorW.x, y + 1.1, doorW.z, 0xffb050, 4, 0.45);
  ctx.terrainMesh.userData.addWarmth(doorW.x, doorW.z, 9, 0.9);

  // Yard fence and supplies
  const L = (lx, lz) => { const p = toWorld(x, z, yaw, lx, lz); return [p.x, p.z]; };
  addFence(ctx, [L(-7.5, 3), L(-9.5, 10), L(-7, 16)]);
  addFence(ctx, [L(7.5, 3), L(10, 9.5)]);
  const c1 = toWorld(x, z, yaw, 6.2, 5), c2 = toWorld(x, z, yaw, 7.2, 2.6);
  addCrate(ctx, c1.x, c1.z, yaw + 0.3);
  addCrate(ctx, c1.x, c1.z, yaw + 0.8, 0.8, 1.2);
  addBarrel(ctx, c2.x, c2.z);
}

function buildHut(ctx, x, z, yaw) {
  const { scene, terrain, collision, glow } = ctx;
  const y = terrain.heightAt(x, z) - 0.05;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = yaw;
  scene.add(g);
  const R = 3.3, L = 7.4;
  const wood = woodTexture();
  const shellGeo = new THREE.CylinderGeometry(R, R, L, 24, 1, true, Math.PI / 2, Math.PI);
  shellGeo.rotateX(Math.PI / 2);
  g.add(shadowed(new THREE.Mesh(shellGeo, lambert({ map: wood, side: THREE.DoubleSide, color: 0xd9b89a }, { strength: 0.25 }))));
  const snowGeo = new THREE.CylinderGeometry(R + 0.14, R + 0.14, L + 0.35, 24, 1, true, Math.PI - 0.95, 1.9);
  snowGeo.rotateX(Math.PI / 2);
  g.add(shadowed(new THREE.Mesh(snowGeo, lambert({ color: 0xf4f8ff }))));
  const ribMat = lambert({ color: 0x4e3020 });
  for (const lz of [-3.5, -1.2, 1.2, 3.5]) {
    const rib = shadowed(new THREE.Mesh(new THREE.TorusGeometry(R + 0.06, 0.13, 6, 24, Math.PI), ribMat));
    rib.position.z = lz;
    g.add(rib);
  }
  const wallMat = lambert({ map: wood, color: 0xb88a64 }, { strength: 0.2 });
  const front = new THREE.Mesh(new THREE.CircleGeometry(R, 24, 0, Math.PI), wallMat);
  front.position.z = L / 2;
  const back = new THREE.Mesh(new THREE.CircleGeometry(R, 24, 0, Math.PI), wallMat);
  back.position.z = -L / 2;
  back.rotation.y = Math.PI;
  g.add(front, back);
  const doorway = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.6), new THREE.MeshBasicMaterial({ map: doorwayTexture(), alphaTest: 0.5 }));
  doorway.position.set(0, 1.3, L / 2 + 0.03);
  g.add(doorway);
  const dw = toWorld(x, z, yaw, 0, L / 2 + 0.6);
  glow.add(dw.x, y + 1.3, dw.z, 0xffb050, 4.2, 0.5);
  ctx.terrainMesh.userData.addWarmth(dw.x, dw.z, 8, 0.9);
  const lp = toWorld(x, z, yaw, -R - 0.5, L / 2 + 0.6);
  addLantern(ctx, lp.x, lp.z, 2.3);
  const fp = toWorld(x, z, yaw, R + 0.9, L / 2 - 0.4);
  addFlag(ctx, fp.x, fp.z, 'heart', 5.8, yaw + Math.PI / 2);
  for (const lz of [-2.6, 0, 2.6]) { const p = toWorld(x, z, yaw, 0, lz); collision.addCircle(p.x, p.z, R, 'hut'); }
}

function buildSnackShack(ctx) {
  const { scene, terrain, collision, batch } = ctx;
  const { x, z } = LOC.counter;
  const yaw = -Math.PI / 2;
  const y = terrain.heightAt(x, z);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = yaw;
  scene.add(g);
  const wood = lambert({ map: woodTexture(), color: 0xe0c0a0 }, { strength: 0.2 });
  const counter = shadowed(new THREE.Mesh(new THREE.BoxGeometry(5, 1.3, 1.3), wood));
  counter.position.set(0, 0.65, 0);
  const top = shadowed(new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.14, 1.7), lambert({ color: 0x9a6a44 })));
  top.position.set(0, 1.37, 0.05);
  g.add(counter, top);
  for (const s of [-1, 1]) {
    const post = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.6, 8), lambert({ color: 0x5e3a22 })));
    post.position.set(s * 2.5, 1.8, -0.7);
    g.add(post);
  }
  const awning = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.6), lambert({ map: awningTexture(), side: THREE.DoubleSide }, { strength: 0.2 })));
  awning.position.set(0, 3.35, 0.25);
  awning.rotation.x = -Math.PI / 2 + 0.38;
  g.add(awning);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), lambert({ map: signTexture(['Snack Shack']) }, { strength: 0.2 }));
  sign.position.set(0, 3.95, -0.66);
  g.add(sign);
  const sign2 = sign.clone();
  sign2.rotation.y = Math.PI;
  sign2.position.z = -0.72;
  g.add(sign2);
  // fish on display
  for (let i = 0; i < 3; i++) {
    const p = toWorld(x, z, yaw, -1.6 + i * 0.5, 0.35);
    batch.add(new THREE.SphereGeometry(0.22, 8, 6), i === 1 ? 0xff9a3c : 0x9fb8d8, mat(p.x, y + 1.55, p.z, 0, yaw + 0.3, 0, 1, 0.45, 0.25));
  }
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.6, 14), new THREE.MeshLambertMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.45 }));
  jar.position.set(1.6, 1.74, 0.2);
  g.add(jar);
  ctx.tipJar = { group: g, local: new THREE.Vector3(1.6, 1.74, 0.2) };
  for (const lx of [-2, 0, 2]) { const p = toWorld(x, z, yaw, lx, 0); collision.addCircle(p.x, p.z, 0.95, 'counter'); }
}

function buildCampfire(ctx) {
  const { scene, terrain, batch, glow, collision } = ctx;
  const { x, z } = LOC.campfire;
  const y = terrain.heightAt(x, z);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    batch.add(new THREE.DodecahedronGeometry(0.32, 0), 0x6a7090, mat(x + Math.cos(a) * 1.1, y + 0.15, z + Math.sin(a) * 1.1, a, a, 0));
  }
  batch.add(new THREE.CylinderGeometry(0.16, 0.18, 1.8, 7), 0x5a3520, mat(x, y + 0.25, z, 0, 0.5, Math.PI / 2));
  batch.add(new THREE.CylinderGeometry(0.16, 0.18, 1.8, 7), 0x5a3520, mat(x, y + 0.35, z, 0, -0.9, Math.PI / 2));
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9a3a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const flameMat2 = new THREE.MeshBasicMaterial({ color: 0xffe07a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.35 - i * 0.05, 1.3 - i * 0.15, 7), i % 2 ? flameMat2 : flameMat);
    f.position.set(x + (i - 1.5) * 0.12, y + 0.8, z + ((i % 2) - 0.5) * 0.15);
    scene.add(f);
    flames.push(f);
  }
  ctx.animated.push((dt, t) => {
    flames.forEach((f, i) => {
      const k = 1 + Math.sin(t * (9 + i * 2.3) + i) * 0.18 + Math.sin(t * 23 + i * 5) * 0.08;
      f.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
      f.rotation.y = t * (1 + i * 0.4);
    });
  });
  glow.add(x, y + 1.0, z, 0xff9a40, 7, 1.1);
  ctx.lanterns.push({ x, y: y + 1.6, z, intensity: 55 });
  ctx.terrainMesh.userData.addWarmth(x, z, 11, 1.0);
  collision.addCircle(x, z, 1.4, 'campfire');
  addLog(ctx, x - 3.2, z + 0.5, 0.2, 3);
  addLog(ctx, x + 2.6, z + 2.4, -0.9, 3);
  addLog(ctx, x + 0.4, z - 3.3, 1.5, 3);
}

// A wooden pier from a water end (x, z) back toward land along (dirX, dirZ) until the shore reaches `top`.
// cap: the snow on each post top (Book 2's warm islands pass null).
export function buildPier(ctx, { x, z, dirX, dirZ, w, top = 1.0, minLen = 6, cap = 0xf4f8ff }) {
  const { scene, terrain, batch } = ctx;
  let len = minLen;
  for (let d = 0; d < 45; d += 0.5) {
    if (terrain.heightAt(x + dirX * d, z + dirZ * d) >= top - 0.1) { len = Math.max(minLen, d + 1.5); break; }
  }
  const yaw = Math.atan2(dirX, dirZ);
  const cx = x + (dirX * len) / 2, cz = z + (dirZ * len) / 2;
  const deck = shadowed(new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.24, len),
    lambert({ map: woodTexture(), color: 0xe7c8a8 }, { strength: 0.2 }),
  ));
  deck.position.set(cx, top - 0.12, cz);
  deck.rotation.y = yaw;
  scene.add(deck);
  const n = Math.ceil(len / 3.2);
  for (let i = 0; i <= n; i++) {
    for (const s of [-1, 1]) {
      const p = toWorld(cx, cz, yaw, s * (w / 2 - 0.15), -len / 2 + (len * i) / n);
      const bottom = Math.min(terrain.heightAt(p.x, p.z), WATER_Y) - 0.5;
      const h = top + 0.4 - bottom;
      batch.add(new THREE.CylinderGeometry(0.15, 0.17, h, 7), 0x5e3a22, mat(p.x, bottom + h / 2, p.z));
      if (cap !== null) batch.add(new THREE.SphereGeometry(0.18, 6, 4), cap, mat(p.x, top + 0.42, p.z, 0, 0, 0, 1, 0.5, 1));
    }
  }
  const platform = ctx.collision.addPlatform({ kind: 'box', x: cx, z: cz, hw: w / 2, hd: len / 2, rot: yaw, top });
  const lp = toWorld(cx, cz, yaw, w / 2 - 0.3, -len / 2 + 0.5);
  addLantern(ctx, lp.x, lp.z, 1.8, top);
  return {
    top, platform, yaw, len,
    waterEnd: { x, z },
    landEnd: { x: x + dirX * len, z: z + dirZ * len },
  };
}

export function buildStructures(ctx) {
  const { scene } = ctx;
  ctx.animated = ctx.animated || [];
  ctx.batch = new PropBatch();
  ctx.lanternGlass = [];

  buildIgloo(ctx);
  addFlag(ctx, LOC.flag.x, LOC.flag.z, 'snowflake', 7.5, 0.4);
  // Professor's star chart easel
  {
    const { x, z } = LOC.easel;
    const y = ctx.terrain.heightAt(x, z);
    const yaw = faceYaw(x, z, LOC.start.x, LOC.start.z);
    for (const s of [-1, 1]) ctx.batch.add(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 5), 0x5e3a22, worldMat(x, y, z, yaw, s * 0.7, 1.3, 0, -0.15, 0, s * 0.05));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), lambert({ map: signTexture(['Star Charts']) }, false));
    board.position.set(x, y + 2.0, z);
    board.rotation.y = yaw;
    board.rotation.x = -0.15;
    scene.add(board);
    ctx.collision.addCircle(x, z, 0.8, 'easel');
  }

  addSnowman(ctx, -86, 112, 0.6, 'top');
  addSnowman(ctx, 20, 72, -0.4, 'bucket');
  addSnowman(ctx, 122, 60, -1.8, null);
  addSnowman(ctx, -118, -6, 1.2, 'bucket');
  addSnowman(ctx, 86, 118, -2.4, 'top');

  // Heart Huts village
  for (const h of [LOC.hutA, LOC.hutB, LOC.hutC]) buildHut(ctx, h.x, h.z, faceYaw(h.x, h.z, LOC.huts.x, LOC.huts.z));
  buildSnackShack(ctx);
  buildCampfire(ctx);
  addCrate(ctx, 110, 36, 0.3);
  addBarrel(ctx, 109, 38.5);
  addBarrel(ctx, 134, 48);

  // Lake: fishing dock and floe launch jetty
  ctx.dock = buildPier(ctx, { x: LOC.dock.x1, z: LOC.dock.z, dirX: -1, dirZ: 0, w: LOC.dock.w, top: LOC.dock.top });
  ctx.launch = buildPier(ctx, { x: LOC.launch.x0, z: LOC.launch.z1, dirX: 0, dirZ: 1, w: LOC.launch.w, top: LOC.launch.top });
  const dl = ctx.dock.landEnd;
  addBarrel(ctx, dl.x - 1.5, dl.z + 3.0);
  addCrate(ctx, dl.x - 4.2, dl.z - 3.4, 0.2, 0.9);
  const ll = ctx.launch.landEnd;
  addLantern(ctx, ll.x + 3.2, ll.z + 1.2, 2.2);
  addLantern(ctx, ll.x - 3.2, ll.z + 1.2, 2.2);

  // Signposts at junctions
  addSignpost(ctx, -61, 70, [
    { text: 'Glimmer Lake', tx: 0, tz: 40 },
    { text: 'Snowdrift Home', tx: -100, tz: 100 },
    { text: 'Fishing Dock', tx: -60, tz: -4 },
  ]);
  addSignpost(ctx, 4, 66, [
    { text: 'Floe Hop', tx: 0, tz: 40 },
    { text: 'Heart Huts', tx: 118, tz: 50 },
  ]);
  addSignpost(ctx, -74, 8, [
    { text: 'Crystal Grove', tx: -140, tz: -30 },
    { text: 'Fishing Dock', tx: -50, tz: -4 },
  ]);
  addSignpost(ctx, -108, -14, [
    { text: 'Gloom Ridge', tx: -100, tz: -80 },
    { text: 'Crystal Grove', tx: -140, tz: -30 },
  ]);
  addSignpost(ctx, 106, 30, [
    { text: 'Aurora Spire', tx: 112, tz: -30 },
    { text: 'Glacier Cave', tx: 100, tz: 110 },
    { text: 'Glimmer Lake', tx: 40, tz: 40 },
  ]);

  // Lantern glass: one instanced unlit mesh for every lantern.
  const glassMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), new THREE.MeshBasicMaterial({ color: 0xffd98a }), 64);
  glassMesh.count = 0;
  ctx.finishLanterns = () => {
    glassMesh.count = Math.min(64, ctx.lanternGlass.length);
    ctx.lanternGlass.slice(0, 64).forEach((m, i) => glassMesh.setMatrixAt(i, m));
    glassMesh.instanceMatrix.needsUpdate = true;
    glassMesh.computeBoundingSphere();
  };
  scene.add(glassMesh);
  ctx.finishBatch = () => {
    ctx.finishLanterns();
    scene.add(ctx.batch.build(lambert({ vertexColors: true }, { strength: 0.25 })));
  };
  return ctx;
}

export { addLantern as lantern, addCrate, addBarrel, addSnowman, addFlag, addSignpost, glowTexture, worldMat, shadowed };
