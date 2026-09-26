// Renders a top-down map of the terrain + layout to .cache/layout.png for checking positions.
import fs from 'node:fs';
import { Terrain, terrainColor } from '../src/world/terrain.js';
import { LOC, ROADS, CRYSTALS, WORLD_HALF } from '../src/world/layout.js';
import { writePNG } from './png.mjs';

const t0 = Date.now();
const terrain = new Terrain();
console.log('terrain built in', Date.now() - t0, 'ms');

const S = 2; // pixels per world unit
const W = WORLD_HALF * 2 * S;
const img = new Uint8Array(W * W * 4);
const col = [0, 0, 0];
const MAX_SLOPE = 1.0;

for (let py = 0; py < W; py++) {
  for (let px = 0; px < W; px++) {
    const x = px / S - WORLD_HALF, z = py / S - WORLD_HALF;
    const h = terrain.heightAt(x, z);
    const g = terrain.gradient(x, z);
    const slope = Math.hypot(g.x, g.z);
    terrainColor(x, z, h, slope, terrain.roadDistanceAt(x, z), col);
    // hillshade from the north-west
    const shade = Math.max(0.35, Math.min(1.25, 1 + (g.x + g.z) * 0.6));
    let r = col[0] * shade, gg = col[1] * shade, b = col[2] * shade;
    if (h < 0) { r = r * 0.3 + 0.05; gg = gg * 0.4 + 0.45; b = b * 0.4 + 0.55; }
    if (slope > MAX_SLOPE) { r = r * 0.6 + 0.4; gg *= 0.6; b *= 0.6; }
    // contour every 5 units
    if (Math.abs(h - Math.round(h / 5) * 5) < 0.12 && h > 0.5) { r *= 0.7; gg *= 0.7; b *= 0.8; }
    const i = (py * W + px) * 4;
    img[i] = Math.min(255, r * 255); img[i + 1] = Math.min(255, gg * 255); img[i + 2] = Math.min(255, b * 255); img[i + 3] = 255;
  }
}

function dot(x, z, rad, c) {
  const cx = (x + WORLD_HALF) * S, cy = (z + WORLD_HALF) * S;
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
    if (dx * dx + dy * dy > rad * rad) continue;
    const px = Math.round(cx + dx), py = Math.round(cy + dy);
    if (px < 0 || py < 0 || px >= W || py >= W) continue;
    const i = (py * W + px) * 4;
    img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2];
  }
}

for (const road of ROADS) {
  for (let k = 0; k < road.length - 1; k++) {
    const [ax, az] = road[k], [bx, bz] = road[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    for (let s = 0; s <= len; s += 0.5) dot(ax + (bx - ax) * s / len, az + (bz - az) * s / len, 1, [230, 170, 20]);
    dot(ax, az, 3, [160, 90, 0]);
  }
}
for (const [k, p] of Object.entries(LOC)) {
  if (p.x !== undefined) dot(p.x, p.z, 4, [220, 30, 60]);
}
for (const p of Object.values(CRYSTALS)) dot(p.x, p.z, 5, [20, 200, 90]);
// dock + launch
for (let x = LOC.dock.x0; x <= LOC.dock.x1; x += 0.5) dot(x, LOC.dock.z, 2, [120, 70, 30]);
for (let z = LOC.launch.z1; z <= LOC.launch.z0; z += 0.5) dot(LOC.launch.x0, z, 2, [120, 70, 30]);

fs.mkdirSync('.cache', { recursive: true });
writePNG('.cache/layout.png', W, W, img);

const report = {};
for (const [k, p] of Object.entries(LOC)) {
  if (p.x !== undefined) report[k] = { h: +terrain.heightAt(p.x, p.z).toFixed(2), slope: +terrain.slopeAt(p.x, p.z).toFixed(2) };
}
for (const [k, p] of Object.entries(CRYSTALS)) report['crystal_' + k] = { h: +terrain.heightAt(p.x, p.z).toFixed(2) };
// steepest point along each road
ROADS.forEach((road, ri) => {
  let worst = 0, at = null, lowest = 1e9;
  for (let k = 0; k < road.length - 1; k++) {
    const [ax, az] = road[k], [bx, bz] = road[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    for (let s = 0; s <= len; s += 1) {
      const x = ax + (bx - ax) * s / len, z = az + (bz - az) * s / len;
      const sl = terrain.slopeAt(x, z);
      if (sl > worst) { worst = sl; at = [x.toFixed(0), z.toFixed(0)]; }
      lowest = Math.min(lowest, terrain.heightAt(x, z));
    }
  }
  report['road' + ri] = { maxSlope: +worst.toFixed(2), at: at.join(','), minH: +lowest.toFixed(2) };
});
// shoreline along the floe path and the dock
const shoreZ = (() => { for (let z = 16; z < 90; z += 0.5) if (terrain.heightAt(0, z) > 0) return z; })();
const shoreX = (() => { for (let x = -20; x > -90; x -= 0.5) if (terrain.heightAt(x, -4) > 0) return x; })();
const islandEdgeZ = (() => { for (let z = 4; z < 30; z += 0.25) if (terrain.heightAt(0, z) < 0) return z; })();
report.islandEdgeZ = islandEdgeZ;
report.floeShoreZ = shoreZ;
report.dockShoreX = shoreX;
console.log(JSON.stringify(report, null, 1));
