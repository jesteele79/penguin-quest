// Graphics presets and an automatic step-down for slower machines (most Chromebooks).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const dpr = () => window.devicePixelRatio || 1;

export const PRESETS = {
  low: { label: 'Low', ratio: () => Math.min(dpr(), 1) * 0.72, shadows: false, snow: 0.35, bloom: false, glow: 0.8 },
  medium: { label: 'Medium', ratio: () => Math.min(dpr(), 1.25), shadows: true, shadowSize: 1024, snow: 0.7, bloom: false, glow: 1 },
  high: { label: 'High', ratio: () => Math.min(dpr(), 1.75), shadows: true, shadowSize: 2048, snow: 1, bloom: true, glow: 1 },
};
const ORDER = ['low', 'medium', 'high'];

export class Quality {
  constructor(renderer, scene, camera, world) {
    Object.assign(this, { renderer, scene, camera, world });
    this.level = null;
    this.mode = 'auto';
    this.frames = [];
    this.cooldown = 6;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
  }

  guess() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    return cores >= 8 && mem >= 8 ? 'high' : 'medium';
  }

  setMode(mode) {
    this.mode = mode;
    this.apply(mode === 'auto' ? this.level ?? this.guess() : mode);
  }

  apply(level) {
    if (!PRESETS[level] || level === this.level) return;
    const p = PRESETS[level];
    const prev = this.level ? PRESETS[this.level] : null;
    this.level = level;
    const r = this.renderer;
    r.setPixelRatio(p.ratio());
    const moon = this.world.moon;
    if (!prev || prev.shadows !== p.shadows || prev.shadowSize !== p.shadowSize) {
      r.shadowMap.enabled = p.shadows;
      moon.castShadow = p.shadows;
      if (p.shadowSize) {
        moon.shadow.mapSize.set(p.shadowSize, p.shadowSize);
        moon.shadow.map?.dispose();
        moon.shadow.map = null;
      }
      r.shadowMap.type = level === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      this.scene.traverse((o) => {
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) m.needsUpdate = true;
      });
    }
    this.world.effects.setSnowAmount(p.snow);
    this.useBloom = p.bloom;
    if (p.bloom && !this.composer) this.buildComposer();
    this.resize(this.w, this.h);
    this.frames = [];
    this.cooldown = 5;
  }

  buildComposer() {
    const c = new EffectComposer(this.renderer);
    c.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.w / 2, this.h / 2), 0.45, 0.4, 0.9);
    c.addPass(this.bloom);
    c.addPass(new OutputPass());
    this.composer = c;
  }

  resize(w, h) {
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.setSize(w, h);
      this.bloom?.resolution.set(w / 2, h / 2);
    }
  }

  // Automatic mode: step down one level if frames stay slow.
  sample(dt) {
    // Long gaps come from background tabs or one-off shader compiles, not a slow GPU.
    if (this.mode !== 'auto' || document.hidden || dt > 0.25) return;
    this.cooldown -= dt;
    this.frames.push(Math.min(dt, 0.1));
    if (this.frames.length > 90) this.frames.shift();
    if (this.cooldown > 0 || this.frames.length < 90) return;
    const sorted = [...this.frames].sort((a, b) => a - b);
    const avg = sorted.slice(9, 81).reduce((a, b) => a + b, 0) / 72;
    const i = ORDER.indexOf(this.level);
    if (avg > 1 / 33 && i > 0) {
      this.apply(ORDER[i - 1]);
      this.onChange?.(this.level);
    }
  }

  render() {
    if (this.useBloom && this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
