import * as THREE from 'three';

const vert = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uScale;
uniform float uFogDensity;
uniform float uMaxPx;
varying vec3 vColor;
varying float vFade;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float pulse = 0.82 + 0.18 * sin(uTime * 1.6 + aPhase * 6.2831);
  float d = -mv.z;
  float fog = exp(-pow(uFogDensity * d, 2.0));
  vColor = aColor * pulse;
  // Fade out up close so a glow never swallows the screen.
  vFade = fog * smoothstep(1.5, 9.0, d);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(aSize * uScale / max(d, 0.1), uMaxPx);
}`;

const frag = /* glsl */ `
varying vec3 vColor;
varying float vFade;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 3.5) * (1.0 - smoothstep(0.85, 1.0, d));
  gl_FragColor = vec4(vColor * a * vFade, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// All static glows (lanterns, crystals, windows) in a single additive Points draw call.
export class GlowField {
  constructor(scene, capacity = 1200) {
    this.capacity = capacity;
    this.count = 0;
    this.pos = new Float32Array(capacity * 3);
    this.col = new Float32Array(capacity * 3);
    this.size = new Float32Array(capacity);
    this.phase = new Float32Array(capacity);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(this.phase, 1));
    g.setDrawRange(0, 0);
    this.geo = g;
    this.uniforms = { uTime: { value: 0 }, uScale: { value: 400 }, uFogDensity: { value: 0.0042 }, uMaxPx: { value: 200 } };
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
    this._c = new THREE.Color();
  }

  // size is in world units (roughly the glow diameter).
  add(x, y, z, color, size = 3, intensity = 1) {
    if (this.count >= this.capacity) return -1;
    const i = this.count++;
    this.pos.set([x, y, z], i * 3);
    this._c.set(color).multiplyScalar(intensity);
    this.col.set([this._c.r, this._c.g, this._c.b], i * 3);
    this.size[i] = size;
    this.phase[i] = Math.random();
    this.geo.setDrawRange(0, this.count);
    this.dirty = true;
    return i;
  }

  set(i, { x, y, z, color, intensity = 1, size } = {}) {
    if (i < 0) return;
    if (x !== undefined) this.pos.set([x, y, z], i * 3);
    if (color !== undefined) {
      this._c.set(color).multiplyScalar(intensity);
      this.col.set([this._c.r, this._c.g, this._c.b], i * 3);
    }
    if (size !== undefined) this.size[i] = size;
    this.dirty = true;
  }

  update(time, viewportHeight, fov, fogDensity) {
    this.uniforms.uTime.value = time;
    this.uniforms.uScale.value = viewportHeight / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
    this.uniforms.uFogDensity.value = fogDensity;
    this.uniforms.uMaxPx.value = viewportHeight * 0.22;
    if (this.dirty) {
      for (const k of ['position', 'aColor', 'aSize']) this.geo.attributes[k].needsUpdate = true;
      this.dirty = false;
    }
  }
}
