// Hands-on models for lessons (the "concrete" step): the child changes the model until it matches a goal.
// Every model: new Model(host, cfg, onChange) renders into host; `.done` says the goal is met; `.solve()`
// shows the answer (the "Show me" button); `.describe()` says what the model shows now, for read-aloud.
import { el } from './dom.js';

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
    const W = 560, left = 10, labelW = 96, rowH = 46, gap = 20;
    const maxWholes = Math.max(...this.rows.map((r) => r.wholes));
    const unit = (W - left - labelW - 12 - (maxWholes - 1) * 10) / maxWholes;
    const svg = svgRoot(W, this.rows.length * (rowH + gap) + 4, 'fraction strips');
    this.rows.forEach((r, ri) => {
      const y = 4 + ri * (rowH + gap);
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

  get ticks() { return (this.cfg.max - this.cfg.min) * this.cfg.den; }

  get value() { return [this.cfg.min * this.cfg.den + this.k, this.cfg.den]; }

  get done() { const [n, d] = this.value; const [tn, td] = this.cfg.target; return n * td === tn * d; }

  solve() { const [tn, td] = this.cfg.target; this.k = (tn * this.cfg.den) / td - this.cfg.min * this.cfg.den; this.changed(); }

  label(n, d) {
    if (this.cfg.decimal) return (n / d).toFixed(String(d).length - 1);
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
      if (whole || this.cfg.labelAll) svg.append(txt(X(k), y + 32, this.label(this.cfg.min * this.cfg.den + k, this.cfg.den), whole ? 'v-t v-strong' : 'v-t2', whole ? 17 : 13));
    }
    for (const m of this.cfg.marks ?? []) {
      const km = (m.n * this.cfg.den) / m.d - this.cfg.min * this.cfg.den;
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

  describe() { return `Each penguin has ${this.each}. ${this.left} left in the pile.`; }

  render() {
    const { groups, thing } = this.cfg;
    const pile = el('div', { class: 'share-pile' }, ...Array.from({ length: this.left }, () => el('span', { class: 'share-item' })));
    const bowls = el('div', { class: 'share-bowls' }, ...Array.from({ length: groups }, (_, i) => el('div', { class: 'share-bowl' },
      el('div', { class: 'share-items' }, ...Array.from({ length: this.each }, () => el('span', { class: 'share-item' }))),
      el('div', { class: 'share-name', text: `Penguin ${i + 1}` }))));
    const give = el('button', { class: 'btn primary', type: 'button', text: this.done ? 'Not enough for everyone!' : `Give one ${thing} to each penguin` });
    give.disabled = this.done;
    give.addEventListener('click', () => { if (!this.done) { this.each += 1; this.changed(); } });
    const readout = el('div', { class: 'manip-readout', html: `Each penguin: <b>${this.each}</b> · left over: <b>${this.left}</b>` });
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

export const MODELS = { strips: Strips, hundred: Hundred, numberline: NumberLine, area: AreaModel, protractor: Protractor, place: PlaceChart, cubes: Cubes, share: Share, steptap: StepTap, tape: TapeBuild };
export { gcd };
