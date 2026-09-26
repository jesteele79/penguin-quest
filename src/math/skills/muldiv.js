// Glimmer Lake: multiplication and division (grades 3-6).
import { P, num, rem, makeChoices, nearInts, labelNum } from '../build.js';
import { fmtInt, fmtNum } from '../fmt.js';
import { Frac } from '../frac.js';

const D = 'lake';
const FRIENDS = ['Mo', 'Lulu', 'Sunny', 'Fern', 'Pebble', 'Skipper'];

function factStrategy(a, b) {
  const p = a * b;
  const [x, y] = [2, 4, 5, 9, 10, 11, 12].includes(b) ? [a, b] : [b, a];
  switch (y) {
    case 2: return { hint: `Times 2 is a double. What is ${x} + ${x}?`, steps: [`${x} × 2 means double ${x}.`, `${x} + ${x} = ${p}.`] };
    case 4: return { hint: `Double ${x}, then double it again.`, steps: [`Double ${x}: ${x * 2}.`, `Double again: ${x * 2} + ${x * 2} = ${p}.`] };
    case 5: return { hint: `${x} × 5 is half of ${x} × 10.`, steps: [`${x} × 10 = ${x * 10}.`, `Half of ${x * 10} is ${p}.`] };
    case 9: return { hint: `${x} × 9 is ${x} × 10 take away one ${x}.`, steps: [`${x} × 10 = ${x * 10}.`, `${x * 10} − ${x} = ${p}.`] };
    case 10: return { hint: `Times 10 puts a zero on the end.`, steps: [`${x} × 10 = ${p}.`] };
    case 11:
    case 12: return {
      hint: `Split ${y} into 10 + ${y - 10}.`,
      steps: [`${x} × 10 = ${x * 10}.`, `${x} × ${y - 10} = ${x * (y - 10)}.`, `${x * 10} + ${x * (y - 10)} = ${p}.`],
    };
    default: {
      const big = Math.max(a, b), small = Math.min(a, b);
      return {
        hint: `Split ${big} into 5 + ${big - 5}. Multiply each part by ${small}.`,
        steps: [`${small} × 5 = ${small * 5}.`, `${small} × ${big - 5} = ${small * (big - 5)}.`, `${small * 5} + ${small * (big - 5)} = ${p}.`],
      };
    }
  }
}

const mulFacts = {
  id: 'mul_facts', domain: D, grade: 3, cc: '3.OA.7', name: 'Multiplication facts', short: '× facts',
  gen(rng, tier) {
    let a, b;
    if (tier === 1) { a = rng.int(2, 5); b = rng.int(2, 9); }
    else if (tier === 2) { a = rng.int(6, 9); b = rng.int(3, 9); }
    else { a = rng.int(6, 12); b = rng.int(6, 12); }
    if (rng.chance(0.5)) [a, b] = [b, a];
    const p = a * b;
    const s = factStrategy(a, b);
    return P({
      skill: this.id, tier,
      text: `What is ${a} × ${b}?`,
      answer: num(p),
      choices: makeChoices(rng, p, [
        { value: a + b, why: `That's ${a} + ${b}. Multiplying means ${a} groups of ${b}.` },
        p + a, p - b, (a + 1) * b, a * (b - 1), ...nearInts(rng, p, 2),
      ], labelNum),
      visual: tier === 1 ? { kind: 'array', rows: Math.min(a, b), cols: Math.max(a, b) } : null,
      ...s,
      meta: { op: '*', a, b },
    });
  },
};

const divFacts = {
  id: 'div_facts', domain: D, grade: 3, cc: '3.OA.7', name: 'Division facts', short: '÷ facts',
  gen(rng, tier) {
    const d = tier === 1 ? rng.int(2, 5) : tier === 2 ? rng.int(6, 9) : rng.int(6, 12);
    const q = rng.int(2, tier === 3 ? 12 : 9);
    const n = d * q;
    const word = rng.chance(0.35);
    const who = rng.pick(FRIENDS);
    const text = word
      ? `${who} has ${n} fish to share equally among ${d} penguins. How many fish does each penguin get?`
      : `What is ${n} ÷ ${d}?`;
    return P({
      skill: this.id, tier, text,
      answer: num(q),
      choices: makeChoices(rng, q, [
        { value: n - d, why: `That's ${n} − ${d}. Dividing asks how many groups of ${d} fit in ${n}.` },
        q + 1, q - 1, q + 2, d === q ? q + 3 : d,
      ], labelNum),
      hint: `Think: ${d} times what number makes ${n}?`,
      steps: [`${d} × ${q} = ${n}.`, `So ${n} ÷ ${d} = ${q}.`],
      meta: { op: '/', a: n, b: d },
    });
  },
};

function splitPlaces(n) {
  const parts = [];
  let place = 1;
  while (n > 0) {
    const digit = n % 10;
    if (digit) parts.unshift(digit * place);
    n = Math.floor(n / 10);
    place *= 10;
  }
  return parts;
}

// Result if a regrouped (carried) digit is forgotten in column multiplication.
function forgotCarry(n, k) {
  const digits = String(n).split('').map(Number);
  return parseInt(digits.map((d, i) => (i === 0 ? String(d * k) : String((d * k) % 10))).join(''), 10);
}

function partialSteps(n, k) {
  const parts = splitPlaces(n);
  const prods = parts.map((p) => p * k);
  const total = n * k;
  return {
    hint: `Split ${fmtInt(n)} into ${parts.map(fmtInt).join(' + ')}. Multiply each part by ${k}, then add.`,
    steps: [
      `Split ${fmtInt(n)} into ${parts.map(fmtInt).join(' + ')}.`,
      ...parts.map((p, i) => `${fmtInt(p)} × ${k} = ${fmtInt(prods[i])}.`),
      `Add: ${prods.map(fmtInt).join(' + ')} = ${fmtInt(total)}.`,
    ],
  };
}

const mul2x1 = {
  id: 'mul_2x1', domain: D, grade: 4, cc: '4.NBT.5', name: 'Multiply 2-digit by 1-digit', short: '2-digit × 1-digit',
  gen(rng, tier) {
    const n = tier === 1 ? rng.int(11, 34) : tier === 2 ? rng.int(23, 79) : rng.int(46, 99);
    const k = tier === 1 ? rng.int(2, 4) : rng.int(3, 9);
    const p = n * k;
    const s = partialSteps(n, k);
    const t = Math.floor(n / 10) * 10, o = n % 10;
    const word = tier === 3 && rng.chance(0.5);
    return P({
      skill: this.id, tier,
      text: word ? `Each ice sled carries ${n} snowballs. How many snowballs are on ${k} sleds?` : `What is ${n} × ${k}?`,
      answer: num(p),
      choices: makeChoices(rng, p, [
        { value: t * k + o, why: `Multiply the ones too: ${o} × ${k} = ${o * k}.` },
        { value: forgotCarry(n, k), why: 'Remember to add the tens you regrouped.' },
        p + 10, p - k, p + k, ...nearInts(rng, p, 10),
      ], labelNum),
      hintVisual: { kind: 'area', rows: [k], cols: splitPlaces(n) },
      ...s,
      meta: { op: '*', a: n, b: k },
    });
  },
};

const mulMulti1 = {
  id: 'mul_multi1', domain: D, grade: 4, cc: '4.NBT.5', name: 'Multiply up to 4 digits by 1 digit', short: '3-4 digit × 1-digit',
  gen(rng, tier) {
    const n = tier === 3 ? rng.int(1012, 4989) : rng.int(112, 899);
    const k = tier === 1 ? rng.int(2, 5) : rng.int(4, 9);
    const p = n * k;
    return P({
      skill: this.id, tier,
      text: `What is ${fmtInt(n)} × ${k}?`,
      answer: num(p),
      choices: makeChoices(rng, p, [
        { value: forgotCarry(n, k), why: 'Remember to add the numbers you regrouped.' },
        p + 100, p - 10, p + k, p - 100, ...nearInts(rng, p, 100),
      ], labelNum),
      hintVisual: { kind: 'area', rows: [k], cols: splitPlaces(n) },
      ...partialSteps(n, k),
      meta: { op: '*', a: n, b: k },
    });
  },
};

const mul2x2 = {
  id: 'mul_2x2', domain: D, grade: 4, cc: '4.NBT.5', name: 'Multiply 2-digit by 2-digit', short: '2-digit × 2-digit',
  gen(rng, tier) {
    let a, b;
    if (tier === 1) {
      a = rng.int(12, 39);
      b = rng.chance(0.5) ? rng.int(2, 6) * 10 : rng.int(11, 15);
    } else if (tier === 2) { a = rng.int(13, 49); b = rng.int(12, 29); }
    else { a = rng.int(24, 98); b = rng.int(23, 97); }
    const p = a * b;
    const ap = splitPlaces(a), bp = splitPlaces(b);
    const prods = [];
    for (const x of ap) for (const y of bp) prods.push({ x, y, v: x * y });
    const onlyMatching = ap.length === 2 && bp.length === 2 ? ap[0] * bp[0] + ap[1] * bp[1] : null;
    return P({
      skill: this.id, tier,
      text: `What is ${a} × ${b}?`,
      answer: num(p),
      choices: makeChoices(rng, p, [
        onlyMatching ? { value: onlyMatching, why: 'Multiply every part by every part. There are 4 partial products, not 2.' } : p + 100,
        p + 10, p - 10, a * bp[0], p + a, ...nearInts(rng, p, 100),
      ], labelNum),
      hint: `Split both numbers into tens and ones: ${ap.join(' + ')} and ${bp.join(' + ')}. Multiply each part by each part.`,
      hintVisual: { kind: 'area', rows: bp, cols: ap },
      steps: [
        `Split: ${a} = ${ap.join(' + ')} and ${b} = ${bp.join(' + ')}.`,
        ...prods.map((q) => `${fmtInt(q.x)} × ${fmtInt(q.y)} = ${fmtInt(q.v)}.`),
        `Add the partial products: ${prods.map((q) => fmtInt(q.v)).join(' + ')} = ${fmtInt(p)}.`,
      ],
      meta: { op: '*', a, b },
    });
  },
};

const divRem = {
  id: 'div_rem', domain: D, grade: 4, cc: '4.NBT.6', name: 'Divide with remainders', short: '÷ with remainders',
  gen(rng, tier) {
    const d = tier === 1 ? rng.int(2, 5) : rng.int(3, 9);
    const q = tier === 1 ? rng.int(3, 9) : tier === 2 ? rng.int(6, 19) : rng.int(21, 99);
    const r = rng.chance(0.85) ? rng.int(1, d - 1) : 0;
    const n = d * q + r;
    const word = rng.chance(0.4);
    const label = (v) => (v.r ? `${fmtInt(v.q)} R${v.r}` : fmtInt(v.q));
    const wrong = [
      { value: { q: q + 1, r: r ? Math.max(0, r - 1) : 1 } },
      { value: { q, r: r + 1 < d ? r + 1 : Math.max(0, r - 1) } },
      { value: { q: q - 1, r: r + d }, why: `A remainder must be smaller than ${d}. If ${r + d} are left, one more group of ${d} fits.` },
      { value: { q: q + 2, r } },
    ];
    const choices = [{ label: label({ q, r }), value: `${q}R${r}`, correct: true }];
    for (const w of wrong) {
      const lab = label(w.value);
      if (choices.length < 4 && w.value.q > 0 && !choices.some((c) => c.label === lab)) choices.push({ label: lab, value: `${w.value.q}R${w.value.r}`, why: w.why });
    }
    const who = rng.pick(FRIENDS);
    return P({
      skill: this.id, tier,
      text: word
        ? `${who} has ${fmtInt(n)} fish to share equally among ${d} penguins. How many does each get, and how many are left over? (Type it like 7 R2)`
        : `What is ${fmtInt(n)} ÷ ${d}? (Type the remainder like 7 R2)`,
      answer: rem(q, r),
      choices: rng.shuffle(choices),
      hint: `How many groups of ${d} fit into ${fmtInt(n)}? Whatever is left over is the remainder.`,
      steps: [
        `Find the biggest multiple of ${d} that is not more than ${fmtInt(n)}: ${d} × ${q} = ${fmtInt(d * q)}.`,
        `${fmtInt(n)} − ${fmtInt(d * q)} = ${r} left over.`,
        r ? `So ${fmtInt(n)} ÷ ${d} = ${q} R${r}.` : `Nothing is left over, so ${fmtInt(n)} ÷ ${d} = ${q}.`,
      ],
      meta: { op: '/r', a: n, b: d },
    });
  },
};

const divMulti = {
  id: 'div_multi', domain: D, grade: 4, cc: '4.NBT.6', name: 'Divide up to 4 digits by 1 digit', short: '3-4 digit ÷ 1-digit',
  gen(rng, tier) {
    const d = tier === 1 ? rng.int(2, 5) : rng.int(3, 9);
    const q = tier === 1 ? rng.int(11, 60) : tier === 2 ? rng.int(21, 199) : rng.int(101, 999);
    const n = d * q;
    const parts = splitPlaces(q);
    return P({
      skill: this.id, tier,
      text: `What is ${fmtInt(n)} ÷ ${d}?`,
      answer: num(q),
      choices: makeChoices(rng, q, [q + 1, q - 1, q + 10, q - 10, q + 100, ...nearInts(rng, q, 10)], labelNum),
      hint: `Break ${fmtInt(n)} into friendly chunks that ${d} divides evenly, like ${fmtInt(d * parts[0])}.`,
      steps: [
        `Break ${fmtInt(n)} into ${parts.map((p) => fmtInt(d * p)).join(' + ')}.`,
        ...parts.map((p) => `${fmtInt(d * p)} ÷ ${d} = ${fmtInt(p)}.`),
        `Add the answers: ${parts.map(fmtInt).join(' + ')} = ${fmtInt(q)}.`,
      ],
      meta: { op: '/', a: n, b: d },
    });
  },
};

const mul3x2 = {
  id: 'mul_3x2', domain: D, grade: 5, cc: '5.NBT.5', name: 'Multiply multi-digit numbers', short: '3-digit × 2-digit',
  gen(rng, tier) {
    const a = tier === 3 ? rng.int(1012, 2999) : rng.int(112, 899);
    const b = tier === 1 ? rng.int(11, 19) : tier === 2 ? rng.int(21, 59) : rng.int(23, 89);
    const p = a * b;
    const tens = Math.floor(b / 10) * 10, ones = b % 10;
    return P({
      skill: this.id, tier,
      text: `What is ${fmtInt(a)} × ${b}?`,
      answer: num(p),
      choices: makeChoices(rng, p, [
        { value: a * Math.floor(b / 10) + a * ones, why: `The tens digit of ${b} is worth ${tens}, not ${tens / 10}.` },
        p + 1000, p - 100, p + a, ...nearInts(rng, p, 1000),
      ], labelNum),
      hint: `Multiply ${fmtInt(a)} by ${tens}, then by ${ones}, and add the two answers.`,
      steps: [
        `${fmtInt(a)} × ${tens} = ${fmtInt(a * tens)}.`,
        `${fmtInt(a)} × ${ones} = ${fmtInt(a * ones)}.`,
        `${fmtInt(a * tens)} + ${fmtInt(a * ones)} = ${fmtInt(p)}.`,
      ],
      meta: { op: '*', a, b },
    });
  },
};

const div2digit = {
  id: 'div_2digit', domain: D, grade: 5, cc: '5.NBT.6', name: 'Divide by 2-digit numbers', short: '÷ 2-digit divisors',
  gen(rng, tier) {
    const d = tier === 1 ? rng.pick([10, 11, 12, 15, 20]) : tier === 2 ? rng.int(11, 35) : rng.int(36, 95);
    const q = tier === 1 ? rng.int(3, 30) : tier === 2 ? rng.int(11, 60) : rng.int(12, 99);
    const n = d * q;
    const t = Math.floor(q / 10) * 10, o = q % 10;
    const steps = t && o
      ? [
        `Try ${d} × ${t} = ${fmtInt(d * t)}. That leaves ${fmtInt(n)} − ${fmtInt(d * t)} = ${fmtInt(n - d * t)}.`,
        `${d} × ${o} = ${fmtInt(d * o)}, which uses up the rest.`,
        `${t} + ${o} = ${q}, so ${fmtInt(n)} ÷ ${d} = ${q}.`,
      ]
      : [`${d} × ${q} = ${fmtInt(n)}.`, `So ${fmtInt(n)} ÷ ${d} = ${q}.`];
    return P({
      skill: this.id, tier,
      text: `What is ${fmtInt(n)} ÷ ${d}?`,
      answer: num(q),
      choices: makeChoices(rng, q, [q + 1, q - 1, q + 10, q - 10, q * 10, ...nearInts(rng, q, 5)], labelNum),
      hint: `Estimate first: about how many ${d}s fit in ${fmtInt(n)}? Try multiplying ${d} by a multiple of 10.`,
      steps,
      meta: { op: '/', a: n, b: d },
    });
  },
};

const decStr = (intVal, places) => fmtNum(new Frac(intVal, 10 ** places).value);

const mulDec = {
  id: 'mul_dec', domain: D, grade: 5, cc: '5.NBT.7', name: 'Multiply decimals', short: 'decimal ×',
  gen(rng, tier) {
    let A, pa, B, pb;
    if (tier === 1) { A = rng.int(2, 49); pa = 1; B = rng.int(2, 9); pb = 0; }
    else if (tier === 2) { A = rng.int(2, 9); pa = 1; B = rng.int(2, 19); pb = 1; }
    else { A = rng.int(101, 499); pa = 2; B = rng.int(11, 39); pb = 1; }
    if (A % 10 === 0) A += 1;
    if (pb && B % 10 === 0) B += 1;
    const a = new Frac(A, 10 ** pa), b = new Frac(B, 10 ** pb);
    const p = a.mul(b);
    const places = pa + pb;
    const sa = decStr(A, pa), sb = decStr(B, pb);
    const shown = decStr(A * B, places);
    return P({
      skill: this.id, tier,
      text: `What is ${sa} × ${sb}?`,
      answer: num(p),
      choices: makeChoices(rng, p, [
        { value: p.mul(10), why: `Count the decimal places: there should be ${places} in the answer.` },
        { value: p.div(10), why: `Count the decimal places: there should be ${places} in the answer.` },
        p.add(new Frac(1, 10 ** Math.max(1, places - 1))), p.sub(new Frac(1, 10 ** places)),
      ], labelNum),
      hint: `Multiply as if there were no decimal points, then put back ${places} decimal place${places > 1 ? 's' : ''}.`,
      steps: [
        `Ignore the decimal points: ${fmtInt(A)} × ${fmtInt(B)} = ${fmtInt(A * B)}.`,
        `${sa} has ${pa} decimal place${pa === 1 ? '' : 's'} and ${sb} has ${pb}. That's ${places} in all.`,
        `Move the point ${places} place${places > 1 ? 's' : ''} left: ${shown}.`,
      ],
      meta: { op: '*', a: a.value, b: b.value },
    });
  },
};

const divDec = {
  id: 'div_dec', domain: D, grade: 5, cc: '5.NBT.7', name: 'Divide decimals', short: 'decimal ÷',
  gen(rng, tier) {
    if (tier < 3) {
      const d = rng.int(2, 9);
      const places = tier === 1 ? 1 : 2;
      let Q = rng.int(tier === 1 ? 2 : 11, tier === 1 ? 49 : 299);
      // Keep the dividend a true decimal (not a whole number).
      while (Q % 10 === 0 || (Q * d) % 10 ** places === 0) Q += 1;
      const q = new Frac(Q, 10 ** places);
      const n = q.mul(d);
      const ns = fmtNum(n.value);
      const unit = places === 1 ? 'tenths' : 'hundredths';
      return P({
        skill: this.id, tier,
        text: `What is ${ns} ÷ ${d}?`,
        answer: num(q),
        choices: makeChoices(rng, q, [
          { value: q.mul(10), why: 'Line the decimal point in the answer up with the decimal point in the number you are dividing.' },
          q.div(10), q.add(new Frac(1, 10 ** places)), q.sub(new Frac(1, 10 ** places)),
        ], labelNum),
        hint: `Think of ${ns} as a number of ${unit}, divide, then change back to a decimal.`,
        steps: [
          `${ns} is ${fmtInt(Q * d)} ${unit}.`,
          `${fmtInt(Q * d)} ${unit} ÷ ${d} = ${fmtInt(Q)} ${unit}.`,
          `${fmtInt(Q)} ${unit} is ${fmtNum(q.value)}.`,
        ],
        meta: { op: '/', a: n.value, b: d },
      });
    }
    const q = rng.int(2, 12);
    const dv = new Frac(rng.int(2, 9), 10);
    const n = dv.mul(q);
    return P({
      skill: this.id, tier,
      text: `What is ${fmtNum(n.value)} ÷ ${fmtNum(dv.value)}?`,
      answer: num(q),
      choices: makeChoices(rng, q, [
        { value: new Frac(q, 10), why: 'Dividing by a number less than 1 gives a bigger answer, not a smaller one.' },
        q * 10, q + 1, q - 1,
      ], labelNum),
      hint: `Multiply both numbers by 10 so you are dividing by a whole number.`,
      steps: [
        `Multiply both by 10: ${fmtNum(n.value)} ÷ ${fmtNum(dv.value)} is the same as ${fmtInt(n.mul(10).value)} ÷ ${fmtInt(dv.mul(10).value)}.`,
        `${fmtInt(n.mul(10).value)} ÷ ${fmtInt(dv.mul(10).value)} = ${q}.`,
      ],
      meta: { op: '/', a: n.value, b: dv.value },
    });
  },
};

const mulWord = {
  id: 'mul_word', domain: D, grade: 4, cc: '4.OA.2', name: 'Multiplication word problems', short: 'word problems',
  gen(rng, tier) {
    const [p1, p2] = rng.shuffle(FRIENDS);
    const kind = tier === 1 ? rng.int(0, 1) : tier === 2 ? rng.int(1, 2) : rng.int(2, 3);
    if (kind === 0) {
      const a = rng.int(3, 12), k = rng.int(2, 6);
      return P({
        skill: this.id, tier,
        text: `${p1} has ${a} snowballs. ${p2} has ${k} times as many. How many snowballs does ${p2} have?`,
        answer: num(a * k),
        choices: makeChoices(rng, a * k, [{ value: a + k, why: `"${k} times as many" means multiply by ${k}, not add ${k}.` }, a * k + a, a * (k - 1), ...nearInts(rng, a * k, 3)], labelNum),
        hint: `"${k} times as many" means ${k} groups of ${a}.`,
        steps: [`${k} times as many as ${a} is ${a} × ${k}.`, `${a} × ${k} = ${a * k}.`],
        meta: { op: '*', a, b: k },
      });
    }
    if (kind === 1) {
      const small = rng.int(3, 12), k = rng.int(2, 8), big = small * k;
      return P({
        skill: this.id, tier,
        text: `${p1} caught ${big} fish. That is ${k} times as many as ${p2} caught. How many fish did ${p2} catch?`,
        answer: num(small),
        choices: makeChoices(rng, small, [{ value: big * k, why: `${p1} has more fish, so ${p2}'s number is smaller. Divide by ${k}.` }, big - k, small + 1, small - 1], labelNum),
        hint: `${p2} caught fewer. What number times ${k} makes ${big}?`,
        steps: [`${p2}'s fish × ${k} = ${big}.`, `${big} ÷ ${k} = ${small}.`],
        meta: { op: '/', a: big, b: k },
      });
    }
    if (kind === 2) {
      const b = rng.int(3, 9), c = rng.int(6, 24), e = rng.int(5, b * c - 5);
      const ans = b * c - e;
      return P({
        skill: this.id, tier,
        text: `There are ${b} baskets with ${c} fish in each. The penguins eat ${e} fish at dinner. How many fish are left?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: b * c, why: `That's how many there were before dinner. Now take away the ${e} eaten.` }, b * c + e, b + c - e, ...nearInts(rng, ans, 5)], labelNum),
        hint: `First find how many fish in all, then take away the ones eaten.`,
        steps: [`Fish in all: ${b} × ${c} = ${b * c}.`, `After dinner: ${b * c} − ${e} = ${ans}.`],
        meta: { op: 'expr', value: ans },
      });
    }
    const cap = rng.int(3, 8), n = rng.int(cap * 3 + 1, cap * 12);
    const sleds = Math.ceil(n / cap);
    return P({
      skill: this.id, tier,
      text: `Each ice sled holds ${cap} penguins. How many sleds are needed to carry ${n} penguins?`,
      answer: num(sleds),
      choices: makeChoices(rng, sleds, [
        n % cap ? { value: Math.floor(n / cap), why: `That leaves ${n % cap} penguins without a ride. They need one more sled.` } : sleds + 1,
        sleds + 1, sleds - 2, ...nearInts(rng, sleds, 2),
      ], labelNum),
      hint: `Divide ${n} by ${cap}. If some penguins are left over, they need a sled too.`,
      steps: [
        `${n} ÷ ${cap} = ${Math.floor(n / cap)}${n % cap ? ` R${n % cap}` : ''}.`,
        n % cap ? `The ${n % cap} leftover penguins need one more sled: ${Math.floor(n / cap)} + 1 = ${sleds}.` : `No penguins are left over, so ${sleds} sleds.`,
      ],
      meta: { op: 'expr', value: sleds },
    });
  },
};

export const LAKE_SKILLS = [mulFacts, divFacts, mul2x1, mulWord, mulMulti1, mul2x2, divRem, divMulti, mul3x2, div2digit, mulDec, divDec];
