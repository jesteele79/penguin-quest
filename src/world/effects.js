import * as THREE from 'three';
import { glowTexture } from '../core/textures.js';
import { WATER_Y } from './layout.js';

const snowVert = /* glsl */ `
uniform float uTime;
uniform vec3 uCenter;
uniform float uScale;
uniform vec3 uBox;
attribute float aSeed;
varying float vFade;
void main() {
  vec3 p = position;
  p.y -= uTime * (1.1 + aSeed * 1.3);
  p.x += sin(uTime * 0.8 + aSeed * 40.0) * 1.2;
  p.z += cos(uTime * 0.6 + aSeed * 30.0) * 1.0;
  // wrap into a box around the camera
  p = mod(p - uCenter + uBox * 0.5, uBox) + uCenter - uBox * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = -mv.z;
  vFade = smoothstep(1.0, 4.0, d) * (1.0 - smoothstep(28.0, 42.0, d));
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.09 + aSeed * 0.1) * uScale / max(d, 0.5);
}`;

const snowFrag = /* glsl */ `
varying float vFade;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.4, 1.0, d)) * vFade * 0.85;
  gl_FragColor = vec4(vec3(0.92, 0.95, 1.0), a);
  #include <colorspace_fragment>
}`;

const partVert = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aAlpha;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vColor = aColor;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
}`;

const partFrag = /* glsl */ `
uniform sampler2D uMap;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
  #include <colorspace_fragment>
}`;

const POOL = 700;

const ONE = new THREE.Vector3(1, 1, 1);

export class Effects {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.buildSnow(scene, 1400);

    // Particle pool: sparkles, snow spray, splashes.
    this.p = [];
    const g = new THREE.BufferGeometry();
    this.pPos = new Float32Array(POOL * 3);
    this.pCol = new Float32Array(POOL * 3);
    this.pSize = new Float32Array(POOL);
    this.pAlpha = new Float32Array(POOL);
    g.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.pCol, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.pSize, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.pAlpha, 1));
    this.partUniforms = { uScale: { value: 500 }, uMap: { value: glowTexture() } };
    this.additive = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: this.partUniforms, vertexShader: partVert, fragmentShader: partFrag,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.additive.frustumCulled = false;
    this.additive.renderOrder = 8;
    scene.add(this.additive);
    for (let i = 0; i < POOL; i++) this.p.push({ life: 0 });
    this.cursor = 0;

    // Footprints: ring buffer of small dents in the snow.
    const fpGeo = new THREE.CircleGeometry(0.22, 10);
    fpGeo.rotateX(-Math.PI / 2);
    fpGeo.scale(1, 1, 1.5);
    this.footprints = new THREE.InstancedMesh(fpGeo, new THREE.MeshBasicMaterial({
      color: 0x8a9bd0, transparent: true, opacity: 0.45, depthWrite: false,
    }), 90);
    this.footprints.renderOrder = 2;
    this.footprints.frustumCulled = false;
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < 90; i++) this.footprints.setMatrixAt(i, zero);
    scene.add(this.footprints);
    this.fpCursor = 0;
    this.fpSide = 1;
    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._c = new THREE.Color();
  }

  buildSnow(scene, n) {
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = Math.random() * 70; pos[i * 3 + 1] = Math.random() * 40; pos[i * 3 + 2] = Math.random() * 70;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.snowUniforms = {
      uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uScale: { value: 500 }, uBox: { value: new THREE.Vector3(70, 40, 70) },
    };
    this.snow = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: this.snowUniforms, vertexShader: snowVert, fragmentShader: snowFrag,
      transparent: true, depthWrite: false,
    }));
    this.snow.frustumCulled = false;
    this.snow.renderOrder = 9;
    this.snowCount = n;
    scene.add(this.snow);
  }

  setSnowAmount(fraction) {
    this.snow.geometry.setDrawRange(0, Math.floor(this.snowCount * fraction));
  }

  // opts: { count, color, speed, up, life, gravity, size, spread }
  burst(pos, opts = {}) {
    const count = opts.count ?? 24;
    const colors = Array.isArray(opts.color) ? opts.color : [opts.color ?? 0xffffff];
    for (let i = 0; i < count; i++) {
      const p = this.p[this.cursor];
      this.cursor = (this.cursor + 1) % POOL;
      const a = Math.random() * Math.PI * 2;
      const el = (Math.random() - 0.3) * Math.PI * 0.5;
      const sp = (opts.speed ?? 5) * (0.4 + Math.random() * 0.8);
      p.x = pos.x + (Math.random() - 0.5) * (opts.spread ?? 0.4);
      p.y = pos.y + (Math.random() - 0.5) * (opts.spread ?? 0.4);
      p.z = pos.z + (Math.random() - 0.5) * (opts.spread ?? 0.4);
      p.vx = Math.cos(a) * Math.cos(el) * sp + (opts.vx ?? 0);
      p.vy = Math.sin(el) * sp + (opts.up ?? 3);
      p.vz = Math.sin(a) * Math.cos(el) * sp + (opts.vz ?? 0);
      p.g = opts.gravity ?? 6;
      p.life = p.max = (opts.life ?? 1.1) * (0.6 + Math.random() * 0.6);
      p.size = (opts.size ?? 0.5) * (0.6 + Math.random() * 0.8);
      p.drag = opts.drag ?? 1.2;
      this._c.set(colors[i % colors.length]);
      p.r = this._c.r; p.gg = this._c.g; p.b = this._c.b;
    }
  }

  snowSpray(pos, vx, vz, amount = 1) {
    this.burst(pos, { count: Math.ceil(3 * amount), color: [0xffffff, 0xdfeaff], speed: 2.5, up: 2.5, life: 0.6, gravity: 9, size: 0.45, vx: -vx * 0.2, vz: -vz * 0.2, spread: 0.8 });
  }

  splash(pos, big = 1) {
    this.burst({ x: pos.x, y: WATER_Y + 0.1, z: pos.z }, { count: Math.round(26 * big), color: [0xbff4ff, 0xffffff, 0x7fe9e0], speed: 3 * big, up: 5 * big, life: 0.9, gravity: 14, size: 0.5 });
  }

  sparkle(pos, color = 0xffe28a, count = 30) {
    this.burst(pos, { count, color: [color, 0xffffff], speed: 5, up: 2, life: 1.2, gravity: 1.5, size: 0.7, drag: 2 });
  }

  footprint(x, z, yaw) {
    const y = Math.max(this.terrain.heightAt(x, z), WATER_Y) + 0.04;
    this.fpSide *= -1;
    const ox = Math.cos(yaw) * 0.32 * this.fpSide, oz = -Math.sin(yaw) * 0.32 * this.fpSide;
    this._e.set(0, yaw, 0);
    this._q.setFromEuler(this._e);
    this._m.compose(this._p.set(x + ox, y, z + oz), this._q, ONE);
    this.footprints.setMatrixAt(this.fpCursor, this._m);
    this.fpCursor = (this.fpCursor + 1) % 90;
    this.footprints.instanceMatrix.needsUpdate = true;
  }

  update(dt, time, camera, scale = 500) {
    this.snowUniforms.uTime.value = time;
    this.snowUniforms.uCenter.value.copy(camera.position);
    this.snowUniforms.uScale.value = scale;
    this.partUniforms.uScale.value = scale;
    let any = false;
    for (let i = 0; i < POOL; i++) {
      const p = this.p[i];
      if (p.life <= 0) { if (this.pAlpha[i] !== 0) { this.pAlpha[i] = 0; any = true; } continue; }
      any = true;
      p.life -= dt;
      const k = Math.exp(-p.drag * dt);
      p.vx *= k; p.vz *= k; p.vy = p.vy * k - p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const t = Math.max(0, p.life / p.max);
      this.pPos[i * 3] = p.x; this.pPos[i * 3 + 1] = p.y; this.pPos[i * 3 + 2] = p.z;
      this.pCol[i * 3] = p.r; this.pCol[i * 3 + 1] = p.gg; this.pCol[i * 3 + 2] = p.b;
      this.pSize[i] = p.size * (0.5 + 0.5 * t);
      this.pAlpha[i] = Math.min(1, t * 2);
    }
    if (any) {
      const g = this.additive.geometry.attributes;
      g.position.needsUpdate = true; g.aColor.needsUpdate = true; g.aSize.needsUpdate = true; g.aAlpha.needsUpdate = true;
    }
  }
}
