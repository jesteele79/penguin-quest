// Procedural canvas textures. Everything is drawn at runtime so the game ships as one file.
import * as THREE from 'three';
import { Rng } from './rng.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(c, { repeat = false, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

export const glowTexture = () => cached('glow', () => {
  const c = makeCanvas(128, 128);
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.22)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return toTexture(c, { srgb: false });
});

export const snowTexture = () => cached('snow', () => {
  const S = 256;
  const c = makeCanvas(S, S);
  const g = c.getContext('2d');
  g.fillStyle = '#f6f9ff';
  g.fillRect(0, 0, S, S);
  const rng = new Rng(77);
  for (let i = 0; i < 900; i++) {
    const x = rng.float(0, S), y = rng.float(0, S), r = rng.float(2, 14);
    const shade = rng.float(0.86, 0.98);
    const col = `rgba(${Math.round(210 * shade)},${Math.round(222 * shade)},${Math.round(245 * shade)},${rng.float(0.05, 0.16)})`;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x + ox, y + oy, r, r * rng.float(0.5, 1), rng.float(0, 3), 0, Math.PI * 2);
      g.fill();
    }
  }
  return toTexture(c, { repeat: true });
});

export const iglooTexture = () => cached('igloo', () => {
  const W = 512, H = 256;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#9cb9e0';
  g.fillRect(0, 0, W, H);
  const rng = new Rng(9);
  const rows = 7;
  const rowH = H / rows;
  for (let r = 0; r < rows; r++) {
    const count = Math.max(6, 18 - r * 2);
    const bw = W / count;
    const off = (r % 2) * bw * 0.5;
    for (let k = -1; k <= count; k++) {
      const x = k * bw + off;
      const y = H - (r + 1) * rowH;
      const t = rng.float(0.9, 1.0);
      const grd = g.createLinearGradient(0, y, 0, y + rowH);
      grd.addColorStop(0, `rgb(${Math.round(250 * t)},${Math.round(253 * t)},255)`);
      grd.addColorStop(1, `rgb(${Math.round(208 * t)},${Math.round(226 * t)},${Math.round(248 * t)})`);
      g.fillStyle = grd;
      g.beginPath();
      g.roundRect(x + 2, y + 2, bw - 4, rowH - 4, 6);
      g.fill();
    }
  }
  return toTexture(c, { repeat: true });
});

export const woodTexture = () => cached('wood', () => {
  const S = 256;
  const c = makeCanvas(S, S);
  const g = c.getContext('2d');
  const rng = new Rng(3);
  const planks = 5;
  for (let p = 0; p < planks; p++) {
    const y = (p * S) / planks;
    const base = rng.float(0.85, 1.05);
    g.fillStyle = `rgb(${Math.round(128 * base)},${Math.round(86 * base)},${Math.round(56 * base)})`;
    g.fillRect(0, y, S, S / planks);
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = `rgba(60,34,20,${rng.float(0.08, 0.25)})`;
      g.lineWidth = rng.float(0.6, 1.8);
      g.beginPath();
      const yy = y + rng.float(3, S / planks - 3);
      g.moveTo(0, yy);
      for (let x = 0; x <= S; x += 32) g.lineTo(x, yy + rng.float(-1.5, 1.5));
      g.stroke();
    }
    g.fillStyle = 'rgba(40,22,12,0.55)';
    g.fillRect(0, y, S, 2);
  }
  return toTexture(c, { repeat: true });
});

export function flagTexture(kind) {
  return cached('flag-' + kind, () => {
    const c = makeCanvas(256, 160);
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 256, 160);
    grd.addColorStop(0, '#f0514a');
    grd.addColorStop(1, '#c42f3a');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#fff6f2';
    g.strokeStyle = '#fff6f2';
    g.translate(128, 80);
    if (kind === 'heart') {
      g.beginPath();
      g.moveTo(0, 38);
      g.bezierCurveTo(-58, 0, -40, -52, 0, -22);
      g.bezierCurveTo(40, -52, 58, 0, 0, 38);
      g.fill();
    } else {
      g.lineWidth = 8;
      g.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        g.save();
        g.rotate((i * Math.PI) / 3);
        g.beginPath();
        g.moveTo(0, 0); g.lineTo(0, -48);
        g.moveTo(0, -30); g.lineTo(-13, -42);
        g.moveTo(0, -30); g.lineTo(13, -42);
        g.stroke();
        g.restore();
      }
    }
    return toTexture(c);
  });
}

export const moonTexture = () => cached('moon', () => {
  const S = 256;
  const c = makeCanvas(S, S);
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(110, 100, 10, 128, 128, 118);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(0.7, '#e6ebfb');
  grd.addColorStop(1, '#c4cdee');
  g.fillStyle = grd;
  g.beginPath(); g.arc(128, 128, 118, 0, Math.PI * 2); g.fill();
  const rng = new Rng(21);
  g.save();
  g.beginPath(); g.arc(128, 128, 118, 0, Math.PI * 2); g.clip();
  for (let i = 0; i < 26; i++) {
    const x = rng.float(20, 236), y = rng.float(20, 236), r = rng.float(5, 26);
    const cr = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    cr.addColorStop(0, 'rgba(150,160,200,0.35)');
    cr.addColorStop(0.8, 'rgba(160,170,210,0.22)');
    cr.addColorStop(1, 'rgba(160,170,210,0)');
    g.fillStyle = cr;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  return toTexture(c);
});

export const symbolTexture = () => cached('symbols', () => {
  const c = makeCanvas(128, 512);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 512);
  g.fillStyle = '#ffffff';
  g.font = 'bold 84px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = '#e4c8ff';
  g.shadowBlur = 18;
  ['+', '×', '÷', '='].forEach((s, i) => g.fillText(s, 64, 70 + i * 118));
  return toTexture(c);
});

export function signTexture(lines) {
  return cached('sign-' + lines.join('|'), () => {
    const c = makeCanvas(512, 128 * lines.length);
    const g = c.getContext('2d');
    lines.forEach((text, i) => {
      const y = i * 128;
      const grd = g.createLinearGradient(0, y, 0, y + 128);
      grd.addColorStop(0, '#8a5c38');
      grd.addColorStop(1, '#6b4428');
      g.fillStyle = grd;
      g.fillRect(4, y + 8, 504, 112);
      g.strokeStyle = '#4a2c18';
      g.lineWidth = 6;
      g.strokeRect(4, y + 8, 504, 112);
      g.fillStyle = '#fff4dc';
      g.font = '600 52px Fredoka, "Trebuchet MS", sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, 256, y + 66);
    });
    return toTexture(c);
  });
}

function archPath(g, x, y, w, h) {
  const r = w / 2;
  g.beginPath();
  g.moveTo(x, y + h);
  g.lineTo(x, y + r);
  g.arc(x + r, y + r, r, Math.PI, 0);
  g.lineTo(x + w, y + h);
  g.closePath();
}

// Half-disk door (for CircleGeometry(r, n, 0, PI)): only the top half of the canvas is used.
export const doorTexture = () => cached('door', () => {
  const c = makeCanvas(256, 256);
  const g = c.getContext('2d');
  const wood = g.createLinearGradient(0, 0, 256, 0);
  wood.addColorStop(0, '#5e3a20'); wood.addColorStop(0.5, '#8d5a33'); wood.addColorStop(1, '#5e3a20');
  g.fillStyle = wood;
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = 'rgba(40,20,8,0.55)';
  g.lineWidth = 5;
  for (let x = 40; x < 256; x += 44) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
  const win = g.createRadialGradient(128, 70, 3, 128, 70, 34);
  win.addColorStop(0, '#fff6c8'); win.addColorStop(0.6, '#ffc05a'); win.addColorStop(1, '#e0842a');
  g.fillStyle = win;
  g.beginPath(); g.arc(128, 70, 30, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3a2210'; g.lineWidth = 7;
  g.beginPath(); g.arc(128, 70, 30, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(128, 40); g.lineTo(128, 100); g.moveTo(98, 70); g.lineTo(158, 70); g.stroke();
  g.fillStyle = '#f0c870';
  g.beginPath(); g.arc(186, 104, 7, 0, Math.PI * 2); g.fill();
  return toTexture(c);
});

export const awningTexture = () => cached('awning', () => {
  const c = makeCanvas(256, 64);
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fff4ec' : '#e8434b'; g.fillRect(i * 32, 0, 32, 64); }
  return toTexture(c);
});

export const doorwayTexture = () => cached('doorway', () => {
  const c = makeCanvas(128, 160);
  const g = c.getContext('2d');
  archPath(g, 10, 8, 108, 150);
  const glow = g.createLinearGradient(0, 8, 0, 158);
  glow.addColorStop(0, '#ffe6a0'); glow.addColorStop(0.5, '#ffb04a'); glow.addColorStop(1, '#d9661e');
  g.fillStyle = glow;
  g.fill();
  g.strokeStyle = '#5a341c';
  g.lineWidth = 10;
  archPath(g, 10, 8, 108, 150);
  g.stroke();
  return toTexture(c);
});

// Striped / patterned scarf textures for wardrobe items.
export function scarfTexture(kind) {
  return cached('scarf-' + kind, () => {
    const c = makeCanvas(128, 32);
    const g = c.getContext('2d');
    if (kind === 'rainbow') {
      const cols = ['#ff5a5a', '#ffa53d', '#ffe14d', '#5ee37a', '#4db8ff', '#9a6bff'];
      cols.forEach((col, i) => { g.fillStyle = col; g.fillRect((i * 128) / cols.length, 0, 128 / cols.length + 1, 32); });
    } else if (kind === 'candy') {
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#ff4d6d'; g.fillRect(i * 16, 0, 16, 32); }
    } else if (kind === 'star') {
      g.fillStyle = '#1b2360'; g.fillRect(0, 0, 128, 32);
      const rng = new Rng(5);
      for (let i = 0; i < 30; i++) { g.fillStyle = rng.chance(0.3) ? '#ffe68a' : '#ffffff'; g.fillRect(rng.int(0, 127), rng.int(0, 31), 2, 2); }
    } else {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 32);
    }
    const t = toTexture(c, { repeat: true });
    return t;
  });
}
