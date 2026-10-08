// Skyreach's land: flat-topped sky islands at different heights, each ending in a sheer cliff that drops
// into the cloud sea. Under the clouds there is nothing to stand on. Pure functions, like the other books.
import { createNoise2D, makeFbm } from '../../core/noise.js';
import { lerp, smoothstep } from '../../core/mathutil.js';
import { ISLANDS, LOC } from './layout.js';

const nA = createNoise2D(1618);
const nB = createNoise2D(2236);
const fbm = makeFbm(nA);
export const VOID = -30;

// Signed distance to an island's rim: negative on top, positive out over the clouds.
export function islandSD(I, x, z) {
  const dx = x - I.x, dz = z - I.z;
  const th = Math.atan2(dz, dx);
  const wob = I.wob * (Math.sin(3 * th + I.x * 0.1) * 0.6 + Math.sin(5 * th + I.z * 0.07) * 0.4) + nB(x * 0.05, z * 0.05) * 1.6;
  return Math.hypot(dx, dz) - (I.r + wob);
}

// The island under (x, z), if any, and how far inside its rim the point is.
export function islandAt(x, z) {
  let best = null, bd = 0;
  for (const [id, I] of Object.entries(ISLANDS)) {
    const d = islandSD(I, x, z);
    if (d < bd) { bd = d; best = id; }
  }
  return best ? { id: best, d: bd } : null;
}

export function rawHeight(x, z) {
  let h = VOID;
  for (const [id, I] of Object.entries(ISLANDS)) {
    const d = islandSD(I, x, z);
    if (d > 10) continue;
    const inner = smoothstep(-2, -14, d);
    let top = I.h;
    if (id === 'wind') top += (fbm(x * 0.025, z * 0.025, 3) * 3.2 + 0.6) * inner;
    else if (id === 'valley') top += (fbm(x * 0.04, z * 0.04, 3) * 3.4 - nB(x * 0.02, z * 0.02) * 1.5) * inner;
    else if (id === 'well') top += 5 * (1 - smoothstep(5, 15, Math.hypot(x - I.x, z - I.z)));
    else top += fbm(x * 0.03, z * 0.03, 3) * 1.6 * inner;
    // The rim rounds over, then the cliff drops away into the clouds.
    top -= smoothstep(-4, 0, d) * 1.1;
    h = Math.max(h, d < 0 ? top : top - d * 9);
  }
  // Level ground for the places people live and work.
  const flat = (p, r, fall, target) => { const t = 1 - smoothstep(r, r + fall, Math.hypot(x - p.x, z - p.z)); h = lerp(h, target, t); };
  if (h > 0) {
    flat(LOC.home, 15, 10, ISLANDS.town.h);
    flat(LOC.arrival, 6, 6, ISLANDS.town.h);
    flat(LOC.tower, 6, 5, ISLANDS.wind.h + 0.5);
    flat(LOC.dome, 10, 6, ISLANDS.clock.h);
    flat(LOC.kiln, 7, 5, ISLANDS.crystal.h);
    flat(LOC.scope, 7, 6, ISLANDS.stars.h);
    flat(LOC.arena, 7, 5, ISLANDS.valley.h + 0.6);
  }
  return h;
}

// Pastel meadows on top, layered rock in the cliffs, pale stone paths.
export function terrainColor(x, z, h, slope, roadD, out) {
  const n = fbm(x * 0.04, z * 0.04, 2) * 0.5 + 0.5;
  const patch = smoothstep(-0.1, 0.5, nB(x * 0.018 + 3, z * 0.018 - 1));
  // soft mint grass with lilac patches
  let r = lerp(0.36, 0.46, n), g = lerp(0.62, 0.74, n), b = lerp(0.46, 0.54, n);
  r = lerp(r, 0.66, patch * 0.35); g = lerp(g, 0.6, patch * 0.35); b = lerp(b, 0.78, patch * 0.35);
  const at = islandAt(x, z);
  if (at?.id === 'valley') { r = lerp(r, 0.6, 0.35); g = lerp(g, 0.76, 0.35); b = lerp(b, 0.86, 0.35); }
  if (at?.id === 'clock') { r = lerp(r, 0.62, 0.45); g = lerp(g, 0.6, 0.45); b = lerp(b, 0.56, 0.45); }
  if (at?.id === 'crystal') { r = lerp(r, 0.7, 0.4); g = lerp(g, 0.62, 0.4); b = lerp(b, 0.86, 0.4); }
  if (at?.id === 'stars') { r = lerp(r, 0.36, 0.45); g = lerp(g, 0.42, 0.45); b = lerp(b, 0.72, 0.45); }
  if (at?.id === 'well') { r = lerp(r, 0.86, 0.5); g = lerp(g, 0.86, 0.5); b = lerp(b, 0.92, 0.5); }
  // cliffs: warm layered rock, lighter bands every few metres
  const cliff = smoothstep(0.8, 1.6, slope);
  const band = 0.5 + 0.5 * Math.sin(h * 1.4 + nB(x * 0.1, z * 0.1) * 2);
  r = lerp(r, lerp(0.56, 0.7, band), cliff); g = lerp(g, lerp(0.46, 0.58, band), cliff); b = lerp(b, lerp(0.48, 0.6, band), cliff);
  // the rim: a little bare rock where grass gives way to cliff
  const rim = at ? smoothstep(-3, -0.5, at.d) * (1 - cliff) : 0;
  r = lerp(r, 0.62, rim * 0.5); g = lerp(g, 0.56, rim * 0.5); b = lerp(b, 0.56, rim * 0.5);
  // pale stone paths
  const road = 1 - smoothstep(1.0, 2.6, roadD);
  r = lerp(r, 0.92, road * 0.65); g = lerp(g, 0.88, road * 0.65); b = lerp(b, 0.86, road * 0.65);
  out[0] = r; out[1] = g; out[2] = b;
  return out;
}

// The Hush's quiet grey settles over the Starwell until the stars are lit again.
export function gloomMask(x, z) {
  const W = ISLANDS.well;
  return 1 - smoothstep(W.r - 6, W.r + 14, Math.hypot(x - W.x, z - W.z));
}

export const isLake = () => false;
