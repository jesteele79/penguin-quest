export function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return e;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function escapeHTML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Arrow-key navigation between focusable buttons inside a container.
export function arrowNav(container, e, selector = 'button:not([disabled]), [data-nav]:not([disabled])') {
  const items = $$(selector, container).filter((b) => b.offsetParent !== null);
  if (!items.length) return false;
  const i = items.indexOf(document.activeElement);
  const cols = Number(container.dataset.cols || 1);
  let next = null;
  if (e.key === 'ArrowDown') next = i < 0 ? 0 : Math.min(items.length - 1, i + cols);
  else if (e.key === 'ArrowUp') next = i < 0 ? 0 : Math.max(0, i - cols);
  else if (e.key === 'ArrowRight' && cols > 1) next = i < 0 ? 0 : Math.min(items.length - 1, i + 1);
  else if (e.key === 'ArrowLeft' && cols > 1) next = i < 0 ? 0 : Math.max(0, i - 1);
  if (next === null) return false;
  items[next].focus();
  e.preventDefault();
  return true;
}

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

// Character colours double as name text on the night-blue panels; dark ones (the captain's navy) are lifted until they pass WCAG AA for large bold text.
export function readable(hex, bg = '#1b2466', ratio = 3.4) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const b = parseInt(bg.slice(1), 16);
  const lb = lum([(b >> 16) & 255, (b >> 8) & 255, b & 255]);
  for (let i = 0; i < 30 && (lum(c) + 0.05) / (lb + 0.05) < ratio; i++) c = c.map((v) => v + (255 - v) * 0.12);
  return `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}
