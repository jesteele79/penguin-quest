import * as THREE from 'three';
import { lambert } from '../core/materials.js';

const matCache = new Map();
export function solid(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, lambert({ color, ...opts }, opts.emissive ? false : undefined));
  return matCache.get(key);
}
const basicCache = new Map();
export function basic(color) {
  if (!basicCache.has(color)) basicCache.set(color, new THREE.MeshBasicMaterial({ color }));
  return basicCache.get(color);
}

function mesh(geo, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

// Every hat is built in head-local space: origin at the head center, head radius ~0.78.
export const HATS = {
  beanie(color = 0x3aa0ff) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.82, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), solid(color), 0, 0.12, 0, 0, 0, 0, 1, 0.85, 1));
    g.add(mesh(new THREE.TorusGeometry(0.8, 0.13, 8, 24), solid(0xffffff), 0, 0.14, 0, Math.PI / 2));
    g.add(mesh(new THREE.SphereGeometry(0.24, 12, 10), solid(0xffffff), 0, 0.92, 0));
    return g;
  },
  tophat() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.95, 20), solid(0x1a1a24), 0, 0.95, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.07, 24), solid(0x1a1a24), 0, 0.5, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.16, 20), solid(0xd8333f), 0, 0.62, 0));
    return g;
  },
  crown() {
    const g = new THREE.Group();
    const gold = solid(0xffcc3d, { emissive: 0x6a4a00 });
    g.add(mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.35, 16, 1, true), gold, 0, 0.62, 0));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(mesh(new THREE.ConeGeometry(0.13, 0.36, 6), gold, Math.cos(a) * 0.55, 0.95, Math.sin(a) * 0.55));
      g.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), solid(i % 2 ? 0x4de1ff : 0xff4d8a, { emissive: i % 2 ? 0x0a4a5a : 0x5a0a2a }), Math.cos(a) * 0.6, 0.62, Math.sin(a) * 0.6));
    }
    g.position.y = -0.05;
    return g;
  },
  pirate() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.8, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), solid(0x222230), 0, 0.3, 0, 0, 0, 0, 1.25, 0.7, 0.9));
    g.add(mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 3), solid(0x222230), 0, 0.33, 0, 0, Math.PI / 2, 0, 1, 1, 0.65));
    g.add(mesh(new THREE.SphereGeometry(0.13, 10, 8), solid(0xffffff), 0, 0.62, 0.62));
    return g;
  },
  viking() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.84, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), solid(0xa6b0c4), 0, 0.12, 0));
    g.add(mesh(new THREE.TorusGeometry(0.83, 0.08, 6, 24), solid(0xc99a3b), 0, 0.14, 0, Math.PI / 2));
    for (const s of [-1, 1]) {
      const horn = mesh(new THREE.ConeGeometry(0.16, 0.8, 10), solid(0xfff4dc), s * 0.85, 0.6, 0, 0, 0, -s * 0.9);
      g.add(horn);
    }
    return g;
  },
  wizard() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.ConeGeometry(0.62, 1.7, 16), solid(0x4b3bb8), 0, 1.25, 0, -0.12));
    g.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 24), solid(0x4b3bb8), 0, 0.42, 0));
    g.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), basic(0xffe27a), 0.18, 1.0, 0.42));
    g.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), basic(0xffe27a), -0.22, 1.4, 0.28));
    return g;
  },
  party(color = 0xff5ab0) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.ConeGeometry(0.45, 1.2, 16), solid(color), 0, 1.05, 0));
    g.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), solid(0xffe14d), 0, 1.7, 0));
    return g;
  },
  earmuffs(color = 0xff7ab8) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.TorusGeometry(0.82, 0.07, 6, 24, Math.PI), solid(0xdde3f0), 0, 0.02, 0, 0, 0, 0));
    for (const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.3, 14, 10), solid(color), s * 0.8, -0.05, 0));
    return g;
  },
  headphones() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.TorusGeometry(0.84, 0.08, 6, 24, Math.PI), solid(0x2b2f45), 0, 0.02, 0));
    for (const s of [-1, 1]) {
      g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 16), solid(0x2b2f45), s * 0.82, -0.05, 0, 0, 0, Math.PI / 2));
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.21, 16), basic(0x45e6ff), s * 0.84, -0.05, 0, 0, 0, Math.PI / 2));
    }
    return g;
  },
  sailor() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.4, 20), solid(0xffffff), 0, 0.62, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.12, 20), solid(0x22346e), 0, 0.46, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16, 1, false, 0, Math.PI), solid(0x1a1a2a), 0, 0.42, 0.35, 0.2));
    return g;
  },
  bow(color = 0xb05cff) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), solid(color), 0.35, 0.62, 0.1));
    g.add(mesh(new THREE.ConeGeometry(0.2, 0.36, 8), solid(color), 0.13, 0.64, 0.1, 0, 0, Math.PI / 2));
    g.add(mesh(new THREE.ConeGeometry(0.2, 0.36, 8), solid(color), 0.57, 0.64, 0.1, 0, 0, -Math.PI / 2));
    return g;
  },
  flowers() {
    const g = new THREE.Group();
    const cols = [0xff7ab8, 0xffe14d, 0x7affc8, 0xffffff, 0xff9f5a];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.add(mesh(new THREE.SphereGeometry(0.13, 8, 6), solid(cols[i % cols.length]), Math.cos(a) * 0.62, 0.42, Math.sin(a) * 0.62));
    }
    g.add(mesh(new THREE.TorusGeometry(0.62, 0.05, 6, 24), solid(0x3a8a4a), 0, 0.4, 0, Math.PI / 2));
    return g;
  },
  helmetLamp() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.84, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), solid(0xffc234), 0, 0.12, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 14), solid(0x555a6a), 0, 0.55, 0.62, Math.PI / 2 - 0.3));
    g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 14), basic(0xfff3b0), 0, 0.58, 0.73, Math.PI / 2 - 0.3));
    return g;
  },
  scholar() {
    // Professor: round glasses sit on the face, plus a small tweed cap.
    const g = new THREE.Group();
    const rim = solid(0x3b2a1a);
    for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 18), rim, s * 0.27, 0.06, 0.74));
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 6), rim, 0, 0.08, 0.78, 0, 0, Math.PI / 2));
    g.add(mesh(new THREE.SphereGeometry(0.8, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), solid(0x6b5a44), 0, 0.2, -0.05, -0.15, 0, 0, 1, 0.55, 1));
    return g;
  },
};

export const HAT_LIST = ['beanie', 'earmuffs', 'party', 'tophat', 'pirate', 'headphones', 'wizard', 'viking', 'crown'];

export function buildHat(id, color) {
  const fn = HATS[id];
  return fn ? fn(color) : null;
}

// Neck/body extras.
export function bowTie(color = 0xd8333f) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.ConeGeometry(0.16, 0.28, 8), solid(color), -0.14, 0, 0, 0, 0, -Math.PI / 2));
  g.add(mesh(new THREE.ConeGeometry(0.16, 0.28, 8), solid(color), 0.14, 0, 0, 0, 0, Math.PI / 2));
  g.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), solid(color), 0, 0, 0.02));
  return g;
}

export function apron(color = 0xff9fc6) {
  // phi is centered on +z (phi = PI/2 faces forward in SphereGeometry).
  const m = mesh(new THREE.SphereGeometry(1, 16, 12, Math.PI / 2 - 0.9, 1.8, 0.9, 1.2), solid(color), 0, 1.05, 0.06, 0, 0, 0, 0.8, 0.95, 0.82);
  return m;
}
