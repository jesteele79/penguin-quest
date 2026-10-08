// Top-down map of a book's terrain, roads and points of interest, for checking a layout without the game.
//   node tools/mapdump.mjs book2 out.ppm   (then convert the PPM to PNG with any image tool)
import fs from 'node:fs';

const book = process.argv[2] ?? 'book2';
const out = process.argv[3] ?? `.cache/map-${book}.ppm`;
const L = await import(`../src/books/${book}/layout.js`);
const shape = await import(`../src/books/${book}/shape.js`);

const S = 660, half = L.WORLD_HALF, k = (2 * half) / S;
const H = new Float32Array(S * S);
for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) H[j * S + i] = shape.rawHeight(-half + (i + 0.5) * k, -half + (j + 0.5) * k);
const segs = L.ROADS.flatMap((r) => r.slice(0, -1).map((p, i) => [p, r[i + 1]]));
const roadD = (x, z) => Math.min(...segs.map(([a, b]) => {
  const vx = b[0] - a[0], vz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t);
}));
const img = Buffer.alloc(S * S * 3);
const col = [0, 0, 0];
for (let j = 1; j < S - 1; j++) for (let i = 1; i < S - 1; i++) {
  const x = -half + (i + 0.5) * k, z = -half + (j + 0.5) * k, h = H[j * S + i];
  const gx = (H[j * S + i + 1] - H[j * S + i - 1]) / (2 * k), gz = (H[(j + 1) * S + i] - H[(j - 1) * S + i]) / (2 * k);
  shape.terrainColor(x, z, h, Math.hypot(gx, gz), roadD(x, z), col);
  const shade = Math.max(0.5, Math.min(1.25, 1 - (gx + gz) * 0.6));
  let [r, g, b] = col.map((c) => c * shade);
  if (h < L.WATER_Y) { const d = Math.min(1, -h / 6); r = r * 0.35 + (0.2 - d * 0.15) * 0.65; g = g * 0.35 + (0.85 - d * 0.4) * 0.65; b = b * 0.35 + (0.85 - d * 0.25) * 0.65; }
  const o = (j * S + i) * 3;
  img[o] = Math.min(255, r * 255); img[o + 1] = Math.min(255, g * 255); img[o + 2] = Math.min(255, b * 255);
}
const dot = (x, z, rgb, rad = 3) => {
  const ci = Math.round((x + half) / k), cj = Math.round((z + half) / k);
  for (let dj = -rad; dj <= rad; dj++) for (let di = -rad; di <= rad; di++) {
    if (di * di + dj * dj > rad * rad) continue;
    const i = ci + di, j = cj + dj;
    if (i < 0 || j < 0 || i >= S || j >= S) continue;
    img.set(rgb, (j * S + i) * 3);
  }
};
for (const p of L.SNOWFLAKES) dot(p[0], p[1], [120, 255, 255], 2);
for (const p of L.CHESTS) dot(p[0], p[1], [255, 170, 0], 3);
for (const g of L.GLOOM_SPOTS) dot(g.x, g.z, [60, 40, 60], 3);
for (const p of L.CHICK_SPOTS) dot(p[0], p[1], [255, 255, 255], 2);
for (const c of Object.values(L.CRYSTALS)) dot(c.x, c.z, [255, 60, 40], 5);
for (const [name, p] of Object.entries(L.LOC)) if (typeof p.x === 'number' && typeof p.z === 'number') dot(p.x, p.z, [255, 0, 255], 2);
dot(0, 0, [0, 0, 0], 1);
const ring = (r, rgb) => { for (let a = 0; a < 720; a++) dot(Math.cos((a / 720) * Math.PI * 2) * r, Math.sin((a / 720) * Math.PI * 2) * r, rgb, 0); };
ring(L.WORLD_RADIUS, [255, 255, 255]);
fs.mkdirSync('.cache', { recursive: true });
fs.writeFileSync(out, Buffer.concat([Buffer.from(`P6 ${S} ${S} 255\n`), img]));
let lo = Infinity, hi = -Infinity;
for (const v of H) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
const at = (p) => shape.rawHeight(p.x, p.z).toFixed(1);
console.log(`wrote ${out}; heights ${lo.toFixed(1)}..${hi.toFixed(1)}`);
console.log('LOC heights:', Object.entries(L.LOC).filter(([, p]) => typeof p.x === 'number' && typeof p.z === 'number').map(([n, p]) => `${n}=${at(p)}`).join(' '));
console.log('vents:', Object.entries(L.CRYSTALS).map(([n, p]) => `${n}=${at(p)}`).join(' '));
const wet = (list) => list.filter((p) => shape.rawHeight(p[0] ?? p.x, p[1] ?? p.z) < 0.3).map((p) => `[${p[0] ?? p.x},${p[1] ?? p.z}]`);
console.log('in water:', 'glass', wet(L.SNOWFLAKES).join(' '), '| chests', wet(L.CHESTS).join(' '), '| chicks', wet(L.CHICK_SPOTS).join(' '), '| gloom', wet(L.GLOOM_SPOTS).join(' '));
