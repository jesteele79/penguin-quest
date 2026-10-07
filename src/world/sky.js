import * as THREE from 'three';
import { glowTexture, moonTexture } from '../core/textures.js';
import { REGION_COLORS } from '../core/materials.js';
import { Rng } from '../core/rng.js';
import { damp } from '../core/mathutil.js';

export const FOG_COLOR = new THREE.Color(0x27336f);
export const MOON_DIR = new THREE.Vector3(0.28, 0.56, -0.78).normalize();

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const skyFrag = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uBand;
uniform vec3 uMoonDir;
uniform float uGlow;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.6, h));
  col += uBand * exp(-abs(h - 0.1) * 7.0) * 0.55;
  float m = max(dot(d, uMoonDir), 0.0);
  col += vec3(0.55, 0.62, 0.95) * pow(m, 18.0) * 0.35 * uGlow;
  // faint milky way along a tilted great circle
  vec3 bandN = normalize(vec3(0.3, 0.2, 0.93));
  float mw = exp(-pow(dot(d, bandN) * 6.0, 2.0));
  float mwn = 0.55 + 0.45 * sin(d.x * 31.0 + sin(d.z * 17.0) * 2.0) * sin(d.y * 23.0 - d.z * 11.0);
  col += vec3(0.28, 0.25, 0.5) * mw * mwn * 0.18 * smoothstep(0.02, 0.3, h);
  col = mix(col, uHorizon * 0.85, smoothstep(0.0, -0.25, h));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const starVert = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixel;
varying vec3 vColor;
varying float vTw;
void main() {
  vColor = aColor;
  vTw = 0.65 + 0.35 * sin(uTime * (1.2 + aPhase * 2.0) + aPhase * 30.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixel;
}`;

const starFrag = /* glsl */ `
varying vec3 vColor;
varying float vTw;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor * vTw, a * vTw);
  #include <colorspace_fragment>
}`;

const auroraVert = /* glsl */ `
uniform float uTime;
uniform float uSeed;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float fold = sin(uv.x * 9.0 + uTime * 0.35 + uSeed) * 22.0 + sin(uv.x * 23.0 - uTime * 0.6 + uSeed * 2.0) * 7.0;
  p.xz += normalize(p.xz) * fold * (0.4 + uv.y);
  p.y += sin(uv.x * 5.0 + uTime * 0.25 + uSeed) * 18.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const auroraFrag = /* glsl */ `
uniform float uTime;
uniform float uStrength;
uniform float uSat;
uniform float uSeed;
uniform vec3 uColA;
uniform vec3 uColB;
varying vec2 vUv;
void main() {
  float x = vUv.x;
  float rays = 0.55 + 0.45 * sin(x * 60.0 + sin(x * 11.0 + uTime * 0.5 + uSeed) * 3.0 + uTime * 0.3);
  float fine = 0.6 + 0.4 * sin(x * 190.0 + sin(x * 37.0 - uTime * 0.8) * 4.0);
  float drift = 0.5 + 0.5 * sin(x * 7.0 - uTime * 0.22 + uSeed * 3.0);
  float bottom = smoothstep(0.0, 0.1, vUv.y);
  float top = pow(1.0 - vUv.y, 1.7);
  float edge = smoothstep(0.0, 0.12, x) * smoothstep(1.0, 0.88, x);
  float a = rays * fine * (0.35 + 0.65 * drift) * bottom * top * edge * uStrength;
  vec3 col = mix(uColA, uColB, smoothstep(0.05, 0.85, vUv.y));
  float grey = dot(col, vec3(0.3, 0.5, 0.2));
  col = mix(vec3(grey) * vec3(0.7, 0.75, 0.95), col, uSat);
  gl_FragColor = vec4(col * 1.35, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const RIBBONS = [
  { id: 'lake', az0: 40, az1: 118, r: 560, y: 100, h: 290, seed: 1.3 },
  { id: 'grove', az0: 128, az1: 206, r: 600, y: 115, h: 260, seed: 4.1 },
  { id: 'huts', az0: -48, az1: 26, r: 580, y: 120, h: 250, seed: 2.2 },
  { id: 'cave', az0: 214, az1: 292, r: 600, y: 105, h: 245, seed: 5.7 },
  { id: 'ridge', az0: 84, az1: 164, r: 690, y: 190, h: 270, seed: 3.4 },
  { id: 'crown', az0: 10, az1: 170, r: 440, y: 270, h: 170, seed: 6.6 },
];

function ribbonGeometry(def) {
  const seg = 120;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const az = THREE.MathUtils.degToRad(def.az0 + (def.az1 - def.az0) * u);
    const r = def.r + Math.sin(u * 5.0 + def.seed) * 40;
    const x = Math.cos(az) * r, z = -Math.sin(az) * r;
    const y0 = def.y + Math.sin(u * 3.0 + def.seed) * 30;
    pos.push(x, y0, z, x, y0 + def.h, z);
    uv.push(u, 0, u, 1);
    if (i < seg) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export class Sky {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'sky';
    scene.add(this.group);

    this.skyUniforms = {
      uZenith: { value: new THREE.Color(0x070b26) },
      uHorizon: { value: FOG_COLOR.clone() },
      uBand: { value: new THREE.Color(0x4a3a9a) },
      uMoonDir: { value: MOON_DIR },
      uGlow: { value: 1 },
    };
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(900, 48, 24),
      new THREE.ShaderMaterial({
        uniforms: this.skyUniforms,
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    );
    // Drawn after the other opaque objects, with depth testing, so it only shades the sky pixels that
    // nothing else covered (drawing it first shaded the whole screen once more every frame).
    dome.renderOrder = 1000;
    dome.frustumCulled = false;
    this.group.add(dome);

    this.buildStars();
    this.buildMoon();
    this.buildAurora();
  }

  buildStars() {
    const rng = new Rng(99);
    const N = 1600;
    const pos = new Float32Array(N * 3), size = new Float32Array(N), phase = new Float32Array(N), col = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      let x, y, z, l;
      do { x = rng.float(-1, 1); y = rng.float(-0.1, 1); z = rng.float(-1, 1); l = Math.hypot(x, y, z); } while (l > 1 || l < 0.2);
      pos.set([(x / l) * 850, (y / l) * 850, (z / l) * 850], i * 3);
      size[i] = rng.chance(0.06) ? rng.float(2.6, 3.6) : rng.float(1.1, 2.2);
      phase[i] = rng.next();
      c.set(rng.pick([0xffffff, 0xdfe8ff, 0xfff1d6, 0xcfd9ff]));
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    this.starUniforms = { uTime: { value: 0 }, uPixel: { value: 1 } };
    const stars = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: this.starUniforms,
      vertexShader: starVert,
      fragmentShader: starFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    }));
    stars.renderOrder = -90;
    stars.frustumCulled = false;
    this.group.add(stars);
  }

  buildMoon() {
    const p = MOON_DIR.clone().multiplyScalar(780);
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTexture(), fog: false, depthWrite: false, transparent: true }));
    moon.position.copy(p);
    moon.scale.setScalar(62);
    moon.renderOrder = -80;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(), color: 0x9fb2ff, fog: false, depthWrite: false, transparent: true,
      blending: THREE.AdditiveBlending, opacity: 0.55,
    }));
    halo.position.copy(p);
    halo.scale.setScalar(300);
    halo.renderOrder = -81;
    this.group.add(halo, moon);
  }

  buildAurora() {
    this.ribbons = {};
    for (const def of RIBBONS) {
      const colors = REGION_COLORS[def.id];
      const uniforms = {
        uTime: { value: 0 },
        uStrength: { value: 0.0 },
        uSat: { value: 0.0 },
        uSeed: { value: def.seed },
        uColA: { value: new THREE.Color(colors.a) },
        uColB: { value: new THREE.Color(colors.b) },
      };
      const mesh = new THREE.Mesh(ribbonGeometry(def), new THREE.ShaderMaterial({
        uniforms,
        vertexShader: auroraVert,
        fragmentShader: auroraFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: false,
      }));
      mesh.renderOrder = -70;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      // target: 0 = drained, 1 = restored; `boost` animates the restore moment
      this.ribbons[def.id] = { mesh, uniforms, level: 0, target: 0, boost: 0, hidden: def.id === 'crown' };
    }
  }

  setRestored(id, restored, instant = false) {
    const r = this.ribbons[id];
    if (!r) return;
    r.target = restored ? 1 : 0;
    if (id === 'crown') r.hidden = !restored;
    if (instant) r.level = r.target;
  }

  pulse(id, amount = 1.5) {
    const r = this.ribbons[id];
    if (r) r.boost = amount;
  }

  update(dt, time, camera, pixelScale) {
    this.group.position.set(camera.position.x, 0, camera.position.z);
    this.starUniforms.uTime.value = time;
    this.starUniforms.uPixel.value = pixelScale;
    for (const r of Object.values(this.ribbons)) {
      r.level = damp(r.level, r.target, 0.8, dt);
      r.boost = damp(r.boost, 0, 0.6, dt);
      const base = r.hidden ? 0 : 0.2 + r.level * 0.9;
      r.uniforms.uStrength.value = base * (1 + r.boost);
      r.uniforms.uSat.value = Math.min(1, 0.15 + r.level * 0.85 + r.boost * 0.2);
      r.uniforms.uTime.value = time;
      r.mesh.visible = r.uniforms.uStrength.value > 0.005;
    }
  }
}
