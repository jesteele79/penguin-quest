// Number sense, expressions and equations (grades 4-6): Gloom Ridge in Book 1, the Clockwork Observatory
// in Book 3.
import { P, num, pick, makeChoices, labelNum, nearInts } from '../build.js';
import { gcd, lcm } from '../frac.js';
import { fmtInt } from '../fmt.js';

const D = 'ridge';
const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];
const neg = (n) => (n < 0 ? `−${-n}` : String(n));

function distinctDigits(rng, len) {
  let d = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, len);
  if (d[0] === 0) [d[0], d[1]] = [d[1], d[0]];
  return d;
}

const placeValue = {
  id: 'place_value', domain: D, grade: 4, cc: '4.NBT.2', name: 'Place value', short: 'place value',
  gen(rng, tier) {
    const len = tier === 1 ? 4 : tier === 2 ? 5 : 6;
    const digits = distinctDigits(rng, len);
    const n = parseInt(digits.join(''), 10);
    let idx;
    do { idx = rng.int(0, len - 1); } while (digits[idx] === 0);
    const digit = digits[idx];
    const power = len - 1 - idx;
    const value = digit * 10 ** power;
    if (tier >= 2 && rng.chance(0.35)) {
      const parts = digits.map((d, i) => d * 10 ** (len - 1 - i)).filter((v) => v > 0);
      const correct = parts.map(fmtInt).join(' + ');
      const shifted = digits.map((d, i) => d * 10 ** Math.max(0, len - 2 - i)).filter((v) => v > 0).map(fmtInt).join(' + ');
      const digitsOnly = digits.filter((d) => d > 0).join(' + ');
      const choices = [{ label: correct, value: 'c', correct: true }];
      for (const [lab, why] of [[shifted, 'Check each digit\'s place. The first digit is worth the most.'], [digitsOnly, 'Each digit is worth its place value, not just the digit.'], [parts.slice(0, -1).map(fmtInt).join(' + '), 'Every non-zero digit needs a part.']]) {
        if (lab && !choices.some((c) => c.label === lab)) choices.push({ label: lab, value: lab, why });
      }
      return P({
        skill: this.id, tier,
        text: `Which is the expanded form of ${fmtInt(n)}?`,
        answer: pick(), choices: rng.shuffle(choices),
        hint: 'Write each digit times its place value, then add.',
        steps: [`${fmtInt(n)} = ${correct}.`],
        answerText: correct,
        meta: {},
      });
    }
    return P({
      skill: this.id, tier,
      text: `What is the value of the ${digit} in ${fmtInt(n)}?`,
      visual: { kind: 'placeValue', digits, whole: len, highlight: idx },
      answer: num(value),
      choices: makeChoices(rng, value, [
        { value: digit, why: `The digit is ${digit}, but it is in the ${PLACES[power]} place.` },
        value * 10, value / 10 >= 1 ? value / 10 : value * 100, digit * 10 ** Math.max(0, power - 2),
      ], labelNum),
      hint: `Which place is the ${digit} in? Count places from the right: ones, tens, hundreds...`,
      steps: [`The ${digit} is in the ${PLACES[power]} place.`, `${digit} ${PLACES[power]} = ${fmtInt(value)}.`],
      meta: { value },
    });
  },
};

const rounding = {
  id: 'rounding', domain: D, grade: 4, cc: '4.NBT.3', name: 'Rounding', short: 'rounding',
  gen(rng, tier) {
    const unit = tier === 1 ? 10 : tier === 2 ? 100 : rng.pick([1000, 10000]);
    const n = rng.int(unit + 1, unit * 99);
    if (n % unit === 0) return rounding.gen(rng, tier);
    const low = Math.floor(n / unit) * unit, high = low + unit;
    const nextDigit = Math.floor((n % unit) / (unit / 10));
    const up = nextDigit >= 5;
    const ans = up ? high : low;
    const placeName = { 10: 'ten', 100: 'hundred', 1000: 'thousand', 10000: 'ten thousand' }[unit];
    return P({
      skill: this.id, tier,
      text: `Round ${fmtInt(n)} to the nearest ${placeName}.`,
      visual: { kind: 'numline', min: low, max: high, marks: [{ v: n, label: fmtInt(n) }], places: 0 },
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: up ? low : high, why: `Look at the digit to the right of the ${placeName}s place (${nextDigit}). ${up ? '5 or more rounds up.' : 'Less than 5 rounds down.'}` }, n, ans + unit, ans - unit], labelNum),
      hint: `Is ${fmtInt(n)} closer to ${fmtInt(low)} or ${fmtInt(high)}? Check the next digit to the right.`,
      steps: [`${fmtInt(n)} is between ${fmtInt(low)} and ${fmtInt(high)}.`, `The next digit is ${nextDigit}, so round ${up ? 'up' : 'down'}.`, `${fmtInt(n)} rounds to ${fmtInt(ans)}.`],
      meta: { value: ans },
    });
  },
};

function noCarrySum(a, b) {
  const A = String(a).split('').reverse(), B = String(b).split('').reverse();
  const out = [];
  for (let i = 0; i < Math.max(A.length, B.length); i++) out.push((+(A[i] || 0) + +(B[i] || 0)) % 10);
  return parseInt(out.reverse().join(''), 10);
}
function smallerFromLarger(a, b) {
  const A = String(a).split('').reverse(), B = String(b).split('').reverse();
  const out = [];
  for (let i = 0; i < A.length; i++) out.push(Math.abs(+(A[i] || 0) - +(B[i] || 0)));
  return parseInt(out.reverse().join(''), 10);
}

const addSub = {
  id: 'addsub_multi', domain: D, grade: 4, cc: '4.NBT.4', name: 'Add and subtract big numbers', short: 'multi-digit + −',
  gen(rng, tier) {
    const lo = tier === 1 ? 100 : tier === 2 ? 1000 : 10000, hi = lo * 10 - 1;
    let a = rng.int(lo, hi), b = rng.int(lo, hi);
    const add = rng.chance(0.5);
    if (!add) {
      if (a < b) [a, b] = [b, a];
      // Zeros in the middle make kids regroup across places.
      if (tier === 3 && rng.chance(0.5)) a = Math.floor(a / 1000) * 1000 + rng.int(0, 9);
      if (a <= b) b = rng.int(Math.floor(lo / 2), a - lo / 10);
    }
    const ans = add ? a + b : a - b;
    const wrong = add
      ? [{ value: noCarrySum(a, b), why: 'When a column adds up to 10 or more, carry the extra ten to the next column.' }]
      : [{ value: smallerFromLarger(a, b), why: 'When the top digit is smaller, regroup: borrow 1 from the next place.' }];
    return P({
      skill: this.id, tier,
      text: `What is ${fmtInt(a)} ${add ? '+' : '−'} ${fmtInt(b)}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [...wrong, ans + 10, ans - 100, ans + 1000, ...nearInts(rng, ans, 100)], labelNum),
      hintVisual: { kind: 'column', rows: [fmtInt(a), fmtInt(b)], op: add ? '+' : '−' },
      hint: add ? 'Line up the places. Add from the ones column, carrying when a column makes 10 or more.' : 'Line up the places. Subtract from the ones column, regrouping when the top digit is too small.',
      steps: add
        ? [`Line up ${fmtInt(a)} and ${fmtInt(b)} by place value.`, 'Add each column from right to left, carrying tens.', `${fmtInt(a)} + ${fmtInt(b)} = ${fmtInt(ans)}.`, `Check: ${fmtInt(ans)} − ${fmtInt(b)} = ${fmtInt(a)}.`]
        : [`Line up ${fmtInt(a)} and ${fmtInt(b)} by place value.`, 'Subtract each column from right to left, regrouping when needed.', `${fmtInt(a)} − ${fmtInt(b)} = ${fmtInt(ans)}.`, `Check: ${fmtInt(ans)} + ${fmtInt(b)} = ${fmtInt(a)}.`],
      meta: { op: add ? '+' : '-', a, b },
    });
  },
};

const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const factorsOf = (n) => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };

const factors = {
  id: 'factors', domain: D, grade: 4, cc: '4.OA.4', name: 'Factors, multiples and primes', short: 'factors & primes',
  gen(rng, tier) {
    const kind = tier === 1 ? rng.int(0, 1) : tier === 2 ? rng.int(1, 2) : rng.int(2, 3);
    if (kind === 0) {
      const n = rng.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48]);
      const fs = factorsOf(n).filter((f) => f > 1 && f < n);
      const f = rng.pick(fs);
      const nots = [];
      for (let k = 2; k < n && nots.length < 8; k++) if (n % k) nots.push(k);
      const wrong = rng.shuffle(nots).slice(0, 3);
      const choices = rng.shuffle([{ label: String(f), value: f, correct: true }, ...wrong.map((w) => ({ label: String(w), value: w, why: `${n} ÷ ${w} leaves a remainder, so ${w} is not a factor.` }))]);
      return P({
        skill: this.id, tier,
        text: `Which number is a factor of ${n}?`,
        answer: pick(), choices,
        hint: `A factor divides ${n} with nothing left over.`,
        steps: [`${n} ÷ ${f} = ${n / f} with no remainder.`, `So ${f} is a factor of ${n}.`],
        answerText: String(f),
        meta: {},
      });
    }
    if (kind === 1) {
      const n = rng.chance(0.5) ? rng.pick([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71]) : rng.pick([9, 15, 21, 25, 27, 33, 35, 39, 49, 51, 57, 63, 77, 81, 87, 91]);
      const prime = isPrime(n);
      const fs = factorsOf(n);
      const why = prime ? `${n} can only be divided evenly by 1 and ${n}.` : `${n} = ${fs[1]} × ${n / fs[1]}, so it has more than two factors.`;
      return P({
        skill: this.id, tier,
        text: `Is ${n} prime or composite?`,
        answer: pick(),
        choices: [{ label: 'prime', value: 'prime', correct: prime, why: prime ? undefined : why }, { label: 'composite', value: 'composite', correct: !prime, why: prime ? why : undefined }],
        hint: 'A prime number has exactly two factors: 1 and itself.',
        steps: [`Factors of ${n}: ${fs.join(', ')}.`, prime ? `Only 1 and ${n}, so ${n} is prime.` : `More than two factors, so ${n} is composite.`],
        answerText: prime ? 'prime' : 'composite',
        meta: {},
      });
    }
    if (kind === 2) {
      const k = rng.int(3, 12), above = rng.int(20, 90);
      const ans = (Math.floor(above / k) + 1) * k;
      return P({
        skill: this.id, tier,
        text: `What is the smallest multiple of ${k} that is greater than ${above}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [ans - k, ans + k, above + 1, ans + 1], labelNum),
        hint: `Count by ${k}s until you pass ${above}.`,
        steps: [`${k} × ${Math.floor(above / k)} = ${Math.floor(above / k) * k}, which is not more than ${above}.`, `${k} × ${Math.floor(above / k) + 1} = ${ans}.`],
        meta: { value: ans },
      });
    }
    const n = rng.pick([12, 16, 18, 20, 24, 28, 30, 36]);
    const fs = factorsOf(n);
    return P({
      skill: this.id, tier,
      text: `How many factors does ${n} have?`,
      answer: num(fs.length),
      choices: makeChoices(rng, fs.length, [fs.length - 2, fs.length - 1, fs.length + 1, fs.length + 2], labelNum),
      hint: `List factor pairs: 1 × ${n}, 2 × ..., and so on. Don't forget 1 and ${n}.`,
      steps: [`Factor pairs of ${n}: ${fs.filter((f) => f * f <= n).map((f) => `${f} × ${n / f}`).join(', ')}.`, `Factors: ${fs.join(', ')}.`, `That is ${fs.length} factors.`],
      meta: { value: fs.length },
    });
  },
};

const patterns = {
  id: 'patterns', domain: D, grade: 4, cc: '4.OA.5', name: 'Number patterns', short: 'patterns',
  gen(rng, tier) {
    let seq, rule, next;
    if (tier === 3 && rng.chance(0.6)) {
      const r = rng.int(2, 3), s = rng.int(1, 5);
      seq = [s]; for (let i = 0; i < 4; i++) seq.push(seq[i] * r);
      rule = `multiply by ${r}`;
      next = seq[4] * r;
    } else {
      const k = tier === 1 ? rng.int(2, 9) : rng.int(6, 25);
      const down = tier > 1 && rng.chance(0.4);
      const start = down ? rng.int(k * 6, k * 6 + 60) : rng.int(1, 40);
      seq = [start]; for (let i = 0; i < 4; i++) seq.push(seq[i] + (down ? -k : k));
      rule = down ? `subtract ${k}` : `add ${k}`;
      next = seq[4] + (down ? -k : k);
      if (next < 0) return patterns.gen(rng, tier);
    }
    const shown = seq.slice(0, 4);
    const diff = shown[1] - shown[0];
    return P({
      skill: this.id, tier,
      text: `What number comes next?  ${shown.map(fmtInt).join(', ')}, ?`,
      answer: num(seq[4]),
      choices: makeChoices(rng, seq[4], [seq[4] + 1, shown[3] + diff + (diff > 0 ? 2 : -2), shown[3] * 2, seq[4] - 1, next], labelNum),
      hint: 'How does each number change to get the next one?',
      steps: [`The rule is: ${rule}.`, `${fmtInt(shown[3])} → ${fmtInt(seq[4])}.`],
      meta: { value: seq[4] },
    });
  },
};

function leftToRight(tokens) {
  let v = tokens[0];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i], x = tokens[i + 1];
    v = op === '+' ? v + x : op === '−' ? v - x : op === '×' ? v * x : v / x;
  }
  return v;
}

const orderOps = {
  id: 'order_ops', domain: D, grade: 5, cc: '5.OA.1', name: 'Order of operations', short: 'order of operations',
  gen(rng, tier) {
    if (tier === 1) {
      const a = rng.int(2, 20), b = rng.int(2, 9), c = rng.int(2, 9);
      const plus = rng.chance(0.5);
      const ans = plus ? a + b * c : a * b - c;
      if (ans <= 0) return orderOps.gen(rng, tier);
      const text = plus ? `${a} + ${b} × ${c}` : `${a} × ${b} − ${c}`;
      const wrong = plus ? (a + b) * c : a * (b - c);
      return P({
        skill: this.id, tier,
        text: `What is ${text}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: wrong, why: 'Multiply before you add or subtract.' }, ans + 1, ans - 2, ...nearInts(rng, ans, 5)], labelNum),
        hint: 'Multiplication comes before addition and subtraction.',
        steps: plus ? [`First multiply: ${b} × ${c} = ${b * c}.`, `Then add: ${a} + ${b * c} = ${ans}.`] : [`First multiply: ${a} × ${b} = ${a * b}.`, `Then subtract: ${a * b} − ${c} = ${ans}.`],
        meta: { value: ans },
      });
    }
    if (tier === 2) {
      const a = rng.int(2, 12), b = rng.int(2, 12), c = rng.int(2, 6);
      if (rng.chance(0.5)) {
        const ans = (a + b) * c;
        return P({
          skill: this.id, tier,
          text: `What is (${a} + ${b}) × ${c}?`,
          answer: num(ans),
          choices: makeChoices(rng, ans, [{ value: a + b * c, why: 'Do what is inside the parentheses first.' }, ans + c, ans - a, a * b * c], labelNum),
          hint: 'Parentheses first!',
          steps: [`Parentheses: ${a} + ${b} = ${a + b}.`, `Then multiply: ${a + b} × ${c} = ${ans}.`],
          meta: { value: ans },
        });
      }
      const d = rng.int(2, 6), q = rng.int(2, 9);
      const ans = a * b - q;
      if (ans <= 0) return orderOps.gen(rng, tier);
      const text = `${a} × ${b} − ${q * d} ÷ ${d}`;
      return P({
        skill: this.id, tier,
        text: `What is ${text}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: leftToRight([a, '×', b, '−', q * d, '÷', d]), why: 'Do both the × and the ÷ before you subtract.' }, ans + 1, ans + q, a * b], labelNum),
        hint: 'Do × and ÷ first (left to right), then + and −.',
        steps: [`${a} × ${b} = ${a * b}.`, `${q * d} ÷ ${d} = ${q}.`, `${a * b} − ${q} = ${ans}.`],
        meta: { value: ans },
      });
    }
    const a = rng.int(2, 5), b = rng.int(1, 6), c = rng.int(2, 4), e = rng.int(2, 3);
    const ans = a * (b + c ** e);
    return P({
      skill: this.id, tier,
      text: `What is ${a} × (${b} + ${c}^${e})?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: a * (b + c * e), why: `${c}^${e} means ${Array(e).fill(c).join(' × ')}, not ${c} × ${e}.` }, a * b + c ** e, (a * b + c) ** e > 5000 ? ans + a : (a * b + c) ** e, ans + a], labelNum),
      hint: 'Parentheses first. Inside them, do the exponent before adding.',
      steps: [`${c}^${e} = ${Array(e).fill(c).join(' × ')} = ${c ** e}.`, `${b} + ${c ** e} = ${b + c ** e}.`, `${a} × ${b + c ** e} = ${ans}.`],
      meta: { value: ans },
    });
  },
};

const exponents = {
  id: 'exponents', domain: D, grade: 6, cc: '6.EE.1', name: 'Exponents', short: 'exponents',
  gen(rng, tier) {
    let b, e;
    if (tier === 1) { b = rng.int(2, 10); e = 2; }
    else if (tier === 2) { if (rng.chance(0.4)) { b = 10; e = rng.int(2, 5); } else { b = rng.int(2, 5); e = 3; } }
    else {
      const x = rng.int(2, 6), y = rng.int(2, 6);
      const ans = x * x + y * y;
      return P({
        skill: this.id, tier,
        text: `What is ${x}^2 + ${y}^2?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: 2 * x + 2 * y, why: 'Squaring means multiplying a number by itself, not by 2.' }, (x + y) ** 2, ans + 1, x * y * 2], labelNum),
        hint: 'Square each number first, then add.',
        steps: [`${x}^2 = ${x} × ${x} = ${x * x}.`, `${y}^2 = ${y} × ${y} = ${y * y}.`, `${x * x} + ${y * y} = ${ans}.`],
        meta: { value: ans },
      });
    }
    const ans = b ** e;
    return P({
      skill: this.id, tier,
      text: `What is ${b}^${e}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: b * e, why: `${b}^${e} means ${e} copies of ${b} multiplied together, not ${b} × ${e}.` }, b + e, ans + b, b ** (e - 1)], labelNum),
      hint: `Multiply ${b} by itself ${e} times.`,
      steps: [`${b}^${e} = ${Array(e).fill(b).join(' × ')}.`, `= ${fmtInt(ans)}.`],
      meta: { value: ans },
    });
  },
};

const gcfLcm = {
  id: 'gcf_lcm', domain: D, grade: 6, cc: '6.NS.4', name: 'GCF and LCM', short: 'GCF & LCM',
  gen(rng, tier) {
    if (tier === 2 || (tier === 3 && rng.chance(0.5))) {
      let a = rng.int(3, 12), b = rng.int(3, 12);
      if (a === b) b += 1;
      const L = lcm(a, b);
      const word = tier === 3;
      return P({
        skill: this.id, tier,
        text: word ? `Fish sticks come in boxes of ${a}. Buns come in bags of ${b}. What is the smallest number of each you can buy to have the same number of fish sticks and buns?` : `What is the least common multiple (LCM) of ${a} and ${b}?`,
        answer: num(L),
        choices: makeChoices(rng, L, [{ value: a * b === L ? L + a * b : a * b, why: `${a} × ${b} is a common multiple, but not always the smallest.` }, L + a, gcd(a, b), L - b], labelNum),
        hint: `List multiples of ${Math.max(a, b)} until you find one that ${Math.min(a, b)} also divides.`,
        steps: [`Multiples of ${a}: ${[1, 2, 3, 4, 5].map((k) => a * k).join(', ')}...`, `Multiples of ${b}: ${[1, 2, 3, 4, 5].map((k) => b * k).join(', ')}...`, `The smallest one in both lists is ${L}.`],
        meta: { value: L },
      });
    }
    const g = rng.int(2, 9), x = rng.int(1, 6), y = rng.int(2, 7);
    const [p, q] = gcd(x, y) === 1 && x !== y ? [x, y] : [1, y + 1 === 1 ? 2 : y];
    const a = g * p, b = g * q;
    const G = gcd(a, b);
    return P({
      skill: this.id, tier,
      text: `What is the greatest common factor (GCF) of ${a} and ${b}?`,
      answer: num(G),
      choices: makeChoices(rng, G, [{ value: lcm(a, b), why: 'That is a common multiple. The GCF is the biggest number that divides both.' }, G > 2 && G % 2 === 0 ? G / 2 : G + 1, 1, Math.min(a, b), G * 2], labelNum),
      hint: `What is the biggest number that divides both ${a} and ${b} with no remainder?`,
      steps: [`Factors of ${a}: ${factorsOf(a).join(', ')}.`, `Factors of ${b}: ${factorsOf(b).join(', ')}.`, `The greatest one in both lists is ${G}.`],
      meta: { value: G },
    });
  },
};

const evalExpr = {
  id: 'eval_expr', domain: D, grade: 6, cc: '6.EE.2c', name: 'Evaluate expressions', short: 'evaluate expressions',
  gen(rng, tier) {
    const n = rng.int(2, 9);
    let text, ans, steps, wrong;
    if (tier === 1) {
      const a = rng.int(2, 12);
      if (rng.chance(0.5)) { text = `${a}n`; ans = a * n; steps = [`${a}n means ${a} × n.`, `${a} × ${n} = ${ans}.`]; wrong = [{ value: Number(`${a}${n}`), why: `${a}n means ${a} times n, not the digits side by side.` }, a + n]; }
      else { text = `n + ${a}`; ans = n + a; steps = [`Put ${n} in for n: ${n} + ${a}.`, `= ${ans}.`]; wrong = [n * a, ans + 1]; }
    } else if (tier === 2) {
      const a = rng.int(2, 9), b = rng.int(1, 15);
      text = `${a}n + ${b}`; ans = a * n + b;
      steps = [`Put ${n} in for n: ${a} × ${n} + ${b}.`, `${a} × ${n} = ${a * n}.`, `${a * n} + ${b} = ${ans}.`];
      wrong = [{ value: a * (n + b), why: 'Multiply first, then add.' }, Number(`${a}${n}`) + b, ans - 1];
    } else if (rng.chance(0.5)) {
      const a = rng.int(2, 6), b = rng.int(1, 9);
      text = `${a}(n + ${b})`; ans = a * (n + b);
      steps = [`Put ${n} in for n: ${a}(${n} + ${b}).`, `Parentheses first: ${n} + ${b} = ${n + b}.`, `${a} × ${n + b} = ${ans}.`];
      wrong = [{ value: a * n + b, why: `The ${a} multiplies everything in the parentheses.` }, ans + a, ans - b];
    } else {
      const b = rng.int(1, 20);
      text = `n^2 − ${b}`; ans = n * n - b;
      if (ans < 0) return evalExpr.gen(rng, 2);
      steps = [`Put ${n} in for n: ${n}^2 − ${b}.`, `${n}^2 = ${n * n}.`, `${n * n} − ${b} = ${ans}.`];
      wrong = [{ value: 2 * n - b, why: `n^2 means n × n, not 2 × n.` }, ans + 1, n * n + b];
    }
    return P({
      skill: this.id, tier,
      text: `If n = ${n}, what is ${text}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [...wrong, ...nearInts(rng, ans, 3)], labelNum),
      hint: `Replace n with ${n}, then follow the order of operations.`,
      steps,
      meta: { value: ans },
    });
  },
};

const oneStep = {
  id: 'one_step', domain: D, grade: 6, cc: '6.EE.7', name: 'Solve one-step equations', short: 'one-step equations',
  gen(rng, tier) {
    const x = rng.int(2, tier === 3 ? 25 : 12);
    const kind = tier === 1 ? rng.int(0, 1) : rng.int(0, 3);
    const a = rng.int(2, tier === 1 ? 9 : 12);
    let text, steps, wrong;
    switch (kind) {
      case 0:
        text = `x + ${a} = ${x + a}`;
        steps = [`Undo + ${a} by subtracting ${a} from both sides.`, `x = ${x + a} − ${a} = ${x}.`];
        wrong = [{ value: x + 2 * a, why: `To undo + ${a}, subtract ${a}.` }];
        break;
      case 1:
        text = `x − ${a} = ${x}`;
        steps = [`Undo − ${a} by adding ${a} to both sides.`, `x = ${x} + ${a} = ${x + a}.`];
        wrong = [{ value: Math.abs(x - a) || x + 1, why: `To undo − ${a}, add ${a}.` }];
        break;
      case 2:
        text = `${a}x = ${a * x}`;
        steps = [`${a}x means ${a} × x. Undo it by dividing by ${a}.`, `x = ${a * x} ÷ ${a} = ${x}.`];
        wrong = [{ value: a * x - a, why: `${a}x means ${a} times x. Divide by ${a}.` }];
        break;
      default:
        text = `x ÷ ${a} = ${x}`;
        steps = [`Undo ÷ ${a} by multiplying by ${a}.`, `x = ${x} × ${a} = ${x * a}.`];
        wrong = [{ value: x - a > 0 ? x - a : x + a + 1, why: `To undo ÷ ${a}, multiply by ${a}.` }];
    }
    const ans = kind === 1 ? x + a : kind === 3 ? x * a : x;
    return P({
      skill: this.id, tier,
      text: `Solve for x:  ${text}`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [...wrong, ans + 1, ans - 1, ans + a], labelNum),
      hint: 'Do the opposite operation to get x by itself.',
      steps: [...steps, `Check: put ${ans} back in for x.`],
      meta: { value: ans },
    });
  },
};

const writeExpr = {
  id: 'write_expr', domain: D, grade: 6, cc: '6.EE.2a', name: 'Write expressions', short: 'write expressions',
  gen(rng, tier) {
    const a = rng.int(2, 9);
    let b = rng.int(2, 9);
    if (b === a) b = a === 9 ? 2 : a + 1;
    const options = [
      { words: `${a} more than a number n`, correct: `n + ${a}`, wrong: [[`${a}n`, 'More than means add.'], [`n − ${a}`, 'More than means add, not subtract.'], [`${a} − n`, 'More than means add.']] },
      { words: `${a} less than a number n`, correct: `n − ${a}`, wrong: [[`${a} − n`, `"${a} less than n" starts with n and takes ${a} away.`], [`n + ${a}`, 'Less than means subtract.'], [`${a}n`, 'Less than means subtract.']] },
      { words: `${a} times a number n`, correct: `${a}n`, wrong: [[`n + ${a}`, 'Times means multiply.'], [`n ÷ ${a}`, 'Times means multiply.'], [`${a} − n`, 'Times means multiply.']] },
      { words: `a number n divided by ${a}`, correct: `n ÷ ${a}`, wrong: [[`${a} ÷ n`, 'The number n is being divided, so n comes first.'], [`${a}n`, 'Divided by means ÷.'], [`n − ${a}`, 'Divided by means ÷.']] },
      { words: `${a} times a number n, plus ${b}`, correct: `${a}n + ${b}`, wrong: [[`${a}(n + ${b})`, `Multiply n by ${a} first, then add ${b}.`], [`${b}n + ${a}`, 'Check which number multiplies n.'], [`${a} + n + ${b}`, 'Times means multiply.']] },
      { words: `${a} times the sum of n and ${b}`, correct: `${a}(n + ${b})`, wrong: [[`${a}n + ${b}`, `"The sum" goes in parentheses so ${a} multiplies all of it.`], [`n + ${a} + ${b}`, 'Times means multiply.'], [`${a} + (n × ${b})`, 'Check the order of the words.']] },
    ];
    const pickFrom = tier === 1 ? options.slice(0, 4) : tier === 2 ? options.slice(1, 5) : options.slice(3);
    const o = rng.pick(pickFrom);
    const choices = rng.shuffle([{ label: o.correct, value: o.correct, correct: true }, ...o.wrong.map(([l, why]) => ({ label: l, value: l, why }))]);
    return P({
      skill: this.id, tier,
      text: `Which expression means "${o.words}"?`,
      answer: pick(), choices,
      hint: 'Look for the key words: more than (+), less than (−), times (×), divided by (÷), sum (+ in parentheses).',
      steps: [`"${o.words}" is written ${o.correct}.`],
      answerText: o.correct,
      meta: {},
    });
  },
};

// "Do this, then that" phrases whose order matters, with the expression that keeps it.
const PHRASES = [
  { say: (a, b, c) => `add ${a} and ${b}, then multiply by ${c}`, right: (a, b, c) => `(${a} + ${b}) × ${c}`, trap: (a, b, c) => `${a} + ${b} × ${c}`, val: (a, b, c) => (a + b) * c },
  { say: (a, b, c) => `subtract ${b} from ${a}, then multiply by ${c}`, right: (a, b, c) => `(${a} − ${b}) × ${c}`, trap: (a, b, c) => `${a} − ${b} × ${c}`, val: (a, b, c) => (a - b) * c },
  { say: (a, b, c) => `multiply ${c} by the sum of ${a} and ${b}`, right: (a, b, c) => `${c} × (${a} + ${b})`, trap: (a, b, c) => `${c} × ${a} + ${b}`, val: (a, b, c) => c * (a + b) },
];

const exprRead = {
  id: 'expr_read', domain: D, grade: 5, cc: '5.OA.2', name: 'Write and read expressions', short: 'expressions',
  gen(rng, tier) {
    if (tier === 2) {
      const k = rng.int(2, 9);
      const A = rng.int(1200, 29999), B = rng.int(101, 999);
      const plus = rng.chance(0.6);
      const inner = plus ? `${fmtInt(A)} + ${fmtInt(B)}` : `${fmtInt(A)} − ${fmtInt(B)}`;
      return P({
        skill: this.id, tier,
        text: `Without working it out: ${k} × (${inner}) is how many times as large as ${inner}?`,
        answer: num(k),
        choices: makeChoices(rng, k, [{ value: k + 1, why: `${k} × (something) is ${k} times as large as that something.` }, k * 10, Math.max(2, k - 1), 1], labelNum),
        hint: 'The part in parentheses is one number. What is it multiplied by?',
        steps: [`(${inner}) is one amount.`, `${k} × that amount is ${k} times as large.`],
        meta: { value: k },
      });
    }
    const ph = rng.pick(PHRASES);
    let a = rng.int(3, 20), b = rng.int(2, 9);
    const c = rng.int(2, 6);
    if (ph.val(a, b, c) <= 0 || a <= b) a = b + rng.int(2, 12);
    const words = ph.say(a, b, c);
    const right = ph.right(a, b, c);
    if (tier === 3) {
      const v = ph.val(a, b, c);
      const trapVal = ph === PHRASES[0] ? a + b * c : ph === PHRASES[1] ? a - b * c : c * a + b;
      return P({
        skill: this.id, tier,
        text: `Write an expression for "${words}". What is its value?`,
        answer: num(v),
        choices: makeChoices(rng, v, [
          { value: trapVal, why: `Keep the first step together with parentheses: ${right}.` },
          v + c, v - 1, a + b + c,
        ], labelNum),
        hint: 'Write the first step in parentheses so it is done first.',
        steps: [`The expression is ${right}.`, `Work out the parentheses first, then the rest: ${right} = ${fmtInt(v)}.`],
        meta: { value: v },
      });
    }
    const options = [
      { label: right, correct: true },
      { label: ph.trap(a, b, c), why: 'Without parentheses, the multiplication would happen first.' },
      { label: `${a} + ${b} + ${c}`, why: 'The phrase asks you to multiply, not add three numbers.' },
      { label: ph === PHRASES[1] ? `(${b} − ${a}) × ${c}` : `(${a} × ${b}) + ${c}`, why: ph === PHRASES[1] ? `"Subtract ${b} from ${a}" means start with ${a}: ${a} − ${b}.` : 'Check which numbers are added and which multiply.' },
    ];
    return P({
      skill: this.id, tier,
      text: `Which expression means "${words}"?`,
      answer: pick(),
      choices: rng.shuffle(options).map((o) => ({ label: o.label, value: o.label, correct: !!o.correct, why: o.why })),
      hint: 'Parentheses show what to do first. Which step comes first in the words?',
      steps: [`The words do one step first, so it goes in parentheses: ${right}.`],
      answerText: right,
    });
  },
};

const patterns2 = {
  id: 'patterns2', domain: D, grade: 5, cc: '5.OA.3', name: 'Two patterns side by side', short: 'two patterns',
  gen(rng, tier) {
    const a = rng.int(2, tier === 1 ? 5 : 9);
    const m = rng.int(2, tier === 1 ? 3 : 4);
    const b = a * m;
    const steps = rng.int(4, tier === 1 ? 6 : 9);
    const listA = Array.from({ length: 4 }, (_, i) => a * i), listB = Array.from({ length: 4 }, (_, i) => b * i);
    const intro = `Pattern A starts at 0 and adds ${a} each time. Pattern B starts at 0 and adds ${b} each time.`;
    const table = { kind: 'ratioTable', a, b, k: 3, A: 'Pattern A', B: 'Pattern B' };
    if (tier === 2) {
      return P({
        skill: this.id, tier,
        text: `${intro} Each number in pattern B is how many times the matching number in pattern A?`,
        visual: table,
        answer: num(m),
        choices: makeChoices(rng, m, [{ value: b - a, why: `Compare matching terms by dividing, not subtracting: ${b} ÷ ${a} = ${m}.` }, m + 1, b, a], labelNum),
        hint: 'Line the patterns up. Divide a number in B by the number above it in A.',
        steps: [`A: ${listA.join(', ')}, …`, `B: ${listB.join(', ')}, …`, `${b} ÷ ${a} = ${m}, ${b * 2} ÷ ${a * 2} = ${m}: each B number is ${m} times its A number.`],
        meta: { value: m },
      });
    }
    if (tier === 3) {
      const nx = a * 4, ny = b * 4;
      const right = `(${nx}, ${ny})`;
      const options = [
        { label: right, correct: true },
        { label: `(${ny}, ${nx})`, why: 'The pattern A number comes first in the pair.' },
        { label: `(${nx}, ${ny + a})`, why: `Pattern B adds ${b} each time, not ${a}.` },
        { label: `(${nx + a}, ${ny})`, why: `Each pair uses matching steps: after 4 steps A is at ${nx}.` },
      ];
      return P({
        skill: this.id, tier,
        text: `${intro} The first pairs (A, B) are ${listA.map((x, i) => `(${x}, ${listB[i]})`).join(', ')}. Which pair comes next?`,
        answer: pick(),
        choices: rng.shuffle(options).map((o) => ({ label: o.label, value: o.label, correct: !!o.correct, why: o.why })),
        hint: 'Find the next number in each pattern, then put A first and B second.',
        steps: [`Next in A: ${a * 3} + ${a} = ${nx}.`, `Next in B: ${b * 3} + ${b} = ${ny}.`, `The pair is ${right}.`],
        answerText: right,
      });
    }
    const ans = b * steps;
    return P({
      skill: this.id, tier,
      text: `${intro} When pattern A reaches ${a * steps}, what number is pattern B at?`,
      visual: table,
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: a * steps + b, why: `Count the steps: A takes ${steps} steps of ${a} to reach ${a * steps}. B takes ${steps} steps of ${b}.` }, ans + b, ans - b, a * steps * 2 === ans ? ans + a : a * steps * 2], labelNum),
      hint: `How many steps does A take to reach ${a * steps}? B takes the same number of steps.`,
      steps: [`${a * steps} ÷ ${a} = ${steps} steps.`, `B after ${steps} steps: ${steps} × ${b} = ${ans}.`],
      meta: { value: ans },
    });
  },
};

// Equivalent expressions: the distributive property both ways, and combining like terms.
const sgn = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
const equivExpr = {
  id: 'equiv_expr', domain: D, grade: 6, cc: '6.EE.3', name: 'Equivalent expressions', short: 'equivalent expressions',
  gen(rng, tier) {
    const v = rng.pick(['x', 'n', 'y', 'a']);
    const kind = tier === 1 ? rng.int(0, 1) : tier === 2 ? rng.int(0, 2) : rng.int(1, 3);
    const uniqChoices = (list) => rng.shuffle(list.filter((c, i, arr) => arr.findIndex((q) => q.label === c.label) === i));
    if (kind === 0) {
      const k = rng.int(2, 9), c = rng.int(2, 9);
      const correct = `${k}${v} + ${k * c}`;
      return P({
        skill: this.id, tier,
        text: `Which expression is equal to ${k}(${v} + ${c})?`,
        answer: pick(),
        choices: uniqChoices([
          { label: correct, value: 'c', correct: true },
          { label: `${k}${v} + ${c}`, value: 'w1', why: `${k} multiplies everything in the parentheses, so the ${c} becomes ${k} × ${c}.` },
          { label: `${v} + ${k * c}`, value: 'w2', why: `${k} multiplies the ${v} too.` },
          { label: `${k + c}${v}`, value: 'w3', why: `${k}${v} and ${k * c} are not like terms, so they stay separate.` },
        ]),
        hint: `Multiply ${k} by each thing inside the parentheses.`,
        steps: [`${k} × ${v} = ${k}${v}.`, `${k} × ${c} = ${k * c}.`, `So ${k}(${v} + ${c}) = ${correct}.`],
        answerText: correct,
        meta: {},
      });
    }
    if (kind === 1) {
      const p = rng.int(2, 9), q = rng.int(2, 9), r = rng.int(1, 9);
      const correct = `${p + q}${v} + ${r}`;
      return P({
        skill: this.id, tier,
        text: `Which is the simplest way to write ${p}${v} + ${r} + ${q}${v}?`,
        answer: pick(),
        choices: uniqChoices([
          { label: correct, value: 'c', correct: true },
          { label: `${p + q + r}${v}`, value: 'w1', why: `${r} has no ${v}, so it is not a like term. Only the ${v} terms combine.` },
          { label: `${p * q}${v} + ${r}`, value: 'w2', why: `${p}${v} + ${q}${v} adds: ${p} + ${q} = ${p + q}.` },
          { label: `${p + q}${v} + ${r}${v}`, value: 'w3', why: `${r} is just a number, without a ${v}.` },
        ]),
        hint: `Like terms have the same letter. Add the ${v} terms together, and keep the number on its own.`,
        steps: [`${p}${v} + ${q}${v} = ${p + q}${v}.`, `The ${r} stays as it is.`, `So the expression is ${correct}.`],
        answerText: correct,
        meta: {},
      });
    }
    if (kind === 2) {
      // Evaluate both forms to see they match.
      const k = rng.int(2, 6), c = rng.int(1, 8), x = rng.int(2, 9);
      const ans = k * (x + c);
      return P({
        skill: this.id, tier,
        text: `${k}(${v} + ${c}) and ${k}${v} + ${k * c} are equivalent. What do both equal when ${v} = ${x}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: k * x + c, why: `${k} multiplies the ${c} as well: ${k} × ${c} = ${k * c}.` }, ans + k, ans - 1, x + c], labelNum),
        hint: `Put ${x} in for ${v} in either expression.`,
        steps: [`${k}(${x} + ${c}) = ${k} × ${x + c} = ${ans}.`, `${k} × ${x} + ${k * c} = ${k * x} + ${k * c} = ${ans}. They match.`],
        meta: { value: ans },
      });
    }
    // Factor out the greatest common factor.
    const g = rng.int(2, 6);
    let m = rng.int(2, 7), c = rng.int(1, 7);
    while (gcd(m, c) !== 1) c += 1;
    const correct = `${g}(${m}${v} + ${c})`;
    return P({
      skill: this.id, tier,
      text: `Which expression is equal to ${g * m}${v} + ${g * c}?`,
      answer: pick(),
      choices: uniqChoices([
        { label: correct, value: 'c', correct: true },
        { label: `${g}(${m}${v} + ${g * c})`, value: 'w1', why: `Divide both terms by ${g}: ${g * c} ÷ ${g} = ${c}.` },
        { label: `${g * m}(${v} + ${g * c})`, value: 'w2', why: `Multiply it back out: that would give ${g * m * g * c}, not ${g * c}.` },
        { label: `${g}(${m}${v} ${sgn(c + 1)})`, value: 'w3', why: `Check by multiplying out: ${g} × ${c + 1} is not ${g * c}.` },
      ]),
      hint: `What is the biggest number that divides both ${g * m} and ${g * c}?`,
      steps: [`${g} divides both: ${g * m} = ${g} × ${m} and ${g * c} = ${g} × ${c}.`, `So ${g * m}${v} + ${g * c} = ${correct}.`],
      answerText: correct,
      meta: {},
    });
  },
};

// Inequalities: which values make one true, writing one from words, and reading one from a number line.
const inequality = {
  id: 'inequality', domain: D, grade: 6, cc: '6.EE.8', name: 'Inequalities', short: 'inequalities',
  gen(rng, tier) {
    const v = rng.pick(['x', 'n', 'h', 't']);
    const kind = tier === 1 ? 0 : tier === 2 ? rng.int(0, 1) : rng.int(1, 2);
    if (kind === 0) {
      const c = rng.int(3, 15);
      const gt = rng.chance(0.5);
      const right = gt ? c + rng.int(1, 6) : c - rng.int(1, Math.min(6, c));
      const vals = [right, c, gt ? c - rng.int(1, 3) : c + rng.int(1, 3), gt ? c - rng.int(4, 8) : c + rng.int(4, 8)];
      const choices = vals.map((x, i) => ({ label: String(x), value: x, correct: i === 0, why: i === 0 ? undefined : x === c ? `${c} is not ${gt ? 'greater' : 'less'} than ${c}: they are equal.` : `${x} is ${x > c ? 'greater' : 'less'} than ${c}.` }));
      return P({
        skill: this.id, tier,
        text: `Which value of ${v} makes ${v} ${gt ? '>' : '<'} ${c} true?`,
        answer: pick(),
        choices: rng.shuffle(choices.filter((q, i, arr) => arr.findIndex((z) => z.label === q.label) === i)),
        hint: `${gt ? '>' : '<'} means "is ${gt ? 'greater' : 'less'} than". Equal does not count.`,
        steps: [`${right} ${gt ? '>' : '<'} ${c} is true.`, `So ${v} = ${right} works.`],
        answerText: String(right),
        meta: {},
      });
    }
    if (kind === 1) {
      const c = rng.int(4, 60);
      const o = rng.pick([
        { words: `A rider must be at least ${c} inches tall. Let ${v} be a rider's height.`, sym: '≥' },
        { words: `A glider can carry at most ${c} kilograms. Let ${v} be the load.`, sym: '≤' },
        { words: `The cloud line is more than ${c} meters below the island. Let ${v} be its depth.`, sym: '>' },
        { words: `Fewer than ${c} lanterns are left. Let ${v} be the number left.`, sym: '<' },
      ]);
      const all = ['≥', '≤', '>', '<'];
      const why = { '≥': 'At least means that number or more.', '≤': 'At most means that number or less.', '>': 'More than does not include the number itself.', '<': 'Fewer than does not include the number itself.' };
      return P({
        skill: this.id, tier,
        text: `${o.words} Which inequality fits?`,
        answer: pick(),
        choices: rng.shuffle(all.map((s) => ({ label: `${v} ${s} ${c}`, value: s, correct: s === o.sym, why: s === o.sym ? undefined : why[o.sym] }))),
        hint: 'At least: ≥. At most: ≤. More than: >. Less or fewer than: <.',
        steps: [why[o.sym], `So the inequality is ${v} ${o.sym} ${c}.`],
        answerText: `${v} ${o.sym} ${c}`,
        meta: {},
      });
    }
    const c = rng.int(-4, 6);
    const dir = rng.chance(0.5) ? 'right' : 'left';
    const closed = rng.chance(0.5);
    const sym = dir === 'right' ? (closed ? '≥' : '>') : (closed ? '≤' : '<');
    const all = ['≥', '>', '≤', '<'];
    const c0 = c < 0 ? `−${-c}` : String(c);
    return P({
      skill: this.id, tier,
      text: 'Which inequality does the number line show?',
      visual: { kind: 'ineq', min: -6, max: 8, at: c, dir, closed },
      answer: pick(),
      choices: rng.shuffle(all.map((s) => ({ label: `${v} ${s} ${c0}`, value: s, correct: s === sym, why: s === sym ? undefined : `The circle is ${closed ? 'filled in, so ' + c0 + ' is included' : 'open, so ' + c0 + ' is not included'}, and the arrow points ${dir}.` }))),
      hint: 'An arrow to the right means greater; to the left means less. A filled circle includes the number.',
      steps: [`The arrow points ${dir}: ${dir === 'right' ? 'greater' : 'less'} than ${c0}.`, `The circle is ${closed ? 'filled, so ' + c0 + ' counts too' : 'open, so ' + c0 + ' does not count'}: ${v} ${sym} ${c0}.`],
      answerText: `${v} ${sym} ${c0}`,
      meta: {},
    });
  },
};

// Two quantities that change together: a table, the rule behind it, and which one depends on which.
const varTable = {
  id: 'var_table', domain: D, grade: 6, cc: '6.EE.9', name: 'Variables that change together', short: 'input-output tables',
  gen(rng, tier) {
    const m = rng.int(2, 6), b = tier === 1 ? 0 : rng.int(1, 6);
    const xs = [1, 2, 3, 4];
    const ys = xs.map((x) => m * x + b);
    const rule = b ? `y = ${m}x + ${b}` : `y = ${m}x`;
    const kind = tier === 1 ? 0 : tier === 2 ? rng.int(0, 1) : rng.int(1, 2);
    if (kind === 0) {
      const x = rng.int(6, 12);
      const ans = m * x + b;
      return P({
        skill: this.id, tier,
        text: `The table follows the rule ${rule}. What is y when x is ${x}?`,
        visual: { kind: 'rtable', rows: [{ name: 'x', cells: [...xs.map(String), String(x)] }, { name: 'y', cells: [...ys.map(String), '?'] }] },
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: ys[3] + (x - 4), why: `Each time x goes up by 1, y goes up by ${m}, not 1.` }, m * x, ans + m, m + x + b], labelNum),
        hint: `Put ${x} in for x: ${m} × ${x}${b ? ` + ${b}` : ''}.`,
        steps: [`${m} × ${x} = ${m * x}.`, ...(b ? [`${m * x} + ${b} = ${ans}.`] : []), `So y = ${ans}.`],
        meta: { value: ans },
      });
    }
    if (kind === 1) {
      const wrongRules = [
        [`y = x + ${ys[0] - 1}`, 'It fits the first column, but check the others too.'],
        [`y = ${m + 1}x`, `Check x = 2: that gives ${2 * (m + 1)}, but the table says ${ys[1]}.`],
        [b ? `y = ${m}x` : `y = ${m}x + 1`, b ? `Check x = 1: ${m} × 1 = ${m}, but the table says ${ys[0]}.` : `Check x = 1: ${m} + 1 is not ${ys[0]}.`],
        [`y = ${b + 1}x + ${m}`, 'Try it on each column of the table.'],
      ];
      const choices = [{ label: rule, value: 'c', correct: true }, ...wrongRules.map(([l, why], i) => ({ label: l, value: 'w' + i, why }))];
      return P({
        skill: this.id, tier,
        text: 'Which rule fits every column of the table?',
        visual: { kind: 'rtable', rows: [{ name: 'x', cells: xs.map(String) }, { name: 'y', cells: ys.map(String) }] },
        answer: pick(),
        choices: (() => { const u = choices.filter((c, i, arr) => arr.findIndex((q) => q.label === c.label) === i); return rng.shuffle([u[0], ...rng.shuffle(u.slice(1)).slice(0, 3)]); })(),
        hint: `When x goes up by 1, y goes up by ${m}. That number multiplies x.`,
        steps: [`y goes up by ${m} each time, so the rule starts y = ${m}x.`, b ? `At x = 1, ${m} × 1 = ${m}, and y is ${ys[0]}, so add ${b}.` : `At x = 1, ${m} × 1 = ${m}, which is y. Nothing to add.`, `The rule is ${rule}.`],
        answerText: rule,
        meta: {},
      });
    }
    const o = rng.pick([
      { story: 'The more hours a lantern burns, the more oil it uses.', dep: 'the oil used', ind: 'the hours it burns' },
      { story: 'A glider\'s height drops the further it flies.', dep: 'its height', ind: 'how far it flies' },
      { story: 'Each cadet who joins the guild gets 3 feathers.', dep: 'the number of feathers', ind: 'the number of cadets' },
      { story: 'The longer a kite string, the higher the kite can fly.', dep: 'how high the kite flies', ind: 'the length of the string' },
    ]);
    const askDep = rng.chance(0.5);
    const right = askDep ? o.dep : o.ind;
    return P({
      skill: this.id, tier,
      text: `${o.story} Which is the ${askDep ? 'dependent' : 'independent'} variable?`,
      answer: pick(),
      choices: rng.shuffle([
        { label: right, value: 'c', correct: true },
        { label: askDep ? o.ind : o.dep, value: 'w', why: askDep ? 'The dependent variable is the one that changes because of the other.' : 'The independent variable is the one that changes on its own and causes the other to change.' },
      ]),
      hint: 'Ask: which one depends on the other?',
      steps: [`${o.dep[0].toUpperCase() + o.dep.slice(1)} depends on ${o.ind}.`, `So ${o.dep} is dependent and ${o.ind} is independent.`],
      answerText: right,
      meta: {},
    });
  },
};

export const RIDGE_SKILLS = [placeValue, rounding, addSub, factors, patterns, orderOps, exprRead, patterns2, exponents, gcfLcm, evalExpr, writeExpr, equivExpr, oneStep, inequality, varTable];
