import * as THREE from 'three';
import { lambert, crystalMaterial, REGION_COLORS, SHARED_TIME } from '../core/materials.js';
import { mergeColored, mat, jitter } from '../core/geo.js';
import { symbolTexture } from '../core/textures.js';
import { LOC, CRYSTALS, WATER_Y } from '../books/book1/layout.js';
import { clusterGeometry, CRYSTAL_COLORS } from './nature.js';
import { damp } from '../core/mathutil.js';

const beamVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const beamFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
uniform float uTime;
varying vec2 vUv;
void main() {
  float fade = smoothstep(0.0, 0.03, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y));
  float swirl = 0.7 + 0.3 * sin(vUv.x * 18.85 + vUv.y * 60.0 - uTime * 4.0);
  float edge = 0.55 + 0.45 * sin(vUv.x * 6.2831);
  gl_FragColor = vec4(uColor * swirl, fade * uAlpha * edge);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const shieldVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const shieldFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
uniform float uTime;
uniform float uBands;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
void main() {
  float rim = pow(1.0 - abs(dot(vN, vView)), 1.6);
  float w = sin(vUv.x * 6.2831 * uBands + uTime * 1.3 + sin(vUv.y * 12.0 + uTime) * 1.5);
  float bands = smoothstep(0.55, 1.0, w) * 0.6;
  float drift = 0.5 + 0.5 * sin(vUv.y * 30.0 - uTime * 2.5 + vUv.x * 40.0);
  float fadeY = smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
  float a = (0.18 + rim * 0.7 + bands * drift) * uAlpha * fadeY;
  gl_FragColor = vec4(uColor, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function makeBeam(color, height = 320) {
  const uniforms = { uColor: { value: new THREE.Color(color) }, uAlpha: { value: 0 }, uTime: SHARED_TIME };
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, height, 20, 1, true), new THREE.ShaderMaterial({
    uniforms, vertexShader: beamVert, fragmentShader: beamFrag, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  }));
  m.renderOrder = 7;
  m.frustumCulled = false;
  m.visible = false;
  return { mesh: m, uniforms };
}

export function makeShield(geo, color, bands = 5) {
  const uniforms = { uColor: { value: new THREE.Color(color) }, uAlpha: { value: 1 }, uTime: SHARED_TIME, uBands: { value: bands } };
  const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms, vertexShader: shieldVert, fragmentShader: shieldFrag, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  m.renderOrder = 7;
  return { mesh: m, uniforms };
}

const DRAINED = new THREE.Color(0x5a557a);

// One of the five Aurora Crystals.
export class AuroraCrystal {
  constructor(ctx, id, x, z) {
    this.id = id;
    const { scene, terrain, collision, glow, batch } = ctx;
    const y = terrain.heightAt(x, z);
    this.base = new THREE.Vector3(x, y, z);
    this.color = new THREE.Color(REGION_COLORS[id].a);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      batch.add(new THREE.DodecahedronGeometry(0.5, 0), 0x6d74a8, mat(x + Math.cos(a) * 2.6, y + 0.1, z + Math.sin(a) * 2.6, a, a * 2, 0, 1, 0.7, 1));
    }
    batch.add(new THREE.CylinderGeometry(1.7, 2.1, 0.9, 6), 0x5c6399, mat(x, y + 0.35, z));
    batch.add(new THREE.CylinderGeometry(1.35, 1.6, 0.35, 6), 0x7880bb, mat(x, y + 0.95, z));
    const geo = mergeColored([
      { geo: new THREE.CylinderGeometry(0.95, 0.95, 2.4, 6), color: 0xffffff },
      { geo: new THREE.ConeGeometry(0.95, 1.7, 6), color: 0xffffff, matrix: mat(0, 2.05, 0) },
      { geo: new THREE.ConeGeometry(0.95, 1.1, 6), color: 0xffffff, matrix: mat(0, -1.75, 0, Math.PI) },
    ]);
    this.material = new THREE.MeshLambertMaterial({ color: DRAINED.clone(), emissive: DRAINED.clone(), emissiveIntensity: 0.25, flatShading: true });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, y + 3.6, z);
    scene.add(this.mesh);
    this.shards = [];
    const shardGeo = mergeColored([
      { geo: new THREE.OctahedronGeometry(0.3, 0), color: 0xffffff, matrix: mat(0, 0, 0, 0, 0, 0, 1, 1.8, 1) },
    ]);
    this.shardMats = [];
    for (let i = 0; i < 3; i++) {
      const sm = new THREE.MeshLambertMaterial({ color: DRAINED.clone(), emissive: DRAINED.clone(), emissiveIntensity: 0.15, flatShading: true });
      const s = new THREE.Mesh(shardGeo, sm);
      scene.add(s);
      this.shards.push(s);
      this.shardMats.push(sm);
    }
    this.shardCount = 0;
    this.glowIndex = glow.add(x, y + 3.6, z, DRAINED, 9, 0.5);
    this.glow = glow;
    this.beam = makeBeam(this.color);
    this.beam.mesh.position.set(x, y + 3.6 + 160, z);
    scene.add(this.beam.mesh);
    collision.addCircle(x, z, 2.2, 'crystal-' + id);
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

  // Aurora Shards collected for this crystal light up its orbiting shards.
  setShards(n) {
    this.shardCount = n;
    this.shardMats.forEach((m, i) => {
      const lit = i < n;
      m.color.copy(lit ? this.color : DRAINED);
      m.emissive.copy(lit ? this.color : DRAINED);
      m.emissiveIntensity = lit ? 1.0 : 0.15;
    });
  }

  update(dt, t) {
    this.level = damp(this.level, this.restored ? 1 : 0, 1.5, dt);
    this.chargeShown = damp(this.chargeShown, this.charge, 4, dt);
    this.pulse = damp(this.pulse, 0, 3, dt);
    const lit = Math.max(this.level, this.chargeShown * 0.8);
    this.material.color.copy(DRAINED).lerp(this.color, lit);
    this.material.emissive.copy(DRAINED).lerp(this.color, lit);
    this.material.emissiveIntensity = 0.25 + lit * 0.75 + this.pulse * 0.8;
    const bob = Math.sin(t * 1.3) * 0.25;
    this.mesh.position.y = this.base.y + 3.6 + bob;
    this.mesh.rotation.y = t * (0.3 + lit * 0.5);
    this.shards.forEach((s, i) => {
      const a = t * (0.8 + lit) + (i * Math.PI * 2) / 3;
      s.position.set(this.base.x + Math.cos(a) * 2.2, this.base.y + 3.2 + Math.sin(t * 2 + i) * 0.5, this.base.z + Math.sin(a) * 2.2);
      s.rotation.y = t * 2;
    });
    this.glow.set(this.glowIndex, {
      x: this.base.x, y: this.mesh.position.y, z: this.base.z,
      color: this.material.emissive, intensity: 0.4 + lit * 1.1 + this.pulse, size: 9 + lit * 5 + this.pulse * 6,
    });
    this.beam.uniforms.uAlpha.value = this.level * 0.55;
  }
}

export class FractionPillar {
  constructor(ctx, x, z) {
    const { scene, terrain, collision, glow, batch } = ctx;
    const y = terrain.heightAt(x, z);
    this.pos = new THREE.Vector3(x, y, z);
    batch.add(new THREE.CylinderGeometry(0.95, 1.2, 0.8, 8), 0x5c6399, mat(x, y + 0.4, z));
    batch.add(new THREE.CylinderGeometry(0.95, 0.95, 0.3, 8), 0x5c6399, mat(x, y + 5.05, z));
    this.group = new THREE.Group();
    this.group.position.set(x, y, z);
    scene.add(this.group);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 4.1, 20, 1, true), new THREE.MeshLambertMaterial({
      color: 0xbfefff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, emissive: 0x1a3a4a,
    }));
    glass.position.y = 2.85;
    glass.renderOrder = 4;
    this.fillMat = new THREE.MeshLambertMaterial({ color: 0x38f0d2, emissive: 0x38f0d2, emissiveIntensity: 0.9 });
    this.fill = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1, 18), this.fillMat);
    this.fill.position.y = 0.8;
    this.fill.scale.y = 0.001;
    this.marks = new THREE.Group();
    this.group.add(glass, this.fill, this.marks);
    this.capMat = new THREE.MeshLambertMaterial({ color: 0x5a557a, emissive: 0x5a557a, emissiveIntensity: 0.2, flatShading: true });
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), this.capMat);
    cap.position.y = 5.8;
    cap.scale.y = 1.6;
    this.cap = cap;
    this.group.add(cap);
    this.glowIndex = glow.add(x, y + 5.8, z, 0x38f0d2, 5, 0.0);
    this.glow = glow;
    collision.addCircle(x, z, 1.25, 'pillar');
    this.target = 0;
    this.shown = 0;
    this.done = false;
    this.H = 4.0;
  }

  setMarks(denominator) {
    this.marks.clear();
    const ringGeo = new THREE.TorusGeometry(0.74, 0.035, 4, 24);
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for (let i = 1; i < denominator; i++) {
      const r = new THREE.Mesh(ringGeo, m);
      r.rotation.x = Math.PI / 2;
      r.position.y = 0.8 + (this.H * i) / denominator;
      this.marks.add(r);
    }
  }

  setFill(f) { this.target = Math.max(0, Math.min(1, f)); }

  complete() {
    this.done = true;
    this.target = 1;
    this.marks.clear();
  }

  update(dt, t) {
    this.shown = damp(this.shown, this.target, 3, dt);
    this.fill.scale.y = Math.max(0.001, this.shown * this.H);
    this.fill.position.y = 0.8 + (this.shown * this.H) / 2;
    const lit = this.done ? 1 : 0;
    this.capMat.emissive.setHex(this.done ? 0x38f0d2 : 0x5a557a);
    this.capMat.emissiveIntensity = this.done ? 1.1 + Math.sin(t * 3) * 0.2 : 0.2;
    this.cap.rotation.y = t * (this.done ? 1.5 : 0.3);
    this.glow.set(this.glowIndex, { color: 0x38f0d2, intensity: lit * 1.2 + this.shown * 0.3 });
  }
}

function buildCave(ctx) {
  const { scene, collision, glow, batch, terrain } = ctx;
  const C = LOC.caveDome;
  const floorY = terrain.heightAt(C.x, C.z);
  const dir = new THREE.Vector2(LOC.lake.x - C.x, LOC.lake.z - C.z).normalize();
  const a0 = Math.atan2(dir.y, dir.x);
  const w = 1.35;
  const R = C.r;
  const iceMat = lambert({ color: 0xb4d6ff, emissive: 0x1a1850, side: THREE.DoubleSide, flatShading: true }, { strength: 0.5, color: 0xc8b8ff });
  const domeGeo = new THREE.SphereGeometry(R, 44, 14, -Math.PI - a0 + w / 2, Math.PI * 2 - w, 0, Math.PI / 2);
  jitter(domeGeo, 0.7, 5);
  const dome = new THREE.Mesh(domeGeo, iceMat);
  dome.position.set(C.x, floorY - 0.4, C.z);
  dome.castShadow = true;
  dome.receiveShadow = true;
  scene.add(dome);
  const capGeo = new THREE.SphereGeometry(R, 10, 6, -Math.PI - a0 - w / 2 - 0.05, w + 0.1, 0, 0.86);
  jitter(capGeo, 0.5, 9);
  const cap = new THREE.Mesh(capGeo, iceMat);
  cap.position.copy(dome.position);
  scene.add(cap);
  // Entrance arch
  const archDist = 11.4;
  const ax = C.x + dir.x * archDist, az = C.z + dir.y * archDist;
  const archGeo = new THREE.TorusGeometry(6.6, 2.1, 10, 26, Math.PI);
  jitter(archGeo, 0.4, 3);
  const arch = new THREE.Mesh(archGeo, iceMat);
  arch.position.set(ax, floorY - 0.4, az);
  arch.rotation.y = Math.atan2(dir.x, dir.y);
  arch.castShadow = true;
  scene.add(arch);
  // Icicles along the arch
  const icicleGeo = new THREE.ConeGeometry(0.16, 1.2, 5);
  icicleGeo.rotateX(Math.PI);
  const N_ICE = 13;
  const ice = new THREE.InstancedMesh(icicleGeo, lambert({ color: 0xdff0ff, emissive: 0x2a3a70 }), N_ICE);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < N_ICE; i++) {
    const t = 0.12 + (i / (N_ICE - 1)) * 0.76;
    const ang = Math.PI * t;
    const lx = Math.cos(ang) * 4.6, ly = Math.sin(ang) * 4.6;
    const s = 0.45 + ((i * 37) % 10) / 16;
    const px = ax + Math.cos(arch.rotation.y) * lx, pz = az - Math.sin(arch.rotation.y) * lx;
    m4.compose(new THREE.Vector3(px, floorY - 0.4 + ly - 0.6 * s, pz), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    ice.setMatrixAt(i, m4);
  }
  ice.instanceMatrix.needsUpdate = true;
  scene.add(ice);
  // Ice floor inside
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R - 0.6, 40), lambert({ color: 0xcfe6ff, emissive: 0x241e5a }, { strength: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(C.x, floorY + 0.04, C.z);
  floor.receiveShadow = true;
  scene.add(floor);
  // Inner glow
  glow.add(C.x, floorY + 6, C.z, 0x8a6bff, 22, 0.45);
  ctx.lanterns.push({ x: C.x, y: floorY + 5, z: C.z, intensity: 45 });
  // Walls: ring with a gap for the entrance, plus arch legs.
  const gapW = 0.95;
  collision.addRing(C.x, C.z, R, 1.4, a0, gapW, 'cave');
  const perp = new THREE.Vector2(-dir.y, dir.x);
  for (const s of [-1, 1]) collision.addCircle(ax + perp.x * 6.6 * s, az + perp.y * 6.6 * s, 2.0, 'cave');
  ctx.cave = { center: new THREE.Vector3(C.x, floorY, C.z), dir, floorY };
  // Build pad in front of the crystal
  const padX = C.x + dir.x * 2.5, padZ = C.z + dir.y * 2.5;
  const padTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#bfe2ff'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(80,110,200,0.45)'; g.lineWidth = 2;
    for (let i = 0; i <= 256; i += 21.33) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 6.4), [
    lambert({ color: 0x8fb8f0 }), lambert({ color: 0x8fb8f0 }),
    lambert({ map: padTex, emissive: 0x101840 }, { strength: 0.2 }),
    lambert({ color: 0x8fb8f0 }), lambert({ color: 0x8fb8f0 }), lambert({ color: 0x8fb8f0 }),
  ]);
  pad.position.set(padX, floorY + 0.15, padZ);
  pad.rotation.y = Math.atan2(dir.x, dir.y);
  pad.receiveShadow = true;
  scene.add(pad);
  ctx.buildPad = { x: padX, z: padZ, y: floorY + 0.3, yaw: pad.rotation.y, size: 6.4 };
  const p = ctx.collision.addPlatform({ kind: 'box', x: padX, z: padZ, hw: 3.2, hd: 3.2, rot: pad.rotation.y, top: floorY + 0.3 });
  ctx.buildPad.platform = p;
}

function buildSpire(ctx) {
  const { scene, collision, glow, terrain, batch } = ctx;
  const S = LOC.spire;
  const y = terrain.heightAt(S.x, S.z);
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 9.4, 0.5, 8), lambert({ color: 0x5a609c, flatShading: true }, { strength: 0.3 }));
  dais.position.set(S.x, y + 0.25, S.z);
  dais.receiveShadow = true;
  scene.add(dais);
  collision.addPlatform({ kind: 'circle', x: S.x, z: S.z, r: 9.2, top: y + 0.5 });
  const runes = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.1, 6, 64), new THREE.MeshBasicMaterial({ color: 0xb58cff }));
  runes.rotation.x = Math.PI / 2;
  runes.position.set(S.x, y + 0.53, S.z);
  scene.add(runes);
  const obMat = crystalMaterial(0x8a5cff, 0.7);
  const ob = new THREE.Mesh(mergeColored([
    { geo: new THREE.CylinderGeometry(1.5, 2.3, 18, 6), color: 0xd0d0ff, matrix: mat(0, 9, 0) },
    { geo: new THREE.ConeGeometry(1.5, 4.5, 6), color: 0xffffff, matrix: mat(0, 20.25, 0) },
    { geo: new THREE.CylinderGeometry(3.0, 3.4, 1.4, 6), color: 0x8080a0, matrix: mat(0, 0.7, 0) },
  ]), obMat);
  ob.position.set(S.x, y + 0.5, S.z);
  ob.castShadow = true;
  scene.add(ob);
  const symTex = symbolTexture();
  symTex.wrapS = THREE.RepeatWrapping;
  symTex.repeat.set(6, 1);
  const sym = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 2.36, 16, 6, 1, true), new THREE.MeshBasicMaterial({
    map: symTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xe8d8ff,
  }));
  sym.position.set(S.x, y + 0.5 + 9.5, S.z);
  scene.add(sym);
  collision.addCircle(S.x, S.z, 3.3, 'spire');
  const glowTop = glow.add(S.x, y + 24, S.z, 0xb58cff, 18, 0.9);
  glow.add(S.x, y + 3, S.z, 0x8a5cff, 14, 0.6);
  const shards = [];
  const shardGeo = new THREE.OctahedronGeometry(0.6, 0);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(shardGeo, obMat);
    s.scale.y = 1.8;
    scene.add(s);
    shards.push(s);
  }
  const shield = makeShield(new THREE.SphereGeometry(15, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), 0x9a6bff, 6);
  shield.mesh.position.set(S.x, y, S.z);
  scene.add(shield.mesh);
  const shieldRing = collision.addRing(S.x, S.z, 15, 1.2, null, 0, 'spire-shield');
  const beam = makeBeam(0xffd86b);
  beam.mesh.scale.set(2.2, 1, 2.2);
  beam.mesh.position.set(S.x, y + 22 + 160, S.z);
  scene.add(beam.mesh);
  const spire = {
    base: new THREE.Vector3(S.x, y + 0.5, S.z), top: new THREE.Vector3(S.x, y + 22, S.z),
    shield, shieldRing, beam, obMat, sym, glowTop, open: false, finale: false, level: 0,
    setOpen(v) {
      this.open = v;
      shieldRing.forEach((c) => { c.active = !v; });
    },
    setFinale(v) { this.finale = v; beam.mesh.visible = v; },
  };
  ctx.animated.push((dt, t) => {
    spire.level = damp(spire.level, spire.finale ? 1 : spire.open ? 0.6 : 0.25, 1.2, dt);
    shards.forEach((s, i) => {
      const a = t * 0.5 + (i * Math.PI * 2) / 5;
      s.position.set(S.x + Math.cos(a) * 5, y + 8 + i * 2.2 + Math.sin(t * 1.5 + i) * 0.6, S.z + Math.sin(a) * 5);
      s.rotation.y = t;
    });
    obMat.emissiveIntensity = 0.25 + spire.level * 0.9;
    sym.material.opacity = 0.2 + spire.level * 0.8;
    shield.uniforms.uAlpha.value = damp(shield.uniforms.uAlpha.value, spire.open ? 0 : 0.5, 1.5, dt);
    shield.mesh.visible = shield.uniforms.uAlpha.value > 0.01;
    beam.uniforms.uAlpha.value = spire.finale ? 0.7 : 0;
    ctx.glow.set(glowTop, { color: 0xb58cff, intensity: 0.4 + spire.level * 1.2 });
  });
  ctx.spire = spire;
}

function buildIslandBarrier(ctx) {
  const { scene, collision } = ctx;
  const I = LOC.island;
  const shield = makeShield(new THREE.CylinderGeometry(13, 13, 3.4, 64, 1, true), 0x7a4ad8, 9);
  shield.mesh.position.set(I.x, WATER_Y + 1.0, I.z);
  scene.add(shield.mesh);
  const ring = collision.addRing(I.x, I.z, 13, 1.1, null, 0, 'island-barrier');
  ring.forEach((c) => { c.onlySwim = true; });
  const barrier = {
    shield, ring, up: true,
    setUp(v) { this.up = v; ring.forEach((c) => { c.active = v; }); },
  };
  ctx.animated.push((dt) => {
    shield.uniforms.uAlpha.value = damp(shield.uniforms.uAlpha.value, barrier.up ? 0.9 : 0, 1.5, dt);
    shield.mesh.visible = shield.uniforms.uAlpha.value > 0.01;
  });
  ctx.islandBarrier = barrier;
}

function buildArena(ctx) {
  const { batch, terrain, collision, glow } = ctx;
  const A = LOC.arena;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const x = A.x + Math.cos(a) * 15, z = A.z + Math.sin(a) * 11;
    const y = terrain.heightAt(x, z);
    batch.add(new THREE.BoxGeometry(1.2, 3.4, 0.9), 0x3a3456, mat(x, y + 1.5, z, 0.05, -a, 0.08));
    batch.add(new THREE.BoxGeometry(0.5, 0.5, 0.95), 0x9a6bff, mat(x, y + 2.3, z, 0.05, -a, 0.08));
    glow.add(x, y + 2.3, z, 0x8a5cff, 3.5, 0.9);
    collision.addCircle(x, z, 0.9, 'totem');
  }
}

export function buildLandmarks(ctx) {
  ctx.crystals = {};
  for (const [id, p] of Object.entries(CRYSTALS)) ctx.crystals[id] = new AuroraCrystal(ctx, id, p.x, p.z);
  ctx.animated.push((dt, t) => { for (const c of Object.values(ctx.crystals)) c.update(dt, t); });

  const G = CRYSTALS.grove;
  ctx.pillars = [90, 210, 330].map((deg) => {
    const a = THREE.MathUtils.degToRad(deg);
    return new FractionPillar(ctx, G.x + Math.cos(a) * 7.5, G.z + Math.sin(a) * 7.5);
  });
  ctx.animated.push((dt, t) => ctx.pillars.forEach((p) => p.update(dt, t)));

  buildCave(ctx);
  buildSpire(ctx);
  buildIslandBarrier(ctx);
  buildArena(ctx);

  // Crystals on the island around the pedestal.
  const I = LOC.island;
  const cg = clusterGeometry(17);
  const isl = new THREE.InstancedMesh(cg, crystalMaterial(CRYSTAL_COLORS.green, 0.7), 5);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    const x = I.x + Math.cos(a) * 5.5, z = I.z + Math.sin(a) * 5.5;
    m4.compose(new THREE.Vector3(x, ctx.terrain.heightAt(x, z) - 0.1, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)), new THREE.Vector3(0.9, 0.9, 0.9));
    isl.setMatrixAt(i, m4);
    ctx.glow.add(x, ctx.terrain.heightAt(x, z) + 1.2, z, CRYSTAL_COLORS.green, 5, 0.8);
  }
  isl.instanceMatrix.needsUpdate = true;
  isl.computeBoundingSphere();
  ctx.scene.add(isl);

  if (ctx.finishBatch) ctx.finishBatch();
  return ctx;
}
