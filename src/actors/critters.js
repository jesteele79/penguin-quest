// Friends who are not penguins: Tortuga the old sea turtle, Shelldon the hermit crab, Tock the clockwork owl
// and the puffins of Skyreach. They share the penguin model's interface (root, animate, updateAttachments,
// setVisible, setCulled), so NPCs, dialog and cutscenes treat them the same way.
import * as THREE from 'three';
import { lambert, plush, CHARACTER_RIM } from '../core/materials.js';
import { glowTexture } from '../core/textures.js';
import { clamp, damp } from '../core/mathutil.js';
import { mergeColored } from '../core/geo.js';

const SPH = new THREE.SphereGeometry(1, 22, 14);
const SPH_LO = new THREE.SphereGeometry(1, 12, 8);
const cache = new Map();
const plushOf = (color) => { if (!cache.has(color)) cache.set(color, plush(lambert({ color }, CHARACTER_RIM))); return cache.get(color); };
const unlit = (color) => { const k = 'u' + color; if (!cache.has(k)) cache.set(k, new THREE.MeshBasicMaterial({ color })); return cache.get(k); };
let plushVC = null, unlitVC = null;

// Merge each group's still parts into one mesh per kind (plush or unlit), so a critter costs a handful of
// draw calls instead of dozens. Groups keep their place, so heads, wings, claws and blinking eyes still move;
// meshes that move on their own are passed in skip and left alone.
function bake(group, skip) {
  const kinds = { plush: [], unlit: [] };
  for (const m of group.children) {
    if (!m.isMesh || skip.has(m)) continue;
    const kind = m.material.isMeshBasicMaterial ? 'unlit' : 'plush';
    m.updateMatrix();
    kinds[kind].push(m);
  }
  for (const [kind, list] of Object.entries(kinds)) {
    if (list.length < 2) continue;
    plushVC ??= plush(lambert({ vertexColors: true }, CHARACTER_RIM));
    unlitVC ??= new THREE.MeshBasicMaterial({ vertexColors: true });
    const merged = new THREE.Mesh(mergeColored(list.map((m) => ({ geo: m.geometry, color: m.material.color.getHex(), matrix: m.matrix }))), kind === 'plush' ? plushVC : unlitVC);
    merged.castShadow = kind === 'plush';
    for (const m of list) group.remove(m);
    group.add(merged);
  }
  for (const c of [...group.children]) if (!c.isMesh) bake(c, skip);
}

function part(geo, material, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  return m;
}

// Big glossy cartoon eyes: dark eye, two catchlights. Returns a group so it can blink (scale.y).
function cuteEye(r, iris = 0x2a5cc8) {
  const g = new THREE.Group();
  g.add(part(SPH_LO, unlit(0x10142a), 0, 0, 0, r, r * 1.15, r * 0.6));
  g.add(part(SPH_LO, unlit(iris), 0, -r * 0.1, r * 0.08, r * 0.72, r * 0.82, r * 0.55));
  g.add(part(SPH_LO, unlit(0x05060c), 0, -r * 0.1, r * 0.14, r * 0.36, r * 0.42, r * 0.5));
  g.add(part(SPH_LO, unlit(0xffffff), r * 0.28, r * 0.38, r * 0.42, r * 0.3, r * 0.3, r * 0.2));
  g.add(part(SPH_LO, unlit(0xffffff), -r * 0.22, -r * 0.42, r * 0.42, r * 0.14, r * 0.14, r * 0.12));
  return g;
}

let shadowMat = null;
function blobShadow(scene) {
  shadowMat ??= new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0x000010, transparent: true, opacity: 0.42, depthWrite: false });
  const m = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20), shadowMat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  scene.add(m);
  return m;
}

class Critter {
  constructor(scene, opts) {
    this.scene = scene;
    this.opts = opts;
    this.root = new THREE.Group();
    this.root.name = opts.name || 'critter';
    this.root.scale.setScalar(opts.scale ?? 1);
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.shadow = blobShadow(scene);
    this.shadowSize = 1.6;
    scene.add(this.root);
    this.time = Math.random() * 10;
    this.blinkT = 2 + Math.random() * 3;
    this.blink = 0;
    this.celebrate = 0;
    this.eyes = [];
  }

  setVisible(v) { this.shown = v; this.applyVisibility(); }

  setCulled(c) { if (this.culled !== c) { this.culled = c; this.applyVisibility(); } }

  applyVisibility() {
    const v = this.shown !== false && !this.culled;
    this.root.visible = v;
    this.shadow.visible = v;
  }

  get position() { return this.root.position; }

  // Called at the end of each critter's constructor, once every part is in place.
  bakeParts(skip = []) { bake(this.root, new Set(skip)); }

  land() {}

  hop() {}

  spin() {}

  // Blinks and happy squints, shared by both critters.
  blinkEyes(dt) {
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.14; this.blinkT = 2.4 + Math.random() * 3.5; }
    if (this.blink > 0) this.blink -= dt;
    const squint = this.celebrate > 0.5 ? 0.35 : 1;
    for (const e of this.eyes) e.scale.y = this.blink > 0 ? 0.12 : squint;
  }

  updateAttachments(dt, groundY) {
    const s = this.root.scale.x;
    this.shadow.position.set(this.root.position.x, groundY + 0.06, this.root.position.z);
    this.shadow.scale.setScalar(s * this.shadowSize);
  }

  dispose() { this.scene.remove(this.root); this.scene.remove(this.shadow); }
}

// ------------------------------------------------------------ Tortuga
export class Turtle extends Critter {
  constructor(scene, opts = {}) {
    super(scene, opts);
    this.shadowSize = 2.2;
    const b = this.body;
    const shellCol = opts.shell ?? 0x5f7d3c, skin = opts.skin ?? 0x8cc4a0;
    b.add(part(SPH, plushOf(shellCol), 0, 0.95, 0, 1.5, 0.78, 1.7));
    b.add(part(SPH, plushOf(0xe6d4a0), 0, 0.62, 0.05, 1.42, 0.32, 1.62));
    b.add(part(new THREE.TorusGeometry(1.0, 0.11, 8, 28), plushOf(0x6b5232), 0, 0.72, 0, 1.48, 1.68, 1, Math.PI / 2));
    // Lighter plates on the shell.
    const plate = plushOf(opts.plate ?? 0x86a556);
    b.add(part(SPH_LO, plate, 0, 1.68, 0.1, 0.62, 0.12, 0.7));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.5;
      b.add(part(SPH_LO, plate, Math.cos(a) * 0.86, 1.36, Math.sin(a) * 1.0, 0.42, 0.1, 0.46, -Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5));
    }
    // Flippers: the front pair is big for swimming.
    this.flippers = [];
    for (const [x, z, s, front] of [[-1.25, 0.9, 0.95, true], [1.25, 0.9, 0.95, true], [-1.05, -1.1, 0.6, false], [1.05, -1.1, 0.6, false]]) {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.55, z);
      pivot.add(part(SPH_LO, plushOf(skin), Math.sign(x) * s * 0.7, 0, front ? 0.15 : 0, s * 0.9, s * 0.16, s * 0.5, 0, Math.sign(x) * (front ? -0.5 : 0.4), 0));
      b.add(pivot);
      this.flippers.push({ pivot, side: Math.sign(x), front });
    }
    b.add(part(new THREE.ConeGeometry(0.16, 0.5, 6), plushOf(skin), 0, 0.62, -1.75, 1, 1, 1, -Math.PI / 2 - 0.3));
    // Head on a short neck, with kind eyes and round spectacles.
    this.head = new THREE.Group();
    this.head.position.set(0, 1.05, 1.75);
    b.add(this.head);
    this.head.add(part(SPH, plushOf(skin), 0, 0.15, 0.2, 0.62, 0.56, 0.66));
    this.head.add(part(new THREE.CylinderGeometry(0.34, 0.42, 0.6, 12), plushOf(skin), 0, -0.05, -0.25, 1, 1, 1, Math.PI / 2 - 0.4));
    for (const s of [-1, 1]) {
      const e = cuteEye(0.15, 0x3a2a14);
      e.position.set(s * 0.27, 0.27, 0.72);
      e.rotation.y = s * 0.35;
      this.head.add(e);
      this.eyes.push(e);
      this.head.add(part(new THREE.TorusGeometry(0.19, 0.025, 6, 20), plushOf(0x3b2a1a), s * 0.27, 0.27, 0.78, 1, 1, 1, 0, s * 0.35, 0));
      this.head.add(part(SPH_LO, plushOf(0xff9fb0), s * 0.36, 0.06, 0.66, 0.09, 0.05, 0.03));
    }
    this.head.add(part(new THREE.TorusGeometry(0.12, 0.022, 6, 16, Math.PI), unlit(0x10142a), 0, 0.03, 0.8, 1, 1, 1, 0, 0, Math.PI));
    this.root.rotation.order = 'YXZ';
    this.bakeParts();
  }

  animate(dt, st = {}) {
    this.time += dt;
    const t = this.time;
    this.celebrate = damp(this.celebrate, st.celebrate ? 1 : 0, 6, dt);
    const breathe = 1 + Math.sin(t * 1.4) * 0.015;
    this.body.scale.set(1, breathe, 1);
    this.head.rotation.x = (st.talking ? Math.sin(t * 6) * 0.1 : Math.sin(t * 0.7) * 0.04) - this.celebrate * 0.25;
    this.head.rotation.y = Math.sin(t * 0.33) * 0.25 * (st.talking ? 0.3 : 1);
    for (const f of this.flippers) {
      const paddle = f.front ? (st.talking ? Math.sin(t * 3 + f.side) * 0.25 : Math.sin(t * 0.9 + f.side) * 0.05) : 0;
      f.pivot.rotation.z = f.side * (paddle + this.celebrate * (f.front ? 0.6 + Math.sin(t * 12) * 0.25 : 0));
    }
    this.blinkEyes(dt);
  }
}

// ------------------------------------------------------------ Shelldon
export class Crab extends Critter {
  constructor(scene, opts = {}) {
    super(scene, opts);
    this.shadowSize = 1.5;
    const b = this.body;
    const red = opts.color ?? 0xe8603a;
    b.add(part(SPH, plushOf(red), 0, 0.55, 0.2, 0.62, 0.42, 0.5));
    // The borrowed shell: a spiral of rings on his back, cream with pink stripes.
    const shell = new THREE.Group();
    shell.position.set(0, 1.05, -0.45);
    shell.rotation.set(-0.5, 0, 0.3);
    for (let i = 0; i < 5; i++) {
      const r = 0.68 - i * 0.12;
      shell.add(part(SPH, plushOf(i % 2 ? 0xf2a0a8 : 0xf6e2c2), Math.sin(i * 1.2) * 0.12, i * 0.27, Math.cos(i * 1.2) * 0.08, r, r * 0.8, r));
    }
    shell.add(part(new THREE.ConeGeometry(0.14, 0.4, 8), plushOf(0xf6e2c2), 0, 1.45, 0));
    b.add(shell);
    // Eyes on wobbly stalks.
    this.stalks = [];
    for (const s of [-1, 1]) {
      const stalk = new THREE.Group();
      stalk.position.set(s * 0.2, 0.82, 0.48);
      stalk.add(part(new THREE.CylinderGeometry(0.045, 0.06, 0.46, 6), plushOf(red), 0, 0.22, 0));
      const e = cuteEye(0.16);
      e.position.set(0, 0.52, 0.04);
      stalk.add(part(SPH_LO, plushOf(0xffffff), 0, 0.52, -0.02, 0.17, 0.19, 0.15));
      stalk.add(e);
      b.add(stalk);
      this.stalks.push({ g: stalk, side: s });
      this.eyes.push(e);
    }
    // Claws: the right one is bigger. Each has a fixed jaw and a moving one.
    this.claws = [];
    for (const s of [-1, 1]) {
      const big = s > 0 ? 1.25 : 0.9;
      const arm = new THREE.Group();
      arm.position.set(s * 0.52, 0.55, 0.45);
      arm.add(part(SPH_LO, plushOf(red), s * 0.18, 0.05, 0.12, 0.2, 0.14, 0.32, 0, s * 0.5, 0));
      const claw = new THREE.Group();
      claw.position.set(s * 0.32, 0.15, 0.4);
      claw.scale.setScalar(big);
      claw.add(part(SPH, plushOf(red), 0, 0, 0.12, 0.2, 0.17, 0.3));
      const jaw = new THREE.Group();
      jaw.position.set(0, 0.06, 0.2);
      jaw.add(part(new THREE.ConeGeometry(0.1, 0.36, 8), plushOf(red), 0, 0, 0.16, 1, 1, 1, Math.PI / 2));
      claw.add(jaw);
      claw.add(part(new THREE.ConeGeometry(0.1, 0.34, 8), plushOf(0xd04a2a), 0, -0.07, 0.34, 1, 1, 1, Math.PI / 2));
      arm.add(claw);
      b.add(arm);
      this.claws.push({ arm, jaw, side: s });
    }
    // Little legs.
    this.legs = [];
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const leg = part(new THREE.CylinderGeometry(0.035, 0.05, 0.62, 5), plushOf(red), s * 0.55, 0.28, 0.25 - i * 0.24, 1, 1, 1, 0, 0, s * 1.0);
        b.add(leg);
        this.legs.push({ leg, side: s, i });
      }
    }
    this.bakeParts(this.legs.map((l) => l.leg));
  }

  animate(dt, st = {}) {
    this.time += dt;
    const t = this.time;
    this.celebrate = damp(this.celebrate, st.celebrate ? 1 : 0, 6, dt);
    this.body.position.y = Math.abs(Math.sin(t * 2.2)) * 0.03 * (st.talking ? 2 : 1);
    for (const s of this.stalks) {
      s.g.rotation.z = Math.sin(t * 1.7 + s.side) * 0.12;
      s.g.rotation.x = Math.sin(t * 1.1 + s.side * 2) * 0.08 - (st.talking ? 0.1 : 0);
    }
    for (const c of this.claws) {
      const click = st.talking ? clamp(Math.sin(t * 9 + c.side) * 0.5 + 0.5, 0, 1) : clamp(Math.sin(t * 0.8 + c.side) * 3 - 2.4, 0, 1);
      c.jaw.rotation.x = -click * 0.5;
      c.arm.rotation.x = -this.celebrate * (1.2 + Math.sin(t * 10 + c.side) * 0.2);
      c.arm.rotation.z = c.side * this.celebrate * 0.3;
    }
    for (const l of this.legs) l.leg.rotation.x = Math.sin(t * 3 + l.i * 1.4 + l.side) * 0.06;
    this.blinkEyes(dt);
  }
}

// ------------------------------------------------------------ Tock
// A clockwork owl: polished brass, gear-ringed eyes, ear tufts, and a wind-up key turning on its back.
export class Owl extends Critter {
  constructor(scene, opts = {}) {
    super(scene, opts);
    this.shadowSize = 1.3;
    const b = this.body;
    const brass = opts.color ?? 0xc9a25a, dark = 0x7a5a32;
    b.add(part(SPH, plushOf(brass), 0, 1.15, 0, 0.95, 1.1, 0.9));
    b.add(part(SPH, plushOf(0xf2e2b8), 0, 1.0, 0.36, 0.7, 0.82, 0.62));
    // Rows of little rivets down the belly.
    for (let i = 0; i < 4; i++) b.add(part(SPH_LO, plushOf(dark), 0, 0.72 + i * 0.22, 0.95, 0.05));
    this.head = new THREE.Group();
    this.head.position.set(0, 1.95, 0.05);
    b.add(this.head);
    this.head.add(part(SPH, plushOf(brass), 0, 0.1, 0, 0.95, 0.78, 0.82));
    for (const s of [-1, 1]) {
      // Ear tufts.
      this.head.add(part(new THREE.ConeGeometry(0.16, 0.5, 6), plushOf(dark), s * 0.58, 0.72, -0.05, 1, 1, 1, 0, 0, -s * 0.35));
      // Gear-ring eyes: a toothed bronze ring around each big eye.
      const ring = new THREE.Group();
      ring.position.set(s * 0.34, 0.12, 0.62);
      ring.add(part(new THREE.TorusGeometry(0.3, 0.06, 6, 24), plushOf(dark), 0, 0, 0));
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        ring.add(part(new THREE.BoxGeometry(0.07, 0.09, 0.07), plushOf(dark), Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0, 1, 1, 1, 0, 0, a));
      }
      this.head.add(ring);
      const e = cuteEye(0.22, opts.iris ?? 0x2ec4b6);
      e.position.set(s * 0.34, 0.12, 0.66);
      this.head.add(e);
      this.eyes.push(e);
      this.head.add(part(SPH_LO, plushOf(0xff9fb0), s * 0.62, -0.18, 0.5, 0.11, 0.06, 0.04));
    }
    this.head.add(part(new THREE.ConeGeometry(0.1, 0.26, 6), plushOf(0xff9a3c), 0, -0.12, 0.8, 1, 1, 1, Math.PI / 2 + 0.3));
    // Wings at the sides, on pivots so they can flap.
    this.flippers = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.82, 1.45, 0);
      pivot.add(part(SPH, plushOf(dark), s * 0.12, -0.45, 0, 0.26, 0.7, 0.5, 0, 0, s * 0.15));
      b.add(pivot);
      this.flippers.push({ pivot, side: s });
    }
    for (const s of [-1, 1]) b.add(part(SPH_LO, plushOf(0xff9a3c), s * 0.32, 0.08, 0.3, 0.2, 0.1, 0.26));
    // The wind-up key.
    this.key = new THREE.Group();
    this.key.position.set(0, 1.3, -0.92);
    this.key.add(part(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), plushOf(0xe8c46a), 0, 0, -0.1, 1, 1, 1, Math.PI / 2));
    this.key.add(part(new THREE.TorusGeometry(0.16, 0.05, 6, 14), plushOf(0xe8c46a), -0.17, 0, -0.26, 1, 1, 1, 0, Math.PI / 2, 0));
    this.key.add(part(new THREE.TorusGeometry(0.16, 0.05, 6, 14), plushOf(0xe8c46a), 0.17, 0, -0.26, 1, 1, 1, 0, Math.PI / 2, 0));
    b.add(this.key);
    this.bakeParts();
  }

  animate(dt, st = {}) {
    this.time += dt;
    const t = this.time;
    this.celebrate = damp(this.celebrate, st.celebrate ? 1 : 0, 6, dt);
    this.body.position.y = Math.abs(Math.sin(t * 2.6)) * 0.03 * (st.talking ? 2.5 : 1) + this.celebrate * Math.abs(Math.sin(t * 8)) * 0.3;
    this.head.rotation.z = Math.sin(t * 0.7) * 0.12 + (st.talking ? Math.sin(t * 5) * 0.08 : 0);
    this.head.rotation.y = Math.sin(t * 0.4) * 0.35 * (st.talking ? 0.3 : 1);
    for (const f of this.flippers) f.pivot.rotation.z = f.side * ((st.talking ? 0.2 + Math.sin(t * 7) * 0.15 : 0.05) + this.celebrate * (0.9 + Math.sin(t * 16) * 0.5));
    this.key.rotation.z = t * 1.6;
    this.blinkEyes(dt);
  }
}

// ------------------------------------------------------------ puffins
// Grown-up puffins have the famous striped beak; a puffling is a round ball of grey fluff.
export class Puffin extends Critter {
  constructor(scene, opts = {}) {
    super(scene, opts);
    this.shadowSize = 1.1;
    const b = this.body;
    const baby = !!opts.baby;
    const back = baby ? 0x5a5e6e : 0x1c1e2c, front = baby ? 0xd8dbe6 : 0xf6f4ee;
    b.add(part(SPH, plushOf(back), 0, 0.85, -0.05, 0.78, 0.85, 0.74));
    b.add(part(SPH, plushOf(front), 0, 0.72, 0.28, 0.6, 0.62, 0.52));
    this.head = new THREE.Group();
    this.head.position.set(0, 1.62, 0.06);
    b.add(this.head);
    this.head.add(part(SPH, plushOf(back), 0, 0, 0, 0.62, 0.6, 0.6));
    if (!baby) this.head.add(part(SPH, plushOf(0xf6f4ee), 0, -0.02, 0.24, 0.52, 0.42, 0.42));
    for (const s of [-1, 1]) {
      const e = cuteEye(baby ? 0.16 : 0.13, 0x3a2a14);
      e.position.set(s * 0.22, 0.08, 0.5);
      this.head.add(e);
      this.eyes.push(e);
      this.head.add(part(SPH_LO, plushOf(0xff9fb0), s * 0.36, -0.12, 0.44, 0.08, 0.05, 0.03));
    }
    if (baby) {
      this.head.add(part(new THREE.ConeGeometry(0.08, 0.2, 6), plushOf(0x2a2a30), 0, -0.1, 0.62, 1, 1, 1, Math.PI / 2));
      // Fluff tufts.
      for (let i = 0; i < 5; i++) this.head.add(part(SPH_LO, plushOf(back), Math.sin(i * 1.3) * 0.2, 0.52, Math.cos(i * 1.3) * 0.1 - 0.05, 0.12));
    } else {
      const beak = new THREE.Group();
      beak.position.set(0, -0.1, 0.56);
      beak.add(part(SPH_LO, plushOf(0xff6a2a), 0, 0, 0.1, 0.16, 0.24, 0.24));
      beak.add(part(SPH_LO, plushOf(0xffd23d), 0, 0, -0.02, 0.17, 0.26, 0.12));
      beak.add(part(SPH_LO, plushOf(0x5a6a8a), 0, 0, -0.12, 0.18, 0.28, 0.06));
      this.head.add(beak);
    }
    this.flippers = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.68, 1.1, 0);
      pivot.add(part(SPH_LO, plushOf(back), s * 0.06, -0.3, 0, 0.16, 0.48, 0.34));
      b.add(pivot);
      this.flippers.push({ pivot, side: s });
      b.add(part(SPH_LO, plushOf(0xff7a3a), s * 0.26, 0.06, 0.22, 0.18, 0.07, 0.26));
    }
    this.bakeParts();
  }

  animate(dt, st = {}) {
    this.time += dt;
    const t = this.time;
    this.celebrate = damp(this.celebrate, st.celebrate ? 1 : 0, 6, dt);
    const waddle = st.speed ? Math.min(1, Math.abs(st.speed) / 4) : 0;
    this.body.rotation.z = Math.sin(t * 9) * 0.12 * waddle;
    this.body.position.y = Math.abs(Math.sin(t * 9)) * 0.08 * waddle + this.celebrate * Math.abs(Math.sin(t * 8)) * 0.25;
    this.head.rotation.x = st.talking ? Math.sin(t * 6) * 0.1 : Math.sin(t * 0.8) * 0.05;
    for (const f of this.flippers) f.pivot.rotation.z = f.side * (0.1 + waddle * Math.abs(Math.sin(t * 9)) * 0.4 + this.celebrate * (0.8 + Math.sin(t * 14) * 0.4));
    this.blinkEyes(dt);
  }
}

export const CRITTERS = { turtle: Turtle, crab: Crab, owl: Owl, puffin: Puffin };
