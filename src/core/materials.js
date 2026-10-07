import * as THREE from 'three';

// Moonlit rim light added to Lambert materials: keeps characters readable against the night.
export function withRim(material, { color = 0xa9c8ff, power = 2.6, strength = 0.55 } = {}) {
  const rimColor = new THREE.Color(color);
  material.userData.rim = { color: rimColor, power, strength };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: rimColor };
    shader.uniforms.uRimPower = { value: power };
    shader.uniforms.uRimStrength = { value: strength };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimPower;\nuniform float uRimStrength;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float rimF = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
        totalEmissiveRadiance += uRimColor * pow(rimF, uRimPower) * uRimStrength;
      }`);
    material.userData.shader = shader;
  };
  material.customProgramCacheKey = () => 'rim';
  return material;
}

// Half-Lambert "wrap" lighting (Valve): light wraps past the shadow line, so round characters read as soft
// and plush instead of going flat on their dark side.
const PLUSH_LIGHTS = THREE.ShaderChunk.lights_lambert_pars_fragment.replace(
  'float dotNL = saturate( dot( geometryNormal, directLight.direction ) );',
  'float dotNL = dot( geometryNormal, directLight.direction ) * 0.5 + 0.5; dotNL *= dotNL;',
);
export function plush(material) {
  const prev = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <lights_lambert_pars_fragment>', PLUSH_LIGHTS)
      // A soft fill from the camera's side, so a character seen from behind (the player, most of the time)
      // still shows its round shape instead of a dark silhouette.
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      totalEmissiveRadiance += diffuseColor.rgb * pow(saturate(dot(normal, normalize(vViewPosition))), 1.5) * 0.3;`);
  };
  material.customProgramCacheKey = () => `${key}|plush`;
  return material;
}

// Characters get a warm rim, which separates them from the cold blue night around them.
export const CHARACTER_RIM = { color: 0xffe6d8, power: 2.6, strength: 0.24 };

export function lambert(opts = {}, rim) {
  const m = new THREE.MeshLambertMaterial(opts);
  return rim === false ? m : withRim(m, rim);
}

export const SHARED_TIME = { value: 0 };

// Faceted glowing crystal: emissive follows the vertex gradient (dark base, bright tip) and shimmers.
export function crystalMaterial(color, emissive = 0.6) {
  const m = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: emissive, vertexColors: true, flatShading: true });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = SHARED_TIME;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      totalEmissiveRadiance *= vColor.rgb * (0.82 + 0.18 * sin(uTime * 2.0 + vViewPosition.y * 0.6 + vViewPosition.x * 0.3));
      {
        float rimF = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
        totalEmissiveRadiance += vec3(0.75, 0.88, 1.0) * pow(rimF, 2.0) * 0.6;
      }`);
  };
  m.customProgramCacheKey = () => 'crystal';
  return m;
}

// Shared palette (sRGB hex).
export const PAL = {
  penguin: 0x26305c,
  belly: 0xf6f8ff,
  beak: 0xff9d2e,
  feet: 0xff8a1f,
  scarf: 0xff5a4e,
  wood: 0x7b5236,
  woodDark: 0x5a3a26,
  ice: 0xcfe6ff,
  iceDeep: 0x8fb6e8,
  snow: 0xf2f7ff,
  rock: 0x6e7cb4,
  lantern: 0xffc45c,
  gold: 0xffd166,
  gloom: 0x2a2150,
};

export const REGION_COLORS = {
  lake: { a: 0x4dffa0, b: 0x3fd8ff, css: '#4dffa0' },
  grove: { a: 0x38f0d2, b: 0x5aa2ff, css: '#38f0d2' },
  huts: { a: 0xff72c8, b: 0xb07bff, css: '#ff72c8' },
  cave: { a: 0x55b4ff, b: 0x7d6bff, css: '#55b4ff' },
  ridge: { a: 0xb483ff, b: 0xff7ad6, css: '#b483ff' },
  crown: { a: 0xffd86b, b: 0xff9a6b, css: '#ffd86b' },
};
