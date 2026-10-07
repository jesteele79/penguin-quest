// SVG visual models for problems and hints. Colors come from CSS classes (see styles.css .vis).
import { Frac } from './frac.js';
import { fmtInt, fmtNum } from './fmt.js';

const svg = (w, h, body, label = '') =>
  `<svg class="vis" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const t = (x, y, s, cls = 'v-t', anchor = 'middle', size = 16) =>
  `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}" font-size="${size}" dominant-baseline="middle">${s}</text>`;
const minus = (v) => (v < 0 ? `−${-v}` : String(v));

function fracText(f) {
  f = Frac.of(f);
  if (f.d === 1) return String(f.n);
  const w = Math.floor(f.n / f.d), r = f.n % f.d;
  return w ? (r ? `${w} ${r}/${f.d}` : String(w)) : `${f.n}/${f.d}`;
}

const R = {
  array({ rows, cols }) {
    const s = 24, pad = 14;
    let b = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) b += `<circle cx="${pad + c * s + s / 2}" cy="${pad + r * s + s / 2}" r="8" class="v-dot"/>`;
    return svg(pad * 2 + cols * s, pad * 2 + rows * s, b, `${rows} rows of ${cols}`);
  },

  bar({ parts, shaded }) {
    const W = 340, H = 60, x0 = 10, y0 = 10, w = (W - 20) / parts;
    let b = '';
    for (let i = 0; i < parts; i++) b += `<rect x="${x0 + i * w}" y="${y0}" width="${w}" height="${H - 20}" class="${i < shaded ? 'v-fill' : 'v-empty'}"/>`;
    b += `<rect x="${x0}" y="${y0}" width="${W - 20}" height="${H - 20}" class="v-outline" rx="4"/>`;
    return svg(W, H, b, `bar with ${shaded} of ${parts} parts shaded`);
  },

  bars({ bars }) {
    const W = 340, bh = 36, gap = 14;
    let b = '';
    bars.forEach((bar, k) => {
      const y = 10 + k * (bh + gap), w = (W - 20) / bar.parts;
      for (let i = 0; i < bar.parts; i++) b += `<rect x="${10 + i * w}" y="${y}" width="${w}" height="${bh}" class="${i < bar.shaded ? (k ? 'v-fill2' : 'v-fill') : 'v-empty'}"/>`;
      b += `<rect x="10" y="${y}" width="${W - 20}" height="${bh}" class="v-outline" rx="4"/>`;
    });
    return svg(W, 20 + bars.length * (bh + gap) - gap, b, 'fraction bars');
  },

  circle({ parts, shaded }) {
    const r = 62, cx = 72, cy = 72;
    let b = '';
    for (let i = 0; i < parts; i++) {
      const a0 = (i / parts) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / parts) * Math.PI * 2 - Math.PI / 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      b += `<path d="M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z" class="${i < shaded ? 'v-fill' : 'v-empty'} v-edge"/>`;
    }
    return svg(144, 144, b, `circle with ${shaded} of ${parts} parts shaded`);
  },

  area({ rows, cols }) {
    const W = 360, H = 190, left = 56, top = 34;
    const sumC = cols.reduce((a, b) => a + b, 0), sumR = rows.reduce((a, b) => a + b, 0);
    const cw = cols.map((c) => Math.max(70, ((W - left - 10) * c) / sumC));
    const scaleC = (W - left - 10) / cw.reduce((a, b) => a + b, 0);
    const rh = rows.map((r) => Math.max(46, ((H - top - 10) * r) / sumR));
    const scaleR = (H - top - 10) / rh.reduce((a, b) => a + b, 0);
    let b = '', x = left;
    cols.forEach((c, i) => {
      const w = cw[i] * scaleC;
      b += t(x + w / 2, top - 14, fmtInt(c), 'v-t v-strong');
      let y = top;
      rows.forEach((r, j) => {
        const h = rh[j] * scaleR;
        b += `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${(i + j) % 2 ? 'v-fill2 v-soft' : 'v-fill v-soft'} v-edge"/>`;
        b += t(x + w / 2, y + h / 2, `${fmtInt(r)} × ${fmtInt(c)}`, 'v-t', 'middle', 14);
        if (i === 0) b += t(left - 10, y + h / 2, fmtInt(r), 'v-t v-strong', 'end');
        y += h;
      });
      x += w;
    });
    return svg(W, H, b, 'area model');
  },

  rect({ w, h, unit, grid }) {
    const maxW = 300, maxH = 170;
    const hv = typeof h === 'number' ? h : Math.max(2, Math.round(w * 0.6));
    const s = Math.min(maxW / w, maxH / hv);
    const W = w * s, H = hv * s, x0 = 20, y0 = 16;
    let b = `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" class="v-fill v-soft v-edge"/>`;
    if (grid && w <= 15 && hv <= 12) {
      for (let i = 1; i < w; i++) b += `<line x1="${x0 + i * s}" y1="${y0}" x2="${x0 + i * s}" y2="${y0 + H}" class="v-gridline"/>`;
      for (let j = 1; j < hv; j++) b += `<line x1="${x0}" y1="${y0 + j * s}" x2="${x0 + W}" y2="${y0 + j * s}" class="v-gridline"/>`;
    }
    b += t(x0 + W / 2, y0 + H + 18, `${w} ${unit}`, 'v-t v-strong');
    b += t(x0 + W + 10, y0 + H / 2, `${h} ${typeof h === 'number' ? unit : ''}`.trim(), 'v-t v-strong', 'start');
    return svg(x0 + W + 80, y0 + H + 36, b, `rectangle ${w} by ${h} ${unit}`);
  },

  lshape({ W, H, cw, ch, unit }) {
    const s = Math.min(280 / W, 170 / H);
    const x0 = 40, y0 = 20, w = W * s, h = H * s, a = cw * s, c = ch * s;
    const pts = [[x0, y0], [x0 + w - a, y0], [x0 + w - a, y0 + c], [x0 + w, y0 + c], [x0 + w, y0 + h], [x0, y0 + h]];
    let b = `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" class="v-fill v-soft v-edge"/>`;
    b += `<rect x="${x0 + w - a}" y="${y0}" width="${a}" height="${c}" class="v-cut"/>`;
    b += t(x0 + w / 2, y0 + h + 18, `${W} ${unit}`, 'v-t v-strong');
    b += t(x0 - 8, y0 + h / 2, `${H} ${unit}`, 'v-t v-strong', 'end');
    b += t(x0 + w - a / 2, y0 - 10, `${cw}`, 'v-t2', 'middle', 13);
    b += t(x0 + w + 8, y0 + c / 2, `${ch}`, 'v-t2', 'start', 13);
    return svg(x0 + w + 60, y0 + h + 36, b, 'shape with a corner cut out');
  },

  angle({ deg, split, labelA, labelB }) {
    const W = 300, H = deg > 90 ? 170 : 190, cx = deg >= 180 ? 150 : 70, cy = H - 30, r = 120;
    const ray = (a) => [cx + r * Math.cos((-a * Math.PI) / 180), cy + r * Math.sin((-a * Math.PI) / 180)];
    const arc = (a0, a1, rr, cls) => {
      const p0 = [cx + rr * Math.cos((-a0 * Math.PI) / 180), cy + rr * Math.sin((-a0 * Math.PI) / 180)];
      const p1 = [cx + rr * Math.cos((-a1 * Math.PI) / 180), cy + rr * Math.sin((-a1 * Math.PI) / 180)];
      return `<path d="M${p0} A${rr},${rr} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${p1}" class="${cls}"/>`;
    };
    let b = '';
    const e0 = ray(0), e1 = ray(deg);
    b += `<line x1="${cx}" y1="${cy}" x2="${e0[0]}" y2="${e0[1]}" class="v-ray"/>`;
    b += `<line x1="${cx}" y1="${cy}" x2="${e1[0]}" y2="${e1[1]}" class="v-ray"/>`;
    if (split !== undefined) {
      const m = ray(split);
      b += `<line x1="${cx}" y1="${cy}" x2="${m[0]}" y2="${m[1]}" class="v-ray v-ray2"/>`;
      b += arc(0, split, 42, 'v-arc');
      b += arc(split, deg, 58, 'v-arc2');
      const la = ray(split / 2), lb = ray((split + deg) / 2);
      b += t(cx + (la[0] - cx) * 0.6, cy + (la[1] - cy) * 0.6, labelA, 'v-t v-strong', 'middle', 15);
      b += t(cx + (lb[0] - cx) * 0.78, cy + (lb[1] - cy) * 0.78, labelB, 'v-t v-strong', 'middle', 15);
    } else if (deg === 90) {
      b += `<path d="M${cx + 22},${cy} L${cx + 22},${cy - 22} L${cx},${cy - 22}" class="v-arc"/>`;
    } else {
      b += arc(0, deg, 34, 'v-arc');
    }
    b += `<circle cx="${cx}" cy="${cy}" r="5" class="v-dot"/>`;
    return svg(W, H, b, `angle of ${deg} degrees`);
  },

  box3d({ l, w, h, unit, cubes }) {
    const hv = typeof h === 'number' ? h : 3;
    const s = Math.min(26, 190 / (l + w * 0.5), 150 / (hv + w * 0.5));
    const dx = w * s * 0.55, dy = w * s * 0.4;
    const x0 = 30, y0 = 20 + dy, L = l * s, Hh = hv * s;
    const front = [[x0, y0], [x0 + L, y0], [x0 + L, y0 + Hh], [x0, y0 + Hh]];
    const top = [[x0, y0], [x0 + dx, y0 - dy], [x0 + L + dx, y0 - dy], [x0 + L, y0]];
    const side = [[x0 + L, y0], [x0 + L + dx, y0 - dy], [x0 + L + dx, y0 - dy + Hh], [x0 + L, y0 + Hh]];
    const poly = (p, cls) => `<polygon points="${p.map((q) => q.join(',')).join(' ')}" class="${cls}"/>`;
    let b = poly(front, 'v-fill v-soft v-edge') + poly(top, 'v-top v-edge') + poly(side, 'v-side v-edge');
    if (cubes && typeof h === 'number') {
      for (let i = 1; i < l; i++) b += `<line x1="${x0 + i * s}" y1="${y0}" x2="${x0 + i * s}" y2="${y0 + Hh}" class="v-gridline"/><line x1="${x0 + i * s}" y1="${y0}" x2="${x0 + i * s + dx}" y2="${y0 - dy}" class="v-gridline"/>`;
      for (let j = 1; j < hv; j++) b += `<line x1="${x0}" y1="${y0 + j * s}" x2="${x0 + L}" y2="${y0 + j * s}" class="v-gridline"/><line x1="${x0 + L}" y1="${y0 + j * s}" x2="${x0 + L + dx}" y2="${y0 + j * s - dy}" class="v-gridline"/>`;
      for (let k = 1; k < w; k++) {
        const fx = (k / w) * dx, fy = (k / w) * dy;
        b += `<line x1="${x0 + fx}" y1="${y0 - fy}" x2="${x0 + L + fx}" y2="${y0 - fy}" class="v-gridline"/><line x1="${x0 + L + fx}" y1="${y0 - fy}" x2="${x0 + L + fx}" y2="${y0 - fy + Hh}" class="v-gridline"/>`;
      }
    }
    b += t(x0 + L / 2, y0 + Hh + 18, `${l} ${unit}`, 'v-t v-strong');
    b += t(x0 + L + dx / 2 + 16, y0 + Hh - dy / 2 + 12, `${w} ${unit}`, 'v-t v-strong', 'start');
    b += t(x0 + L + dx + 10, y0 - dy + Hh / 2, `${h} ${typeof h === 'number' ? unit : ''}`.trim(), 'v-t v-strong', 'start');
    return svg(x0 + L + dx + 80, y0 + Hh + 36, b, `box ${l} by ${w} by ${h} ${unit}`);
  },

  grid({ lo, hi, points }) {
    const n = hi - lo, s = Math.min(30, 300 / n), pad = 30;
    const W = pad * 2 + n * s, H = W;
    const X = (v) => pad + (v - lo) * s, Y = (v) => pad + (hi - v) * s;
    let b = '';
    for (let v = lo; v <= hi; v++) {
      b += `<line x1="${X(v)}" y1="${Y(lo)}" x2="${X(v)}" y2="${Y(hi)}" class="v-gridline"/>`;
      b += `<line x1="${X(lo)}" y1="${Y(v)}" x2="${X(hi)}" y2="${Y(v)}" class="v-gridline"/>`;
    }
    const ax = lo < 0 ? 0 : lo;
    b += `<line x1="${X(lo)}" y1="${Y(ax)}" x2="${X(hi)}" y2="${Y(ax)}" class="v-axis"/><line x1="${X(ax)}" y1="${Y(lo)}" x2="${X(ax)}" y2="${Y(hi)}" class="v-axis"/>`;
    for (let v = lo; v <= hi; v++) {
      if (v === ax && lo < 0) continue;
      b += t(X(v), Y(ax) + 14, minus(v), 'v-t2', 'middle', 11);
      if (v !== ax) b += t(X(ax) - 8, Y(v), minus(v), 'v-t2', 'end', 11);
    }
    b += t(X(hi) + 12, Y(ax), 'x', 'v-t v-strong', 'middle', 14) + t(X(ax), Y(hi) - 14, 'y', 'v-t v-strong', 'middle', 14);
    for (const p of points) b += icon(p.icon, X(p.x), Y(p.y), s * 0.42);
    return svg(W + 16, H, b, 'coordinate grid');
  },

  triangle({ shape, b: base, h, unit }) {
    const s = Math.min(260 / (base + (shape === 'para' ? 3 : 0)), 150 / h);
    const x0 = 24, y0 = 16 + h * s, B = base * s, Hh = h * s;
    const off = shape === 'para' ? Math.min(3 * s, B * 0.35) : B * 0.35;
    let body;
    if (shape === 'para') {
      body = `<polygon points="${x0},${y0} ${x0 + B},${y0} ${x0 + B + off},${y0 - Hh} ${x0 + off},${y0 - Hh}" class="v-fill v-soft v-edge"/>`;
    } else {
      body = `<polygon points="${x0},${y0} ${x0 + B},${y0} ${x0 + off},${y0 - Hh}" class="v-fill v-soft v-edge"/>`;
    }
    body += `<line x1="${x0 + off}" y1="${y0}" x2="${x0 + off}" y2="${y0 - Hh}" class="v-dash"/>`;
    body += `<path d="M${x0 + off + 10},${y0} L${x0 + off + 10},${y0 - 10} L${x0 + off},${y0 - 10}" class="v-arc"/>`;
    body += t(x0 + B / 2, y0 + 18, `${base} ${unit}`, 'v-t v-strong');
    body += t(x0 + off + 8, y0 - Hh / 2, `${h} ${unit}`, 'v-t v-strong', 'start');
    return svg(x0 + B + off + 70, y0 + 36, body, `${shape === 'para' ? 'parallelogram' : 'triangle'} base ${base} height ${h}`);
  },

  numline({ min, max, marks = [], places = 0, step }) {
    const W = 380, x0 = 26, x1 = W - 26, y = 62;
    const X = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0);
    let b = `<line x1="${x0 - 10}" y1="${y}" x2="${x1 + 10}" y2="${y}" class="v-axis"/>`;
    const st = step ?? (max - min) / 10;
    const n = Math.round((max - min) / st);
    for (let i = 0; i <= n; i++) {
      const v = min + i * st;
      const major = i === 0 || i === n || (step ? v % (st * 2) === 0 || n <= 10 : false);
      b += `<line x1="${X(v)}" y1="${y - (major ? 9 : 5)}" x2="${X(v)}" y2="${y + (major ? 9 : 5)}" class="v-tick"/>`;
      if (major || i === 0 || i === n) b += t(X(v), y + 24, minus(Number(v.toFixed(places + 1))), 'v-t2', 'middle', 12);
    }
    for (const m of marks) {
      b += `<circle cx="${X(m.v)}" cy="${y}" r="7" class="v-mark"/>`;
      b += t(X(m.v), y - 22, m.label, 'v-t v-strong', 'middle', 15);
    }
    return svg(W, 100, b, 'number line');
  },

  placeValue({ digits, whole, highlight }) {
    const names = [];
    for (let i = 0; i < digits.length; i++) {
      const p = whole - 1 - i;
      names.push(['ones', 'tens', 'hundreds', 'thousands', 'ten thou.', 'hundred thou.'][p] ?? ['tenths', 'hundredths', 'thousandths'][-p - 1]);
    }
    const cw = Math.min(74, 380 / (digits.length + 0.5));
    let b = '', x = 8;
    digits.forEach((d, i) => {
      if (i === whole) { b += t(x + 6, 62, '.', 'v-t v-strong', 'middle', 34); x += 14; }
      b += `<rect x="${x}" y="8" width="${cw - 4}" height="28" class="v-head"/>`;
      b += t(x + (cw - 4) / 2, 22, names[i], 'v-t2', 'middle', 10.5);
      b += `<rect x="${x}" y="40" width="${cw - 4}" height="44" class="${i === highlight ? 'v-fill v-edge' : 'v-empty v-edge'}"/>`;
      b += t(x + (cw - 4) / 2, 63, d, 'v-t v-strong', 'middle', 24);
      x += cw;
    });
    return svg(x + 8, 92, b, 'place value chart');
  },

  column({ rows, op }) {
    const w = Math.max(...rows.map((r) => r.length)) * 17 + 50;
    let b = '';
    rows.forEach((r, i) => {
      b += t(w - 12, 22 + i * 30, r, 'v-t v-mono', 'end', 24);
    });
    b += t(14, 22 + (rows.length - 1) * 30, op, 'v-t v-strong', 'start', 24);
    b += `<line x1="10" y1="${10 + rows.length * 30}" x2="${w - 6}" y2="${10 + rows.length * 30}" class="v-axis"/>`;
    b += t(w - 12, 28 + rows.length * 30, '?', 'v-t2 v-mono', 'end', 24);
    return svg(w, 50 + rows.length * 30, b, 'numbers lined up in columns');
  },

  barchart({ labels, values, scale, title }) {
    const W = 380, H = 230, left = 44, bottom = 34, top = 30;
    const maxV = Math.ceil(Math.max(...values) / scale) * scale + scale;
    const Y = (v) => H - bottom - ((H - bottom - top) * v) / maxV;
    const bw = (W - left - 10) / labels.length;
    let b = t(W / 2, 14, title, 'v-t v-strong', 'middle', 14);
    for (let v = 0; v <= maxV; v += scale) {
      b += `<line x1="${left}" y1="${Y(v)}" x2="${W - 6}" y2="${Y(v)}" class="v-gridline"/>`;
      if ((v / scale) % (maxV / scale > 12 ? 2 : 1) === 0) b += t(left - 8, Y(v), String(v), 'v-t2', 'end', 11);
    }
    labels.forEach((lab, i) => {
      const x = left + i * bw + bw * 0.18;
      b += `<rect x="${x}" y="${Y(values[i])}" width="${bw * 0.64}" height="${Y(0) - Y(values[i])}" class="${i % 2 ? 'v-fill2' : 'v-fill'}" rx="3"/>`;
      b += t(x + bw * 0.32, H - bottom + 16, lab, 'v-t2', 'middle', 12);
    });
    b += `<line x1="${left}" y1="${Y(0)}" x2="${W - 6}" y2="${Y(0)}" class="v-axis"/>`;
    return svg(W, H, b, title);
  },

  lineplot({ den, min, max, counts, title }) {
    const W = 380, x0 = 24, x1 = W - 24, base = 170;
    const X = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0);
    const tallest = Math.max(1, ...counts.map((c) => c.n));
    const step = Math.min(24, 110 / tallest);
    let b = t(W / 2, 14, title, 'v-t v-strong', 'middle', 14);
    b += `<line x1="${x0 - 8}" y1="${base}" x2="${x1 + 8}" y2="${base}" class="v-axis"/>`;
    for (let k = 0; k <= (max - min) * den; k++) {
      const v = min + k / den;
      const labelIt = den <= 4 || k % (den / 2) === 0;
      b += `<line x1="${X(v)}" y1="${base - 6}" x2="${X(v)}" y2="${base + 6}" class="v-tick"/>`;
      if (labelIt) b += t(X(v), base + 20, fracText(new Frac(min * den + k, den)), 'v-t2', 'middle', 11.5);
    }
    for (const c of counts) for (let i = 0; i < c.n; i++) b += t(X(c.v), base - 14 - i * step, '×', 'v-t v-strong', 'middle', 20);
    return svg(W, 200, b, title);
  },

  ratioTable({ a, b: bb, k, A, B, hideA, hideB }) {
    const cols = k <= 4 ? Array.from({ length: k }, (_, i) => i + 1) : [1, 2, 3, k];
    const cw = 64, left = 118;
    let s = '';
    const rows = [[A, a, hideA], [B, bb, hideB]];
    rows.forEach(([name, v, hide], r) => {
      const y = 12 + r * 44;
      s += `<rect x="6" y="${y}" width="${left - 12}" height="38" class="v-head"/>`;
      s += t(left / 2, y + 19, name, 'v-t2', 'middle', 13);
      cols.forEach((c, i) => {
        const x = left + i * cw;
        const last = i === cols.length - 1;
        s += `<rect x="${x}" y="${y}" width="${cw - 6}" height="38" class="${last ? 'v-fill v-edge' : 'v-empty v-edge'}"/>`;
        s += t(x + (cw - 6) / 2, y + 20, last && hide ? '?' : String(v * c), 'v-t v-strong', 'middle', 17);
        if (k > 4 && i === 2) s += t(x + cw - 3, y + 20, '…', 'v-t2', 'middle', 14);
      });
    });
    return svg(left + cols.length * cw + 10, 106, s, 'ratio table');
  },

  // Tape (bar) diagram: each row is a strip of segments sized by value, with an optional total bracket.
  // rows: [{ segs: [{ v, label, alt?, unknown? }], total?, totalLabel? }]
  tape({ rows }) {
    const W = 380, x0 = 12, x1 = W - 12, rowH = 40, gap = 34;
    const maxSum = Math.max(...rows.map((r) => r.segs.reduce((a, s) => a + s.v, 0)));
    let b = '', y = 24;
    for (const row of rows) {
      const sum = row.segs.reduce((a, s) => a + s.v, 0);
      const span = ((x1 - x0) * sum) / maxSum;
      let x = x0;
      for (const s of row.segs) {
        const w = Math.max(28, (span * s.v) / sum);
        b += `<rect x="${x}" y="${y}" width="${w}" height="${rowH}" class="${s.unknown ? 'v-empty' : s.alt ? 'v-fill2 v-soft' : 'v-fill v-soft'} v-edge" rx="3"/>`;
        if (s.label) b += t(x + w / 2, y + rowH / 2, s.label, s.unknown ? 'v-t v-strong' : 'v-t', 'middle', s.label.length > 6 ? 12 : 15);
        x += w;
      }
      if (row.totalLabel) {
        const ty = y - 8;
        b += `<path d="M${x0},${ty + 6} L${x0},${ty} L${x},${ty} L${x},${ty + 6}" class="v-arc"/>`;
        b += t((x0 + x) / 2, ty - 10, row.totalLabel, 'v-t v-strong', 'middle', 14);
      }
      y += rowH + gap;
    }
    return svg(W, y - gap + 12, b, 'tape diagram');
  },

  // A 10 by 10 grid: whole tenths shade as full columns, extra hundredths as single squares.
  hundred({ tenths = 0, hundredths = 0 }) {
    const S = 17, x0 = 8, y0 = 8;
    let b = '';
    for (let c = 0; c < 10; c++) for (let r = 0; r < 10; r++) {
      const k = c * 10 + r;
      const cls = c < tenths ? 'v-fill' : k < tenths * 10 + hundredths ? 'v-fill2' : 'v-empty';
      b += `<rect x="${x0 + c * S}" y="${y0 + r * S}" width="${S}" height="${S}" class="${cls} v-edge"/>`;
    }
    return svg(S * 10 + 16, S * 10 + 16, b, `${tenths} tenths and ${hundredths} hundredths shaded`);
  },

  // A protractor with both scales. The angle's first ray lies along the baseline on the `from` side.
  protractor({ deg, from = 'right' }) {
    const W = 360, cx = 180, cy = 176, r = 150;
    const P = (a, rr) => [cx + rr * Math.cos((a * Math.PI) / 180), cy - rr * Math.sin((a * Math.PI) / 180)];
    let b = `<path d="M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy} Z" class="v-empty v-edge"/>`;
    for (let a = 0; a <= 180; a += 5) {
      const major = a % 10 === 0;
      const [ax, ay] = P(a, r), [bx, by] = P(a, r - (major ? 13 : 7));
      b += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" class="v-tick"/>`;
      if (a % 20 === 0) {
        const [ox, oy] = P(a, r - 24), [ix, iy] = P(a, r - 44);
        b += t(ox, oy, String(180 - a), 'v-t2', 'middle', 10.5);
        b += t(ix, iy, String(a), 'v-t2 v-strong', 'middle', 10.5);
      }
    }
    b += `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" class="v-axis"/>`;
    const start = from === 'right' ? 0 : 180;
    const end = from === 'right' ? deg : 180 - deg;
    for (const a of [start, end]) {
      const [x, y] = P(a, r + 10);
      b += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="v-ray"/>`;
    }
    const lo = Math.min(start, end), hi = Math.max(start, end);
    const [p0x, p0y] = P(lo, 34), [p1x, p1y] = P(hi, 34);
    b += `<path d="M${p0x},${p0y} A34,34 0 0 0 ${p1x},${p1y}" class="v-arc"/>`;
    b += `<circle cx="${cx}" cy="${cy}" r="4" class="v-dot"/>`;
    return svg(W, cy + 14, b, 'protractor');
  },

  // A polygon from SHAPES with right-angle marks, equal-side ticks and an optional dashed line.
  shape({ name, line }) {
    const pts = SHAPES[name];
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const s = Math.min(230 / (maxX - minX), 160 / (maxY - minY));
    const pad = 30;
    const X = (x) => pad + (x - minX) * s, Y = (y) => pad + (maxY - y) * s;
    const W = pad * 2 + (maxX - minX) * s, H = pad * 2 + (maxY - minY) * s;
    let b = `<polygon points="${pts.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')}" class="v-fill v-soft v-edge"/>`;
    const n = pts.length;
    const len = pts.map((p, i) => Math.hypot(pts[(i + 1) % n][0] - p[0], pts[(i + 1) % n][1] - p[1]));
    const groups = [];
    len.forEach((l, i) => { const g = groups.find((q) => Math.abs(q.l - l) < 1e-3); if (g) g.sides.push(i); else groups.push({ l, sides: [i] }); });
    let mark = 0;
    for (const g of groups) {
      if (g.sides.length < 2 || g.sides.length === n && n > 4) continue;
      mark += 1;
      for (const i of g.sides) {
        const a = pts[i], c = pts[(i + 1) % n];
        const mx = X((a[0] + c[0]) / 2), my = Y((a[1] + c[1]) / 2);
        const dx = X(c[0]) - X(a[0]), dy = Y(c[1]) - Y(a[1]), L = Math.hypot(dx, dy);
        const nx = -dy / L, ny = dx / L, ux = dx / L, uy = dy / L;
        for (let k = 0; k < mark; k++) {
          const o = (k - (mark - 1) / 2) * 5;
          b += `<line x1="${mx + ux * o - nx * 6}" y1="${my + uy * o - ny * 6}" x2="${mx + ux * o + nx * 6}" y2="${my + uy * o + ny * 6}" class="v-tick"/>`;
        }
      }
    }
    pts.forEach((p, i) => {
      const a = pts[(i + n - 1) % n], c = pts[(i + 1) % n];
      const ux = a[0] - p[0], uy = a[1] - p[1], vx = c[0] - p[0], vy = c[1] - p[1];
      if (Math.abs(ux * vx + uy * vy) > 1e-6 * Math.hypot(ux, uy) * Math.hypot(vx, vy) * 1e3) return;
      const k = 12 / s, lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
      const q1 = [p[0] + (ux / lu) * k, p[1] + (uy / lu) * k], q3 = [p[0] + (vx / lv) * k, p[1] + (vy / lv) * k];
      const q2 = [q1[0] + (vx / lv) * k, q1[1] + (vy / lv) * k];
      b += `<path d="M${X(q1[0])},${Y(q1[1])} L${X(q2[0])},${Y(q2[1])} L${X(q3[0])},${Y(q3[1])}" class="v-arc"/>`;
    });
    if (line) {
      const [[ax, ay], [cx2, cy2]] = line;
      const ex = cx2 - ax, ey = cy2 - ay, el = Math.hypot(ex, ey), ext = 0.18 * Math.max(maxX - minX, maxY - minY);
      b += `<line x1="${X(ax - (ex / el) * ext)}" y1="${Y(ay - (ey / el) * ext)}" x2="${X(cx2 + (ex / el) * ext)}" y2="${Y(cy2 + (ey / el) * ext)}" class="v-dash v-symline"/>`;
    }
    return svg(W, H, b, name);
  },

  fracgrid({ rows, cols, rowsShaded, colsShaded }) {
    const S = 170, x0 = 10, y0 = 10, ch = S / rows, cw = S / cols;
    let b = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const inR = r < rowsShaded, inC = c < colsShaded;
      const cls = inR && inC ? 'v-fill' : inR ? 'v-fill2 v-soft' : inC ? 'v-top' : 'v-empty';
      b += `<rect x="${x0 + c * cw}" y="${y0 + r * ch}" width="${cw}" height="${ch}" class="${cls} v-edge"/>`;
    }
    return svg(S + 20, S + 20, b, 'fraction multiplication grid');
  },
};

// Shapes for the geometry skills, in units (y up). Right angles and equal sides are found from the points.
const hex = Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3), Math.sin((i * Math.PI) / 3)]);
const pent = Array.from({ length: 5 }, (_, i) => [Math.cos(Math.PI / 2 + (i * 2 * Math.PI) / 5), Math.sin(Math.PI / 2 + (i * 2 * Math.PI) / 5)]);
export const SHAPES = {
  square: [[0, 0], [1, 0], [1, 1], [0, 1]],
  rectangle: [[0, 0], [1.7, 0], [1.7, 1], [0, 1]],
  rhombus: [[0.8, 0], [1.6, 0.6], [0.8, 1.2], [0, 0.6]],
  parallelogram: [[0, 0], [1.3, 0], [1.8, 0.9], [0.5, 0.9]],
  trapezoid: [[0, 0], [1.8, 0], [1.35, 0.9], [0.45, 0.9]],
  rightTrapezoid: [[0, 0], [1.6, 0], [1.0, 0.9], [0, 0.9]],
  kite: [[0.6, 0], [1.2, 1.0], [0.6, 1.5], [0, 1.0]],
  equilateral: [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]],
  isosceles: [[0, 0], [1, 0], [0.5, 1.25]],
  scalene: [[0, 0], [1.4, 0], [0.3, 0.8]],
  rightTriangle: [[0, 0], [1.3, 0], [0, 0.9]],
  obtuseTriangle: [[0, 0], [1.6, 0], [-0.45, 0.6]],
  acuteTriangle: [[0, 0], [1.2, 0], [0.5, 1.0]],
  hexagon: hex,
  pentagon: pent,
};

function icon(kind, x, y, s) {
  switch (kind) {
    case 'fish':
      return `<g class="v-icon-fish"><ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.6}"/><polygon points="${x - s * 0.8},${y} ${x - s * 1.5},${y - s * 0.6} ${x - s * 1.5},${y + s * 0.6}"/></g>`;
    case 'star': {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.45 : s * 1.05, a = (i * Math.PI) / 5 - Math.PI / 2;
        pts.push(`${x + r * Math.cos(a)},${y + r * Math.sin(a)}`);
      }
      return `<polygon points="${pts.join(' ')}" class="v-icon-star"/>`;
    }
    case 'igloo':
      return `<path d="M${x - s},${y + s * 0.5} A${s},${s} 0 0 1 ${x + s},${y + s * 0.5} Z" class="v-icon-igloo"/>`;
    default:
      return `<polygon points="${x},${y - s * 1.1} ${x + s * 0.6},${y} ${x},${y + s * 1.1} ${x - s * 0.6},${y}" class="v-icon-crystal"/>`;
  }
}

export function renderVisual(v) {
  if (!v || !R[v.kind]) return '';
  try { return R[v.kind](v); } catch (e) { console.warn('visual failed', v, e); return ''; }
}

export { fmtNum };
