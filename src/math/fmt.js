// Formatting and the tiny markup used in problem text:
//   {3/4} stacked fraction, {2 3/4} mixed number, **bold**, ^2 superscript after a number or letter.
import { Frac, gcd } from './frac.js';

export function fmtInt(n) {
  const s = String(Math.abs(n));
  const withCommas = Math.abs(n) >= 1000 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s;
  return (n < 0 ? '−' : '') + withCommas;
}

// Number (JS number or Frac) as a clean decimal string, commas on the whole part.
export function fmtNum(x, places = null) {
  const v = x instanceof Frac ? x.value : x;
  let s = places === null ? String(Math.round(v * 1e6) / 1e6) : v.toFixed(places);
  if (s.includes('e')) s = v.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  let [w, f] = s.split('.');
  w = fmtInt(parseInt(w, 10));
  return (neg ? '−' : '') + w + (f !== undefined ? '.' + f : '');
}

export const fmtMoney = (v) => (v < 0 ? '−$' : '$') + Math.abs(v).toFixed(2);

// Markup for a fraction value. mixed: show improper values as mixed numbers.
export function fracMarkup(f, { mixed = false, reduce = false } = {}) {
  f = Frac.of(f);
  if (reduce) f = f.reduced;
  if (f.d === 1) return fmtInt(f.n);
  const neg = f.n < 0;
  const n = Math.abs(f.n);
  if (mixed && n > f.d) {
    const w = Math.floor(n / f.d), r = n % f.d;
    if (r === 0) return (neg ? '−' : '') + fmtInt(w);
    return `{${neg ? '-' : ''}${w} ${r}/${f.d}}`;
  }
  return `{${neg ? '-' : ''}${n}/${f.d}}`;
}

// Plain-text typed form of a fraction answer ("3/4", "2 1/2").
export function fracTyped(f, { mixed = false } = {}) {
  f = Frac.of(f);
  if (f.d === 1) return String(f.n);
  const neg = f.n < 0;
  const n = Math.abs(f.n);
  if (mixed && n > f.d) {
    const w = Math.floor(n / f.d), r = n % f.d;
    return `${neg ? '-' : ''}${w}${r ? ` ${r}/${f.d}` : ''}`;
  }
  return `${neg ? '-' : ''}${n}/${f.d}`;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const box = (v) => (v === '?' ? '<span class="unknown">?</span>' : v);

export function toHTML(markup) {
  let s = esc(markup);
  s = s.replace(/\{(-?)([\d?]+) ([\d?]+)\/([\d?]+)\}/g, (_, neg, w, n, d) =>
    `<span class="mixed">${neg ? '−' : ''}${box(w)}<span class="frac"><span class="fn">${box(n)}</span><span class="fd">${box(d)}</span></span></span>`);
  s = s.replace(/\{(-?)([\d?]+)\/([\d?]+)\}/g, (_, neg, n, d) =>
    `${neg ? '−' : ''}<span class="frac"><span class="fn">${box(n)}</span><span class="fd">${box(d)}</span></span>`);
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  s = s.replace(/([0-9a-z)])\^(\d+)/gi, '$1<sup>$2</sup>');
  return s;
}

const DEN_NAMES = {
  2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'],
  7: ['seventh', 'sevenths'], 8: ['eighth', 'eighths'], 9: ['ninth', 'ninths'], 10: ['tenth', 'tenths'], 12: ['twelfth', 'twelfths'],
  100: ['hundredth', 'hundredths'], 1000: ['thousandth', 'thousandths'],
};

function fracWords(n, d) {
  if (n === '?' || Number.isNaN(d)) return `what over ${Number.isNaN(d) ? 'what' : d}`;
  const names = DEN_NAMES[d];
  if (!names) return `${n} over ${d}`;
  return `${n} ${n === '1' || n === 1 ? names[0] : names[1]}`;
}

export function toSpeech(markup) {
  let s = String(markup);
  s = s.replace(/\{(-?)([\d?]+) ([\d?]+)\/([\d?]+)\}/g, (_, neg, w, n, d) => `${neg ? 'negative ' : ''}${w} and ${fracWords(n, +d)}`);
  s = s.replace(/\{(-?)([\d?]+)\/([\d?]+)\}/g, (_, neg, n, d) => `${neg ? 'negative ' : ''}${fracWords(n, +d)}`);
  s = s.replace(/\*\*/g, '');
  // A minus sign in front of a number is a negative number, read the way a teacher says it.
  s = s.replace(/(^|[\s(=,:])−(\d)/g, '$1negative $2');
  s = s.replace(/(\w)\^2/g, '$1 squared').replace(/(\w)\^3/g, '$1 cubed').replace(/(\w)\^(\d+)/g, '$1 to the power of $2');
  s = s.replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/−/g, ' minus ').replace(/\+/g, ' plus ')
    .replace(/=/g, ' equals ').replace(/○/g, ' compared to ').replace(/°/g, ' degrees').replace(/\?/g, ' what?');
  return s.replace(/\s+/g, ' ').trim();
}

export function simplifySteps(f) {
  const g = gcd(f.n, f.d);
  if (g === 1) return null;
  return `Divide the top and bottom by ${g}: {${f.n}/${f.d}} = {${f.n / g}/${f.d / g}}.`;
}
