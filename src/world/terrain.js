// Pure terrain model: no three.js, no DOM. Used by the renderer, physics and the Node layout map.
import { createNoise2D, makeFbm } from '../core/noise.js';
import { clamp, lerp, smoothstep } from '../core/mathutil.js';
import { LOC, ROADS, WORLD_HALF, GRID_STEP } from './layout.js';

const noiseA = createNoise2D(1337);
const noiseB = createNoise2D(4242);
const fbm = makeFbm(noiseA);

const d2 = (x, z, p) => Math.hypot(x - p.x, z - p.z);

export function lakeRadius(theta) {
  return 64 + 9 * Math.sin(3 * theta + 0.7) + 5 * Math.sin(5 * theta + 2.1) + 3 * Math.sin(8 * theta + 0.3);
}

// Signed distance-ish to the lake shoreline: negative inside the lake.
export function lakeSD(x, z) {
  const dx = x - LOC.lake.x, dz = z - LOC.lake.z;
  return Math.hypot(dx, dz) - lakeRadius(Math.atan2(dz, dx));
}

function blendTo(h, d, radius, falloff, target) {
  const t = 1 - smoothstep(radius, radius + falloff, d);
  return lerp(h, target, t);
}

function segDist(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az;
  const len2 = vx * vx + vz * vz || 1;
  const t = clamp(((px - ax) * vx + (pz - az) * vz) / len2, 0, 1);
  return { d: Math.hypot(px - (ax + vx * t), pz - (az + vz * t)), t };
}

// Rounded snow hills that break up sightlines and make good sledding slopes.
const HILLS = [
  { x: -40, z: 118, r: 30, h: 13 },
  { x: -158, z: 52, r: 30, h: 12 },
  { x: 52, z: 112, r: 26, h: 10 },
  { x: 36, z: -100, r: 20, h: 8 },
  { x: -150, z: -100, r: 22, h: 10 },
  { x: 150, z: -10, r: 20, h: 9 },
  { x: -10, z: 150, r: 22, h: 9 },
];

export function rawHeight(x, z) {
  let h = 3.2 + fbm(x * 0.010, z * 0.010, 4) * 6 + noiseB(x * 0.05, z * 0.05) * 0.6;
  h = Math.max(h, 1.3);
  for (const k of HILLS) {
    const q = Math.hypot(x - k.x, z - k.z) / k.r;
    h += k.h * Math.exp(-2.5 * q * q);
  }

  h = blendTo(h, d2(x, z, LOC.home), 28, 20, 9.5 + noiseB(x * 0.03, z * 0.03) * 0.4);
  h = blendTo(h, d2(x, z, LOC.grove), 20, 16, 4.5);
  h = blendTo(h, d2(x, z, LOC.huts), 22, 16, 7.5);

  // Glacier cave: a steep hill with a flat floor carved in front of it.
  const hill = 34 * (1 - smoothstep(8, 42, d2(x, z, LOC.caveHill)));
  h = Math.max(h, hill + fbm(x * 0.06, z * 0.06, 2) * 1.5 * (hill > 2 ? 1 : 0));
  h = blendTo(h, Math.hypot(x - 100, z - 119), 15, 9, 4.0);

  // Gloom Ridge mesa with cliffs.
  const R = LOC.ridge;
  const e = Math.hypot((x - R.x) / R.rx, (z - R.z) / R.rz);
  const outside = (e - 1) * Math.min(R.rx, R.rz);
  h = lerp(h, R.top + fbm(x * 0.05, z * 0.05, 2) * 0.7, 1 - smoothstep(0, 7, outside));

  // Ramp up to the ridge.
  const A = LOC.rampA, B = LOC.rampB;
  const s = segDist(x, z, A.x, A.z, B.x, B.z);
  const rampH = lerp(A.h, B.h, s.t);
  h = lerp(h, rampH, 1 - smoothstep(5, 11, s.d));

  // Aurora Spire mountain.
  const ds = d2(x, z, LOC.spire);
  const spireH = LOC.spire.top * (1 - smoothstep(12, 75, ds));
  h = Math.max(h, spireH + (ds > 12 ? fbm(x * 0.04, z * 0.04, 2) * 1.2 * smoothstep(12, 30, ds) : 0));

  // Lake basin and island.
  const sd = lakeSD(x, z);
  h = lerp(-6, h, smoothstep(-16, 8, sd));
  const di = d2(x, z, LOC.island);
  h = Math.max(h, 1.8 - Math.pow(di / 10, 2) * 2.4 + noiseB(x * 0.2, z * 0.2) * 0.15);

  // Ring of mountains that closes the world.
  const r = Math.hypot(x, z);
  h += smoothstep(165, 205, r) * (42 + fbm(x * 0.02 + 5, z * 0.02, 3) * 20);
  return h;
}

// Precomputed heightfield with bilinear lookup. Build once, share everywhere.
export class Terrain {
  constructor() {
    this.half = WORLD_HALF;
    this.step = GRID_STEP;
    this.n = Math.round((2 * WORLD_HALF) / GRID_STEP) + 1;
    const n = this.n;
    this.heights = new Float32Array(n * n);
    this.roadDist = new Float32Array(n * n);
    const segs = [];
    for (const road of ROADS) {
      for (let i = 0; i < road.length - 1; i++) segs.push([road[i][0], road[i][1], road[i + 1][0], road[i + 1][1]]);
    }
    this.roadSegs = segs;
    for (let j = 0; j < n; j++) {
      const z = -WORLD_HALF + j * GRID_STEP;
      for (let i = 0; i < n; i++) {
        const x = -WORLD_HALF + i * GRID_STEP;
        let rd = 1e9;
        for (const sg of segs) {
          const q = segDist(x, z, sg[0], sg[1], sg[2], sg[3]);
          if (q.d < rd) rd = q.d;
        }
        let h = rawHeight(x, z);
        // Worn path: a shallow trough along the golden road.
        h -= 0.18 * (1 - smoothstep(1.0, 2.6, rd));
        this.heights[j * n + i] = h;
        this.roadDist[j * n + i] = rd;
      }
    }
  }

  index(i, j) { return j * this.n + i; }

  heightAt(x, z) {
    const n = this.n;
    const fx = clamp((x + this.half) / this.step, 0, n - 1.001);
    const fz = clamp((z + this.half) / this.step, 0, n - 1.001);
    const i = Math.floor(fx), j = Math.floor(fz);
    const tx = fx - i, tz = fz - j;
    const H = this.heights;
    const a = H[j * n + i], b = H[j * n + i + 1];
    const c = H[(j + 1) * n + i], d = H[(j + 1) * n + i + 1];
    return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
  }

  // Gradient (dh/dx, dh/dz) via central differences.
  gradient(x, z, eps = 1.0) {
    return {
      x: (this.heightAt(x + eps, z) - this.heightAt(x - eps, z)) / (2 * eps),
      z: (this.heightAt(x, z + eps) - this.heightAt(x, z - eps)) / (2 * eps),
    };
  }

  slopeAt(x, z) {
    const g = this.gradient(x, z);
    return Math.hypot(g.x, g.z);
  }

  roadDistanceAt(x, z) {
    let best = 1e9;
    for (const sg of this.roadSegs) {
      const q = segDist(x, z, sg[0], sg[1], sg[2], sg[3]);
      if (q.d < best) best = q.d;
    }
    return best;
  }

  isLake(x, z) { return lakeSD(x, z) < 4 && this.heightAt(x, z) < 0.2; }
}

// Surface color in sRGB [0..1]. `out` is a length-3 array.
export function terrainColor(x, z, h, slope, roadD, out) {
  const n = fbm(x * 0.05, z * 0.05, 2) * 0.5 + 0.5;
  const patch = smoothstep(-0.1, 0.5, noiseB(x * 0.012 + 3, z * 0.012 - 7));
  let r = lerp(0.80, 0.92, n), g = lerp(0.86, 0.95, n), b = 1.0;
  // cool blue drifts
  r = lerp(r, 0.62, patch * 0.45); g = lerp(g, 0.72, patch * 0.45); b = lerp(b, 0.97, patch * 0.45);
  // rock and ice on steep ground
  const streak = smoothstep(0.1, 0.6, noiseB(x * 0.09, z * 0.03));
  const s1 = smoothstep(0.6, 1.15, slope) * (1 - streak * 0.6);
  r = lerp(r, 0.58, s1 * 0.85); g = lerp(g, 0.64, s1 * 0.85); b = lerp(b, 0.88, s1 * 0.85);
  const s2 = smoothstep(1.3, 2.4, slope) * (1 - streak * 0.5);
  r = lerp(r, 0.42, s2 * 0.8); g = lerp(g, 0.47, s2 * 0.8); b = lerp(b, 0.74, s2 * 0.8);
  // icy shoreline and lake bed
  const shore = smoothstep(1.0, 0.1, h);
  r = lerp(r, 0.70, shore); g = lerp(g, 0.90, shore); b = lerp(b, 0.96, shore);
  const deep = smoothstep(-0.3, -4.5, h);
  r = lerp(r, 0.05, deep); g = lerp(g, 0.24, deep); b = lerp(b, 0.36, deep);
  // warm golden road
  const road = 1 - smoothstep(1.0, 2.8, roadD);
  r = lerp(r, 1.0, road * 0.55); g = lerp(g, 0.86, road * 0.55); b = lerp(b, 0.58, road * 0.55);
  out[0] = r; out[1] = g; out[2] = b;
  return out;
}

// 1 on Gloom Ridge (fades out when the ridge crystal is restored), 0 elsewhere.
export function gloomMask(x, z) {
  const R = LOC.ridge;
  const e = Math.hypot((x - R.x) / (R.rx + 14), (z - R.z) / (R.rz + 12));
  return 1 - smoothstep(0.75, 1.05, e);
}
