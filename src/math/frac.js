// Exact rational arithmetic and answer parsing. No DOM, no three.js.

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

export class Frac {
  constructor(n, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`bad fraction ${n}/${d}`);
    if (d < 0) { n = -n; d = -d; }
    this.n = n; // kept unreduced on purpose (the parser needs to know what was typed)
    this.d = d;
  }
  static of(x) {
    if (x instanceof Frac) return x;
    if (Number.isInteger(x)) return new Frac(x, 1);
    return Frac.fromDecimalString(String(x));
  }
  static fromDecimalString(s) {
    const m = /^(-)?(\d*)(?:\.(\d+))?$/.exec(s.trim());
    if (!m || (m[2] === '' && !m[3])) throw new Error('not a decimal: ' + s);
    const places = m[3] ? m[3].length : 0;
    const d = 10 ** places;
    const n = parseInt((m[2] || '0') + (m[3] || ''), 10);
    return new Frac(m[1] ? -n : n, d);
  }
  get reduced() { const g = gcd(this.n, this.d); return new Frac(this.n / g, this.d / g); }
  get isReduced() { return gcd(this.n, this.d) === 1; }
  get value() { return this.n / this.d; }
  get isWhole() { return this.n % this.d === 0; }
  add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d).reduced; }
  sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d).reduced; }
  mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d).reduced; }
  div(o) { o = Frac.of(o); return new Frac(this.n * o.d, this.d * o.n).reduced; }
  cmp(o) { o = Frac.of(o); return Math.sign(this.n * o.d - o.n * this.d); }
  eq(o) { return this.cmp(o) === 0; }
  toString() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }
  // Decimal string if the value terminates within 6 places, else null.
  toDecimal() {
    const r = this.reduced;
    let d = r.d;
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    if (d !== 1) return null;
    const v = r.n / r.d;
    return String(Math.round(v * 1e6) / 1e6);
  }
}

// Parse a typed answer into a structured value.
// Returns { kind: 'number'|'fraction'|'mixed'|'remainder'|'pair'|'invalid', value?: Frac, ... }
export function parseAnswer(raw) {
  if (raw === null || raw === undefined) return { kind: 'invalid' };
  let s = String(raw).trim().toLowerCase();
  s = s.replace(/[−–—]/g, '-').replace(/\s+/g, ' ');
  s = s.replace(/^\$\s*/, '').replace(/^-\s*\$\s*/, '-').replace(/\s*(°|degrees?|deg)$/, '').replace(/\s*%$/, '');
  if (s === '') return { kind: 'invalid' };

  // Remainder: "12 r3", "12r 3", "12 remainder 3", "12 R 3"
  let m = /^(-?\d[\d,]*)\s*(?:r|rem|remainder)\s*(\d+)$/.exec(s);
  if (m) return { kind: 'remainder', q: toInt(m[1]), r: parseInt(m[2], 10) };

  // Ignore a trailing unit the kid may add: "26 ft", "12 square cm", "45 degrees", "8 fish".
  s = s.replace(/^([-\d.,/ ]*\d)\s+[a-z][a-z .]*$/, '$1').trim();

  // Pair: "(3, 4)" or "3,4" only when it has parentheses or a comma with spaces
  m = /^\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/.exec(s);
  if (m) return { kind: 'pair', x: Frac.fromDecimalString(m[1]), y: Frac.fromDecimalString(m[2]) };

  // Mixed number: "2 3/4" or "-2 3/4"
  m = /^(-)?(\d+) (\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m) {
    const w = parseInt(m[2], 10), n = parseInt(m[3], 10), d = parseInt(m[4], 10);
    if (d === 0) return { kind: 'invalid' };
    const sign = m[1] ? -1 : 1;
    return { kind: 'mixed', whole: w, num: n, den: d, value: new Frac(sign * (w * d + n), d) };
  }
  // Fraction: "3/4", "-3/4", "3 / 4"
  m = /^(-)?(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m) {
    const n = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (d === 0) return { kind: 'invalid' };
    return { kind: 'fraction', num: n, den: d, value: new Frac(m[1] ? -n : n, d) };
  }
  // Number with optional thousands separators and decimals: "1,234", "-0.5", ".75"
  const plain = s.replace(/,(?=\d{3}(\D|$))/g, '');
  m = /^(-)?(\d*)(\.\d+)?$/.exec(plain);
  if (m && (m[2] !== '' || m[3])) {
    return { kind: 'number', value: Frac.fromDecimalString(plain) };
  }
  return { kind: 'invalid' };
}

function toInt(s) { return parseInt(s.replace(/,/g, ''), 10); }
