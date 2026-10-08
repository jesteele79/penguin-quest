import * as THREE from 'three';
import { Terrain } from './terrain.js';
import { buildTerrainMesh } from './terrainMesh.js';
import { BIOME, LIGHT_DIR } from './biome.js';
import { Water } from './water.js';
import { Collision } from './collision.js';
import { GlowField } from './glow.js';
import { buildBookWorld } from './builders.js';
import { Roads } from './roads.js';
import { Effects } from './effects.js';
import { SHARED_TIME } from '../core/materials.js';
import { ShadowCasters } from './shadowcasters.js';
import { WATER_Y } from './layout.js';

// Shadow-camera axes: three's lookAt puts x along up × direction and y along direction × x.
const SHADOW_R = new THREE.Vector3(0, 1, 0).cross(LIGHT_DIR).normalize();
const SHADOW_U = LIGHT_DIR.clone().cross(SHADOW_R).normalize();
const _snap = new THREE.Vector3();

export class World {
  constructor(scene, renderer, quality) {
    this.scene = scene;
    this.renderer = renderer;
    this.quality = quality;
    this.terrain = new Terrain();
    this.collision = new Collision();

    scene.fog = new THREE.FogExp2(BIOME.fog, BIOME.fogDensity);
    scene.background = BIOME.fog.clone();

    this.hemi = new THREE.HemisphereLight(BIOME.hemi.sky, BIOME.hemi.ground, BIOME.hemi.intensity);
    scene.add(this.hemi);
    // The key light: the moon over Glacier Bay, the low sun over the Ember Isles.
    this.moon = new THREE.DirectionalLight(BIOME.light.color, BIOME.light.intensity);
    this.moon.castShadow = true;
    const sc = this.moon.shadow.camera;
    // A box fitted around the player: the further the box reaches, the blurrier every shadow gets.
    sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 260;
    this.moon.shadow.bias = -0.0006;
    this.moon.shadow.normalBias = 0.04;
    this.moon.shadow.mapSize.set(2048, 2048);
    scene.add(this.moon, this.moon.target);

    // Two warm lights follow the lanterns nearest the camera.
    this.warmLights = [0, 1].map(() => {
      const l = new THREE.PointLight(0xffb45c, 38, 26, 1.6);
      scene.add(l);
      return l;
    });
    this.lanterns = [];

    this.sky = new BIOME.Sky(scene);
    this.shadowCasters = new ShadowCasters(scene);
    this.terrainMesh = buildTerrainMesh(this.terrain);
    this.terrainMesh.userData.uniforms.uGloomColor.value.set(BIOME.gloom);
    this.terrainMesh.userData.uniforms.uGloomGlow.value.setRGB(...BIOME.gloomGlow);
    scene.add(this.terrainMesh);
    this.glow = new GlowField(scene, 1500);
    this.water = new Water(scene, this.terrain, BIOME.water);
    this.roads = new Roads(scene, this.terrain);
    this.effects = new Effects(scene, this.terrain, BIOME.effects);

    const ctx = {
      scene,
      terrain: this.terrain,
      collision: this.collision,
      glow: this.glow,
      terrainMesh: this.terrainMesh,
      lanterns: this.lanterns,
      shadowCasters: this.shadowCasters,
      world: this,
    };
    this.ctx = ctx;
    buildBookWorld(ctx);
    this.animated = ctx.animated || [];
  }

  // Walkable height at (x, z) for something currently at height y.
  groundAt(x, z, y) {
    const t = this.terrain.heightAt(x, z);
    const p = this.collision.platformTop(x, z, y);
    if (p.platform && p.top >= t - 0.05) return { y: p.top, terrain: t, platform: p.platform };
    return { y: t, terrain: t, platform: null };
  }

  isDeepWater(x, z) { return this.terrain.heightAt(x, z) < WATER_Y - 0.95; }

  update(dt, time, camera, focus) {
    SHARED_TIME.value = time;
    this.terrainMesh.userData.uniforms.uTime.value = time;
    const h = this.renderer.domElement.height;
    this.pixelScale = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    this.sky.update(dt, time, camera, h / 900);
    this.water.update(dt, time);
    this.glow.update(time, h, camera.fov, this.scene.fog.density);
    this.effects.update(dt, time, camera, this.pixelScale);
    for (const a of this.animated) a(dt, time);

    // Moon shadow box follows the player, snapped to whole shadow-map texels so shadow edges don't crawl.
    const sc = this.moon.shadow.camera;
    const texel = (sc.right - sc.left) / this.moon.shadow.mapSize.x;
    const a = Math.round(focus.dot(SHADOW_R) / texel) * texel;
    const b = Math.round(focus.dot(SHADOW_U) / texel) * texel;
    _snap.copy(SHADOW_R).multiplyScalar(a).addScaledVector(SHADOW_U, b).addScaledVector(LIGHT_DIR, focus.dot(LIGHT_DIR));
    this.moon.position.copy(_snap).addScaledVector(LIGHT_DIR, 120);
    this.moon.target.position.copy(_snap);
    this.shadowCasters.update(focus);

    // The warm point lights go to the two lanterns closest to the camera. Out of range they fade to zero
    // rather than switching off: hiding a light changes the light count, which recompiles every shader.
    const cx = camera.position.x, cz = camera.position.z;
    let i0 = -1, i1 = -1, d0 = Infinity, d1 = Infinity;
    this.lanterns.forEach((l, i) => {
      const d = (l.x - cx) ** 2 + (l.z - cz) ** 2;
      if (d < d0) { i1 = i0; d1 = d0; i0 = i; d0 = d; } else if (d < d1) { i1 = i; d1 = d; }
    });
    this.warmLights.forEach((light, i) => {
      const idx = i === 0 ? i0 : i1, d = i === 0 ? d0 : d1;
      const l = this.lanterns[idx];
      if (l) light.position.set(l.x, l.y, l.z);
      const want = l && d < 90 * 90 ? (l.intensity ?? 38) * (0.92 + Math.sin(time * 9 + i * 3) * 0.04 + Math.sin(time * 23 + i) * 0.03) : 0;
      light.intensity = want;
    });
  }
}
