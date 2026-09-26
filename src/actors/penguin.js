import * as THREE from 'three';
import { PAL, lambert } from '../core/materials.js';
import { solid, basic, buildHat } from './accessories.js';
import { clamp, damp, lerp } from '../core/mathutil.js';
import { glowTexture, scarfTexture } from '../core/textures.js';

const SPHERE = new THREE.SphereGeometry(1, 28, 20);
const SPHERE_LO = new THREE.SphereGeometry(1, 14, 10);
const BEAK = new THREE.ConeGeometry(0.17, 0.46, 14);
BEAK.rotateX(Math.PI / 2);
const TORUS = new THREE.TorusGeometry(0.8, 0.21, 12, 32);
TORUS.rotateX(Math.PI / 2);
const TUFT = new THREE.ConeGeometry(0.09, 0.4, 6);

let shadowMat = null;
function blobShadowMaterial() {
  if (!shadowMat) {
    shadowMat = new THREE.MeshBasicMaterial({
      map: glowTexture(), color: 0x000010, transparent: true, opacity: 0.42, depthWrite: false,
    });
  }
  return shadowMat;
}

function part(geo, material, x, y, z, sx, sy = sx, sz = sx, cast = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = cast;
  return m;
}

const SEG = 7;
const SEG_LEN = 0.2;

// Verlet ribbon for a scarf tail, simulated in world space.
class ScarfTail {
  constructor(scene, color, texKind, width = 0.3, len = SEG_LEN) {
    this.pts = [];
    this.len = len;
    for (let i = 0; i < SEG; i++) this.pts.push({ p: new THREE.Vector3(), o: new THREE.Vector3() });
    const n = SEG * 2;
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    const uv = new Float32Array(n * 2);
    const idx = [];
    for (let i = 0; i < SEG; i++) {
      uv.set([i / (SEG - 1), 0, i / (SEG - 1), 1], i * 4);
      if (i < SEG - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    this.width = width;
    this.material = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
    if (texKind) this.material.map = scarfTexture(texKind);
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    this.initialized = false;
  }

  setLook(color, texKind) {
    this.material.color.set(color);
    this.material.map = texKind ? scarfTexture(texKind) : null;
    this.material.needsUpdate = true;
  }

  reset(anchor) {
    for (const q of this.pts) { q.p.copy(anchor); q.o.copy(anchor); }
    this.initialized = true;
  }

  step(dt, anchor, side, back, bodyCenter, bodyR, wind) {
    if (!this.initialized) this.reset(anchor);
    const g = -9 * dt * dt;
    this.pts[0].p.copy(anchor);
    this.pts[0].o.copy(anchor);
    for (let i = 1; i < SEG; i++) {
      const q = this.pts[i];
      const vx = (q.p.x - q.o.x) * 0.9, vy = (q.p.y - q.o.y) * 0.9, vz = (q.p.z - q.o.z) * 0.9;
      q.o.copy(q.p);
      q.p.x += vx + (wind.x + back.x * 0.6) * dt * dt;
      q.p.y += vy + g;
      q.p.z += vz + (wind.z + back.z * 0.6) * dt * dt;
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 1; i < SEG; i++) {
        const a = this.pts[i - 1].p, b = this.pts[i].p;
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const d = Math.hypot(dx, dy, dz) || 1e-4;
        const k = (d - this.len) / d;
        if (i === 1) { b.x -= dx * k; b.y -= dy * k; b.z -= dz * k; }
        else {
          a.x += dx * k * 0.5; a.y += dy * k * 0.5; a.z += dz * k * 0.5;
          b.x -= dx * k * 0.5; b.y -= dy * k * 0.5; b.z -= dz * k * 0.5;
        }
      }
      for (let i = 1; i < SEG; i++) {
        const p = this.pts[i].p;
        const dx = p.x - bodyCenter.x, dy = p.y - bodyCenter.y, dz = p.z - bodyCenter.z;
        const d = Math.hypot(dx, dy, dz);
        if (d < bodyR && d > 1e-4) { const s = bodyR / d; p.x = bodyCenter.x + dx * s; p.y = bodyCenter.y + dy * s; p.z = bodyCenter.z + dz * s; }
      }
    }
    const arr = this.posAttr.array;
    for (let i = 0; i < SEG; i++) {
      const p = this.pts[i].p;
      const w = this.width * (i === SEG - 1 ? 1.15 : 1) * 0.5;
      arr[i * 6] = p.x - side.x * w; arr[i * 6 + 1] = p.y - side.y * w; arr[i * 6 + 2] = p.z - side.z * w;
      arr[i * 6 + 3] = p.x + side.x * w; arr[i * 6 + 4] = p.y + side.y * w; arr[i * 6 + 5] = p.z + side.z * w;
    }
    this.posAttr.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  dispose(scene) { scene.remove(this.mesh); this.mesh.geometry.dispose(); this.material.dispose(); }
}

const _v = new THREE.Vector3();
const _side = new THREE.Vector3();
const _back = new THREE.Vector3();
const _center = new THREE.Vector3();
const _wind = new THREE.Vector3(1.2, 0, 0.6);

export class Penguin {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.opts = opts;
    const s = opts.scale ?? 1;
    this.root = new THREE.Group();
    this.root.name = opts.name || 'penguin';
    this.root.scale.setScalar(s);
    this.tilt = new THREE.Group();
    this.tilt.position.y = 1.05;
    this.root.add(this.tilt);
    const body = this.body = new THREE.Group();
    body.position.y = -1.05;
    this.tilt.add(body);

    const dark = solid(opts.body ?? PAL.penguin);
    const white = solid(opts.belly ?? PAL.belly);
    const orange = solid(PAL.beak);

    this.bodyMesh = part(SPHERE, dark, 0, 1.05, 0, 0.98, 1.1, 0.92);
    body.add(this.bodyMesh);
    body.add(part(SPHERE, white, 0, 0.95, 0.4, 0.74, 0.88, 0.58));

    // Head
    const head = this.head = new THREE.Group();
    head.position.set(0, 2.25, 0.05);
    body.add(head);
    head.add(part(SPHERE, dark, 0, 0, 0, 0.8, 0.78, 0.78));
    head.add(part(SPHERE, white, 0, -0.08, 0.36, 0.62, 0.56, 0.5));
    const tuft = new THREE.Group();
    tuft.position.set(0, 0.72, 0);
    for (const [x, rz] of [[-0.1, 0.5], [0, 0], [0.1, -0.5]]) {
      const t = new THREE.Mesh(TUFT, dark);
      t.position.set(x, 0.12, 0);
      t.rotation.z = rz;
      tuft.add(t);
    }
    head.add(tuft);

    this.eyes = new THREE.Group();
    this.eyes.position.set(0, 0.07, 0);
    head.add(this.eyes);
    const iris = basic(opts.iris ?? 0x1c3f8a);
    for (const sx of [-1, 1]) {
      const e = new THREE.Group();
      e.position.set(sx * 0.27, 0, 0.6);
      e.add(part(SPHERE_LO, basic(0xffffff), 0, 0, 0, 0.21, 0.24, 0.12, false));
      e.add(part(SPHERE_LO, iris, 0, -0.01, 0.07, 0.14, 0.16, 0.08, false));
      e.add(part(SPHERE_LO, basic(0x05060c), 0, -0.01, 0.1, 0.085, 0.1, 0.06, false));
      e.add(part(SPHERE_LO, basic(0xffffff), sx * -0.04 + 0.03, 0.06, 0.15, 0.045, 0.045, 0.03, false));
      this.eyes.add(e);
    }
    const beak = part(BEAK, orange, 0, -0.14, 0.86, 1, 1, 1);
    beak.rotation.x = 0.12;
    head.add(beak);
    for (const sx of [-1, 1]) head.add(part(SPHERE_LO, solid(0xff9fb4), sx * 0.44, -0.2, 0.56, 0.12, 0.08, 0.05, false));
    this.hatSlot = new THREE.Group();
    head.add(this.hatSlot);

    // Flippers pivot at the shoulders.
    this.flippers = [];
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * 0.9, 1.65, 0);
      const f = part(SPHERE, dark, sx * 0.08, -0.62, 0, 0.17, 0.7, 0.4);
      pivot.add(f);
      body.add(pivot);
      this.flippers.push({ pivot, side: sx });
    }

    // Feet
    this.feet = [];
    for (const sx of [-1, 1]) {
      const f = part(SPHERE_LO, solid(PAL.feet), sx * 0.4, 0.08, 0.38, 0.32, 0.12, 0.46);
      this.root.add(f);
      this.feet.push({ mesh: f, side: sx });
    }

    // Scarf ring + knot + two tails
    this.scarfMat = lambert({ color: opts.scarf ?? PAL.scarf });
    this.scarfRing = part(TORUS, this.scarfMat, 0, 1.78, 0, 1, 0.9, 1);
    body.add(this.scarfRing);
    // Knot on the back-right shoulder so the tails stream behind, visible from the follow camera.
    this.knot = part(SPHERE_LO, this.scarfMat, 0.58, 1.74, -0.36, 0.2, 0.2, 0.2);
    body.add(this.knot);
    this.tails = [];
    if (opts.scarf !== null) {
      this.tails.push(new ScarfTail(scene, opts.scarf ?? PAL.scarf, opts.scarfTex, 0.3, SEG_LEN * s));
      this.tails.push(new ScarfTail(scene, opts.scarf ?? PAL.scarf, opts.scarfTex, 0.26, SEG_LEN * 0.8 * s));
    } else {
      this.scarfRing.visible = false;
      this.knot.visible = false;
    }
    if (opts.scarfTex) this.setScarf(opts.scarf ?? PAL.scarf, opts.scarfTex);

    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20), blobShadowMaterial());
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 2;
    scene.add(this.shadow);

    if (opts.hat) this.setHat(opts.hat, opts.hatColor);
    if (opts.extras) opts.extras(this);

    scene.add(this.root);

    this.walkPhase = 0;
    this.blinkT = 2 + Math.random() * 3;
    this.blink = 0;
    this.slideAmt = 0;
    this.swimAmt = 0;
    this.airAmt = 0;
    this.stretch = 1;
    this.celebrate = 0;
    this.lookYaw = 0;
    this.time = Math.random() * 10;
    this.groundY = 0;
    this.visibleTails = true;
  }

  setHat(id, color) {
    this.hatSlot.clear();
    if (!id) return;
    const h = buildHat(id, color);
    if (h) this.hatSlot.add(h);
  }

  setScarf(color, texKind) {
    this.scarfMat.color.set(texKind ? 0xffffff : color);
    this.scarfMat.map = texKind ? scarfTexture(texKind) : null;
    this.scarfMat.needsUpdate = true;
    for (const t of this.tails) t.setLook(texKind ? 0xffffff : color, texKind);
  }

  setVisible(v) {
    this.root.visible = v;
    this.shadow.visible = v;
    for (const t of this.tails) t.mesh.visible = v;
  }

  get position() { return this.root.position; }

  // state: { speed, grounded, sliding, swimming, vy, talking, celebrate, groundY, dt }
  animate(dt, st = {}) {
    this.time += dt;
    const t = this.time;
    const speed = st.speed ?? 0;
    this.lastSpeed = speed;
    const k = clamp(Math.abs(speed) / 5, 0, 1);
    this.walkPhase += dt * (2.2 + Math.abs(speed) * 1.25) * (k > 0.05 ? 1 : 0);

    this.slideAmt = damp(this.slideAmt, st.sliding ? 1 : 0, 10, dt);
    this.swimAmt = damp(this.swimAmt, st.swimming ? 1 : 0, 6, dt);
    this.airAmt = damp(this.airAmt, st.grounded === false && !st.swimming ? 1 : 0, 12, dt);
    this.celebrate = damp(this.celebrate, st.celebrate ? 1 : 0, 6, dt);
    const lying = Math.max(this.slideAmt, this.swimAmt);

    const waddle = Math.sin(this.walkPhase) * 0.15 * k * (1 - lying) * (1 - this.airAmt);
    const bounce = Math.abs(Math.sin(this.walkPhase)) * 0.1 * k * (1 - lying) * (1 - this.airAmt);
    const breathe = 1 + Math.sin(t * 2.1) * 0.012;
    const vy = st.vy ?? 0;
    const targetStretch = 1 + clamp(vy * 0.018, -0.1, 0.14) * this.airAmt;
    this.stretch = damp(this.stretch, targetStretch, 14, dt);

    this.tilt.rotation.z = waddle + Math.sin(t * 11) * 0.03 * this.swimAmt;
    this.tilt.rotation.x = lerp(0, 1.38, this.slideAmt) + lerp(0, 1.2, this.swimAmt * (1 - this.slideAmt)) + Math.sin(t * 3) * 0.05 * this.swimAmt;
    this.tilt.position.y = 1.05 + bounce - lying * 0.2 + Math.sin(t * 3.4) * 0.06 * this.swimAmt;
    this.tilt.scale.set(1 / Math.sqrt(this.stretch), this.stretch * breathe, 1 / Math.sqrt(this.stretch));

    // Head: look around when idle, nod when talking
    const idle = (1 - k) * (1 - lying);
    const glance = Math.sin(t * 0.4) * 0.35 + Math.sin(t * 0.13) * 0.25;
    this.head.rotation.y = damp(this.head.rotation.y, (st.lookYaw ?? glance * idle), 4, dt);
    this.head.rotation.x = (st.talking ? Math.sin(t * 9) * 0.07 : 0) - lying * 0.9 + this.celebrate * -0.25;
    this.head.rotation.z = st.talking ? Math.sin(t * 4.5) * 0.06 : 0;

    // Blink
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.14; this.blinkT = 2.2 + Math.random() * 3.5; }
    if (this.blink > 0) this.blink -= dt;
    this.eyes.scale.y = this.blink > 0 ? 0.12 : (st.happy ? 0.55 : 1);

    // Flippers
    for (const f of this.flippers) {
      let rz = 0.22 + Math.sin(this.walkPhase + (f.side > 0 ? Math.PI : 0)) * 0.22 * k;
      let rx = Math.sin(this.walkPhase) * 0.2 * k * f.side;
      if (this.airAmt > 0.01) rz = lerp(rz, 1.1 + Math.sin(t * 22) * 0.5, this.airAmt);
      if (st.talking) rz += Math.max(0, Math.sin(t * 3 + f.side)) * 0.5 * (f.side > 0 ? 1 : 0.3);
      rz = lerp(rz, 2.5 + Math.sin(t * 14 + f.side) * 0.25, this.celebrate);
      rz = lerp(rz, 0.15, this.slideAmt);
      rx = lerp(rx, -1.1, this.slideAmt);
      rx = lerp(rx, Math.sin(t * 7 + (f.side > 0 ? 0 : Math.PI)) * 1.1, this.swimAmt * (1 - this.slideAmt));
      rz = lerp(rz, 0.6, this.swimAmt * (1 - this.slideAmt));
      f.pivot.rotation.z = rz * f.side;
      f.pivot.rotation.x = rx;
    }

    // Feet: step when walking, tuck back when sliding/swimming
    for (const f of this.feet) {
      const ph = this.walkPhase + (f.side > 0 ? Math.PI : 0);
      const lift = Math.max(0, Math.sin(ph)) * 0.18 * k * (1 - this.airAmt);
      f.mesh.position.set(f.side * 0.4, 0.08 + lift + lying * 0.35, 0.38 + Math.cos(ph) * 0.22 * k * (1 - lying) - lying * 1.9);
      f.mesh.rotation.x = lying * 1.3;
      f.mesh.visible = this.swimAmt < 0.9 || this.slideAmt > 0.1;
    }
  }

  // Must run after the root's world matrix is current.
  updateAttachments(dt, groundY, near = true) {
    const s = this.root.scale.x;
    this.shadow.position.set(this.root.position.x, groundY + 0.06, this.root.position.z);
    const hgt = Math.max(0, this.root.position.y - groundY);
    this.shadow.scale.setScalar(s * Math.max(0.45, 1 - hgt * 0.12) * (1 + this.slideAmt * 0.3));
    this.shadow.material.opacity = 0.42;
    if (!near || !this.tails.length) {
      for (const t of this.tails) t.mesh.visible = false;
      return;
    }
    this.root.updateMatrixWorld(true);
    this.knot.getWorldPosition(_v);
    _side.set(1, 0, 0).applyQuaternion(this.root.quaternion);
    _back.set(0, 0, -1).applyQuaternion(this.root.quaternion).multiplyScalar(this.lastSpeed || 0);
    this.bodyMesh.getWorldPosition(_center);
    const t = this.time;
    _wind.set(1.4 + Math.sin(t * 0.7) * 0.8, 0, 0.8 + Math.cos(t * 0.9) * 0.6);
    this.tails.forEach((tail, i) => {
      tail.mesh.visible = this.root.visible;
      _v.y -= i * 0.05 * s;
      tail.step(Math.min(dt, 1 / 30), _v, _side, _back, _center, 0.95 * s, _wind);
    });
  }

  dispose() {
    this.scene.remove(this.root);
    this.scene.remove(this.shadow);
    for (const t of this.tails) t.dispose(this.scene);
  }
}
