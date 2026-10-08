// The cloud sea under Skyreach: a slow, lumpy blanket lit peach on the sunset side and lavender in shadow,
// with soft billows rising out of it. It takes the place of the other books' water (same interface).
import * as THREE from 'three';
import { puffTexture } from '../../core/textures.js';
import { Rng } from '../../core/rng.js';
import { WATER_Y, ISLANDS } from './layout.js';
import { SUN_DIR } from './sky.js';

const vert = /* glsl */ `
varying vec2 vXZ;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vXZ = wp.xz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const frag = /* glsl */ `
uniform float uTime;
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uDeep;
uniform vec2 uSun;
varying vec2 vXZ;
#include <fog_pars_fragment>
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 5; k++) { v += a * vnoise(p); p = p * 2.07 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main() {
  vec2 p = vXZ * 0.018;
  float t = uTime * 0.012;
  float n = fbm(p + vec2(t, t * 0.6));
  float m = fbm(p * 2.3 - vec2(t * 1.4, 0.0));
  float puff = smoothstep(0.32, 0.78, n * 0.7 + m * 0.4);
  // Light falls from the sunset side: the slope of the billows decides lit or shaded.
  float e = 0.6;
  float nx = fbm(p + vec2(e * 0.05, 0.0) + vec2(t, t * 0.6)) - n;
  float nz = fbm(p + vec2(0.0, e * 0.05) + vec2(t, t * 0.6)) - n;
  float lit = clamp(0.55 - (nx * uSun.x + nz * uSun.y) * 18.0, 0.0, 1.0);
  vec3 col = mix(uDeep, mix(uShade, uLit, lit), 0.55 + puff * 0.45);
  col += uLit * pow(puff, 3.0) * 0.18;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export class CloudSea {
  constructor(scene, terrain) {
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.group.name = 'clouds';
    scene.add(this.group);
    this.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 },
      uLit: { value: new THREE.Color(0xffd8cc) },
      uShade: { value: new THREE.Color(0x9c96d6) },
      uDeep: { value: new THREE.Color(0x6a6aae) },
      uSun: { value: new THREE.Vector2(SUN_DIR.x, SUN_DIR.z).normalize() },
    }]);
    const sea = new THREE.Mesh(new THREE.CircleGeometry(900, 72), new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: vert, fragmentShader: frag, fog: true }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = WATER_Y;
    sea.receiveShadow = false;
    this.group.add(sea);
    // Billows: soft puffs sitting on the blanket, thickest around the islands' feet.
    const rng = new Rng(77);
    const tex = puffTexture();
    this.billows = [];
    const add = (x, z, s, y) => {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: rng.chance(0.5) ? 0xf3e8ff : 0xffe4dc, transparent: true, opacity: rng.float(0.5, 0.8), depthWrite: false, fog: true }));
      m.scale.set(s, s * 0.55, 1);
      m.position.set(x, y, z);
      m.material.rotation = rng.float(-0.3, 0.3);
      this.group.add(m);
      this.billows.push({ m, x, z, phase: rng.float(0, 6), drift: rng.float(0.2, 0.6) });
    };
    for (const I of Object.values(ISLANDS)) {
      const k = Math.round(I.r / 4);
      for (let i = 0; i < k; i++) {
        const a = rng.float(0, Math.PI * 2), r = I.r + rng.float(2, 9);
        add(I.x + Math.cos(a) * r, I.z + Math.sin(a) * r, rng.float(14, 26), WATER_Y + rng.float(0.5, 3));
      }
    }
    for (let i = 0; i < 40; i++) {
      const a = rng.float(0, Math.PI * 2), r = rng.float(40, 260);
      add(Math.cos(a) * r, Math.sin(a) * r, rng.float(26, 60), WATER_Y + rng.float(1, 6));
    }
  }

  depthAt(x, z) { return WATER_Y - this.terrain.heightAt(x, z); }

  update(dt, time) {
    this.uniforms.uTime.value = time;
    for (const b of this.billows) {
      b.m.position.x = b.x + Math.sin(time * 0.05 * b.drift + b.phase) * 3;
      b.m.position.z = b.z + Math.cos(time * 0.04 * b.drift + b.phase) * 2;
    }
  }
}
