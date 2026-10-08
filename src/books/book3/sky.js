// Blue-hour sky over Skyreach: deep indigo overhead, a peach glow where the sun has just set, and the first
// stars. Same interface as the other books' skies: each Star Anchor relit brings out one constellation, and
// the finale ('crown') joins them into the Star Map.
import * as THREE from 'three';
import { damp } from '../../core/mathutil.js';
import { Rng } from '../../core/rng.js';

export const HAZE = new THREE.Color(0x9a92c8);
export const SUN_DIR = new THREE.Vector3(-0.56, 0.34, -0.76).normalize();

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const frag = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uGlow;
uniform vec3 uSunDir;
uniform float uTime;
uniform float uStars;
varying vec3 vDir;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  float sun = max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0);
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.25, h));
  col = mix(col, uZenith, smoothstep(0.2, 0.85, h));
  // The afterglow hugs the horizon on the side the sun went down.
  col += uGlow * exp(-max(h, 0.0) * 7.0) * pow(sun, 2.0) * 0.9;
  col += uGlow * exp(-max(h, 0.0) * 18.0) * 0.18;
  // A faint band of the sky river, brighter once the Star Map is whole.
  vec3 axis = normalize(vec3(0.35, 0.2, 0.92));
  float river = exp(-pow(dot(d, axis) * 3.2, 2.0)) * smoothstep(0.05, 0.4, h);
  col += vec3(0.42, 0.38, 0.62) * river * (0.12 + uStars * 0.22) * (0.6 + 0.4 * vnoise(d.xz * 9.0));
  col = mix(col, uHorizon * 0.96, smoothstep(0.0, -0.25, h));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// Each constellation belongs to one island: [azimuth, elevation] of its stars (degrees) and the lines.
const CONSTELLATIONS = {
  lake: { name: 'The Kite', stars: [[-60, 38], [-52, 46], [-44, 38], [-52, 28], [-56, 20], [-50, 14]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5]] },
  grove: { name: 'The Puffling', stars: [[-128, 30], [-120, 36], [-112, 33], [-110, 26], [-118, 22], [-126, 24]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]] },
  huts: { name: 'The Gear', stars: [[60, 40], [68, 46], [76, 40], [76, 31], [68, 26], [60, 31], [68, 36]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [6, 1], [6, 4]] },
  cave: { name: 'The Lantern', stars: [[128, 34], [134, 42], [140, 34], [138, 22], [130, 22]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },
  ridge: { name: 'The Spyglass', stars: [[10, 52], [18, 57], [27, 61], [36, 63], [20, 48]], lines: [[0, 1], [1, 2], [2, 3], [1, 4]] },
};
const toDir = ([az, el]) => {
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
};

function starTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class TwilightSky {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'sky';
    scene.add(this.group);
    this.uniforms = {
      uZenith: { value: new THREE.Color(0x1a2260) },
      uMid: { value: new THREE.Color(0x4a4a9c) },
      uHorizon: { value: HAZE.clone() },
      uGlow: { value: new THREE.Color(0xffa98c) },
      uSunDir: { value: SUN_DIR },
      uTime: { value: 0 },
      uStars: { value: 0 },
    };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false,
    }));
    dome.renderOrder = 1000;
    dome.frustumCulled = false;
    this.group.add(dome);
    const tex = starTexture();
    // A field of faint stars, twinkling a little.
    const rng = new Rng(4242);
    const pos = [];
    for (let i = 0; i < 700; i++) {
      const el = Math.asin(rng.float(0.06, 1));
      const az = rng.float(0, Math.PI * 2);
      pos.push(Math.sin(az) * Math.cos(el) * 820, Math.sin(el) * 820, -Math.cos(az) * Math.cos(el) * 820);
    }
    const field = new THREE.BufferGeometry();
    field.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.fieldMat = new THREE.PointsMaterial({ map: tex, color: 0xdfe4ff, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.6, depthWrite: false, fog: false });
    const pts = new THREE.Points(field, this.fieldMat);
    pts.renderOrder = 1001;
    pts.frustumCulled = false;
    this.group.add(pts);
    // The constellations: bright stars and the lines that join them, each fading in when its island is safe.
    this.cons = {};
    for (const [id, C] of Object.entries(CONSTELLATIONS)) {
      const dirs = C.stars.map(toDir).map((v) => v.multiplyScalar(800));
      const sg = new THREE.BufferGeometry().setFromPoints(dirs);
      const starMat = new THREE.PointsMaterial({ map: tex, color: 0xfff2c8, size: 7, sizeAttenuation: false, transparent: true, opacity: 0.25, depthWrite: false, fog: false });
      const stars = new THREE.Points(sg, starMat);
      const lp = [];
      for (const [a, b] of C.lines) lp.push(dirs[a], dirs[b]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0, depthWrite: false, fog: false });
      const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp), lineMat);
      for (const o of [stars, lines]) { o.renderOrder = 1002; o.frustumCulled = false; this.group.add(o); }
      this.cons[id] = { starMat, lineMat, level: 0 };
    }
    this.restored = {};
    this.map = 0;
    this.boost = {};
  }

  setRestored(id, restored, instant = false) {
    this.restored[id] = restored;
    if (instant) {
      if (this.cons[id]) this.cons[id].level = restored ? 1 : 0;
      if (id === 'crown') this.map = restored ? 1 : 0;
    }
  }

  pulse(id, amount = 1.5) { this.boost[id] = Math.max(this.boost[id] ?? 0, amount); }

  update(dt, time, camera) {
    this.group.position.set(camera.position.x, 0, camera.position.z);
    this.uniforms.uTime.value = time;
    this.map = damp(this.map, this.restored.crown ? 1 : 0, 0.6, dt);
    this.uniforms.uStars.value = this.map;
    this.fieldMat.opacity = 0.5 + this.map * 0.35 + Math.sin(time * 0.7) * 0.04;
    for (const [id, c] of Object.entries(this.cons)) {
      c.level = damp(c.level, this.restored[id] ? 1 : 0, 0.8, dt);
      const b = (this.boost[id] = damp(this.boost[id] ?? 0, 0, 1.2, dt));
      c.starMat.opacity = 0.25 + c.level * 0.7 + b * 0.2;
      c.starMat.size = 7 + c.level * 3 + b * 4;
      c.lineMat.opacity = c.level * (0.55 + this.map * 0.3) + b * 0.25;
    }
  }
}
