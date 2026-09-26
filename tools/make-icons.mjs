// Renders the app icons (a penguin under the aurora) into assets/icon-192.png and icon-512.png.
// Everything important stays inside the middle 80% so maskable crops never cut the face.
import fs from 'node:fs';
import { writePNG } from './png.mjs';

const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const inEllipse = (u, v, cx, cy, rx, ry) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1;
const inCircle = (u, v, cx, cy, r) => (u - cx) ** 2 + (v - cy) ** 2 <= r * r;

const NAVY = hex(0x1e2746), WHITE = hex(0xf6f8ff), BEAK = hex(0xff9d2e), CHEEK = hex(0xff9fb4);
const SCARF = hex(0xff5a4e), SCARF_DARK = hex(0xd8333f), PUPIL = hex(0x05060c), IRIS = hex(0x1c3f8a);
const SKY_TOP = hex(0x1a2a78), SKY_BOTTOM = hex(0x0b1033);
const AURORA = [[hex(0x4dffa0), 0.2, 0.0], [hex(0x38f0d2), 0.26, 1.7], [hex(0xb483ff), 0.33, 3.1]];
const STARS = [[0.14, 0.12], [0.84, 0.1], [0.9, 0.34], [0.08, 0.4], [0.72, 0.2], [0.26, 0.28], [0.93, 0.62], [0.06, 0.7]];

function colorAt(u, v) {
  let c = mix(SKY_TOP, SKY_BOTTOM, v);
  for (const [col, y0, ph] of AURORA) {
    const band = y0 + Math.sin(u * 5.5 + ph) * 0.05;
    const d = Math.abs(v - band);
    const a = (1 - smooth(0, 0.07, d)) * 0.75 * (0.6 + 0.4 * Math.sin(u * 13 + ph * 2));
    c = mix(c, col, Math.max(0, a));
  }
  for (const [sx, sy] of STARS) if (inCircle(u, v, sx, sy, 0.009)) c = [255, 255, 255];
  // Snow drift at the bottom
  if (v > 0.9 + Math.sin(u * 9) * 0.015) c = mix(hex(0xdfeaff), hex(0xb8cdf5), (v - 0.9) * 6);

  const inBody = inEllipse(u, v, 0.5, 0.57, 0.29, 0.31);
  const tuft = [-1, 0, 1].some((k) => {
    const tx = 0.5 + k * 0.035, ty = 0.285, h = 0.09, w = 0.022;
    const lean = k * 0.25;
    const yy = (ty - v) / h;
    const xx = u - tx + (ty - v) * lean;
    return yy >= 0 && yy <= 1 && Math.abs(xx) <= w * (1 - yy);
  });
  if (inBody || tuft) c = NAVY;
  const rr = ((u - 0.5) / 0.29) ** 2 + ((v - 0.57) / 0.31) ** 2;
  if (inBody && rr > 0.86) c = mix(NAVY, hex(0x6f8fe0), smooth(0.86, 1, rr) * 0.8);
  if (inBody) {
    const face = inCircle(u, v, 0.44, 0.5, 0.125) || inCircle(u, v, 0.56, 0.5, 0.125) || inEllipse(u, v, 0.5, 0.6, 0.2, 0.15);
    if (face) c = WHITE;
    for (const sx of [0.405, 0.595]) if (inCircle(u, v, sx, 0.585, 0.03)) c = mix(c, CHEEK, 0.85);
    for (const ex of [0.44, 0.56]) {
      if (inEllipse(u, v, ex, 0.49, 0.052, 0.06)) c = WHITE;
      if (inEllipse(u, v, ex, 0.5, 0.036, 0.042)) c = IRIS;
      if (inEllipse(u, v, ex, 0.502, 0.022, 0.026)) c = PUPIL;
      if (inCircle(u, v, ex - 0.012, 0.487, 0.011)) c = [255, 255, 255];
    }
    // Beak: a rounded downward triangle.
    const by = (v - 0.555) / 0.06;
    if (by >= 0 && by <= 1 && Math.abs(u - 0.5) <= 0.045 * (1 - by * 0.85)) c = mix(BEAK, hex(0xe8741a), by * 0.6);
  }
  // Scarf band and a tail hanging on the right.
  const bandY = 0.765 + Math.sin((u - 0.5) * 3) * 0.006;
  if (Math.abs(v - bandY) < 0.034 && inEllipse(u, v, 0.5, 0.57, 0.305, 0.4)) c = Math.abs(v - bandY) > 0.024 ? SCARF_DARK : SCARF;
  if (u > 0.6 && u < 0.68 && v > 0.78 && v < 0.905 - (u - 0.6) * 0.3) c = (v > 0.87 && Math.floor(u * 100) % 2 === 0) ? SCARF_DARK : SCARF;
  return c;
}

function render(size) {
  const rgba = new Uint8Array(size * size * 4);
  const S = 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const c = colorAt((x + (sx + 0.5) / S) / size, (y + (sy + 0.5) / S) / size);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const o = (y * size + x) * 4;
      rgba[o] = r / (S * S); rgba[o + 1] = g / (S * S); rgba[o + 2] = b / (S * S); rgba[o + 3] = 255;
    }
  }
  return rgba;
}

fs.mkdirSync('assets', { recursive: true });
for (const size of [192, 512]) {
  writePNG(`assets/icon-${size}.png`, size, size, render(size));
  console.log(`assets/icon-${size}.png`);
}
