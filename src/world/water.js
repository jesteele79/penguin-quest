import * as THREE from 'three';
import { WATER_Y, LOC } from './layout.js';
import { MOON_DIR } from './sky.js';
import { Rng } from '../core/rng.js';
import { mergeColored, mat } from '../core/geo.js';
import { lambert } from '../core/materials.js';

const LAKE_R = 92;
const TEX = 128;

const waterVert = /* glsl */ `
varying vec3 vWorld;
varying vec2 vDepthUv;
uniform float uLakeR;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vDepthUv = (wp.xz + uLakeR) / (2.0 * uLakeR);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const waterFrag = /* glsl */ `
uniform float uTime;
uniform sampler2D uDepth;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uGlow;
uniform vec3 uFoam;
uniform vec3 uSkyTint;
uniform vec3 uMoonDir;
uniform float uGlowAmt;
varying vec3 vWorld;
varying vec2 vDepthUv;
#include <fog_pars_fragment>
void main() {
  float depth = texture2D(uDepth, vDepthUv).r;
  vec2 p = vWorld.xz;
  float t = uTime;
  vec3 n = normalize(vec3(
    sin(p.x * 0.35 + t * 0.9) * 0.06 + sin((p.x + p.y) * 0.9 - t * 1.7) * 0.03,
    1.0,
    cos(p.y * 0.31 - t * 0.8) * 0.06 + cos((p.x - p.y) * 0.7 + t * 1.3) * 0.03));
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  vec3 col = mix(uShallow, uDeep, smoothstep(0.08, 0.95, depth));
  float glowMask = smoothstep(0.04, 0.3, depth) * (1.0 - 0.45 * smoothstep(0.55, 1.0, depth));
  float caustic = sin(p.x * 1.1 + t * 1.1 + sin(p.y * 1.5 + t * 0.9) * 1.3) * sin(p.y * 0.9 - t * 0.8 + sin(p.x * 0.8) * 1.2);
  float swirl = 0.5 + 0.5 * sin(length(p) * 0.18 - t * 0.6);
  col += uGlow * (0.45 + 0.3 * caustic + 0.25 * swirl) * glowMask * uGlowAmt;
  vec3 r = reflect(-viewDir, n);
  float spec = pow(max(dot(r, uMoonDir), 0.0), 90.0);
  col += vec3(0.85, 0.9, 1.0) * spec * 1.4;
  col = mix(col, uSkyTint, fres * 0.45);
  float foam = smoothstep(0.07, 0.0, depth) * (0.55 + 0.45 * sin(t * 2.2 + p.x * 0.9 + p.y * 0.7));
  col = mix(col, uFoam, foam * 0.75);
  float alpha = mix(0.6, 0.93, smoothstep(0.0, 0.45, depth));
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

function fishGeometry() {
  const body = new THREE.SphereGeometry(0.5, 10, 6);
  const tail = new THREE.ConeGeometry(0.28, 0.5, 4);
  return mergeColored([
    { geo: body, color: 0x10304a, matrix: mat(0, 0, 0, 0, 0, 0, 1, 0.42, 0.22) },
    { geo: tail, color: 0x0c2638, matrix: mat(-0.62, 0, 0, 0, 0, Math.PI / 2, 1, 1, 0.35) },
  ]);
}

export class Water {
  constructor(scene, terrain) {
    this.terrain = terrain;
    this.group = new THREE.Group();
    scene.add(this.group);

    const data = new Uint8Array(TEX * TEX);
    for (let j = 0; j < TEX; j++) {
      for (let i = 0; i < TEX; i++) {
        const x = -LAKE_R + ((i + 0.5) / TEX) * 2 * LAKE_R;
        const z = -LAKE_R + ((j + 0.5) / TEX) * 2 * LAKE_R;
        const h = terrain.heightAt(x, z);
        data[j * TEX + i] = Math.round(THREE.MathUtils.clamp(-h / 5.5, 0, 1) * 255);
      }
    }
    const depthTex = new THREE.DataTexture(data, TEX, TEX, THREE.RedFormat, THREE.UnsignedByteType);
    depthTex.magFilter = THREE.LinearFilter;
    depthTex.minFilter = THREE.LinearFilter;
    depthTex.needsUpdate = true;

    this.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 },
      uDepth: { value: null },
      uLakeR: { value: LAKE_R },
      uDeep: { value: new THREE.Color(0x06324a) },
      uShallow: { value: new THREE.Color(0x3fd6d6) },
      uGlow: { value: new THREE.Color(0x19c9b8) },
      uFoam: { value: new THREE.Color(0xe6fbff) },
      uSkyTint: { value: new THREE.Color(0x3a4a9a) },
      uMoonDir: { value: MOON_DIR },
      uGlowAmt: { value: 1 },
    }]);
    this.uniforms.uDepth.value = depthTex;
    const geo = new THREE.CircleGeometry(LAKE_R, 96);
    geo.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: waterVert,
      fragmentShader: waterFrag,
      transparent: true,
      fog: true,
    }));
    this.mesh.position.y = WATER_Y;
    this.mesh.renderOrder = 1;
    this.mesh.name = 'water';
    this.group.add(this.mesh);

    this.buildFish();
    this.buildFloes();
  }

  depthAt(x, z) { return WATER_Y - this.terrain.heightAt(x, z); }

  buildFish() {
    const rng = new Rng(55);
    const N = 46;
    this.fish = [];
    for (let i = 0; i < N; i++) {
      let x, z, tries = 0;
      do { x = rng.float(-60, 60); z = rng.float(-60, 60); tries++; } while (this.depthAt(x, z) < 2.4 && tries < 50);
      this.fish.push({
        cx: x, cz: z, r: rng.float(3, 9), a: rng.float(0, Math.PI * 2),
        speed: rng.float(0.25, 0.6) * rng.sign(), y: -rng.float(0.9, 1.8), s: rng.float(0.7, 1.2), phase: rng.next() * 10,
      });
    }
    this.fishMesh = new THREE.InstancedMesh(fishGeometry(), lambert({ vertexColors: true }, false), N);
    this.fishMesh.frustumCulled = false;
    this.group.add(this.fishMesh);
  }

  buildFloes() {
    const rng = new Rng(12);
    const geo = mergeColored([
      { geo: new THREE.CylinderGeometry(1, 1.08, 0.5, 7), color: 0xa9d4f2 },
      { geo: new THREE.CylinderGeometry(0.97, 1, 0.08, 7), color: 0xf4faff, matrix: mat(0, 0.27, 0) },
    ]);
    this.floes = [];
    const N = 16;
    for (let i = 0; i < N; i++) {
      let x, z, tries = 0;
      do {
        x = rng.float(-58, 58); z = rng.float(-58, 58); tries++;
      } while ((this.depthAt(x, z) < 1.5 || Math.abs(x - LOC.launch.x0) < 12 && z > 8 || Math.hypot(x - LOC.island.x, z - LOC.island.z) < 16) && tries < 80);
      this.floes.push({ x, z, s: rng.float(1.2, 3.2), rot: rng.float(0, 6), phase: rng.next() * 6 });
    }
    this.floeMesh = new THREE.InstancedMesh(geo, lambert({ vertexColors: true }), N);
    this.floeMesh.receiveShadow = true;
    this.group.add(this.floeMesh);
    this.updateFloes(0);
  }

  updateFloes(time) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
    this.floes.forEach((f, i) => {
      e.set(Math.sin(time * 0.7 + f.phase) * 0.03, f.rot + time * 0.01, Math.cos(time * 0.6 + f.phase) * 0.03);
      q.setFromEuler(e);
      p.set(f.x + Math.sin(time * 0.1 + f.phase) * 0.6, WATER_Y + 0.05 + Math.sin(time * 1.1 + f.phase) * 0.05, f.z);
      s.set(f.s, 1, f.s);
      m.compose(p, q, s);
      this.floeMesh.setMatrixAt(i, m);
    });
    this.floeMesh.instanceMatrix.needsUpdate = true;
  }

  update(dt, time) {
    this.uniforms.uTime.value = time;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
    this.fish.forEach((f, i) => {
      f.a += (f.speed / f.r) * dt * 3;
      const x = f.cx + Math.cos(f.a) * f.r, z = f.cz + Math.sin(f.a) * f.r;
      const heading = f.a + (f.speed > 0 ? Math.PI / 2 : -Math.PI / 2);
      e.set(0, -heading + Math.sin(time * 8 + f.phase) * 0.15, 0);
      q.setFromEuler(e);
      p.set(x, f.y + Math.sin(time + f.phase) * 0.1, z);
      s.setScalar(f.s);
      m.compose(p, q, s);
      this.fishMesh.setMatrixAt(i, m);
    });
    this.fishMesh.instanceMatrix.needsUpdate = true;
    this.updateFloes(time);
  }
}
