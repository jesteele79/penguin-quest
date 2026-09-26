import * as THREE from 'three';
import { terrainColor, gloomMask } from './terrain.js';
import { snowTexture } from '../core/textures.js';

export function buildTerrainMesh(terrain) {
  const n = terrain.n, half = terrain.half, step = terrain.step;
  const count = n * n;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const gloom = new Float32Array(count);
  const warm = new Float32Array(count);
  const rgb = [0, 0, 0];
  const c = new THREE.Color();

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const k = j * n + i;
      const x = -half + i * step, z = -half + j * step;
      const h = terrain.heights[k];
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      uv[k * 2] = x / 9; uv[k * 2 + 1] = z / 9;
      terrainColor(x, z, h, terrain.slopeAt(x, z), terrain.roadDist[k], rgb);
      c.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
      gloom[k] = gloomMask(x, z);
    }
  }
  const idx = new Uint32Array((n - 1) * (n - 1) * 6);
  let o = 0;
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, cc = a + n, d = cc + 1;
      idx[o++] = a; idx[o++] = cc; idx[o++] = b;
      idx[o++] = b; idx[o++] = cc; idx[o++] = d;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('aGloom', new THREE.BufferAttribute(gloom, 1));
  geo.setAttribute('aWarm', new THREE.BufferAttribute(warm, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  const uniforms = {
    uTime: { value: 0 },
    uGloom: { value: 1 },
    uWarmColor: { value: new THREE.Color(0xffb54d) },
    uGloomColor: { value: new THREE.Color(0x3a2a66) },
  };
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, map: snowTexture() });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aGloom;
attribute float aWarm;
varying float vGloom;
varying float vWarm;
varying vec3 vWorldP;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
vGloom = aGloom;
vWarm = aWarm;
vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uTime;
uniform float uGloom;
uniform vec3 uWarmColor;
uniform vec3 uGloomColor;
varying float vGloom;
varying float vWarm;
varying vec3 vWorldP;
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, uGloomColor, vGloom * uGloom * 0.72);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  vec2 g = vWorldP.xz * 5.0;
  vec2 cell = floor(g);
  float h = hash12(cell);
  vec3 toCam = cameraPosition - vWorldP;
  float dist = length(toCam);
  float tw = sin(h * 91.0 + uTime * 1.7 + dot(normalize(toCam), vec3(9.0, 5.0, 7.0)) * 2.5);
  float spark = step(0.982, h) * smoothstep(0.6, 1.0, tw) * smoothstep(0.32, 0.0, length(fract(g) - 0.5));
  float snowy = smoothstep(0.55, 0.8, vColor.b) * (1.0 - vGloom * uGloom);
  spark *= snowy * (1.0 - smoothstep(8.0, 38.0, dist));
  totalEmissiveRadiance += vec3(0.85, 0.92, 1.0) * spark * 2.2;
  totalEmissiveRadiance += uWarmColor * vWarm * 0.55;
  totalEmissiveRadiance += vec3(0.18, 0.08, 0.32) * vGloom * uGloom * 0.35;
}`);
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  mesh.userData.uniforms = uniforms;

  // Bake a warm lantern glow into nearby ground.
  mesh.userData.addWarmth = (x, z, radius, strength = 1) => {
    const attr = geo.attributes.aWarm;
    const i0 = Math.max(0, Math.floor((x - radius + half) / step)), i1 = Math.min(n - 1, Math.ceil((x + radius + half) / step));
    const j0 = Math.max(0, Math.floor((z - radius + half) / step)), j1 = Math.min(n - 1, Math.ceil((z + radius + half) / step));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const vx = -half + i * step, vz = -half + j * step;
        const d = Math.hypot(vx - x, vz - z) / radius;
        if (d >= 1) continue;
        const k = j * n + i;
        attr.array[k] = Math.min(1, attr.array[k] + strength * (1 - d) * (1 - d));
      }
    }
    attr.needsUpdate = true;
  };
  return mesh;
}
