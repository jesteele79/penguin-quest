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

// Head shape and face layout, shared by the penguin model and anything worn on the face.
export const HEAD_R = { x: 0.8, y: 0.78, z: 0.78 };
export const FACE = { eyeX: 0.27, eyeY: -0.06, beakY: -0.25 };
// Hats sit this much higher than the head centre so the brim clears the big eyes.
export const HAT_LIFT = 0.13;
const faceZ = (x, y) => HEAD_R.z * Math.sqrt(1 - (x / HEAD_R.x) ** 2 - (y / HEAD_R.y) ** 2);

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
    const z = faceZ(FACE.eyeX, FACE.eyeY) + 0.06;
    // The hat slot is lifted, so the glasses come back down to eye level.
    const y = FACE.eyeY - HAT_LIFT;
    for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(0.23, 0.035, 6, 20), rim, s * FACE.eyeX, y, z, 0, s * 0.42, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), rim, 0, y + 0.04, z + 0.04, 0, 0, Math.PI / 2));
    g.add(mesh(new THREE.SphereGeometry(0.8, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), solid(0x6b5a44), 0, 0.2, -0.05, -0.15, 0, 0, 1, 0.55, 1));
    return g;
  },
};

// ---------------------------------------------------------------- the Ember Isles cast
Object.assign(HATS, {
  // Rockhopper plumes: golden feathers sweep back from above each eye.
  crest(color = 0xffd23d) {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const plume = mesh(new THREE.ConeGeometry(0.05 - i * 0.006, 0.62 + i * 0.08, 5), solid(color), s * (0.34 + i * 0.09), 0.18 - HAT_LIFT + i * 0.05, 0.42 - i * 0.16);
        plume.rotation.set(-1.1 - i * 0.12, 0, -s * (1.25 + i * 0.08), 'YXZ');
        g.add(plume);
      }
    }
    return g;
  },
  // Brass inventor's goggles pushed up on the forehead.
  goggles() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.TorusGeometry(0.8, 0.06, 6, 28), solid(0x4a3428), 0, 0.12, 0, Math.PI / 2 - 0.25));
    for (const s of [-1, 1]) {
      const x = s * 0.27, y = 0.3;
      const z = faceZ(x, y - HAT_LIFT * 0.5) + 0.04;
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.16, 16), solid(0xc89a3a), x, y, z, Math.PI / 2 - 0.35, 0, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.17, 16), basic(0x9fe8ff), x, y + 0.01, z + 0.02, Math.PI / 2 - 0.35, 0, 0));
    }
    return g;
  },
  chef() {
    const g = new THREE.Group();
    const white = solid(0xffffff);
    g.add(mesh(new THREE.CylinderGeometry(0.66, 0.7, 0.42, 20), white, 0, 0.52, 0));
    g.add(mesh(new THREE.SphereGeometry(0.74, 18, 12), white, 0, 1.08, 0, 0, 0, 0, 1, 0.72, 1));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.add(mesh(new THREE.SphereGeometry(0.34, 12, 8), white, Math.cos(a) * 0.45, 1.12, Math.sin(a) * 0.45));
    }
    return g;
  },
  // A yellow fisherman's rain hat, longer at the back.
  souwester(color = 0xffd23d) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.84, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), solid(color), 0, 0.14, 0, 0, 0, 0, 1, 0.9, 1));
    const brim = mesh(new THREE.CylinderGeometry(0.98, 1.22, 0.07, 24), solid(color), 0, 0.12, -0.12, -0.18);
    g.add(brim);
    return g;
  },
  // A hibiscus tucked behind one ear.
  hibiscus(color = 0xff5c8a) {
    const g = new THREE.Group();
    const flower = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      flower.add(mesh(new THREE.SphereGeometry(0.17, 10, 6), solid(color), Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0, 0, 0, a, 1.3, 0.8, 0.35));
    }
    flower.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), solid(0xffd23d), 0, 0, 0.06));
    flower.add(mesh(new THREE.SphereGeometry(0.16, 8, 4), solid(0x3a9a4a), -0.18, -0.2, -0.05, 0, 0, 0.6, 1.4, 0.5, 0.3));
    flower.position.set(0.66, 0.16, 0.24);
    flower.rotation.set(0, 1.0, 0);
    g.add(flower);
    return g;
  },
  // A glider pilot's leather cap with ear flaps, goggles up on the front.
  aviator(color = 0x8a5a3a) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.86, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), solid(color), 0, 0.1, -0.02, 0, 0, 0, 1, 0.92, 1));
    for (const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.3, 12, 8), solid(color), s * 0.74, -0.18, 0.02, 0, 0, 0, 0.45, 1, 0.8));
    g.add(mesh(new THREE.TorusGeometry(0.83, 0.05, 6, 28), solid(0x3a2a20), 0, 0.2, 0, Math.PI / 2 - 0.1));
    for (const s of [-1, 1]) {
      const x = s * 0.26, y = 0.5;
      const z = faceZ(x * 0.9, y - HAT_LIFT - 0.1) + 0.06;
      g.add(mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.14, 16), solid(0x9a9aa8), x, y, z, Math.PI / 2 - 0.7, 0, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.15, 16), basic(0xbfe8ff), x, y + 0.01, z + 0.02, Math.PI / 2 - 0.7, 0, 0));
    }
    return g;
  },
  // A soft midnight hood speckled with stars, its tip flopping over.
  starhood(color = 0x2a2f7a) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.9, 20, 12, 0, Math.PI * 2, 0, Math.PI / 1.9), solid(color), 0, 0.06, -0.06, 0, 0, 0, 1.02, 1.05, 1));
    g.add(mesh(new THREE.ConeGeometry(0.42, 0.9, 14), solid(color), 0.12, 1.02, -0.18, -0.5, 0, -0.6));
    g.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), basic(0xffe27a), 0.55, 1.18, -0.32));
    for (const [x, y, z] of [[0.3, 0.7, 0.55], [-0.42, 0.55, 0.5], [0.0, 0.88, 0.3], [-0.6, 0.3, 0.42], [0.62, 0.36, 0.38]]) g.add(mesh(new THREE.SphereGeometry(0.05, 6, 4), basic(0xfff1b0), x, y, z));
    return g;
  },
  // A beanie with a little propeller on top.
  propeller(color = 0x5aa9e6) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.84, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), solid(color), 0, 0.12, 0, 0, 0, 0, 1, 0.82, 1));
    g.add(mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.14, 22), solid(0xffd23d), 0, 0.14, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6), solid(0x3a3a48), 0, 0.92, 0));
    for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.62, 0.03, 0.14), solid(s < 0 ? 0xff5c5c : 0x39d98a), s * 0.32, 1.08, 0, 0, 0, s * 0.15));
    return g;
  },
  sunhat(color = 0xe8c77a) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.06, 28), solid(color), 0, 0.42, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.58, 0.68, 0.46, 20), solid(color), 0, 0.66, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.69, 0.69, 0.12, 20), solid(0xff5c5c), 0, 0.5, 0));
    return g;
  },
});

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
  // Sized just outside the body (radii 1.0, 1.02, 0.95 at y 1.0) so it drapes over the belly.
  const m = mesh(new THREE.SphereGeometry(1, 20, 14, Math.PI / 2 - 0.85, 1.7, 0.95, 1.15), solid(color), 0, 1.0, 0.02, 0, 0, 0, 1.03, 1.04, 0.98);
  return m;
}

// A flower lei worn instead of a scarf.
export function lei(colors = [0xff5c8a, 0xffd23d, 0xffffff, 0xff8a3d]) {
  const g = new THREE.Group();
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.add(mesh(new THREE.IcosahedronGeometry(0.15, 0), solid(colors[i % colors.length]), Math.cos(a) * 0.86, Math.sin(a * 2) * 0.03 - (Math.sin(a) > 0 ? Math.sin(a) * 0.08 : 0), Math.sin(a) * 0.82));
  }
  g.position.y = 1.64;
  return g;
}

// Soot smudges from a busy workshop.
export function soot(p) {
  const s = solid(0x3a3236);
  p.head.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), s, 0.42, -0.32, 0.56, 0, 0.6, 0, 1.2, 0.7, 0.3));
  p.body.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), s, -0.32, 0.86, 0.86, 0, -0.3, 0, 1.3, 0.8, 0.3));
}
