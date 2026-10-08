// The five Ember Vents and the volcano's crater. A vent has the same interface as Book 1's Aurora Crystal
// (setShards, setCharge, flash, setRestored, update), so the quest engine drives both the same way.
import * as THREE from 'three';
import { REGION_COLORS, SHARED_TIME } from '../../core/materials.js';
import { mergeColored, mat, jitter } from '../../core/geo.js';
import { damp } from '../../core/mathutil.js';
import { makeBeam } from '../../world/landmarks.js';
import { LOC } from './layout.js';

const COLD = new THREE.Color(0x5e4a4a);

export class EmberVent {
  constructor(ctx, id, x, z) {
    this.id = id;
    const { scene, terrain, collision, glow, batch } = ctx;
    const y = terrain.heightAt(x, z);
    this.base = new THREE.Vector3(x, y, z);
    this.color = new THREE.Color(REGION_COLORS[id].a).lerp(new THREE.Color(0xffa040), 0.35);
    // A ring of black stones around a stone basin.
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      batch.add(new THREE.DodecahedronGeometry(0.55, 0), i % 2 ? 0x3a3236 : 0x4a4044, mat(x + Math.cos(a) * 2.7, y + 0.15, z + Math.sin(a) * 2.7, a, a * 2, 0, 1, 0.8, 1));
    }
    batch.add(new THREE.CylinderGeometry(1.9, 2.3, 1.0, 9), 0x5a4e4c, mat(x, y + 0.4, z));
    batch.add(new THREE.CylinderGeometry(1.45, 1.75, 0.3, 9), 0x2a2224, mat(x, y + 1.0, z));
    // The ember stone: a rough faceted rock that glows from inside once it is warm again.
    let g = new THREE.IcosahedronGeometry(1.15, 1);
    jitter(g, 0.25, id.length * 7 + 3);
    g = mergeColored([{ geo: g, color: 0xffffff, matrix: mat(0, 0, 0, 0, 0, 0, 1, 1.25, 1) }]);
    this.material = new THREE.MeshLambertMaterial({ color: COLD.clone(), emissive: COLD.clone(), emissiveIntensity: 0.15, flatShading: true });
    this.mesh = new THREE.Mesh(g, this.material);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, y + 2.8, z);
    scene.add(this.mesh);
    // Three little embers orbit the stone, one per Ember Shard found.
    this.shardMats = [];
    this.shards = [];
    for (let i = 0; i < 3; i++) {
      const sm = new THREE.MeshLambertMaterial({ color: COLD.clone(), emissive: COLD.clone(), emissiveIntensity: 0.1, flatShading: true });
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), sm);
      scene.add(s);
      this.shards.push(s);
      this.shardMats.push(sm);
    }
    this.glowIndex = glow.add(x, y + 2.8, z, COLD, 8, 0.4);
    this.glow = glow;
    // Restored: a tall shimmer of warm air rises from the vent.
    this.beam = makeBeam(this.color, 140);
    this.beam.mesh.position.set(x, y + 2.8 + 70, z);
    scene.add(this.beam.mesh);
    collision.addCircle(x, z, 2.4, 'vent-' + id);
    ctx.terrainMesh.userData.addWarmth(x, z, 6, 0.4);
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
    const flicker = 0.9 + 0.1 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    this.material.color.copy(COLD).lerp(this.color, lit);
    this.material.emissive.copy(COLD).lerp(this.color, lit);
    this.material.emissiveIntensity = 0.15 + lit * 0.85 * flicker + this.pulse * 0.8;
    this.mesh.position.y = this.base.y + 2.8 + Math.sin(t * 1.1) * 0.15 * lit;
    this.mesh.rotation.y = t * 0.25 * lit;
    this.shards.forEach((s, i) => {
      const a = t * (0.7 + lit) + (i * Math.PI * 2) / 3;
      s.position.set(this.base.x + Math.cos(a) * 2.1, this.base.y + 2.6 + Math.sin(t * 2 + i) * 0.4, this.base.z + Math.sin(a) * 2.1);
      s.rotation.y = t * 2;
    });
    this.glow.set(this.glowIndex, {
      x: this.base.x, y: this.mesh.position.y, z: this.base.z,
      color: this.material.emissive, intensity: 0.35 + lit * 1.2 * flicker + this.pulse, size: 8 + lit * 6 + this.pulse * 6,
    });
    this.beam.uniforms.uAlpha.value = this.level * 0.4;
  }
}

// Slow lava, shared by the crater and the forge's pool. The pattern is laid out in world space so any shape
// of surface gets the same scale of crust.
const lavaFrag = /* glsl */ `
uniform float uTime;
uniform float uHeat;
varying vec2 vP;
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec2 p = vP;
  float n = vnoise(p + vec2(uTime * 0.15, uTime * 0.07)) * 0.6 + vnoise(p * 2.3 - vec2(uTime * 0.11, 0.0)) * 0.4;
  float crust = smoothstep(0.44, 0.6, n);
  // Deep orange lava, brightest in the cracks between the plates of dark crust.
  vec3 hot = mix(vec3(0.95, 0.2, 0.02), vec3(1.0, 0.6, 0.12), smoothstep(0.42, 0.1, n));
  vec3 col = mix(hot * (0.95 + uHeat * 0.5), vec3(0.13, 0.06, 0.05), crust * (1.0 - uHeat * 0.5));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const lavaVert = /* glsl */ `
varying vec2 vP;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vP = w.xz * 0.42;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const lavaMaterial = (uniforms) => new THREE.ShaderMaterial({ uniforms, vertexShader: lavaVert, fragmentShader: lavaFrag });

// Mount Ember's crater: a lake of slow lava, a glow you can see from the beach, and a lazy plume of smoke.
export function buildCrater(ctx) {
  const { scene, terrain, glow } = ctx;
  const V = LOC.volcano;
  const floor = terrain.heightAt(V.x, V.z);
  const uniforms = { uTime: SHARED_TIME, uHeat: { value: 0 } };
  const lava = new THREE.Mesh(new THREE.CircleGeometry(V.crater * 0.82, 40), lavaMaterial(uniforms));
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(V.x, floor + 0.9, V.z);
  scene.add(lava);
  const g1 = glow.add(V.x, floor + 3, V.z, 0xff6a2a, 34, 1.0);
  const g2 = glow.add(V.x, floor + 16, V.z, 0xff8a4a, 60, 0.35);
  ctx.terrainMesh.userData.addWarmth(V.x, V.z, V.crater + 4, 1);
  ctx.lanterns.push({ x: V.x, y: floor + 4, z: V.z, intensity: 90 });
  // Smoke: a few soft puffs rising and drifting with the wind.
  const puffGeo = new THREE.IcosahedronGeometry(1, 1);
  const puffs = [];
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Mesh(puffGeo, new THREE.MeshLambertMaterial({ color: 0x6a5e64, transparent: true, opacity: 0.5, depthWrite: false }));
    scene.add(p);
    puffs.push({ mesh: p, phase: i / 9 });
  }
  ctx.crater = {
    lava, uniforms, center: new THREE.Vector3(V.x, floor, V.z),
    // 0 = sooty and dim (the Heart-Ember is cooling), 1 = rekindled.
    setHeat(h) { uniforms.uHeat.value = h; glow.set(g1, { x: V.x, y: floor + 3, z: V.z, color: 0xff6a2a, intensity: 0.7 + h * 0.6, size: 30 + h * 14 }); glow.set(g2, { x: V.x, y: floor + 16, z: V.z, color: 0xff8a4a, intensity: 0.25 + h * 0.4, size: 56 + h * 20 }); },
  };
  ctx.crater.setHeat(0);
  ctx.animated.push((dt, t) => {
    for (const p of puffs) {
      const k = (t * 0.045 + p.phase) % 1;
      const s = 2.5 + k * 9;
      p.mesh.position.set(V.x + k * 26 + Math.sin(t * 0.3 + p.phase * 9) * 2, floor + 10 + k * 46, V.z + k * 12);
      p.mesh.scale.setScalar(s);
      p.mesh.material.opacity = 0.42 * Math.sin(Math.PI * k);
    }
  });
}

// The lava pool beside the forge: glowing up onto the rocks around it, with lazy bubbles swelling and popping.
// The forge vent stands on the rock island at its east end.
export function buildLavaPool(ctx) {
  const { scene, glow, terrainMesh } = ctx;
  const P = LOC.lavaPool;
  const lava = new THREE.Mesh(new THREE.CircleGeometry(1, 56), lavaMaterial({ uTime: SHARED_TIME, uHeat: { value: 0.1 } }));
  lava.rotation.x = -Math.PI / 2;
  lava.scale.set(P.a, P.b, 1);
  lava.position.set(P.x, P.lavaY, P.z);
  scene.add(lava);
  for (let i = 0; i < 5; i++) glow.add(P.x - P.a * 0.75 + i * P.a * 0.375, P.lavaY + 1.2, P.z, 0xff6a2a, 15, 0.5);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    terrainMesh.userData.addWarmth(P.x + Math.cos(a) * P.a, P.z + Math.sin(a) * P.b, 5, 0.22);
  }
  terrainMesh.userData.addWarmth(P.isle.x, P.isle.z, P.isle.r + 2, 0.3);
  ctx.lanterns.push({ x: P.x - P.a * 0.5, y: P.lavaY + 2, z: P.z, intensity: 60 }, { x: P.x + P.a * 0.35, y: P.lavaY + 2, z: P.z, intensity: 60 });
  const dome = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xff9a3a });
  const bubbles = Array.from({ length: 6 }, (_, i) => {
    const m = new THREE.Mesh(dome, bubbleMat);
    scene.add(m);
    return { mesh: m, k: i / 6, life: 1.2 + Math.random() };
  });
  const place = (b) => {
    for (let tries = 0; tries < 6; tries++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.8;
      const x = P.x + Math.cos(a) * P.a * r, z = P.z + Math.sin(a) * P.b * r;
      if (Math.hypot(x - P.isle.x, z - P.isle.z) > P.isle.r + 2.5) { b.mesh.position.set(x, P.lavaY - 0.05, z); return; }
    }
  };
  bubbles.forEach(place);
  ctx.animated.push((dt) => {
    for (const b of bubbles) {
      b.k += dt / b.life;
      if (b.k >= 1) { b.k = 0; b.life = 1.2 + Math.random(); place(b); }
      const s = 0.25 + Math.sqrt(Math.sin(Math.PI * b.k)) * 0.45;
      b.mesh.scale.set(s, s * 0.7, s);
    }
  });
}
