// The five Star Anchors and the Starwell. An anchor has the same interface as Book 1's Aurora Crystal and
// Book 2's Ember Vent (setShards, setCharge, flash, setRestored, update), so the quest engine drives all three
// the same way. The Hush, a great shy cloud, curls around the Starwell until it is calmed.
import * as THREE from 'three';
import { REGION_COLORS } from '../../core/materials.js';
import { mergeColored, mat } from '../../core/geo.js';
import { damp } from '../../core/mathutil.js';
import { makeBeam } from '../../world/landmarks.js';
import { lambert } from '../../core/materials.js';
import { LOC, ISLANDS } from './layout.js';

const COLD = new THREE.Color(0x5a5a7a);
const GOLD = new THREE.Color(0xffd98a);

function starShape(outer, inner, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 ? inner : outer;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}
let starGeo = null;
function starGeometry() {
  if (!starGeo) {
    starGeo = new THREE.ExtrudeGeometry(starShape(1.2, 0.52), { depth: 0.36, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 2 });
    starGeo.center();
  }
  return starGeo;
}

export class StarAnchor {
  constructor(ctx, id, x, z) {
    this.id = id;
    const { scene, terrain, collision, glow, batch } = ctx;
    const y = terrain.heightAt(x, z);
    this.base = new THREE.Vector3(x, y, z);
    this.color = new THREE.Color(REGION_COLORS[id].a).lerp(GOLD, 0.45);
    // A round plinth of pale stone with a ring of little standing stones.
    batch.add(new THREE.CylinderGeometry(2.0, 2.4, 0.8, 12), 0xd8d4e8, mat(x, y + 0.3, z));
    batch.add(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 12), 0xb8b2d0, mat(x, y + 0.9, z));
    batch.add(new THREE.TorusGeometry(1.55, 0.09, 6, 28), 0xc8a050, mat(x, y + 1.16, z, Math.PI / 2));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      batch.add(new THREE.BoxGeometry(0.4, 1.3, 0.4), 0xc4c0dc, mat(x + Math.cos(a) * 3.0, y + 0.55, z + Math.sin(a) * 3.0, 0, a, 0));
    }
    this.material = new THREE.MeshLambertMaterial({ color: COLD.clone(), emissive: COLD.clone(), emissiveIntensity: 0.15 });
    this.mesh = new THREE.Mesh(starGeometry(), this.material);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, y + 3.2, z);
    scene.add(this.mesh);
    // Three star shards orbit the anchor, one per Star Shard found.
    this.shardMats = [];
    this.shards = [];
    for (let i = 0; i < 3; i++) {
      const sm = new THREE.MeshLambertMaterial({ color: COLD.clone(), emissive: COLD.clone(), emissiveIntensity: 0.1 });
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), sm);
      scene.add(s);
      this.shards.push(s);
      this.shardMats.push(sm);
    }
    this.glowIndex = glow.add(x, y + 3.2, z, COLD, 8, 0.4);
    this.glow = glow;
    this.beam = makeBeam(this.color, 160);
    this.beam.mesh.position.set(x, y + 3.2 + 80, z);
    scene.add(this.beam.mesh);
    collision.addCircle(x, z, 2.6, 'anchor-' + id);
    this.restored = false;
    this.level = 0;
    this.charge = 0;
    this.chargeShown = 0;
    this.pulse = 0;
  }

  setRestored(v, instant = false) {
    this.restored = v;
    if (instant) this.level = v ? 1 : 0;
    this.beam.mesh.visible = v;
  }

  setCharge(f) { this.charge = f; }

  flash() { this.pulse = 1; }

  setShards(n) {
    this.shardMats.forEach((m, i) => {
      const lit = i < n;
      m.color.copy(lit ? this.color : COLD);
      m.emissive.copy(lit ? this.color : COLD);
      m.emissiveIntensity = lit ? 1.0 : 0.1;
    });
  }

  update(dt, t) {
    this.level = damp(this.level, this.restored ? 1 : 0, 1.5, dt);
    this.chargeShown = damp(this.chargeShown, this.charge, 4, dt);
    this.pulse = damp(this.pulse, 0, 3, dt);
    const lit = Math.max(this.level, this.chargeShown * 0.8);
    const twinkle = 0.92 + 0.08 * Math.sin(t * 5.1) * Math.sin(t * 2.3);
    this.material.color.copy(COLD).lerp(this.color, lit);
    this.material.emissive.copy(COLD).lerp(this.color, lit);
    this.material.emissiveIntensity = 0.15 + lit * 0.8 * twinkle + this.pulse * 0.8;
    this.mesh.position.y = this.base.y + 3.2 + Math.sin(t * 1.2) * 0.2 * (0.3 + lit);
    this.mesh.rotation.y = t * (0.2 + lit * 0.6);
    this.shards.forEach((s, i) => {
      const a = t * (0.6 + lit) + (i * Math.PI * 2) / 3;
      s.position.set(this.base.x + Math.cos(a) * 2.2, this.base.y + 3.0 + Math.sin(t * 2 + i) * 0.4, this.base.z + Math.sin(a) * 2.2);
      s.rotation.y = t * 2;
    });
    this.glow.set(this.glowIndex, {
      x: this.base.x, y: this.mesh.position.y, z: this.base.z,
      color: this.material.emissive, intensity: 0.35 + lit * 1.1 * twinkle + this.pulse, size: 8 + lit * 7 + this.pulse * 6,
    });
    this.beam.uniforms.uAlpha.value = this.level * 0.38;
  }
}

// The Starwell: a ring of tall white stones around a pool of starlight on the highest island, and the Hush
// curled around it. setOpen lets penguins through; setFinale lights the pool and sends the Hush home happy.
const wellFrag = /* glsl */ `
uniform float uTime;
uniform float uLevel;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  vec3 col = mix(vec3(0.06, 0.07, 0.2), vec3(0.18, 0.12, 0.42), r);
  vec2 g = floor(vUv * 60.0);
  float s = step(0.985, hash(g + floor(uTime * 0.5)));
  col += vec3(1.0, 0.95, 0.8) * s * (0.4 + uLevel);
  float swirl = sin(atan(p.y, p.x) * 3.0 + r * 9.0 - uTime * 0.8) * 0.5 + 0.5;
  col += vec3(0.5, 0.4, 0.9) * swirl * (1.0 - r) * (0.15 + uLevel * 0.5);
  col = mix(col, vec3(1.0, 0.9, 0.6), smoothstep(0.92, 1.0, r) * (0.3 + uLevel * 0.6));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const wellVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export function buildStarwell(ctx) {
  const { scene, terrain, collision, glow, batch } = ctx;
  const S = LOC.spire, W = ISLANDS.well;
  const y = terrain.heightAt(S.x, S.z);
  // The pool of starlight and its rim.
  const uniforms = { uTime: { value: 0 }, uLevel: { value: 0 } };
  const pool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), new THREE.ShaderMaterial({ uniforms, vertexShader: wellVert, fragmentShader: wellFrag }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(S.x, y + 0.62, S.z);
  scene.add(pool);
  batch.add(new THREE.TorusGeometry(4.5, 0.42, 8, 40), 0xf0eef8, mat(S.x, y + 0.5, S.z, Math.PI / 2));
  batch.add(new THREE.CylinderGeometry(4.6, 5.0, 0.6, 32), 0xd8d6e8, mat(S.x, y + 0.2, S.z));
  // Tall white stones in a ring, capped with gold.
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const x = S.x + Math.cos(a) * 9, z = S.z + Math.sin(a) * 9, h = 5 + (i % 3) * 1.2;
    const gy = terrain.heightAt(x, z);
    batch.add(new THREE.BoxGeometry(1.1, h, 0.9), 0xf2f0fa, mat(x, gy + h / 2 - 0.2, z, 0, -a, 0));
    batch.add(new THREE.OctahedronGeometry(0.42, 0), 0xffd98a, mat(x, gy + h + 0.2, z));
    collision.addCircle(x, z, 0.8, 'well-stone');
  }
  const g1 = glow.add(S.x, y + 1.5, S.z, 0x9a8aff, 14, 0.4);
  // The Hush: a great soft cloud wrapped round the island's rim, standing taller than the rim until it is
  // calmed. Its head rests on the north-east rim and turns to watch whoever comes near.
  const hush = new THREE.Group();
  hush.position.set(W.x, W.h, W.z);
  scene.add(hush);
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xa8a6d2, emissive: 0x34325a, transparent: true, opacity: 0.94 });
  const puff = new THREE.IcosahedronGeometry(1, 2);
  const puffs = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = W.r + 6 + Math.sin(i * 1.7) * 2;
    const m = new THREE.Mesh(puff, cloudMat);
    const s = 5 + (i % 4) * 1.6;
    m.position.set(Math.cos(a) * r, Math.sin(i * 2.3) * 2, Math.sin(a) * r);
    m.scale.set(s, s * 0.8, s);
    hush.add(m);
    puffs.push({ m, a, r, base: m.position.y, s });
  }
  const headA = Math.atan2(-2, 1), headR = W.r + 9;
  const head = new THREE.Group();
  hush.add(head);
  for (const [x, y, z, s] of [[0, 0, 0, 8.5], [-6.5, -2.5, -1, 5.5], [6.5, -2.5, -1, 6], [-3.5, 5, -2, 5.5], [3.5, 5.5, -2.5, 5]]) {
    const m = new THREE.Mesh(puff, cloudMat);
    m.position.set(x, y, z);
    m.scale.set(s, s * 0.88, s);
    head.add(m);
  }
  // A shy face: sleepy eyes that open as it calms, rosy cheeks, and a little mouth that becomes a smile.
  const faceMat = new THREE.MeshBasicMaterial({ color: 0x3a3060, transparent: true });
  const eyes = [-1, 1].map((s) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(1.2, 14, 10), faceMat);
    e.position.set(s * 2.9, 1.2, 7.7);
    e.scale.set(1, 0.2, 0.45);
    head.add(e);
    return e;
  });
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
  const shines = eyes.map((e) => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), shineMat);
    h.position.set(e.position.x + 0.4, 1.6, 8.1);
    head.add(h);
    return h;
  });
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff9ac0, transparent: true, opacity: 0, depthWrite: false });
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.CircleGeometry(1.1, 16), cheekMat);
    c.position.set(s * 4.65, -0.6, 7.2);
    c.rotation.y = s * 0.57;
    head.add(c);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.16, 6, 14, Math.PI), faceMat);
  mouth.position.set(0, -1.1, 8.35);
  mouth.rotation.z = Math.PI;
  head.add(mouth);
  // Until it is calmed, the Hush wraps the island: nothing passes, walking or gliding.
  const ring = collision.addRing(W.x, W.z, W.r + 3, 1.4, null, 0, 'hush');
  const spire = {
    base: new THREE.Vector3(S.x, y + 0.5, S.z), top: new THREE.Vector3(S.x, y + 1, S.z),
    open: false, finale: false, calm: 0, gone: 0, level: 0, hush, head, eyes,
    setOpen(v, instant = false) {
      this.open = v;
      ring.forEach((c) => { c.active = !v; });
      if (instant && !this.finale) this.calm = v ? 0.35 : 0;
    },
    setFinale(v, instant = false) {
      this.finale = v;
      if (instant) { this.calm = v ? 1 : this.open ? 0.35 : 0; this.gone = v ? 1 : 0; }
    },
  };
  const hp = new THREE.Vector3();
  let look = headA + Math.PI / 2;
  ctx.animated.push((dt, t, focus) => {
    spire.level = damp(spire.level, spire.finale ? 1 : spire.open ? 0.4 : 0.1, 1, dt);
    spire.calm = damp(spire.calm, spire.finale ? 1 : spire.open ? 0.35 : 0, 0.6, dt);
    spire.gone = damp(spire.gone, spire.finale ? 1 : 0, 0.4, dt);
    const { calm, gone } = spire;
    uniforms.uTime.value = t;
    uniforms.uLevel.value = spire.level;
    glow.set(g1, { color: 0x9a8aff, intensity: 0.3 + spire.level * 1.4, size: 14 + spire.level * 12 });
    // Calmer, the Hush sinks below the rim and draws back, paler; once the Star Map is whole it drifts off
    // over the clouds and fades.
    for (const p of puffs) {
      const r = p.r + calm * 4 + gone * 30;
      p.m.position.set(Math.cos(p.a) * r, p.base + Math.sin(t * 0.5 + p.a * 3) * 0.8 - calm * 10 + gone * 12, Math.sin(p.a) * r);
      const breathe = 1 + Math.sin(t * 0.7 + p.a) * 0.04;
      p.m.scale.set(p.s * breathe, p.s * 0.8 * breathe, p.s * breathe);
    }
    head.position.set(Math.cos(headA) * (headR + gone * 30), 8 + Math.sin(t * 0.6) * 0.6 - calm * 6 + gone * 16, Math.sin(headA) * (headR + gone * 30));
    head.scale.setScalar(1 + Math.sin(t * 0.7) * 0.025);
    if (focus) {
      head.getWorldPosition(hp);
      const want = Math.atan2(focus.x - hp.x, focus.z - hp.z);
      look += Math.atan2(Math.sin(want - look), Math.cos(want - look)) * (1 - Math.exp(-1.5 * dt));
      head.rotation.y = look;
    }
    cloudMat.color.setRGB(0.66 + calm * 0.32, 0.65 + calm * 0.3, 0.82 + calm * 0.15);
    cloudMat.opacity = 0.94 * (1 - gone);
    const open = Math.max(0.05, 0.2 + calm * 0.65 + (Math.sin(t * 0.3) > 0.97 ? -0.2 : 0));
    for (const e of eyes) e.scale.y = open;
    const shine = Math.max(0, (open - 0.45) / 0.4);
    for (const h of shines) h.scale.setScalar(Math.min(1, shine));
    faceMat.opacity = 1 - gone;
    shineMat.opacity = 1 - gone;
    cheekMat.opacity = Math.max(0, calm - 0.3) * 0.9 * (1 - gone);
    mouth.scale.set(0.55 + calm * 0.45, 0.15 + calm * 0.85, 1);
    hush.visible = gone < 0.98;
  });
  ctx.spire = spire;
}
