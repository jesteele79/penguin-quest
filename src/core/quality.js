// Graphics presets and automatic adjustment for slower machines (most Chromebooks).
//
// Things that would recompile every shader (light counts, shadow type, render path) stay the same in
// every preset, so changing quality never freezes the game. Presets differ only in pixel budget,
// shadow-map size and refresh rate, particle counts and frame-rate cap.
import * as THREE from 'three';

const dpr = () => window.devicePixelRatio || 1;

export const PRESETS = {
  low: { label: 'Low', budget: 0.45e6, shadowSize: 512, shadowEvery: 3, shadowRadius: 1.5, snow: 0.35, glow: 0.8, fps: 30 },
  medium: { label: 'Medium', budget: 0.8e6, shadowSize: 1024, shadowEvery: 2, shadowRadius: 2, snow: 0.7, glow: 1, fps: 60 },
  high: { label: 'High', budget: 1.4e6, shadowSize: 2048, shadowEvery: 1, shadowRadius: 3, snow: 1, glow: 1, fps: 60 },
};
const ORDER = ['low', 'medium', 'high'];
const MIN_SCALE = 0.7;

// GPU time per frame from EXT_disjoint_timer_query_webgl2 (almost every ChromeOS device has it).
// Results arrive a few frames late, so a small ring of queries is kept in flight.
class GpuTimer {
  constructor(renderer) {
    const gl = renderer.getContext();
    this.gl = gl;
    this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    this.free = [];
    this.pending = [];
    this.active = null;
  }

  get ok() { return !!this.ext; }

  begin() {
    if (!this.ext || this.active || this.pending.length > 4) return;
    const q = this.free.pop() ?? this.gl.createQuery();
    this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, q);
    this.active = q;
  }

  end() {
    if (!this.active) return;
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    this.pending.push(this.active);
    this.active = null;
  }

  // Milliseconds of finished queries since the last call.
  collect(out) {
    const gl = this.gl;
    const disjoint = this.ext && gl.getParameter(this.ext.GPU_DISJOINT_EXT);
    while (this.pending.length) {
      const q = this.pending[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      this.pending.shift();
      if (!disjoint) out.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
      this.free.push(q);
    }
  }
}

export class Quality {
  constructor(renderer, scene, camera, world) {
    Object.assign(this, { renderer, scene, camera, world });
    this.level = null;
    this.mode = 'auto';
    this.scale = 1;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.gpu = new GpuTimer(renderer);
    this.samples = [];
    this.gpuMs = [];
    this.cooldown = 4;
    this.headroom = 0;
    this.frame = 0;
    // A preset auto mode had to leave is not retried for a while, so quality does not bounce.
    this.blockedUntil = {};
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    world.moon.castShadow = true;
  }

  // A first guess from the GPU's name; frame timing corrects it from there.
  guess() {
    let name = '';
    try {
      const gl = this.renderer.getContext();
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    } catch { /* hidden by the browser */ }
    this.gpuName = name;
    if (/UHD Graphics 6\d\d|HD Graphics [45]\d\d|Mali-G(31|51|52|72)|PowerVR|Adreno.*\b[3-6]\d\d\b|SwiftShader|llvmpipe/i.test(name)) return 'low';
    if (/Iris|Radeon|GeForce|RTX|Apple M|Arc\b/i.test(name)) return 'high';
    return 'medium';
  }

  setMode(mode) {
    this.mode = mode;
    this.apply(mode === 'auto' ? this.level ?? this.guess() : mode, true);
  }

  apply(level, reset = false) {
    if (!PRESETS[level]) return;
    const changed = level !== this.level;
    const p = PRESETS[level];
    this.level = level;
    if (reset) this.scale = 1;
    const moon = this.world.moon;
    if (moon.shadow.mapSize.x !== p.shadowSize) {
      moon.shadow.mapSize.set(p.shadowSize, p.shadowSize);
      moon.shadow.map?.dispose();
      moon.shadow.map = null;
    }
    moon.shadow.radius = p.shadowRadius;
    moon.shadow.autoUpdate = p.shadowEvery === 1;
    this.world.effects.setSnowAmount(p.snow);
    this.fps = p.fps;
    this.resize(this.w, this.h);
    if (changed) { this.samples = []; this.gpuMs = []; this.cooldown = 4; this.headroom = 0; }
  }

  // Render at a fixed pixel budget rather than the device pixel ratio: a 1080p Chromebook at 125% scaling
  // would otherwise draw over two million pixels a frame. The browser upscales the canvas for free.
  resize(w, h) {
    this.w = w; this.h = h;
    const p = PRESETS[this.level] ?? PRESETS.medium;
    const ratio = Math.min(dpr(), Math.sqrt(p.budget / (w * h))) * this.scale;
    this.renderer.setPixelRatio(Math.max(0.35, ratio));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // Called once per tick with that tick's CPU time and the time since the last frame.
  sample(cpuMs, frameDt) {
    if (this.mode !== 'auto' || document.hidden || frameDt > 0.25) return;
    this.gpu.collect(this.gpuMs);
    const gpu = this.gpuMs.length ? this.gpuMs[this.gpuMs.length - 1] : 0;
    // Without a GPU timer, fall back to the frame interval (it can be throttled by Energy Saver,
    // so it only ever counts when it is clearly slower than the frame cap).
    const cost = this.gpu.ok ? Math.max(cpuMs, gpu) : Math.max(cpuMs, frameDt * 1000 - 4);
    this.samples.push(cost);
    if (this.samples.length > 120) this.samples.shift();
    if (this.gpuMs.length > 30) this.gpuMs.splice(0, this.gpuMs.length - 30);
    this.cooldown -= frameDt;
    if (this.cooldown > 0 || this.samples.length < 60) return;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const budget = 1000 / this.fps;
    const i = ORDER.indexOf(this.level);
    if (p90 > budget * 0.92) {
      // Too slow: shave resolution first, then drop a preset.
      if (this.scale > MIN_SCALE + 0.01) { this.scale -= 0.1; this.resize(this.w, this.h); }
      else if (i > 0) {
        this.blockedUntil[this.level] = performance.now() + 90000;
        this.apply(ORDER[i - 1], true);
        this.onChange?.(this.level);
      }
      this.samples = [];
      this.cooldown = 3;
      this.headroom = 0;
    } else if (p90 < budget * 0.5) {
      // Plenty of room for ten seconds: give resolution back, then try the next preset.
      this.headroom += frameDt;
      if (this.headroom > 10) {
        this.headroom = 0;
        this.samples = [];
        if (this.scale < 0.99) { this.scale = Math.min(1, this.scale + 0.1); this.resize(this.w, this.h); }
        else if (i < ORDER.length - 1 && !(this.blockedUntil[ORDER[i + 1]] > performance.now())) { this.apply(ORDER[i + 1], true); }
        this.cooldown = 3;
      }
    } else {
      this.headroom = 0;
    }
  }

  // Low runs at 30 fps: render on every other display frame with a fixed step.
  shouldRender(nowMs) {
    if (this.fps >= 60) return true;
    if (this.lastRender !== undefined && nowMs - this.lastRender < 1000 / this.fps - 4) return false;
    this.lastRender = nowMs;
    return true;
  }

  render() {
    const p = PRESETS[this.level] ?? PRESETS.medium;
    this.frame += 1;
    if (p.shadowEvery > 1) this.world.moon.shadow.needsUpdate = this.frame % p.shadowEvery === 0;
    this.gpu.begin();
    this.renderer.render(this.scene, this.camera);
    this.gpu.end();
  }
}
