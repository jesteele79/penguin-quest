// Golden-hour sky over the Ember Isles: warm haze at the horizon, a low sun, soft pink clouds. Same
// interface as Book 1's aurora sky: each Ember Vent that is reopened makes the sunset glow a little warmer.
import * as THREE from 'three';
import { damp } from '../../core/mathutil.js';

export const HAZE = new THREE.Color(0xe8a68f);
export const SUN_DIR = new THREE.Vector3(-0.5, 0.42, 0.76).normalize();

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const frag = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uBand;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform float uTime;
uniform float uWarm;
varying vec3 vDir;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  float sun = max(dot(d, uSunDir), 0.0);
  vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.6, h));
  col += uBand * exp(-abs(h - 0.05) * 8.0) * (0.35 + 0.65 * pow(sun, 1.5)) * (0.75 + 0.5 * uWarm);
  col += uSunCol * pow(sun, 12.0) * 0.5;
  col += uSunCol * smoothstep(0.9993, 0.9997, sun) * 2.5;
  // A band of soft clouds above the horizon, lit warm on the sun's side.
  vec2 cp = d.xz / (h + 0.22) * 1.4 + vec2(uTime * 0.006, uTime * 0.002);
  float c = smoothstep(0.5, 0.78, fbm(cp));
  float band = smoothstep(0.015, 0.1, h) * (1.0 - smoothstep(0.32, 0.55, h));
  vec3 cloud = mix(vec3(0.9, 0.62, 0.72), vec3(1.0, 0.86, 0.64), pow(sun, 2.5));
  col = mix(col, cloud, c * band * 0.7);
  col = mix(col, uHorizon * 0.92, smoothstep(0.0, -0.22, h));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class SunsetSky {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'sky';
    scene.add(this.group);
    this.uniforms = {
      uZenith: { value: new THREE.Color(0x3f5f9e) },
      uHorizon: { value: HAZE.clone() },
      uBand: { value: new THREE.Color(0xff8a6a) },
      uSunDir: { value: SUN_DIR },
      uSunCol: { value: new THREE.Color(0xffe2b0) },
      uTime: { value: 0 },
      uWarm: { value: 0 },
    };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false,
    }));
    // Drawn after the opaque scene with depth testing, so only uncovered sky pixels are shaded.
    dome.renderOrder = 1000;
    dome.frustumCulled = false;
    this.group.add(dome);
    this.restored = {};
    this.warm = 0;
    this.boost = 0;
  }

  setRestored(id, restored, instant = false) {
    this.restored[id] = restored;
    if (instant) this.warm = this.target;
  }

  get target() {
    const n = ['lake', 'grove', 'huts', 'cave', 'ridge'].filter((k) => this.restored[k]).length;
    return n / 5 + (this.restored.crown ? 0.4 : 0);
  }

  pulse(id, amount = 1.5) { this.boost = Math.max(this.boost, amount * 0.4); }

  update(dt, time, camera) {
    this.group.position.set(camera.position.x, 0, camera.position.z);
    this.warm = damp(this.warm, this.target, 0.8, dt);
    this.boost = damp(this.boost, 0, 0.6, dt);
    this.uniforms.uTime.value = time;
    this.uniforms.uWarm.value = this.warm + this.boost;
  }
}
