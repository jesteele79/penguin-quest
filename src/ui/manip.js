// Hands-on models for lessons (the "concrete" step): the child changes the model until it matches a goal.
// Every model: new Model(host, cfg, onChange) renders into host; `.done` says the goal is met; `.solve()`
// shows the answer (the "Show me" button); `.describe()` says what the model shows now, for read-aloud.
import { el } from './dom.js';
import { renderVisual } from '../math/visuals.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};
const svgRoot = (w, h, label) => svgEl('svg', { class: 'vis manip-svg', viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label });
const txt = (x, y, s, cls = 'v-t', size = 16, anchor = 'middle') => {
  const t = svgEl('text', { x, y, class: cls, 'font-size': size, 'text-anchor': anchor, 'dominant-baseline': 'middle' });
  t.textContent = s;
  return t;
};
// Pointer position in SVG units.
function svgPoint(svg, e) {
  const p = svg.createSVGPoint();
  p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const fracLabel = (n, d) => `${n}/${d}`;

class Model {
  constructor(host, cfg, onChange) {
    this.host = host; this.cfg = cfg; this.onChange = onChange;
    this.root = el('div', { class: `manip ${this.constructor.kind ?? ''}` });
    host.append(this.root);
  }

  changed() { this.render(); this.onChange?.(this); }

  destroy() { this.root.remove(); }
}

// ------------------------------------------------------------ fraction strips
// rows: [{ parts, filled, fixed, wholes = 1, name }]; goal(values) -> bool, values are fractions as [n, d].
export class Strips extends Model {
  static kind = 'strips';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.rows = cfg.rows.map((r) => ({ wholes: 1, filled: 0, ...r }));
    this.render();
  }

  get values() { return this.rows.map((r) => [r.filled, r.parts]); }

  get done() { return this.cfg.goal(this.values); }

  solve() { this.cfg.solution?.(this.rows); this.changed(); }

  describe() { return this.rows.map((r) => `${r.name ? `${r.name}: ` : ''}${r.filled} of ${r.parts} parts${r.wholes > 1 ? ' in each whole' : ''} shaded`).join('. '); }

  render() {
    const W = 560, left = 10, labelW = 96, rowH = 46, gap = 20, top = this.rows.some((r) => r.name) ? 20 : 4;
    const maxWholes = Math.max(...this.rows.map((r) => r.wholes));
    const unit = (W - left - labelW - 12 - (maxWholes - 1) * 10) / maxWholes;
    const svg = svgRoot(W, this.rows.length * (rowH + gap) + top, 'fraction strips');
    this.rows.forEach((r, ri) => {
      const y = top + ri * (rowH + gap);
      for (let w = 0; w < r.wholes; w++) {
        const x0 = left + w * (unit + 10);
        const segW = unit / r.parts;
        for (let i = 0; i < r.parts; i++) {
          const k = w * r.parts + i;
          const on = k < r.filled;
          const seg = svgEl('rect', {
            x: x0 + i * segW, y, width: segW, height: rowH, rx: 3,
            class: `${on ? (r.fixed ? 'v-fill2' : 'v-fill') : 'v-empty'} v-edge ${r.fixed ? '' : 'tap'}`,
          });
          if (!r.fixed) {
            seg.addEventListener('pointerdown', (e) => {
              e.preventDefault();
              r.filled = r.filled === k + 1 ? k : k + 1;
              this.changed();
            });
          }
          svg.append(seg);
        }
        svg.append(svgEl('rect', { x: x0, y, width: unit, height: rowH, rx: 4, class: 'v-outline' }));
      }
      svg.append(txt(W - labelW / 2, y + rowH / 2, fracLabel(r.filled, r.parts), 'v-t v-strong', 22));
      if (r.name) svg.append(txt(left + 4, y - 9, r.name, 'v-t2', 13, 'start'));
    });
    this.root.replaceChildren(svg);
  }
}

// ------------------------------------------------------------ hundred grid
// Tap a square to shade up to it (columns are tenths). cfg: { target, show: 'decimal' | 'fraction' }
export class Hundred extends Model {
  static kind = 'hundred';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.shaded = cfg.start ?? 0;
    this.render();
  }

  get done() { return this.shaded === this.cfg.target; }

  solve() { this.shaded = this.cfg.target; this.changed(); }

  describe() { return `${this.shaded} hundredths are shaded.`; }

  render() {
    const S = 30, x0 = 8, y0 = 8;
    const svg = svgRoot(S * 10 + 16, S * 10 + 16, 'hundred grid');
    svg.style.maxWidth = 'min(340px, 42vh)';
    for (let c = 0; c < 10; c++) {
      for (let r = 0; r < 10; r++) {
        const k = c * 10 + r;
        const cell = svgEl('rect', { x: x0 + c * S, y: y0 + r * S, width: S, height: S, class: `${k < this.shaded ? (Math.floor(k / 10) < Math.floor(this.shaded / 10) ? 'v-fill' : 'v-fill2') : 'v-empty'} v-edge tap` });
        cell.addEventListener('pointerdown', (e) => { e.preventDefault(); this.shaded = this.shaded === k + 1 ? k : k + 1; this.changed(); });
        svg.append(cell);
      }
    }
    const t = Math.floor(this.shaded / 10), h = this.shaded % 10;
    const dec = (this.shaded / 100).toFixed(2);
    const readout = el('div', { class: 'manip-readout', html: `<b>${this.shaded}</b> hundredths = <b>${t}</b> tenths and <b>${h}</b> hundredths = <b>${dec}</b>` });
    this.root.replaceChildren(svg, readout);
  }
}

// ------------------------------------------------------------ number line
// Drag the marker (it snaps to ticks). cfg: { min, max, den, target: [n, d], marks: [{ n, d, label }], decimal }
export class NumberLine extends Model {
  static kind = 'numberline';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.k = cfg.start ?? 0;
    this.render();
  }

  get base() { return Math.round(this.cfg.min * this.cfg.den); }

  get ticks() { return Math.round((this.cfg.max - this.cfg.min) * this.cfg.den); }

  get value() { return [this.base + this.k, this.cfg.den]; }

  get done() { const [n, d] = this.value; const [tn, td] = this.cfg.target; return n * td === tn * d; }

  solve() { const [tn, td] = this.cfg.target; this.k = Math.round((tn * this.cfg.den) / td) - this.base; this.changed(); }

  label(n, d) {
    if (this.cfg.decimal) return (n / d).toFixed(this.cfg.places ?? String(d).length - 1);
    if (n % d === 0) return String(n / d);
    return fracLabel(n, d);
  }

  describe() { const [n, d] = this.value; return `The marker is at ${this.label(n, d)}.`; }

  render() {
    const W = 580, x0 = 34, x1 = W - 34, y = 92;
    const n = this.ticks;
    const X = (k) => x0 + ((x1 - x0) * k) / n;
    const svg = svgRoot(W, 150, 'number line');
    svg.append(svgEl('line', { x1: x0 - 12, y1: y, x2: x1 + 12, y2: y, class: 'v-axis' }));
    for (let k = 0; k <= n; k++) {
      const whole = k % this.cfg.den === 0;
      svg.append(svgEl('line', { x1: X(k), y1: y - (whole ? 13 : 8), x2: X(k), y2: y + (whole ? 13 : 8), class: 'v-tick' }));
      const major = whole || (this.cfg.major && k % this.cfg.major === 0);
      if (major || this.cfg.labelAll) svg.append(txt(X(k), y + 32, this.label(this.base + k, this.cfg.den), major ? 'v-t v-strong' : 'v-t2', major ? 17 : 13));
    }
    for (const m of this.cfg.marks ?? []) {
      const km = Math.round((m.n * this.cfg.den) / m.d) - this.base;
      svg.append(svgEl('circle', { cx: X(km), cy: y, r: 7, class: 'v-fill2' }));
      svg.append(txt(X(km), y + 52, m.label, 'v-t2 v-strong', 14));
    }
    const mx = X(this.k);
    const marker = svgEl('g', { class: 'tap drag' });
    marker.append(svgEl('path', { d: `M${mx},${y - 8} l-14,-26 h28 z`, class: 'v-mark' }));
    marker.append(txt(mx, y - 52, this.label(...this.value), 'v-t v-strong', 20));
    svg.append(marker);
    const hit = svgEl('rect', { x: 0, y: 0, width: W, height: 150, fill: 'transparent', class: 'tap' });
    let dragging = false;
    const move = (e) => {
      const p = svgPoint(svg, e);
      const k = Math.round(((p.x - x0) / (x1 - x0)) * n);
      const kk = Math.max(0, Math.min(n, k));
      if (kk !== this.k) { this.k = kk; this.changed(); }
    };
    hit.addEventListener('pointerdown', (e) => { dragging = true; hit.setPointerCapture?.(e.pointerId); move(e); e.preventDefault(); });
    hit.addEventListener('pointermove', (e) => { if (dragging) move(e); });
    hit.addEventListener('pointerup', () => { dragging = false; });
    svg.insertBefore(hit, svg.firstChild);
    // Keyboard: arrows move the marker.
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        this.k = Math.max(0, Math.min(n, this.k + (e.key === 'ArrowRight' ? 1 : -1)));
        this.changed();
        e.preventDefault();
        e.stopPropagation();
      }
    });
    this.root.replaceChildren(svg);
  }
}

// ------------------------------------------------------------ area model
// Fill in each partial product, then the total. cfg: { a: [20, 3], b: [10, 4] }
export class AreaModel extends Model {
  static kind = 'area';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.vals = {};
    this.render();
  }

  get cells() { return this.cfg.a.flatMap((x, i) => this.cfg.b.map((y, j) => ({ key: `${i}-${j}`, x, y, v: x * y }))); }

  get total() { return this.cfg.a.reduce((s, x) => s + x, 0) * this.cfg.b.reduce((s, y) => s + y, 0); }

  get done() { return this.cells.every((c) => Number(this.vals[c.key]) === c.v) && Number(this.vals.total) === this.total; }

  solve() { for (const c of this.cells) this.vals[c.key] = c.v; this.vals.total = this.total; this.render(); this.onChange?.(this); }

  describe() { return `Split into ${this.cfg.a.join(' plus ')} and ${this.cfg.b.join(' plus ')}. Fill in each box, then add them up.`; }

  render() {
    const { a, b } = this.cfg;
    const grid = el('div', { class: 'area-grid', style: `grid-template-columns: 70px ${b.map((y) => `${Math.max(1, y)}fr`).join(' ')}` });
    grid.append(el('div', { class: 'area-head corner', text: '×' }));
    for (const y of b) grid.append(el('div', { class: 'area-head', text: String(y) }));
    a.forEach((x, i) => {
      grid.append(el('div', { class: 'area-head side', text: String(x) }));
      b.forEach((y, j) => {
        const key = `${i}-${j}`;
        const input = el('input', { class: 'area-in', inputmode: 'numeric', 'aria-label': `${x} times ${y}`, value: this.vals[key] ?? '', placeholder: `${x} × ${y}` });
        const ok = Number(this.vals[key]) === x * y;
        input.addEventListener('input', () => { this.vals[key] = input.value.trim(); input.classList.toggle('ok', Number(input.value) === x * y); this.onChange?.(this); this.syncTotal(); });
        if (ok) input.classList.add('ok');
        grid.append(el('div', { class: `area-cell c${(i + j) % 2}` }, input));
      });
    });
    const totalIn = el('input', { class: 'area-in total', inputmode: 'numeric', 'aria-label': 'Total', value: this.vals.total ?? '', placeholder: 'add them up' });
    totalIn.addEventListener('input', () => { this.vals.total = totalIn.value.trim(); totalIn.classList.toggle('ok', Number(totalIn.value) === this.total); this.onChange?.(this); });
    if (Number(this.vals.total) === this.total) totalIn.classList.add('ok');
    this.totalRow = el('div', { class: 'area-total' }, el('span', { text: 'Total' }), totalIn);
    this.root.replaceChildren(grid, this.totalRow);
    this.syncTotal();
  }

  syncTotal() {
    const ready = this.cells.every((c) => Number(this.vals[c.key]) === c.v);
    this.totalRow.classList.toggle('dim', !ready);
  }
}

// ------------------------------------------------------------ protractor
// Drag the second ray to the target angle. cfg: { target, from: 'right' | 'left' }
export class Protractor extends Model {
  static kind = 'protractor';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.deg = cfg.start ?? 30;
    this.render();
  }

  get done() { return this.deg === this.cfg.target; }

  solve() { this.deg = this.cfg.target; this.changed(); }

  describe() { return `The angle is ${this.deg} degrees.`; }

  render() {
    const W = 420, cx = 210, cy = 210, r = 180;
    const P = (a, rr) => [cx + rr * Math.cos((a * Math.PI) / 180), cy - rr * Math.sin((a * Math.PI) / 180)];
    const svg = svgRoot(W, cy + 20, 'protractor');
    svg.append(svgEl('path', { d: `M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy} Z`, class: 'v-empty v-edge' }));
    for (let a = 0; a <= 180; a += 5) {
      const major = a % 10 === 0;
      const [ax, ay] = P(a, r), [bx, by] = P(a, r - (major ? 15 : 8));
      svg.append(svgEl('line', { x1: ax, y1: ay, x2: bx, y2: by, class: 'v-tick' }));
      if (a % 30 === 0) {
        const [ix, iy] = P(a, r - 34);
        svg.append(txt(ix, iy, String(this.cfg.from === 'left' ? 180 - a : a), 'v-t2 v-strong', 13));
      }
    }
    svg.append(svgEl('line', { x1: cx - r, y1: cy, x2: cx + r, y2: cy, class: 'v-axis' }));
    const start = this.cfg.from === 'left' ? 180 : 0;
    const end = this.cfg.from === 'left' ? 180 - this.deg : this.deg;
    const [sx, sy] = P(start, r + 8), [ex, ey] = P(end, r + 8);
    svg.append(svgEl('line', { x1: cx, y1: cy, x2: sx, y2: sy, class: 'v-ray' }));
    svg.append(svgEl('line', { x1: cx, y1: cy, x2: ex, y2: ey, class: 'v-ray v-ray2' }));
    const lo = Math.min(start, end), hi = Math.max(start, end);
    const [p0x, p0y] = P(lo, 46), [p1x, p1y] = P(hi, 46);
    svg.append(svgEl('path', { d: `M${p0x},${p0y} A46,46 0 0 0 ${p1x},${p1y}`, class: 'v-arc' }));
    const [hx, hy] = P(end, r + 8);
    svg.append(svgEl('circle', { cx: hx, cy: hy, r: 12, class: 'v-mark tap' }));
    svg.append(txt(cx, cy - 70, `${this.deg}°`, 'v-t v-strong', 30));
    const hit = svgEl('rect', { x: 0, y: 0, width: W, height: cy + 20, fill: 'transparent', class: 'tap' });
    let dragging = false;
    const move = (e) => {
      const p = svgPoint(svg, e);
      let a = (Math.atan2(cy - p.y, p.x - cx) * 180) / Math.PI;
      a = Math.max(0, Math.min(180, a));
      let d = this.cfg.from === 'left' ? 180 - a : a;
      d = Math.round(d / 5) * 5;
      if (d !== this.deg) { this.deg = d; this.changed(); }
    };
    hit.addEventListener('pointerdown', (e) => { dragging = true; hit.setPointerCapture?.(e.pointerId); move(e); e.preventDefault(); });
    hit.addEventListener('pointermove', (e) => { if (dragging) move(e); });
    hit.addEventListener('pointerup', () => { dragging = false; });
    svg.append(hit);
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const step = (e.key === 'ArrowLeft') === (this.cfg.from !== 'left') ? 5 : -5;
        this.deg = Math.max(0, Math.min(180, this.deg + step));
        this.changed();
        e.preventDefault();
        e.stopPropagation();
      }
    });
    this.root.replaceChildren(svg);
  }
}

// ------------------------------------------------------------ place-value chart
// Tap the digit in a given place. cfg: { number: '8.74', target: index of the digit, names }
export class PlaceChart extends Model {
  static kind = 'place';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.picked = null;
    this.render();
  }

  get done() { return this.picked === this.cfg.target; }

  solve() { this.picked = this.cfg.target; this.changed(); }

  describe() { return this.picked === null ? 'Tap a digit.' : `You picked the ${this.places[this.picked]} digit.`; }

  get places() {
    const s = this.cfg.number;
    const dot = s.indexOf('.');
    const whole = dot < 0 ? s.length : dot;
    const names = ['ones', 'tens', 'hundreds', 'thousands'];
    const decs = ['tenths', 'hundredths', 'thousandths'];
    return [...s.replace('.', '')].map((_, i) => (i < whole ? names[whole - 1 - i] : decs[i - whole]));
  }

  render() {
    const s = this.cfg.number;
    const digits = [...s.replace('.', '')];
    const dot = s.indexOf('.');
    const whole = dot < 0 ? s.length : dot;
    const row = el('div', { class: 'place-row' });
    digits.forEach((dgt, i) => {
      if (i === whole) row.append(el('div', { class: 'place-dot', text: '.' }));
      const cell = el('button', { class: `place-cell ${this.picked === i ? (i === this.cfg.target ? 'ok' : 'no') : ''}`, type: 'button', html: `<span class="pn">${this.places[i]}</span><span class="pd">${dgt}</span>` });
      cell.addEventListener('click', () => { this.picked = i; this.changed(); });
      row.append(cell);
    });
    this.root.replaceChildren(row);
  }
}

// ------------------------------------------------------------ unit cubes
// Build a box with rows and layers of unit cubes. cfg: { l, w, h }
export class Cubes extends Model {
  static kind = 'cubes';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.rows = 0;
    this.render();
  }

  get count() { return this.rows * this.cfg.l; }

  get done() { return this.rows === this.cfg.w * this.cfg.h; }

  solve() { this.rows = this.cfg.w * this.cfg.h; this.changed(); }

  describe() { return `${this.count} cubes so far.`; }

  render() {
    const { l, w, h } = this.cfg;
    const s = Math.min(34, 260 / (l + w * 0.6));
    const dx = s * 0.6, dy = s * 0.45;
    const W = l * s + w * dx + 40, H = h * s + w * dy + 40;
    const svg = svgRoot(W, H, 'unit cubes');
    svg.style.maxWidth = `${Math.round(W * 1.7)}px`;
    const x0 = 20, base = H - 20;
    const L = l * s, T = h * s, D = w * dx, E = w * dy;
    const box = [
      `${x0},${base} ${x0 + L},${base} ${x0 + L},${base - T} ${x0},${base - T}`,
      `${x0},${base - T} ${x0 + L},${base - T} ${x0 + L + D},${base - T - E} ${x0 + D},${base - T - E}`,
      `${x0 + L},${base} ${x0 + L + D},${base - E} ${x0 + L + D},${base - T - E} ${x0 + L},${base - T}`,
    ];
    svg.append(svgEl('polyline', { points: `${x0},${base} ${x0 + D},${base - E} ${x0 + L + D},${base - E}`, class: 'v-ghost-line' }));
    svg.append(svgEl('line', { x1: x0 + D, y1: base - E, x2: x0 + D, y2: base - T - E, class: 'v-ghost-line' }));
    for (const pts of box) svg.append(svgEl('polygon', { points: pts, class: 'v-ghost' }));
    // Draw back to front, bottom to top.
    for (let z = 0; z < h; z++) {
      for (let y = w - 1; y >= 0; y--) {
        const rowIndex = z * w + (w - 1 - y);
        if (rowIndex >= this.rows) continue;
        for (let x = 0; x < l; x++) {
          const px = x0 + x * s + y * dx, py = base - z * s - y * dy;
          const g = svgEl('g');
          g.append(svgEl('polygon', { points: `${px},${py} ${px + s},${py} ${px + s},${py - s} ${px},${py - s}`, class: 'v-fill v-edge' }));
          g.append(svgEl('polygon', { points: `${px},${py - s} ${px + dx},${py - s - dy} ${px + s + dx},${py - s - dy} ${px + s},${py - s}`, class: 'v-top v-edge' }));
          g.append(svgEl('polygon', { points: `${px + s},${py} ${px + s + dx},${py - dy} ${px + s + dx},${py - s - dy} ${px + s},${py - s}`, class: 'v-side v-edge' }));
          svg.append(g);
        }
      }
    }
    for (const pts of box) svg.append(svgEl('polygon', { points: pts, class: 'v-ghost-line' }));
    const layer = Math.floor(this.rows / w), inLayer = this.rows % w;
    const addRow = el('button', { class: 'btn small', type: 'button', text: `Add a row of ${l}` });
    addRow.addEventListener('click', () => { if (this.rows < w * h) { this.rows += 1; this.changed(); } });
    const addLayer = el('button', { class: 'btn small', type: 'button', text: `Add a whole layer (${l * w})` });
    addLayer.addEventListener('click', () => { if (this.rows < w * h) { this.rows = Math.min(w * h, (layer + 1) * w); this.changed(); } });
    const reset = el('button', { class: 'btn small ghost', type: 'button', text: 'Start over' });
    reset.addEventListener('click', () => { this.rows = 0; this.changed(); });
    const readout = el('div', { class: 'manip-readout', html: `<b>${this.count}</b> cubes · ${layer} full layer${layer === 1 ? '' : 's'}${inLayer ? ` and ${inLayer} row${inLayer === 1 ? '' : 's'}` : ''} · the box is ${l} × ${w} × ${h}` });
    this.root.replaceChildren(svg, el('div', { class: 'manip-buttons' }, addRow, addLayer, reset), readout);
  }
}

// ------------------------------------------------------------ share it out
// Share things fairly: hand one to each group until there are not enough left. cfg: { total, groups, thing }
export class Share extends Model {
  static kind = 'share';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.each = 0;
    this.render();
  }

  get left() { return this.cfg.total - this.each * this.cfg.groups; }

  get done() { return this.left < this.cfg.groups; }

  solve() { this.each = Math.floor(this.cfg.total / this.cfg.groups); this.changed(); }

  describe() { return `Each ${(this.cfg.groupName ?? 'penguin').toLowerCase()} has ${this.each}. ${this.left} left in the pile.`; }

  render() {
    const { groups, thing } = this.cfg;
    const pile = el('div', { class: 'share-pile' }, ...Array.from({ length: this.left }, () => el('span', { class: 'share-item' })));
    const bowls = el('div', { class: 'share-bowls' }, ...Array.from({ length: groups }, (_, i) => el('div', { class: 'share-bowl' },
      el('div', { class: 'share-items' }, ...Array.from({ length: this.each }, () => el('span', { class: 'share-item' }))),
      el('div', { class: 'share-name', text: `${this.cfg.groupName ?? 'Penguin'} ${i + 1}` }))));
    const give = el('button', { class: 'btn primary', type: 'button', text: this.done ? 'Not enough for everyone!' : `Give one ${thing} to each ${(this.cfg.groupName ?? 'penguin').toLowerCase()}` });
    give.disabled = this.done;
    give.addEventListener('click', () => { if (!this.done) { this.each += 1; this.changed(); } });
    const readout = el('div', { class: 'manip-readout', html: `Each ${(this.cfg.groupName ?? 'penguin').toLowerCase()}: <b>${this.each}</b> · left over: <b>${this.left}</b>` });
    this.root.replaceChildren(el('div', { class: 'share-label', text: `The pile (${this.left})` }), pile, bowls, give, readout);
  }
}

// ------------------------------------------------------------ tap the next step
// Order of operations: tap the operation that comes next; it collapses into its result.
// cfg: { tokens: [3, '+', 4, '×', 2] } (numbers and the operators + − × ÷)
const PREC = { '×': 2, '÷': 2, '+': 1, '−': 1 };
const APPLY = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b };
export class StepTap extends Model {
  static kind = 'steptap';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.tokens = [...cfg.tokens];
    this.msg = 'Tap the operation to do first.';
    this.render();
  }

  get done() { return this.tokens.length === 1; }

  // The operator that must go next: brackets are not used; the first × or ÷, else the first + or −.
  nextIndex() {
    let best = -1;
    for (let i = 1; i < this.tokens.length; i += 2) {
      if (best < 0 || PREC[this.tokens[i]] > PREC[this.tokens[best]]) best = i;
    }
    return best;
  }

  apply(i) {
    const v = APPLY[this.tokens[i]](this.tokens[i - 1], this.tokens[i + 1]);
    this.tokens.splice(i - 1, 3, v);
  }

  solve() { while (!this.done) this.apply(this.nextIndex()); this.msg = 'All done!'; this.changed(); }

  describe() { return `${this.tokens.join(' ')}. ${this.msg}`; }

  render() {
    const row = el('div', { class: 'step-row' });
    this.tokens.forEach((t, i) => {
      if (i % 2 === 0) { row.append(el('span', { class: 'step-num', text: String(t) })); return; }
      const b = el('button', { class: 'step-op', type: 'button', text: t });
      b.addEventListener('click', () => {
        if (i === this.nextIndex()) {
          this.msg = this.tokens[i] === '×' || this.tokens[i] === '÷' ? 'Yes! Multiply and divide come first.' : 'Yes! Now add and subtract, left to right.';
          this.apply(i);
          if (this.done) this.msg = `All done! The answer is ${this.tokens[0]}.`;
          this.changed();
        } else {
          this.msg = 'Not that one yet. Multiply and divide come before add and subtract.';
          b.classList.remove('no'); void b.offsetWidth; b.classList.add('no');
          this.root.querySelector('.manip-readout').textContent = this.msg;
        }
      });
      row.append(b);
    });
    this.root.replaceChildren(row, el('div', { class: 'manip-readout', text: this.msg }));
  }
}

// ------------------------------------------------------------ build a tape
// Add equal pieces (and one extra) to model a word problem. cfg: { unit, count, extra, unitLabel, extraLabel }
export class TapeBuild extends Model {
  static kind = 'tape';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.n = 0;
    this.extra = false;
    this.render();
  }

  get done() { return this.n === this.cfg.count && (!this.cfg.extra || this.extra); }

  solve() { this.n = this.cfg.count; this.extra = !!this.cfg.extra; this.changed(); }

  describe() { return `${this.n} pieces of ${this.cfg.unit}${this.extra ? ` and ${this.cfg.extra} more` : ''}.`; }

  render() {
    const { unit, count, extra, unitLabel, extraLabel } = this.cfg;
    const W = 560, h = 50;
    const total = count * unit + (extra ?? 0);
    const scale = (W - 20) / Math.max(total, 1);
    const svg = svgRoot(W, h + 44, 'tape diagram');
    let x = 10;
    for (let i = 0; i < this.n; i++) {
      svg.append(svgEl('rect', { x, y: 30, width: unit * scale, height: h, rx: 3, class: 'v-fill v-soft v-edge' }));
      svg.append(txt(x + (unit * scale) / 2, 30 + h / 2, String(unit), 'v-t v-strong', 16));
      x += unit * scale;
    }
    if (this.extra) {
      svg.append(svgEl('rect', { x, y: 30, width: extra * scale, height: h, rx: 3, class: 'v-fill2 v-soft v-edge' }));
      svg.append(txt(x + (extra * scale) / 2, 30 + h / 2, `+${extra}`, 'v-t v-strong', 16));
      x += extra * scale;
    }
    if (this.done) {
      svg.append(svgEl('path', { d: `M10,22 L10,14 L${x},14 L${x},22`, class: 'v-arc' }));
      svg.append(txt((10 + x) / 2, 6, 'how many in all?', 'v-t2', 13));
    }
    const add = el('button', { class: 'btn small', type: 'button', text: `Add ${unitLabel} (${unit})` });
    add.addEventListener('click', () => { if (this.n < count) { this.n += 1; this.changed(); } });
    const buttons = [add];
    if (extra) {
      const more = el('button', { class: 'btn small', type: 'button', text: extraLabel ?? `Add the ${extra} more` });
      more.addEventListener('click', () => { if (!this.extra) { this.extra = true; this.changed(); } });
      buttons.push(more);
    }
    const reset = el('button', { class: 'btn small ghost', type: 'button', text: 'Start over' });
    reset.addEventListener('click', () => { this.n = 0; this.extra = false; this.changed(); });
    this.root.replaceChildren(svg, el('div', { class: 'manip-buttons' }, ...buttons, reset));
  }
}

// ------------------------------------------------------------ fraction grid
// A square cut into rows and columns. Shade rows for one fraction and columns for the other: the overlap is
// their product. cfg: { rows, cols, goalRows, goalCols, rowName, colName, decimal }
export class FracGrid extends Model {
  static kind = 'fracgrid';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.r = 0;
    this.c = 0;
    this.render();
  }

  get done() { return this.r === this.cfg.goalRows && this.c === this.cfg.goalCols; }

  solve() { this.r = this.cfg.goalRows; this.c = this.cfg.goalCols; this.changed(); }

  frac(n, d) { return this.cfg.decimal ? (n / d).toFixed(String(d).length - 1) : fracLabel(n, d); }

  describe() {
    const { rows, cols } = this.cfg;
    return `${this.frac(this.r, rows)} of the rows and ${this.frac(this.c, cols)} of the columns are shaded. They overlap in ${this.r * this.c} of ${rows * cols} small boxes.`;
  }

  render() {
    const { rows, cols, rowName = 'rows', colName = 'columns' } = this.cfg;
    const S = Math.min(300 / rows, 300 / cols), bar = 30, gap = 10;
    const x0 = bar + gap + 8, y0 = bar + gap + 8, Wg = cols * S, Hg = rows * S;
    const svg = svgRoot(x0 + Wg + 12, y0 + Hg + 12, 'fraction grid');
    svg.style.maxWidth = 'min(400px, 52vh)';
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const inR = i < this.r, inC = j < this.c;
        svg.append(svgEl('rect', { x: x0 + j * S, y: y0 + i * S, width: S, height: S, class: `${inR && inC ? 'v-fill' : inR ? 'v-top' : inC ? 'v-fill2 v-soft' : 'v-empty'} v-edge` }));
      }
    }
    svg.append(svgEl('rect', { x: x0, y: y0, width: Wg, height: Hg, class: 'v-outline' }));
    // Row bar (left) and column bar (top) are the controls.
    for (let i = 0; i < rows; i++) {
      const seg = svgEl('rect', { x: 8, y: y0 + i * S, width: bar, height: S, rx: 3, class: `${i < this.r ? 'v-top' : 'v-empty'} v-edge tap` });
      seg.addEventListener('pointerdown', (e) => { e.preventDefault(); this.r = this.r === i + 1 ? i : i + 1; this.changed(); });
      svg.append(seg);
    }
    for (let j = 0; j < cols; j++) {
      const seg = svgEl('rect', { x: x0 + j * S, y: 8, width: S, height: bar, rx: 3, class: `${j < this.c ? 'v-fill2' : 'v-empty'} v-edge tap` });
      seg.addEventListener('pointerdown', (e) => { e.preventDefault(); this.c = this.c === j + 1 ? j : j + 1; this.changed(); });
      svg.append(seg);
    }
    const readout = el('div', { class: 'manip-readout', html: `${rowName}: <b>${this.frac(this.r, rows)}</b> · ${colName}: <b>${this.frac(this.c, cols)}</b> · overlap: <b>${this.r * this.c}</b> of ${rows * cols} = <b>${this.frac(this.r * this.c, rows * cols)}</b>` });
    this.root.replaceChildren(svg, readout);
  }
}

// ------------------------------------------------------------ coordinate plotter
// Tap grid points to place markers. cfg: { n, targets: [[x, y]], icons } (icons: one label per target)
export class Plot extends Model {
  static kind = 'plot';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.pts = [];
    this.last = null;
    this.render();
  }

  has(x, y) { return this.pts.some((p) => p[0] === x && p[1] === y); }

  get done() { return this.cfg.targets.every(([x, y]) => this.has(x, y)) && this.pts.length === this.cfg.targets.length; }

  solve() { this.pts = this.cfg.targets.map((p) => [...p]); this.last = null; this.changed(); }

  describe() { return this.pts.length ? `Points at ${this.pts.map((p) => `(${p[0]}, ${p[1]})`).join(', ')}.` : 'No points yet.'; }

  render() {
    const n = this.cfg.n, S = Math.min(34, 330 / n), pad = 34;
    const W = pad * 2 + n * S;
    const X = (v) => pad + v * S, Y = (v) => pad + (n - v) * S;
    const svg = svgRoot(W, W, 'coordinate grid');
    svg.style.maxWidth = 'min(400px, 46vh)';
    for (let v = 0; v <= n; v++) {
      svg.append(svgEl('line', { x1: X(v), y1: Y(0), x2: X(v), y2: Y(n), class: 'v-gridline' }));
      svg.append(svgEl('line', { x1: X(0), y1: Y(v), x2: X(n), y2: Y(v), class: 'v-gridline' }));
      svg.append(txt(X(v), Y(0) + 16, String(v), 'v-t2', 12));
      if (v) svg.append(txt(X(0) - 12, Y(v), String(v), 'v-t2', 12));
    }
    svg.append(svgEl('line', { x1: X(0), y1: Y(0), x2: X(n) + 10, y2: Y(0), class: 'v-axis' }));
    svg.append(svgEl('line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(n) - 10, class: 'v-axis' }));
    svg.append(txt(X(n) + 18, Y(0), 'x', 'v-t v-strong', 15));
    svg.append(txt(X(0), Y(n) - 20, 'y', 'v-t v-strong', 15));
    if (this.cfg.line && this.pts.length > 1) {
      const sorted = [...this.pts].sort((a, b) => a[0] - b[0]);
      svg.append(svgEl('polyline', { points: sorted.map(([x, y]) => `${X(x)},${Y(y)}`).join(' '), class: 'v-arc' }));
    }
    for (const [x, y] of this.pts) {
      const good = this.cfg.targets.some((t) => t[0] === x && t[1] === y);
      svg.append(svgEl('circle', { cx: X(x), cy: Y(y), r: 9, class: good ? 'v-mark' : 'v-fill2' }));
    }
    const hit = svgEl('rect', { x: 0, y: 0, width: W, height: W, fill: 'transparent', class: 'tap' });
    hit.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const p = svgPoint(svg, e);
      const x = Math.round((p.x - pad) / S), y = Math.round(n - (p.y - pad) / S);
      if (x < 0 || y < 0 || x > n || y > n) return;
      if (this.has(x, y)) this.pts = this.pts.filter((q) => q[0] !== x || q[1] !== y);
      else this.pts.push([x, y]);
      this.last = [x, y];
      this.changed();
    });
    svg.append(hit);
    const msg = this.last ? `You tapped <b>(${this.last[0]}, ${this.last[1]})</b>: ${this.last[0]} across, ${this.last[1]} up.` : 'Tap where the lines cross. Go across first, then up.';
    this.root.replaceChildren(svg, el('div', { class: 'manip-readout', html: msg }));
  }
}

// ------------------------------------------------------------ sliding place-value chart
// Every digit slides one place with each × 10 or ÷ 10. cfg: { start: '0.35', target: '35', lo: -3, hi: 3 }
// Values are kept as an integer count of thousandths so nothing drifts.
const PLACE_LABEL = { 3: 'thousands', 2: 'hundreds', 1: 'tens', 0: 'ones', '-1': 'tenths', '-2': 'hundredths', '-3': 'thousandths' };
const toMilli = (s) => Math.round(Number(s) * 1000);
export class PlaceSlide extends Model {
  static kind = 'slide';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.v = toMilli(cfg.start);
    this.moves = [];
    this.render();
  }

  get done() { return this.v === toMilli(this.cfg.target); }

  solve() { this.v = toMilli(this.cfg.target); this.changed(); }

  show() { return fmtMilli(this.v); }

  describe() { return `The number is ${this.show()}.`; }

  render() {
    const lo = this.cfg.lo ?? -3, hi = this.cfg.hi ?? 3;
    const row = el('div', { class: 'place-row slide' });
    const digits = String(this.v).padStart(4, '0');
    // Digit for place p (p = 0 ones, -1 tenths...): value in thousandths has place p at index len - 4 - p.
    const digitAt = (p) => { const i = digits.length - 4 - p; return i >= 0 && i < digits.length ? digits[i] : '0'; };
    const lead = (p) => { // hide leading zeros on the left of the first non-zero whole digit
      if (p <= 0) return false;
      for (let q = hi; q >= p; q--) if (digitAt(q) !== '0') return false;
      return true;
    };
    const trail = (p) => { // and trailing zeros after the last non-zero decimal digit
      if (p >= 0) return false;
      for (let q = lo; q <= p; q++) if (digitAt(q) !== '0') return false;
      return true;
    };
    for (let p = hi; p >= lo; p--) {
      if (p === -1) row.append(el('div', { class: 'place-dot', text: '.' }));
      const d = lead(p) || trail(p) ? '' : digitAt(p);
      row.append(el('div', { class: `place-cell${d && d !== '0' ? ' ok' : ''}`, html: `<span class="pn">${PLACE_LABEL[p]}</span><span class="pd">${d || '&nbsp;'}</span>` }));
    }
    const can10 = this.v * 10 < 10 ** (hi + 4);
    const canDiv = this.v % 10 === 0;
    const times = el('button', { class: 'btn small', type: 'button', text: '× 10  (slide left)' });
    times.disabled = !can10;
    times.addEventListener('click', () => { if (can10) { this.v *= 10; this.changed(); } });
    const div = el('button', { class: 'btn small', type: 'button', text: '÷ 10  (slide right)' });
    div.disabled = !canDiv;
    div.addEventListener('click', () => { if (canDiv) { this.v /= 10; this.changed(); } });
    const reset = el('button', { class: 'btn small ghost', type: 'button', text: 'Start over' });
    reset.addEventListener('click', () => { this.v = toMilli(this.cfg.start); this.changed(); });
    this.root.replaceChildren(row, el('div', { class: 'manip-buttons' }, times, div, reset), el('div', { class: 'manip-readout', html: `The number is <b>${this.show()}</b>` }));
  }
}
function fmtMilli(m) {
  const w = Math.floor(m / 1000), f = m % 1000;
  return f ? `${w.toLocaleString('en-US')}.${String(f).padStart(3, '0').replace(/0+$/, '')}` : w.toLocaleString('en-US');
}

// ------------------------------------------------------------ jumps on a number line
// Hop by a fixed amount and count the hops. cfg: { max, den, jump: [n, d], target: [n, d], decimal }
export class Jumps extends Model {
  static kind = 'jumps';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.k = 0;
    this.render();
  }

  // Positions in ticks (1 / den each).
  get step() { const [n, d] = this.cfg.jump; return (n * this.cfg.den) / d; }

  get goal() { const [n, d] = this.cfg.target; return (n * this.cfg.den) / d; }

  get done() { return this.k * this.step === this.goal; }

  solve() { this.k = this.goal / this.step; this.changed(); }

  label(t) {
    const { den, decimal } = this.cfg;
    if (decimal) { const s = (t / den).toFixed(String(den).length - 1); return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }
    if (t % den === 0) return String(t / den);
    return fracLabel(t, den);
  }

  describe() { return `${this.k} jumps, landing on ${this.label(this.k * this.step)}.`; }

  render() {
    const { max, den } = this.cfg;
    const n = max * den;
    const W = 580, x0 = 30, x1 = W - 30, y = 110;
    const X = (t) => x0 + ((x1 - x0) * t) / n;
    const svg = svgRoot(W, 160, 'number line with jumps');
    svg.append(svgEl('line', { x1: x0 - 10, y1: y, x2: x1 + 10, y2: y, class: 'v-axis' }));
    for (let t = 0; t <= n; t++) {
      const whole = t % den === 0;
      svg.append(svgEl('line', { x1: X(t), y1: y - (whole ? 12 : 7), x2: X(t), y2: y + (whole ? 12 : 7), class: 'v-tick' }));
      if (whole || this.cfg.labelAll) svg.append(txt(X(t), y + 30, this.label(t), whole ? 'v-t v-strong' : 'v-t2', whole ? 16 : 12));
    }
    svg.append(svgEl('circle', { cx: X(this.goal), cy: y, r: 8, class: 'v-fill2' }));
    for (let i = 0; i < this.k; i++) {
      const a = X(i * this.step), b = X((i + 1) * this.step), h = Math.min(60, 18 + (b - a) * 0.45);
      svg.append(svgEl('path', { d: `M${a},${y - 4} Q${(a + b) / 2},${y - 4 - h * 2} ${b},${y - 4}`, class: 'v-arc' }));
      svg.append(txt((a + b) / 2, y - 8 - h, String(i + 1), 'v-t v-strong', 13));
    }
    const at = this.k * this.step;
    const jump = el('button', { class: 'btn primary', type: 'button', text: `Jump ${this.label(this.step)}` });
    jump.disabled = at + this.step > n;
    jump.addEventListener('click', () => { if (at + this.step <= n) { this.k += 1; this.changed(); } });
    const back = el('button', { class: 'btn small ghost', type: 'button', text: 'Start over' });
    back.addEventListener('click', () => { this.k = 0; this.changed(); });
    this.root.replaceChildren(svg, el('div', { class: 'manip-buttons' }, jump, back), el('div', { class: 'manip-readout', html: `<b>${this.k}</b> jump${this.k === 1 ? '' : 's'} of ${this.label(this.step)} land on <b>${this.label(at)}</b>` }));
  }
}

// ------------------------------------------------------------ level the towers
// Move blocks from tall towers to short ones until every tower is the same: the fair share (the mean).
// cfg: { heights: [5, 2, 7, 2], unit: 'fish', names }
export class Level extends Model {
  static kind = 'level';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.h = [...cfg.heights];
    this.sel = null;
    this.render();
  }

  get done() { return this.h.every((v) => v === this.h[0]); }

  solve() { const m = this.h.reduce((a, b) => a + b, 0) / this.h.length; this.h = this.h.map(() => m); this.sel = null; this.changed(); }

  describe() { return `Towers: ${this.h.join(', ')}.`; }

  render() {
    const { names, unit = 'blocks' } = this.cfg;
    const n = this.h.length, top = Math.max(...this.cfg.heights, ...this.h);
    const S = Math.min(26, 230 / top), colW = Math.min(90, 520 / n), W = n * colW + 20, base = 20 + top * S + 6;
    const svg = svgRoot(W, base + 30, 'towers of blocks');
    this.h.forEach((v, i) => {
      const x = 10 + i * colW + (colW - S * 1.6) / 2;
      const col = svgEl('g', { class: 'tap' });
      col.append(svgEl('rect', { x: 10 + i * colW + 2, y: 10, width: colW - 4, height: base - 8, rx: 8, class: this.sel === i ? 'v-head' : 'v-empty', 'fill-opacity': this.sel === i ? 1 : 0.15 }));
      for (let k = 0; k < v; k++) col.append(svgEl('rect', { x, y: base - (k + 1) * S, width: S * 1.6, height: S - 2, rx: 3, class: `${this.sel === i && k === v - 1 ? 'v-fill2' : 'v-fill'} v-edge` }));
      col.append(txt(10 + i * colW + colW / 2, base + 16, names?.[i] ?? String(v), 'v-t2 v-strong', 13));
      col.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (this.sel === null) { if (v > 0) this.sel = i; }
        else if (this.sel === i) this.sel = null;
        else { this.h[this.sel] -= 1; this.h[i] += 1; this.sel = null; }
        this.changed();
      });
      svg.append(col);
    });
    const msg = this.done ? `Every tower has <b>${this.h[0]}</b> ${unit}. That is the fair share.` : this.sel === null ? 'Tap a tall tower to pick up a block, then tap a short tower to drop it.' : 'Now tap the tower that should get the block.';
    this.root.replaceChildren(svg, el('div', { class: 'manip-readout', html: msg }));
  }
}

// ------------------------------------------------------------ tag the families
// Pick every name that fits. cfg: { shape (a SHAPES name for the picture), tags: [names], correct: [names] }
export class Tagger extends Model {
  static kind = 'tags';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.on = new Set();
    this.render();
  }

  get done() { return this.cfg.correct.length === this.on.size && this.cfg.correct.every((t) => this.on.has(t)); }

  solve() { this.on = new Set(this.cfg.correct); this.changed(); }

  describe() { return this.on.size ? `You picked ${[...this.on].join(', ')}.` : 'Nothing picked yet.'; }

  render() {
    const pic = renderVisual({ kind: 'shape', name: this.cfg.shape });
    const tags = el('div', { class: 'manip-buttons tag-row' }, ...this.cfg.tags.map((t) => {
      const b = el('button', { class: `btn small toggle${this.on.has(t) ? ' on' : ''}`, type: 'button', text: t, 'aria-pressed': String(this.on.has(t)) });
      b.addEventListener('click', () => { if (this.on.has(t)) this.on.delete(t); else this.on.add(t); this.changed(); });
      return b;
    }));
    const right = this.cfg.correct.filter((t) => this.on.has(t)).length;
    const wrong = [...this.on].filter((t) => !this.cfg.correct.includes(t)).length;
    const msg = wrong ? `One of your picks does not fit. Check its rules again.` : `${right} of ${this.cfg.correct.length} names found.`;
    this.root.replaceChildren(el('div', { class: 'quiz-visual', html: pic }), tags, el('div', { class: 'manip-readout', text: msg }));
  }
}

// ------------------------------------------------------------ where do the parentheses go?
// Tap a number, then another two places away, to wrap that part in parentheses. cfg: { tokens, target: [i, j] }
export class Paren extends Model {
  static kind = 'paren';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.wrap = null;
    this.first = null;
    this.render();
  }

  get done() { return !!this.wrap && this.wrap[0] === this.cfg.target[0] && this.wrap[1] === this.cfg.target[1]; }

  solve() { this.wrap = [...this.cfg.target]; this.first = null; this.changed(); }

  value() {
    const t = [...this.cfg.tokens];
    if (this.wrap) {
      const [i, j] = this.wrap;
      const inner = t.slice(i, j + 1);
      while (inner.length > 1) collapse(inner);
      t.splice(i, j - i + 1, inner[0]);
    }
    while (t.length > 1) collapse(t);
    return t[0];
  }

  text() {
    return this.cfg.tokens.map((x, i) => `${this.wrap && this.wrap[0] === i ? '(' : ''}${x}${this.wrap && this.wrap[1] === i ? ')' : ''}`).join(' ');
  }

  describe() { return `${this.text()} = ${this.value()}.`; }

  render() {
    const row = el('div', { class: 'step-row' });
    this.cfg.tokens.forEach((x, i) => {
      if (this.wrap && this.wrap[0] === i) row.append(el('span', { class: 'paren', text: '(' }));
      if (i % 2 === 1) row.append(el('span', { class: 'step-num', text: String(x) }));
      else {
        const b = el('button', { class: `step-op num${this.first === i ? ' picked' : ''}`, type: 'button', text: String(x) });
        b.addEventListener('click', () => {
          if (this.first === null) { this.first = i; this.wrap = null; }
          else {
            const [a, c] = [Math.min(this.first, i), Math.max(this.first, i)];
            this.wrap = a === c ? null : [a, c];
            this.first = null;
          }
          this.changed();
        });
        row.append(b);
      }
      if (this.wrap && this.wrap[1] === i) row.append(el('span', { class: 'paren', text: ')' }));
    });
    const msg = this.first !== null ? 'Now tap the last number to go inside the parentheses.' : `${this.text()} = <b>${this.value()}</b>`;
    this.root.replaceChildren(row, el('div', { class: 'manip-readout', html: msg }));
  }
}
const PREC2 = { '×': 2, '÷': 2, '+': 1, '−': 1 };
function collapse(t) {
  let best = 1;
  for (let i = 1; i < t.length; i += 2) if (PREC2[t[i]] > PREC2[t[best]]) best = i;
  const a = t[best - 1], b = t[best + 1], op = t[best];
  t.splice(best - 1, 3, op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b);
}

// ------------------------------------------------------------ compare decimals place by place
// Both numbers get the same number of decimal places (added zeros show faintly). Tap the first place where
// the digits differ: that place decides which number is greater. cfg: { a: '0.45', b: '0.405' }
const PLACE_OF = (w, i) => (i < w ? ['ones', 'tens', 'hundreds', 'thousands'][w - 1 - i] : ['tenths', 'hundredths', 'thousandths'][i - w]);
export class CompareRows extends Model {
  static kind = 'rows2';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.picked = null;
    const parts = [cfg.a, cfg.b].map((x) => x.split('.'));
    this.w = Math.max(...parts.map((q) => q[0].length));
    this.p = Math.max(...parts.map((q) => (q[1] ?? '').length));
    // Each row: [{ d, added }] whole digits right-aligned, decimals padded with zeros.
    this.rows = parts.map(([whole, dec = '']) => [
      ...whole.padStart(this.w, ' ').split('').map((d) => ({ d, added: d === ' ' })),
      ...dec.padEnd(this.p, '_').split('').map((d) => (d === '_' ? { d: '0', added: true } : { d, added: false })),
    ]);
    this.render();
  }

  get first() { return this.rows[0].findIndex((c, i) => c.d !== this.rows[1][i].d); }

  get done() { return this.picked === this.first; }

  solve() { this.picked = this.first; this.changed(); }

  describe() { return `${this.cfg.a} and ${this.cfg.b}.`; }

  render() {
    const grid = el('div', { class: 'cmp-grid', style: `grid-template-columns: repeat(${this.w}, auto) 18px repeat(${this.p}, auto)` });
    for (let r = 0; r < 2; r++) {
      this.rows[r].forEach((c, i) => {
        if (i === this.w) grid.append(el('div', { class: 'place-dot', text: '.' }));
        const cell = el('button', { class: `place-cell${this.picked === i ? (i === this.first ? ' ok' : ' no') : ''}${c.added ? ' added' : ''}`, type: 'button', html: `${r === 0 ? `<span class="pn">${PLACE_OF(this.w, i)}</span>` : ''}<span class="pd">${c.d === ' ' ? '&nbsp;' : c.d}</span>` });
        cell.addEventListener('click', () => { this.picked = i; this.changed(); });
        grid.append(cell);
      });
    }
    let msg = 'Tap the first place, from the left, where the digits are different.';
    if (this.picked !== null) {
      const i = this.picked, f = this.first;
      if (i === f) {
        const big = Number(this.rows[0][f].d) > Number(this.rows[1][f].d) ? this.cfg.a : this.cfg.b;
        msg = `In the ${PLACE_OF(this.w, f)} place, ${this.rows[0][f].d} and ${this.rows[1][f].d} are different. So <b>${big}</b> is greater!`;
      } else msg = i < f ? 'Those digits match. Keep going to the right.' : 'Go back left: a place before this one is already different.';
    }
    this.root.replaceChildren(grid, el('div', { class: 'manip-readout', html: msg }));
  }
}

export const MODELS = {
  strips: Strips, hundred: Hundred, numberline: NumberLine, area: AreaModel, protractor: Protractor, place: PlaceChart, cubes: Cubes,
  share: Share, steptap: StepTap, tape: TapeBuild, fracgrid: FracGrid, plot: Plot, slide: PlaceSlide, jumps: Jumps, level: Level, tags: Tagger, paren: Paren, rows2: CompareRows,
};
export { gcd };
