// The Ember Isles' land: a volcanic main island built from soft blobs, a coral lagoon behind a reef ring in
// the west, a harbor bay in the east, a half-sunken temple islet to the south-west joined by a sandbar,
// and sea cliffs with a lighthouse to the north-east. Pure functions, like Book 1's terrain.
import { createNoise2D, makeFbm } from '../../core/noise.js';
import { lerp, smoothstep } from '../../core/mathutil.js';
import { LOC, poolDist } from './layout.js';

const nA = createNoise2D(2718);
const nB = createNoise2D(3141);
const fbm = makeFbm(nA);

// Soft union of signed distances: negative inside land.
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const circle = (x, z, cx, cz, r) => Math.hypot(x - cx, z - cz) - r;

function segDist(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz || 1)));
  return { d: Math.hypot(px - (ax + vx * t), pz - (az + vz * t)), t };
}

// Signed distance to the coast of the main island (with its shoulders).
export function coastSD(x, z) {
  const dx = x, dz = (z + 30) / 1.08;
  const th = Math.atan2(dz, dx);
  const wob = 7 * Math.sin(3 * th + 0.6) + 5 * Math.sin(5 * th + 2.0) + 2.5 * Math.sin(11 * th + 1.1);
  let d = Math.hypot(dx, dz) - (104 + wob);
  d = smin(d, circle(x, z, 0, 88, 40), 24); // Arrival Beach
  d = smin(d, circle(x, z, 104, 28, 34), 20); // harbor shoulder
  d = smin(d, circle(x, z, 98, -100, 30), 20); // lighthouse headland
  d = smin(d, circle(x, z, -92, 12, 28), 18); // lagoon shore
  d = Math.max(d, -circle(x, z, 156, 46, 24)); // harbor bay
  d += nB(x * 0.03, z * 0.03) * 3;
  return d;
}

const L = () => LOC;

export function rawHeight(x, z) {
  const loc = L();
  const sd = coastSD(x, z);
  // Land: a beach band, then rolling jungle hills. Sea: a shelf sloping into the deep.
  let h;
  if (sd < 0) {
    const beach = 2.1 * smoothstep(0, -14, sd);
    const hills = (5 + fbm(x * 0.012, z * 0.012, 4) * 7) * smoothstep(-12, -46, sd);
    h = 0.35 + beach + Math.max(0, hills);
  } else {
    h = 0.35 - 2.2 * smoothstep(0, 6, sd) - 6 * smoothstep(4, 40, sd) + nB(x * 0.05, z * 0.05) * 0.3;
  }

  // Mount Ember: a cone with a crater. The rim is the highest ground on the island.
  const V = loc.volcano;
  const dv = Math.hypot(x - V.x, z - V.z);
  let cone;
  if (dv < V.crater) cone = V.top - 10 * Math.pow(1 - dv / V.crater, 1.5);
  else cone = V.top * Math.pow(Math.max(0, 1 - (dv - V.crater) / 72), 1.5);
  cone += dv > V.crater ? fbm(x * 0.05, z * 0.05, 2) * 1.2 * smoothstep(V.crater, V.crater + 20, dv) : 0;
  if (cone > h) h = lerp(h, cone, smoothstep(14, -4, sd));

  // Flat ground for the places people live and work.
  const flat = (p, r, fall, target) => { const t = 1 - smoothstep(r, r + fall, Math.hypot(x - p.x, z - p.z)); h = lerp(h, target, t); };
  flat(loc.home, 20, 14, 2.4);
  flat(loc.harbor, 18, 12, 2.6);
  // The forge and the lava pool share one level terrace at the foot of the volcano.
  const LP = loc.lavaPool;
  flat(loc.forge, 11, 9, LP.rim);
  flat(loc.camp2, 10, 8, 7.5);
  const pd = poolDist(x, z, LP);
  h = lerp(h, LP.rim, 1 - smoothstep(4, 12, pd));
  if (pd < 0) h = Math.min(h, LP.floor + (LP.rim - LP.floor) * smoothstep(-2, 0, pd));
  const I = LP.isle, di = Math.hypot(x - I.x, z - I.z);
  if (di < I.r + 2) h = Math.max(h, lerp(LP.floor, LP.rim + 0.2, 1 - smoothstep(I.r - 0.5, I.r + 1.5, di)));

  // Lighthouse headland: a high plateau with cliffs to the sea, and a ramp up from the hills.
  const C = loc.cliffs;
  const dc = Math.hypot(x - C.x, z - C.z);
  if (dc < C.r + 7) h = Math.max(h, C.top * (1 - smoothstep(C.r, C.r + 7, dc)) + (dc < C.r ? fbm(x * 0.08, z * 0.08, 2) * 0.5 : 0));
  const A = loc.rampA, B = loc.rampB;
  const s = segDist(x, z, A.x, A.z, B.x, B.z);
  h = lerp(h, lerp(A.h, B.h, s.t), 1 - smoothstep(4.5, 9, s.d));

  // Coral lagoon: shallow water inside a sandy reef ring that opens to the west.
  const lg = loc.lagoon;
  const dl = Math.hypot(x - lg.x, z - lg.z);
  if (dl < lg.r + 10) {
    const ang = Math.atan2(z - lg.z, x - lg.x);
    const gap = Math.abs(Math.abs(ang) - Math.PI) < 0.32;
    const inner = -1.5 + nB(x * 0.12, z * 0.12) * 0.35;
    const ring = gap ? -1.2 : 0.55 + nB(x * 0.2, z * 0.2) * 0.15;
    const target = dl < lg.r ? inner : dl < lg.r + 6 ? ring : h;
    const t = dl < lg.r ? 1 : 1 - smoothstep(lg.r + 4, lg.r + 10, dl);
    // The land side of the lagoon keeps its beach.
    if (sd > -6) h = lerp(h, target, t * smoothstep(-6, 4, sd));
  }

  // Temple islet and the sandbar that wades out to it.
  const T = loc.temple;
  const dt = Math.hypot(x - T.x, z - T.z);
  const islet = 3.2 * (1 - smoothstep(T.r * 0.55, T.r, dt)) + 0.2 - 1.6 * smoothstep(T.r * 0.8, T.r + 8, dt);
  if (dt < T.r + 8) h = Math.max(h, islet);
  const sb = segDist(x, z, loc.sandbar[0].x, loc.sandbar[0].z, loc.sandbar[1].x, loc.sandbar[1].z);
  if (sb.d < 8) h = Math.max(h, 0.3 - 1.6 * smoothstep(3, 7, sb.d) + nB(x * 0.3, z * 0.3) * 0.05);

  // Far islands frame the horizon beyond the reef (out of reach).
  for (const f of FAR) {
    const df = Math.hypot(x - f.x, z - f.z);
    if (df < f.r) h = Math.max(h, f.h * Math.pow(1 - df / f.r, 1.6) + fbm(x * 0.04 + 9, z * 0.04, 2) * 2);
  }
  return h;
}

const FAR = [
  { x: 205, z: -120, r: 36, h: 26 }, { x: -210, z: -60, r: 40, h: 32 }, { x: -170, z: 175, r: 30, h: 18 },
  { x: 120, z: 200, r: 34, h: 22 }, { x: 40, z: -215, r: 30, h: 20 }, { x: 215, z: 95, r: 26, h: 16 },
];

export const isLake = () => false;

// Surface colour in sRGB [0..1]: sand, jungle, volcanic rock and ash, cliffs, golden paths.
export function terrainColor(x, z, h, slope, roadD, out) {
  const loc = L();
  const n = fbm(x * 0.04, z * 0.04, 2) * 0.5 + 0.5;
  const patch = smoothstep(-0.2, 0.5, nB(x * 0.015 - 4, z * 0.015 + 2));
  // jungle greens with sunny yellow-green patches
  let r = lerp(0.24, 0.34, n), g = lerp(0.47, 0.6, n), b = lerp(0.2, 0.26, n);
  r = lerp(r, 0.52, patch * 0.35); g = lerp(g, 0.66, patch * 0.35); b = lerp(b, 0.24, patch * 0.35);
  // sand near the water, wetter right at the edge
  const sand = 1 - smoothstep(1.6, 3.0, h);
  const sr = lerp(0.9, 0.98, n), sg = lerp(0.79, 0.87, n), sbb = lerp(0.56, 0.66, n);
  r = lerp(r, sr, sand); g = lerp(g, sg, sand); b = lerp(b, sbb, sand);
  const wet = smoothstep(0.9, 0.25, h);
  r = lerp(r, 0.78, wet * 0.5); g = lerp(g, 0.66, wet * 0.5); b = lerp(b, 0.47, wet * 0.5);
  // the volcano: dark basalt low down, pale ash near the rim, warm red-brown streaks
  const V = loc.volcano;
  const dv = Math.hypot(x - V.x, z - V.z);
  const volc = 1 - smoothstep(38, 66, dv);
  const ash = smoothstep(26, 12, dv);
  const streak = smoothstep(0.2, 0.7, nB(x * 0.11, z * 0.03));
  r = lerp(r, lerp(0.27, 0.42, streak * 0.4), volc); g = lerp(g, 0.21, volc); b = lerp(b, 0.22, volc);
  r = lerp(r, 0.46, ash * 0.8); g = lerp(g, 0.41, ash * 0.8); b = lerp(b, 0.42, ash * 0.8);
  // dark basalt around the lava pool
  const pd = poolDist(x, z, loc.lavaPool);
  const lf = 1 - smoothstep(2, 16, pd);
  r = lerp(r, 0.2, lf * 0.85); g = lerp(g, 0.17, lf * 0.85); b = lerp(b, 0.19, lf * 0.85);
  // cliffs
  const s1 = smoothstep(0.75, 1.3, slope);
  r = lerp(r, 0.58, s1 * 0.85); g = lerp(g, 0.47, s1 * 0.85); b = lerp(b, 0.38, s1 * 0.85);
  const s2 = smoothstep(1.4, 2.4, slope);
  r = lerp(r, 0.42, s2 * 0.8); g = lerp(g, 0.34, s2 * 0.8); b = lerp(b, 0.3, s2 * 0.8);
  // a black crust lip where the ground dips into the lava, and the island the vent stands on
  const lip = Math.max(1 - smoothstep(-0.5, 2.5, pd), 1 - smoothstep(loc.lavaPool.isle.r - 1.5, loc.lavaPool.isle.r + 1, Math.hypot(x - loc.lavaPool.isle.x, z - loc.lavaPool.isle.z)));
  r = lerp(r, 0.15, lip); g = lerp(g, 0.12, lip); b = lerp(b, 0.12, lip);
  // under water: pale lagoon sand, then deep blue-green
  const under = smoothstep(0.3, -0.6, h);
  r = lerp(r, 0.86, under); g = lerp(g, 0.85, under); b = lerp(b, 0.7, under);
  const deep = smoothstep(-1.2, -6, h);
  r = lerp(r, 0.12, deep); g = lerp(g, 0.36, deep); b = lerp(b, 0.42, deep);
  // paths of packed golden sand
  const road = 1 - smoothstep(1.0, 2.8, roadD);
  r = lerp(r, 1.0, road * 0.6); g = lerp(g, 0.88, road * 0.6); b = lerp(b, 0.62, road * 0.6);
  out[0] = r; out[1] = g; out[2] = b;
  return out;
}

// Soot from the siphon machines settles on the volcano's upper slopes until the Heart is rekindled.
export function gloomMask(x, z) {
  const V = L().volcano;
  return 1 - smoothstep(20, 46, Math.hypot(x - V.x, z - V.z));
}
