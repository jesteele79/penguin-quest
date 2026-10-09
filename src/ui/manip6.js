// Hands-on models for the grade 6 lessons: a balance scale for equations, a ratio table that grows, number
// cards to put in order, bins that build a histogram, shapes to copy and cut, a box net to paint, rows of
// multiples, and distances from the mean. Same contract as the models in manip.js.
import { el } from './dom.js';
import { Model, svgEl, svgRoot, txt, button, signed } from './manipkit.js';

// ------------------------------------------------------------ balance scale
// An equation on a balance: mystery bags (each worth x) and unit weights on the left, weights on the right.
// Take the same from both sides, or share both sides into equal groups, until one bag is alone.
// cfg: { bags, ones, right, x, name = 'x' }   (bags × x + ones = right)
export class Balance extends Model {
  static kind = 'balance';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.reset();
    this.render();
  }

  reset() { this.L = { bags: this.cfg.bags, ones: this.cfg.ones }; this.R = this.cfg.right; this.msg = null; }

  get tilt() { return Math.sign(this.R - (this.L.bags * this.cfg.x + this.L.ones)); }

  get done() { return this.L.bags === 1 && this.L.ones === 0 && this.tilt === 0; }

  solve() { this.L = { bags: 1, ones: 0 }; this.R = this.cfg.x; this.msg = null; this.changed(); }

  equation() {
    const n = this.cfg.name ?? 'x';
    const left = `${this.L.bags > 1 ? this.L.bags : ''}${n}${this.L.ones ? ` + ${this.L.ones}` : ''}`;
    return `${left} ${this.tilt === 0 ? '=' : '≠'} ${this.R}`;
  }

  describe() { return `${this.equation()}.`; }

  take(side) {
    if (side === 'L' && this.L.ones > 0) this.L.ones -= 1;
    else if (side === 'R' && this.R > 0) this.R -= 1;
    else return;
    this.msg = this.tilt === 0 ? null : 'The scale tipped! Do the same to the other side to balance it again.';
    this.changed();
  }

  both() {
    if (this.L.ones === 0 || this.R === 0) return;
    this.L.ones -= 1; this.R -= 1;
    this.msg = null;
    this.changed();
  }

  share() {
    const k = this.L.bags;
    if (k < 2 || this.L.ones || this.R % k) return;
    this.L.bags = 1; this.R /= k;
    this.msg = `Each of the ${k} groups is the same, so keep just one group on each side.`;
    this.changed();
  }

  render() {
    const W = 600, H = 250, cx = W / 2, beamY = 70, half = 190;
    const a = this.tilt * 0.12;
    const end = (s) => [cx + s * half * Math.cos(a), beamY + s * half * Math.sin(a)];
    const svg = svgRoot(W, H, 'balance scale');
    svg.append(svgEl('polygon', { points: `${cx},${beamY + 6} ${cx - 34},${H - 16} ${cx + 34},${H - 16}`, class: 'v-head v-edge' }));
    const [lx, ly] = end(-1), [rx, ry] = end(1);
    svg.append(svgEl('line', { x1: lx, y1: ly, x2: rx, y2: ry, class: 'v-axis', 'stroke-width': 6 }));
    svg.append(svgEl('circle', { cx, cy: beamY, r: 7, class: 'v-mark' }));
    const pan = (x, y, side) => {
      const g = svgEl('g');
      g.append(svgEl('line', { x1: x, y1: y, x2: x - 66, y2: y + 70, class: 'v-tick' }), svgEl('line', { x1: x, y1: y, x2: x + 66, y2: y + 70, class: 'v-tick' }));
      g.append(svgEl('path', { d: `M${x - 82},${y + 70} h164 q-8,22 -82,22 q-74,0 -82,-22 z`, class: 'v-empty v-edge' }));
      const bags = side === 'L' ? this.L.bags : 0, ones = side === 'L' ? this.L.ones : this.R;
      for (let i = 0; i < bags; i++) {
        const bx = x - 78 + i * 36, by = y + 34;
        g.append(svgEl('rect', { x: bx, y: by, width: 32, height: 34, rx: 11, class: 'v-fill2 v-edge' }));
        g.append(svgEl('circle', { cx: bx + 16, cy: by - 2, r: 4, class: 'v-fill2 v-edge' }));
        g.append(txt(bx + 16, by + 19, this.cfg.name ?? 'x', 'v-t v-strong', 16));
      }
      const perRow = bags ? Math.max(2, 8 - bags * 2) : 8;
      for (let i = 0; i < ones; i++) {
        const c = i % perRow, r = Math.floor(i / perRow);
        const wx = x + 60 - c * 19, wy = y + 50 - r * 19;
        const box = svgEl('rect', { x: wx, y: wy, width: 16, height: 16, rx: 3, class: 'v-fill v-edge tap' });
        box.addEventListener('pointerdown', (e) => { e.preventDefault(); this.take(side); });
        g.append(box);
      }
      return g;
    };
    svg.append(pan(lx, ly, 'L'), pan(rx, ry, 'R'));
    svg.append(txt(cx, 22, this.equation(), 'v-t v-strong', 24));
    const k = this.L.bags;
    const buttons = [button('Take 1 from both sides', () => this.both(), 'btn small', !this.L.ones || !this.R)];
    if (this.cfg.bags > 1) buttons.push(button(`Share both sides into ${k} groups`, () => this.share(), 'btn small', k < 2 || this.L.ones > 0 || this.R % k !== 0));
    buttons.push(button('Start over', () => { this.reset(); this.changed(); }, 'btn small ghost'));
    const msg = this.done ? `One ${this.cfg.name ?? 'x'} on its own balances <b>${this.R}</b>. So ${this.cfg.name ?? 'x'} = ${this.R}!`
      : this.msg ?? (this.L.ones ? 'Tap a weight to take it away, or take 1 from both sides at once.' : 'Now share both sides into equal groups.');
    this.root.replaceChildren(svg, el('div', { class: 'manip-buttons' }, ...buttons), el('div', { class: 'manip-readout', html: msg }));
  }
}

// ------------------------------------------------------------ ratio table
// Columns that keep the same ratio. Add another batch, multiply or divide the first column, until a
// column has the target number in the target row.
// cfg: { names: [A, B], a, b, target: { row, value }, ops: ['add', 'times', 'divide'], times: [2, 3, 5, 10], divide: [2, 3, 4] }
export class RatioTable extends Model {
  static kind = 'ratiotable';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.cols = [[cfg.a, cfg.b]];
    this.render();
  }

  get hit() { const { row, value } = this.cfg.target; return this.cols.find((c) => c[row] === value) ?? null; }

  get done() { return !!this.hit; }

  // The fewest columns that reach the target, for "Show me".
  solve() {
    const { a, b, target, ops = ['add'] } = this.cfg;
    const k = target.value / (target.row === 0 ? a : b);
    // Built by batches, every batch on the way is shown; otherwise just the column that answers.
    const steps = ops.includes('add') && Number.isInteger(k) && k <= 7 ? Array.from({ length: k }, (_, i) => i + 1) : [1, k];
    this.cols = [...new Set(steps)].map((m) => [a * m, b * m]).sort((p, q) => p[0] - q[0]);
    this.changed();
  }

  add(c) {
    if (this.cols.length >= 7 || this.cols.some((d) => d[0] === c[0])) return;
    this.cols.push(c);
    this.cols.sort((p, q) => p[0] - q[0]);
    this.changed();
  }

  describe() { return this.cols.map(([x, y]) => `${x} ${this.cfg.names[0]} to ${y} ${this.cfg.names[1]}`).join(', ') + '.'; }

  render() {
    const { names, a, b, ops = ['add'] } = this.cfg;
    const left = Math.min(150, 26 + Math.max(...names.map((x) => x.length)) * 9), cw = 66;
    const W = left + 7 * cw + 10;
    const svg = svgRoot(W, 108, 'ratio table');
    names.forEach((name, r) => {
      const y = 10 + r * 46;
      svg.append(svgEl('rect', { x: 6, y, width: left - 12, height: 40, class: 'v-head' }));
      svg.append(txt(left / 2, y + 20, name, 'v-t2', 14));
      this.cols.forEach((c, i) => {
        const x = left + i * cw, on = this.hit === c;
        svg.append(svgEl('rect', { x, y, width: cw - 6, height: 40, rx: 4, class: `${on ? 'v-fill' : i === 0 ? 'v-fill2 v-soft' : 'v-empty'} v-edge` }));
        svg.append(txt(x + (cw - 6) / 2, y + 21, String(c[r]), 'v-t v-strong', 18));
      });
    });
    const last = this.cols[this.cols.length - 1];
    const buttons = [];
    if (ops.includes('add')) buttons.push(button(`Add ${a} more and ${b} more`, () => this.add([last[0] + a, last[1] + b])));
    if (ops.includes('times')) for (const k of this.cfg.times ?? [2, 3, 5, 10]) buttons.push(button(`× ${k}`, () => this.add([a * k, b * k])));
    if (ops.includes('divide')) for (const k of this.cfg.divide ?? [2, 3, 4]) if (a % k === 0 && b % k === 0) buttons.push(button(`÷ ${k}`, () => this.add([a / k, b / k])));
    buttons.push(button('Start over', () => { this.cols = [[a, b]]; this.changed(); }, 'btn small ghost'));
    const h = this.hit;
    const msg = h ? `<b>${h[0]}</b> ${names[0]} go with <b>${h[1]}</b> ${names[1]}. Every column is the same ratio!`
      : `Every column must keep the same ratio as ${a} to ${b}. Find the column with ${this.cfg.target.value} ${names[this.cfg.target.row]}.`;
    this.root.replaceChildren(svg, el('div', { class: 'manip-buttons' }, ...buttons), el('div', { class: 'manip-readout', html: msg }));
  }
}

// ------------------------------------------------------------ number cards
// Tap the cards from least to greatest to line them up; then the middle (and more) lights up.
// cfg: { values, mode: 'order' | 'median' | 'range' | 'quartiles', name }
const sortNum = (a, b) => a - b;
export class Cards extends Model {
  static kind = 'cards';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.left = cfg.values.map((v, i) => ({ v, i }));
    this.row = [];
    this.msg = null;
    this.render();
  }

  get done() { return this.left.length === 0; }

  solve() { this.row = [...this.row, ...this.left].sort((p, q) => p.v - q.v); this.left = []; this.msg = null; this.changed(); }

  describe() { return this.done ? `In order: ${this.row.map((c) => signed(c.v)).join(', ')}.` : `Cards left: ${this.left.map((c) => signed(c.v)).join(', ')}.`; }

  pick(card) {
    const least = Math.min(...this.left.map((c) => c.v));
    if (card.v !== least) { this.msg = `Is there a card less than ${signed(card.v)} left?`; this.changed(); return; }
    this.left = this.left.filter((c) => c !== card);
    this.row.push(card);
    this.msg = null;
    this.changed();
  }

  // Which places in the sorted row to light up, and what to say about them.
  summary() {
    const v = this.row.map((c) => c.v), n = v.length, mid = (arr) => (arr.length % 2 ? arr[(arr.length - 1) / 2] : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2);
    const midIdx = (from, len) => (len % 2 ? [from + (len - 1) / 2] : [from + len / 2 - 1, from + len / 2]);
    const mode = this.cfg.mode ?? 'order';
    if (mode === 'range') return { lit: [0, n - 1], text: `Greatest − least = ${signed(v[n - 1])} − ${signed(v[0])} = <b>${v[n - 1] - v[0]}</b>. That is the range.` };
    if (mode === 'quartiles') {
      const h = Math.floor(n / 2);
      const lower = v.slice(0, h), upper = v.slice(n - h);
      return { lit: [...midIdx(0, n)], soft: [...midIdx(0, h), ...midIdx(n - h, h)], text: `Median <b>${mid(v)}</b>. The middle of the lower half is <b>${mid(lower)}</b> (Q1) and of the upper half <b>${mid(upper)}</b> (Q3).` };
    }
    if (mode === 'median') {
      const counts = new Map();
      for (const x of v) counts.set(x, (counts.get(x) ?? 0) + 1);
      const top = Math.max(...counts.values());
      const modeText = top > 1 ? ` ${[...counts].filter(([, c]) => c === top).map(([x]) => signed(x)).join(' and ')} shows up most: the mode.` : '';
      const m = midIdx(0, n);
      const medText = m.length === 1 ? `The middle card is <b>${signed(v[m[0]])}</b>: the median.` : `The two middle cards are ${signed(v[m[0]])} and ${signed(v[m[1]])}. Halfway between is <b>${mid(v)}</b>: the median.`;
      return { lit: m, text: medText + modeText };
    }
    return { lit: [], text: `In order: <b>${v.map(signed).join(', ')}</b>.` };
  }

  render() {
    const card = (c, cls, onClick) => {
      const b = el('button', { class: `step-op num card${cls ? ` ${cls}` : ''}`, type: 'button', text: signed(c.v) });
      if (onClick) b.addEventListener('click', onClick); else b.disabled = true;
      return b;
    };
    const s = this.done ? this.summary() : null;
    const row = el('div', { class: 'step-row card-row sorted' }, ...this.row.map((c, i) => card(c, s?.lit.includes(i) ? 'picked' : s?.soft?.includes(i) ? 'soft' : '', null)));
    const pile = el('div', { class: 'step-row card-row' }, ...this.left.map((c) => card(c, '', () => this.pick(c))));
    const msg = s ? s.text : this.msg ?? (this.row.length ? 'Keep going: tap the least card that is left.' : 'Tap the cards from least to greatest.');
    this.root.replaceChildren(...(this.done ? [] : [pile, el('div', { class: 'card-arrow', text: '↓' })]), row, el('div', { class: 'manip-readout', html: msg }));
  }
}

// ------------------------------------------------------------ histogram bins
// Drop each number into the interval it belongs to; the stacks become the bars of a histogram.
// cfg: { values, bins: [[lo, hi], ...], name }
export class Bins extends Model {
  static kind = 'bins';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.k = 0;
    this.counts = cfg.bins.map(() => 0);
    this.msg = null;
    this.render();
  }

  get done() { return this.k >= this.cfg.values.length; }

  binOf(v) { return this.cfg.bins.findIndex(([lo, hi]) => v >= lo && v <= hi); }

  solve() { for (; this.k < this.cfg.values.length; this.k++) this.counts[this.binOf(this.cfg.values[this.k])] += 1; this.msg = null; this.changed(); }

  describe() { return `Counts: ${this.cfg.bins.map(([lo, hi], i) => `${lo} to ${hi}: ${this.counts[i]}`).join(', ')}.`; }

  drop(i) {
    if (this.done) return;
    const v = this.cfg.values[this.k];
    const [lo, hi] = this.cfg.bins[i];
    if (this.binOf(v) !== i) { this.msg = `${v} is not between ${lo} and ${hi}. Try another bar.`; this.changed(); return; }
    this.counts[i] += 1;
    this.k += 1;
    this.msg = null;
    this.changed();
  }

  render() {
    const { bins, values } = this.cfg;
    const W = 520, H = 230, left = 34, bottom = 40, top = 14;
    const maxV = Math.max(4, ...bins.map((_, i) => values.filter((v) => this.binOf(v) === i).length));
    const bw = (W - left - 10) / bins.length;
    const Y = (v) => H - bottom - ((H - bottom - top) * v) / maxV;
    const svg = svgRoot(W, H, 'histogram bins');
    for (let v = 0; v <= maxV; v++) {
      svg.append(svgEl('line', { x1: left, y1: Y(v), x2: W - 8, y2: Y(v), class: 'v-gridline' }));
      svg.append(txt(left - 8, Y(v), String(v), 'v-t2', 11, 'end'));
    }
    bins.forEach(([lo, hi], i) => {
      const x = left + i * bw;
      const g = svgEl('g', { class: 'tap' });
      g.append(svgEl('rect', { x: x + 2, y: top, width: bw - 4, height: Y(0) - top, rx: 6, class: 'v-empty' }));
      if (this.counts[i]) g.append(svgEl('rect', { x, y: Y(this.counts[i]), width: bw, height: Y(0) - Y(this.counts[i]), class: 'v-fill v-edge' }));
      g.append(txt(x + bw / 2, H - bottom + 18, `${lo}–${hi}`, 'v-t2 v-strong', 13));
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); this.drop(i); });
      svg.append(g);
    });
    svg.append(svgEl('line', { x1: left, y1: Y(0), x2: W - 8, y2: Y(0), class: 'v-axis' }));
    const next = this.done ? null : values[this.k];
    const chips = el('div', { class: 'step-row card-row' }, ...values.map((v, i) => el('span', { class: `step-op num card${i === this.k ? ' picked' : i < this.k ? ' used' : ''}`, text: String(v) })));
    const msg = this.done ? 'Each bar counts the numbers in its interval. The bars touch because the intervals do: <b>a histogram</b>.'
      : this.msg ?? `Which bar does <b>${next}</b> belong in? Tap it.`;
    this.root.replaceChildren(chips, svg, el('div', { class: 'manip-readout', html: msg }));
  }
}

// ------------------------------------------------------------ copy and cut shapes
// 'tri': a triangle and a turned copy make a parallelogram. 'trap': a trapezoid and a turned copy make a
// parallelogram with both bases along the bottom. 'L': split an L shape into two rectangles.
// cfg: { shape, b, h, b2?, unit } for 'tri' and 'trap'; { shape: 'L', W, H, cw, ch, unit } for 'L'
export class ShapeCut extends Model {
  static kind = 'shapecut';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.copied = false;
    this.cut = null;
    this.render();
  }

  get done() { return this.cfg.shape === 'L' ? !!this.cut : this.copied; }

  solve() { if (this.cfg.shape === 'L') this.cut = 'v'; else this.copied = true; this.changed(); }

  describe() { return this.done ? 'The shape is split into easy pieces.' : 'One shape, waiting.'; }

  render() {
    const c = this.cfg, unit = c.unit ?? 'units';
    const top = c.shape === 'trap' ? c.b2 : 0, off = c.shape === 'trap' ? Math.max(0.5, (c.b - c.b2) / 2) : Math.round(c.b / 3);
    const span = c.shape === 'L' ? c.W : c.b + top + off;
    const S = Math.min(36, 460 / span, 170 / (c.shape === 'L' ? c.H : c.h));
    const W = 540, x0 = 30, y0 = 20 + (c.shape === 'L' ? c.H : c.h) * S;
    const svg = svgRoot(W, y0 + 46, 'shape on a grid');
    const P = (x, y) => `${x0 + x * S},${y0 - y * S}`;
    const poly = (pts, cls) => svgEl('polygon', { points: pts.map(([x, y]) => P(x, y)).join(' '), class: cls });
    const cols = Math.ceil(span) + 1, rows = Math.ceil(c.shape === 'L' ? c.H : c.h);
    for (let i = 0; i <= cols; i++) svg.append(svgEl('line', { x1: x0 + i * S, y1: y0, x2: x0 + i * S, y2: y0 - rows * S, class: 'v-gridline' }));
    for (let j = 0; j <= rows; j++) svg.append(svgEl('line', { x1: x0, y1: y0 - j * S, x2: x0 + cols * S, y2: y0 - j * S, class: 'v-gridline' }));
    let msg;
    const buttons = [];
    if (c.shape === 'L') {
      // An L: full width W along the bottom ch tall, and a tower cw wide up to H on the left.
      const pts = [[0, 0], [c.W, 0], [c.W, c.ch], [c.cw, c.ch], [c.cw, c.H], [0, c.H]];
      svg.append(poly(pts, 'v-fill v-soft v-edge'));
      if (this.cut === 'v') svg.append(svgEl('line', { x1: x0 + c.cw * S, y1: y0, x2: x0 + c.cw * S, y2: y0 - c.ch * S, class: 'v-dash' }));
      if (this.cut === 'h') svg.append(svgEl('line', { x1: x0, y1: y0 - c.ch * S, x2: x0 + c.cw * S, y2: y0 - c.ch * S, class: 'v-dash' }));
      svg.append(txt(x0 + (c.W * S) / 2, y0 + 18, `${c.W} ${unit}`, 'v-t v-strong', 15));
      svg.append(txt(x0 - 8, y0 - (c.H * S) / 2, `${c.H}`, 'v-t v-strong', 15, 'end'));
      svg.append(txt(x0 + (c.cw * S) / 2, y0 - c.H * S - 10, `${c.cw}`, 'v-t v-strong', 15));
      svg.append(txt(x0 + c.W * S + 8, y0 - (c.ch * S) / 2, `${c.ch}`, 'v-t v-strong', 15, 'start'));
      buttons.push(button('Cut straight up', () => { this.cut = 'v'; this.changed(); }), button('Cut straight across', () => { this.cut = 'h'; this.changed(); }));
      if (this.cut === 'v') {
        const a1 = c.cw * c.H, a2 = (c.W - c.cw) * c.ch;
        msg = `${c.cw} × ${c.H} = ${a1} and ${c.W - c.cw} × ${c.ch} = ${a2}. Together: <b>${a1 + a2}</b> square ${unit}.`;
      } else if (this.cut === 'h') {
        const a1 = c.W * c.ch, a2 = c.cw * (c.H - c.ch);
        msg = `${c.W} × ${c.ch} = ${a1} and ${c.cw} × ${c.H - c.ch} = ${a2}. Together: <b>${a1 + a2}</b> square ${unit}.`;
      } else msg = 'Cut the shape into two rectangles. Either way works!';
    } else {
      const pts = c.shape === 'trap' ? [[0, 0], [c.b, 0], [off + top, c.h], [off, c.h]] : [[0, 0], [c.b, 0], [off, c.h]];
      if (this.copied) {
        // The copy, turned halfway round, fits against the slanted right side.
        const turned = pts.map(([x, y]) => [c.b + off + top - x, c.h - y]);
        svg.append(poly(turned, 'v-fill2 v-soft v-edge'));
      }
      svg.append(poly(pts, 'v-fill v-soft v-edge'));
      svg.append(svgEl('line', { x1: x0 + off * S, y1: y0, x2: x0 + off * S, y2: y0 - c.h * S, class: 'v-dash' }));
      svg.append(txt(x0 + (c.b * S) / 2, y0 + 18, `${c.b} ${unit}`, 'v-t v-strong', 15));
      svg.append(txt(x0 + off * S + 6, y0 - (c.h * S) / 2, `${c.h}`, 'v-t v-strong', 15, 'start'));
      if (c.shape === 'trap') svg.append(txt(x0 + (off + top / 2) * S, y0 - c.h * S - 10, `${c.b2}`, 'v-t v-strong', 15));
      buttons.push(button('Copy it and turn it around', () => { this.copied = true; this.changed(); }, 'btn small', this.copied));
      if (this.copied) {
        const base = c.shape === 'trap' ? c.b + c.b2 : c.b, whole = base * c.h;
        msg = c.shape === 'trap'
          ? `Two trapezoids make a parallelogram ${c.b} + ${c.b2} = ${base} long and ${c.h} high: ${base} × ${c.h} = ${whole}. One trapezoid is half: <b>${whole / 2}</b> square ${unit}.`
          : `Two triangles make a parallelogram: ${c.b} × ${c.h} = ${whole}. One triangle is half of it: <b>${whole / 2}</b> square ${unit}.`;
      } else msg = `How much space does this ${c.shape === 'trap' ? 'trapezoid' : 'triangle'} cover? Make a copy and see what the two make together.`;
    }
    this.root.replaceChildren(svg, el('div', { class: 'manip-buttons' }, ...buttons), el('div', { class: 'manip-readout', html: msg }));
  }
}

// ------------------------------------------------------------ box net
// The net of a box, laid flat. Tap every face to paint it and add its area.
// cfg: { l, w, h, unit }
export class BoxNet extends Model {
  static kind = 'net';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.painted = new Set();
    this.render();
  }

  faces() {
    const { l, w, h } = this.cfg;
    // A cross: the top in the middle, the front below it, the bottom below that, the back above, sides left and right.
    return [
      { id: 'back', x: h, y: 0, fw: l, fh: h, a: l * h },
      { id: 'left', x: 0, y: h, fw: h, fh: w, a: w * h },
      { id: 'top', x: h, y: h, fw: l, fh: w, a: l * w },
      { id: 'right', x: h + l, y: h, fw: h, fh: w, a: w * h },
      { id: 'front', x: h, y: h + w, fw: l, fh: h, a: l * h },
      { id: 'bottom', x: h, y: 2 * h + w, fw: l, fh: w, a: l * w },
    ];
  }

  get total() { return this.faces().reduce((s, f) => s + f.a, 0); }

  get done() { return this.painted.size === 6; }

  solve() { this.painted = new Set(this.faces().map((f) => f.id)); this.changed(); }

  describe() { return `${this.painted.size} of 6 faces painted.`; }

  render() {
    const { l, w, h, unit = 'units' } = this.cfg;
    const S = Math.min(30, 400 / (2 * h + l), 260 / (2 * h + 2 * w));
    const W = (2 * h + l) * S + 20, H = (2 * h + 2 * w) * S + 20;
    const svg = svgRoot(W, H, 'net of a box');
    svg.style.maxHeight = '300px';
    for (const f of this.faces()) {
      const on = this.painted.has(f.id);
      const g = svgEl('g', { class: 'tap' });
      g.append(svgEl('rect', { x: 10 + f.x * S, y: 10 + f.y * S, width: f.fw * S, height: f.fh * S, class: `${on ? 'v-fill' : 'v-empty'} v-edge` }));
      g.append(txt(10 + (f.x + f.fw / 2) * S, 10 + (f.y + f.fh / 2) * S, on ? String(f.a) : `${f.fw} × ${f.fh}`, on ? 'v-t v-strong' : 'v-t2', on ? 18 : 13));
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); if (on) this.painted.delete(f.id); else this.painted.add(f.id); this.changed(); });
      svg.append(g);
    }
    const sum = this.faces().filter((f) => this.painted.has(f.id)).reduce((s, f) => s + f.a, 0);
    const msg = this.done ? `All 6 faces: <b>${this.total}</b> square ${unit}. That is the box's surface area!`
      : `Tap each face to paint it. ${this.painted.size} of 6 painted, ${sum} square ${unit} so far.`;
    this.root.replaceChildren(svg, el('div', { class: 'manip-readout', html: msg }));
  }
}

// ------------------------------------------------------------ rows of multiples
// Two rows of multiples grow one at a time; the first number in both rows is the least common multiple.
// cfg: { a, b, names: [A, B] }
export class Multiples extends Model {
  static kind = 'multiples';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.na = 1; this.nb = 1;
    this.render();
  }

  get lcm() { const g = (x, y) => (y ? g(y, x % y) : x); return (this.cfg.a * this.cfg.b) / g(this.cfg.a, this.cfg.b); }

  get rows() { return [Array.from({ length: this.na }, (_, i) => this.cfg.a * (i + 1)), Array.from({ length: this.nb }, (_, i) => this.cfg.b * (i + 1))]; }

  get done() { const [ra, rb] = this.rows; return ra.includes(this.lcm) && rb.includes(this.lcm); }

  solve() { this.na = this.lcm / this.cfg.a; this.nb = this.lcm / this.cfg.b; this.changed(); }

  describe() { const [ra, rb] = this.rows; return `Multiples of ${this.cfg.a}: ${ra.join(', ')}. Multiples of ${this.cfg.b}: ${rb.join(', ')}.`; }

  render() {
    const { a, b, names = [`Hops of ${a}`, `Hops of ${b}`] } = this.cfg;
    const [ra, rb] = this.rows;
    const both = new Set(ra.filter((v) => rb.includes(v)));
    const line = (vals, name, onMore, k) => el('div', { class: 'mult-line' },
      el('div', { class: 'share-name', text: name }),
      el('div', { class: 'step-row card-row' }, ...vals.map((v) => el('span', { class: `step-op num card${both.has(v) ? ' picked' : ''}`, text: String(v) }))),
      button(`+ ${k}`, onMore, 'btn small', vals.length >= 12));
    const msg = this.done ? `<b>${this.lcm}</b> is in both rows, and it is the first one. That is the least common multiple!`
      : 'Grow each row of multiples. Look for the first number that shows up in both rows.';
    this.root.replaceChildren(
      line(ra, names[0], () => { this.na += 1; this.changed(); }, a),
      line(rb, names[1], () => { this.nb += 1; this.changed(); }, b),
      el('div', { class: 'manip-readout', html: msg }));
  }
}

// ------------------------------------------------------------ distances from the mean
// Dots on a number line with the mean marked. Tap each dot to measure how far it is from the mean.
// cfg: { values, min, max, name }
export class Spread extends Model {
  static kind = 'spread';

  constructor(host, cfg, onChange) {
    super(host, cfg, onChange);
    this.seen = new Set();
    this.render();
  }

  get mean() { return this.cfg.values.reduce((s, v) => s + v, 0) / this.cfg.values.length; }

  get done() { return this.seen.size === this.cfg.values.length; }

  solve() { this.seen = new Set(this.cfg.values.map((_, i) => i)); this.changed(); }

  describe() { return `Mean ${this.mean}. ${this.seen.size} distances measured.`; }

  render() {
    const { values, min, max } = this.cfg;
    const W = 560, x0 = 30, x1 = W - 30, y = 150;
    const X = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0);
    const svg = svgRoot(W, 200, 'dots and the mean');
    svg.append(svgEl('line', { x1: x0 - 10, y1: y, x2: x1 + 10, y2: y, class: 'v-axis' }));
    for (let v = min; v <= max; v++) {
      svg.append(svgEl('line', { x1: X(v), y1: y - 6, x2: X(v), y2: y + 6, class: 'v-tick' }));
      svg.append(txt(X(v), y + 22, String(v), 'v-t2', 12));
    }
    const m = this.mean;
    svg.append(svgEl('path', { d: `M${X(m)},${y + 8} l-10,18 h20 z`, class: 'v-mark' }));
    svg.append(txt(X(m), y + 40, `mean ${m}`, 'v-t v-strong', 13));
    const stack = new Map();
    values.forEach((v, i) => {
      const k = stack.get(v) ?? 0;
      stack.set(v, k + 1);
      const cy = y - 16 - k * 22;
      const on = this.seen.has(i);
      if (on && v !== m) {
        const lift = 24 + k * 22 + (v < m ? 0 : 8);
        svg.append(svgEl('path', { d: `M${X(v)},${cy} Q${(X(v) + X(m)) / 2},${cy - lift} ${X(m)},${y - 12}`, class: 'v-arc2' }));
        svg.append(txt((X(v) + X(m)) / 2, cy - lift / 2 - 6, String(Math.abs(v - m)), 'v-t v-strong', 14));
      }
      const dot = svgEl('circle', { cx: X(v), cy, r: 9, class: `${on ? 'v-mark' : 'v-fill'} v-edge tap` });
      dot.addEventListener('pointerdown', (e) => { e.preventDefault(); this.seen.add(i); this.changed(); });
      svg.append(dot);
    });
    const d = values.map((v) => Math.abs(v - m));
    const total = d.reduce((s, x) => s + x, 0);
    const msg = this.done
      ? `Distances: ${d.join(' + ')} = ${total}. Shared out over ${values.length} dots: ${total} ÷ ${values.length} = <b>${total / values.length}</b>. That is the mean absolute deviation.`
      : 'Tap each dot to see how far it is from the mean.';
    this.root.replaceChildren(svg, el('div', { class: 'manip-readout', html: msg }));
  }
}

export const GRADE6_MODELS = { balance: Balance, ratiotable: RatioTable, cards: Cards, bins: Bins, shapecut: ShapeCut, net: BoxNet, multiples: Multiples, spread: Spread };
