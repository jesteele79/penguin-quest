import * as THREE from 'three';
import { withRim } from '../core/materials.js';
import { glowTexture } from '../core/textures.js';
import { damp } from '../core/mathutil.js';

let furGeo = null;
function fuzzyBody() {
  if (furGeo) return furGeo;
  const g = new THREE.IcosahedronGeometry(1, 3);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    if (!seen.has(key)) {
      const n = Math.sin(v.x * 9.1 + v.y * 3.7) * Math.cos(v.z * 8.3 - v.y * 5.1);
      seen.set(key, 1 + Math.max(0, n) * 0.28 + Math.abs(Math.sin(v.x * 23 + v.z * 19)) * 0.07);
    }
    v.multiplyScalar(seen.get(key));
    v.y *= 0.9;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  furGeo = g;
  return g;
}

const EYE = new THREE.SphereGeometry(0.2, 12, 8);
const HAPPY_EYE = new THREE.TorusGeometry(0.15, 0.045, 6, 12, Math.PI);
// Book 1's Glooms are cold purple shadow; Book 2's Sootlings are puffs of soot with ember eyes.
const LOOKS = {
  gloom: { body: 0x2c2152, emissive: 0x1a0f38, rim: 0x9a6bff, horn: 0x241a44, eye: 0xffe27a, brow: 0x120a24, glow: 0x7a4ad8, happy: [0x4dffa0, 0x45e2ff, 0xff78d2, 0xffd166, 0xb483ff], horns: true },
  soot: { body: 0x3a3436, emissive: 0x1a1214, rim: 0xff8a3d, horn: 0x2a2426, eye: 0xffa040, brow: 0x140e10, glow: 0xff6a2a, happy: [0xffd166, 0xff9a3c, 0xff5c8a, 0x7fe0d0, 0xfff1d6], horns: false },
  hush: { body: 0x8c88b8, emissive: 0x24223e, rim: 0xe0d8ff, horn: 0x6a6694, eye: 0xfff4c8, brow: 0x4a4670, glow: 0xb8b0ff, happy: [0xfff1d6, 0xffd6f0, 0xd6f0ff, 0xe8ffe0, 0xfff4b0], horns: false },
};

export class Gloom {
  constructor(scene, { scale = 1, king = false, soot = false, hush = false } = {}) {
    const L = LOOKS[hush ? 'hush' : soot ? 'soot' : 'gloom'];
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.scale.setScalar(scale);
    this.bodyMat = withRim(new THREE.MeshLambertMaterial({ color: L.body, emissive: L.emissive, flatShading: true }), { color: L.rim, power: 2.2, strength: 0.7 });
    this.body = new THREE.Mesh(fuzzyBody(), this.bodyMat);
    this.body.position.y = 1.0;
    this.body.castShadow = true;
    this.root.add(this.body);
    const hornMat = new THREE.MeshLambertMaterial({ color: L.horn, flatShading: true });
    if (L.horns) {
      for (const s of [-1, 1]) {
        const h = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 5), hornMat);
        h.position.set(s * 0.5, 1.95, 0);
        h.rotation.z = -s * 0.45;
        this.root.add(h);
      }
    } else {
      // Wisps of smoke curling off the top of the head.
      this.wisps = [0.36, 0.26, 0.18].map((r, i) => {
        const w = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), this.bodyMat);
        w.position.set((i - 1) * 0.18, 2.0 + i * 0.32, -0.05 * i);
        this.root.add(w);
        return w;
      });
    }
    this.eyeMat = new THREE.MeshBasicMaterial({ color: L.eye });
    this.eyes = [];
    this.happyEyes = [];
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(EYE, this.eyeMat);
      e.position.set(s * 0.33, 1.18, 0.86);
      e.scale.set(1, 0.72, 0.5);
      this.root.add(e);
      this.eyes.push(e);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.08), new THREE.MeshBasicMaterial({ color: L.brow }));
      brow.position.set(s * 0.33, 1.4, 0.9);
      brow.rotation.z = s * 0.35;
      this.root.add(brow);
      this.eyes.push(brow);
      const he = new THREE.Mesh(HAPPY_EYE, new THREE.MeshBasicMaterial({ color: 0x1a1333 }));
      he.position.set(s * 0.33, 1.15, 0.92);
      he.visible = false;
      this.root.add(he);
      this.happyEyes.push(he);
    }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 5, 10, Math.PI), new THREE.MeshBasicMaterial({ color: L.eye }));
    mouth.position.set(0, 0.8, 0.92);
    mouth.rotation.z = Math.PI;
    this.mouth = mouth;
    this.root.add(mouth);
    for (const s of [-1, 1]) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), hornMat);
      f.position.set(s * 0.4, 0.12, 0.2);
      f.scale.set(1, 0.6, 1.3);
      this.root.add(f);
    }
    if (king) {
      const crownMat = new THREE.MeshLambertMaterial({ color: 0xcfeaff, emissive: 0x6a8aff, emissiveIntensity: 0.6, flatShading: true });
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const ic = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.7 + (i % 2) * 0.35, 5), crownMat);
        ic.position.set(Math.cos(a) * 0.55, 2.05 + (i % 2) * 0.15, Math.sin(a) * 0.55);
        this.root.add(ic);
      }
    }
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: L.glow, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.glow.position.y = 1;
    this.glow.scale.setScalar(4.5);
    this.root.add(this.glow);
    scene.add(this.root);
    this.t = Math.random() * 10;
    this.state = 'grumpy';
    this.happy = 0;
    this.rise = 0;
    this.happyColor = new THREE.Color(L.happy[Math.floor(Math.random() * L.happy.length)]);
    this.baseColor = new THREE.Color(L.body);
    this.hop = 0;
  }

  get position() { return this.root.position; }

  cheerUp() {
    if (this.state !== 'grumpy') return;
    this.state = 'happy';
    this.eyes.forEach((e) => { e.visible = false; });
    this.happyEyes.forEach((e) => { e.visible = true; });
    this.mouth.rotation.z = 0;
    this.mouth.material.color.set(0x1a1333);
  }

  // Float up and fade into the aurora.
  ascend() { this.state = 'ascend'; }

  bump() { this.hop = 1; }

  update(dt, lookAt) {
    this.t += dt;
    const t = this.t;
    if (this.wisps) this.wisps.forEach((w, i) => { w.position.x = (i - 1) * 0.18 + Math.sin(t * 2 + i) * 0.08; w.position.y = 2.0 + i * 0.32 + this.body.position.y - 1.0; });
    if (this.state === 'grumpy') {
      this.body.position.y = 1.0 + Math.abs(Math.sin(t * 4)) * 0.18;
      this.body.scale.set(1 + Math.sin(t * 8) * 0.03, 1 - Math.sin(t * 8) * 0.03, 1);
      this.root.rotation.z = Math.sin(t * 2) * 0.05;
    } else {
      this.happy = Math.min(1, this.happy + dt * 1.5);
      this.bodyMat.color.copy(this.baseColor).lerp(this.happyColor, this.happy);
      this.bodyMat.emissive.copy(this.happyColor).multiplyScalar(0.35 * this.happy);
      this.glow.material.color.copy(this.happyColor);
      this.glow.material.opacity = 0.45 + this.happy * 0.4;
      this.body.position.y = 1.0 + Math.abs(Math.sin(t * 7)) * 0.5;
      this.root.rotation.y += dt * 3 * this.happy;
    }
    if (this.state === 'ascend') {
      this.rise += dt;
      this.root.position.y += dt * (2 + this.rise * 6);
      const s = Math.max(0.01, this.root.scale.x * (1 - dt * 0.35));
      this.root.scale.setScalar(s);
    }
    if (this.hop > 0) {
      this.hop = Math.max(0, this.hop - dt * 2.5);
      this.root.position.y += Math.sin(this.hop * Math.PI) * 0.05;
    }
    if (lookAt && this.state === 'grumpy') {
      const want = Math.atan2(lookAt.x - this.root.position.x, lookAt.z - this.root.position.z);
      this.root.rotation.y = damp(this.root.rotation.y, want, 6, dt);
    }
  }

  get gone() { return this.state === 'ascend' && this.rise > 3; }

  dispose() { this.scene.remove(this.root); }
}
