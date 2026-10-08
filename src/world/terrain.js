// The shared heightfield: built once from the active book's land shape, then used by the renderer and physics.
import { clamp, lerp, smoothstep } from '../core/mathutil.js';
import { ROADS, WORLD_HALF, GRID_STEP } from './layout.js';
import { byBook } from '../books/active.js';
import * as glacierBay from '../books/book1/shape.js';
import * as emberIsles from '../books/book2/shape.js';
import * as skyreach from '../books/book3/shape.js';

const SHAPE = byBook({ book1: glacierBay, book2: emberIsles, book3: skyreach });
export const terrainColor = SHAPE.terrainColor;
export const gloomMask = SHAPE.gloomMask;

function segDist(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az;
  const len2 = vx * vx + vz * vz || 1;
  const t = clamp(((px - ax) * vx + (pz - az) * vz) / len2, 0, 1);
  return { d: Math.hypot(px - (ax + vx * t), pz - (az + vz * t)), t };
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
        let h = SHAPE.rawHeight(x, z);
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

  isLake(x, z) { return SHAPE.isLake(x, z, this.heightAt(x, z)); }
}
