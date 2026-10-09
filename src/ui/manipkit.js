// What every hands-on model shares: the base class and small SVG helpers.
// Every model: new Model(host, cfg, onChange) renders into host; `.done` says the goal is met; `.solve()`
// shows the answer (the "Show me" button); `.describe()` says what the model shows now, for read-aloud.
import { el } from './dom.js';

const NS = 'http://www.w3.org/2000/svg';
export const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};
export const svgRoot = (w, h, label) => svgEl('svg', { class: 'vis manip-svg', viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label });
export const txt = (x, y, s, cls = 'v-t', size = 16, anchor = 'middle') => {
  const t = svgEl('text', { x, y, class: cls, 'font-size': size, 'text-anchor': anchor, 'dominant-baseline': 'middle' });
  t.textContent = s;
  return t;
};
// Pointer position in SVG units.
export function svgPoint(svg, e) {
  const p = svg.createSVGPoint();
  p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
// Negative numbers are written with a real minus sign.
export const signed = (v) => (v < 0 ? `−${-v}` : String(v));

export class Model {
  constructor(host, cfg, onChange) {
    this.host = host; this.cfg = cfg; this.onChange = onChange;
    this.root = el('div', { class: `manip ${this.constructor.kind ?? ''}` });
    host.append(this.root);
  }

  changed() { this.render(); this.onChange?.(this); }

  destroy() { this.root.remove(); }
}

export function button(text, onClick, cls = 'btn small', disabled = false) {
  const b = el('button', { class: cls, type: 'button', text });
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
}
