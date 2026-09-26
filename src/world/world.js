import * as THREE from 'three';
import { Terrain } from './terrain.js';
import { buildTerrainMesh } from './terrainMesh.js';
import { Sky, FOG_COLOR, MOON_DIR } from './sky.js';
import { Water } from './water.js';
import { Collision } from './collision.js';
import { GlowField } from './glow.js';
import { buildNature } from './nature.js';
import { buildStructures } from './structures.js';
import { buildLandmarks } from './landmarks.js';
import { Roads } from './roads.js';
import { Effects } from './effects.js';
import { SHARED_TIME } from '../core/materials.js';
import { WATER_Y } from './layout.js';

export class World {
  constructor(scene, renderer, quality) {
    this.scene = scene;
    this.renderer = renderer;
    this.quality = quality;
    this.terrain = new Terrain();
    this.collision = new Collision();

    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.0042);
    scene.background = FOG_COLOR.clone();

    this.hemi = new THREE.HemisphereLight(0x8c9ef0, 0x1c2462, 1.7);
    scene.add(this.hemi);
    this.moon = new THREE.DirectionalLight(0xc9d6ff, 2.0);
    this.moon.castShadow = true;
    const sc = this.moon.shadow.camera;
    sc.left = -48; sc.right = 48; sc.top = 48; sc.bottom = -48; sc.near = 1; sc.far = 260;
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

    this.sky = new Sky(scene);
    this.terrainMesh = buildTerrainMesh(this.terrain);
    scene.add(this.terrainMesh);
    this.glow = new GlowField(scene, 1500);
    this.water = new Water(scene, this.terrain);
    this.roads = new Roads(scene, this.terrain);
    this.effects = new Effects(scene, this.terrain);

    const ctx = {
      scene,
      terrain: this.terrain,
      collision: this.collision,
      glow: this.glow,
      terrainMesh: this.terrainMesh,
      lanterns: this.lanterns,
      world: this,
    };
    this.ctx = ctx;
    this.nature = buildNature(ctx);
    this.structures = buildStructures(ctx);
    this.landmarks = buildLandmarks(ctx);
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

    // Moon shadow frustum follows the player.
    this.moon.position.set(focus.x + MOON_DIR.x * 120, focus.y + MOON_DIR.y * 120, focus.z + MOON_DIR.z * 120);
    this.moon.target.position.copy(focus);

    // Assign the warm point lights to the two lanterns closest to the camera.
    if (this.lanterns.length) {
      const cx = camera.position.x, cz = camera.position.z;
      const sorted = this.lanterns
        .map((l) => ({ l, d: (l.x - cx) ** 2 + (l.z - cz) ** 2 }))
        .sort((a, b) => a.d - b.d);
      this.warmLights.forEach((light, i) => {
        const s = sorted[i];
        if (!s || s.d > 90 * 90) { light.visible = false; return; }
        light.visible = true;
        light.position.set(s.l.x, s.l.y, s.l.z);
        light.intensity = (s.l.intensity ?? 38) * (0.92 + Math.sin(time * 9 + i * 3) * 0.04 + Math.sin(time * 23 + i) * 0.03);
      });
    }
  }
}
