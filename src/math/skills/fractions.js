// Crystal Grove: fractions (grades 3-6).
import { P, frac, num, pick, makeChoices, labelFrac, labelNum, nearInts } from '../build.js';
import { Frac, gcd, lcm } from '../frac.js';
import { fracMarkup as fm, fmtInt } from '../fmt.js';
import { friend } from '../theme.js';

const D = 'grove';
const F = (n, d) => new Frac(n, d);
const lab = labelFrac(false);
const labMixed = labelFrac(true);

function coprimePair(rng, dMin, dMax) {
  for (;;) {
    const d = rng.int(dMin, dMax);
    const n = rng.int(1, d - 1);
    if (gcd(n, d) === 1) return [n, d];
  }
}

const identify = {
  id: 'frac_identify', domain: D, grade: 3, cc: '3.NF.1', name: 'Name the fraction', short: 'what fraction?',
  gen(rng, tier) {
    const d = tier === 1 ? rng.int(2, 4) : tier === 2 ? rng.pick([5, 6, 8]) : rng.pick([9, 10, 12]);
    const n = rng.int(1, d - 1);
    const shape = d <= 8 && rng.chance(0.4) ? 'circle' : 'bar';
    return P({
      skill: this.id, tier,
      text: shape === 'bar' ? 'What fraction of the ice bar is glowing?' : 'What fraction of the snow pie is glowing?',
      visual: { kind: shape, parts: d, shaded: n },
      answer: frac(F(n, d)),
      choices: makeChoices(rng, F(n, d), [
        { value: F(d - n, d), why: 'That fraction counts the parts that are NOT glowing.' },
        { value: F(d, n), why: 'The bottom number is how many equal parts there are in all.' },
        { value: F(n, d + 1) }, { value: F(n + 1, d) },
      ], lab, 4, { byLabel: true }),
      hint: 'Count the glowing parts for the top number. Count all the equal parts for the bottom number.',
      steps: [`There are ${d} equal parts in all. That is the bottom number.`, `${n} part${n > 1 ? 's are' : ' is'} glowing. That is the top number.`, `So the fraction is {${n}/${d}}.`],
      meta: { value: F(n, d) },
    });
  },
};

const equiv = {
  id: 'frac_equiv', domain: D, grade: 4, cc: '4.NF.1', name: 'Equivalent fractions', short: 'equivalent fractions',
  gen(rng, tier) {
    const [a, b] = coprimePair(rng, 2, tier === 1 ? 5 : 8);
    const k = tier === 1 ? rng.int(2, 3) : rng.int(2, 5);
    const c = b * k, ak = a * k;
    if (tier === 3 && rng.chance(0.6)) {
      return P({
        skill: this.id, tier,
        text: `Fill in the missing number: {${ak}/${c}} = {?/${b}}`,
        answer: num(a),
        choices: makeChoices(rng, a, [{ value: ak - (c - b), why: 'Subtracting the same amount from the top and bottom changes the fraction. Divide both by the same number instead.' }, a + 1, a * 2, ...nearInts(rng, a, 2)], labelNum),
        hint: `What did you divide ${c} by to get ${b}? Divide ${ak} by the same number.`,
        hintVisual: { kind: 'bars', bars: [{ parts: c, shaded: ak }, { parts: b, shaded: a }] },
        steps: [`${c} ÷ ${k} = ${b}.`, `Divide the top by ${k} too: ${ak} ÷ ${k} = ${a}.`, `{${ak}/${c}} = {${a}/${b}}.`],
        meta: { value: a },
      });
    }
    return P({
      skill: this.id, tier,
      text: `Fill in the missing number: {${a}/${b}} = {?/${c}}`,
      answer: num(ak),
      choices: makeChoices(rng, ak, [
        { value: a + (c - b), why: 'Adding the same amount to the top and bottom changes the fraction. Multiply both by the same number instead.' },
        ak + 1, ak - 1, a, c - ak, ...nearInts(rng, ak, 2),
      ], labelNum),
      hint: `What did you multiply ${b} by to get ${c}? Multiply ${a} by the same number.`,
      hintVisual: { kind: 'bars', bars: [{ parts: b, shaded: a }, { parts: c, shaded: ak }] },
      steps: [`${b} × ${k} = ${c}.`, `Multiply the top by ${k} too: ${a} × ${k} = ${ak}.`, `{${a}/${b}} = {${ak}/${c}}.`],
      meta: { value: ak },
    });
  },
};

const simplify = {
  id: 'frac_simplify', domain: D, grade: 4, cc: '4.NF.1', name: 'Simplify fractions', short: 'simplest form',
  gen(rng, tier) {
    const [a, b] = coprimePair(rng, 2, tier === 1 ? 5 : 9);
    const g = tier === 1 ? 2 : tier === 2 ? rng.int(2, 4) : rng.int(3, 7);
    const n = a * g, d = b * g;
    const partial = g % 2 === 0 && g > 2 ? F(n / 2, d / 2) : null;
    return P({
      skill: this.id, tier,
      text: `Write {${n}/${d}} in simplest form.`,
      answer: frac(F(a, b), { simplest: true }),
      choices: makeChoices(rng, F(a, b), [
        partial ? { value: partial, why: `You can divide the top and bottom by 2 again.` } : { value: F(n - 1, d - 1) },
        { value: F(a, d), why: 'Divide the top AND the bottom by the same number.' },
        { value: F(n, b), why: 'Divide the top AND the bottom by the same number.' },
        { value: F(a + 1, b) },
      ], lab, 4, { byLabel: true }),
      hint: `Find the biggest number that divides both ${n} and ${d}.`,
      steps: [`${g} divides both ${n} and ${d}.`, `${n} ÷ ${g} = ${a} and ${d} ÷ ${g} = ${b}.`, `So {${n}/${d}} = {${a}/${b}}.`],
      meta: { value: F(a, b) },
    });
  },
};

function compareProblem(rng, tier) {
  let a, b, c, d;
  if (tier === 1) {
    if (rng.chance(0.5)) { b = d = rng.int(3, 12); a = rng.int(1, b - 1); c = rng.int(1, b - 1); }
    else { a = c = rng.int(1, 4); b = rng.int(a + 1, 12); d = rng.int(a + 1, 12); }
  } else if (tier === 2) {
    [a, b] = coprimePair(rng, 3, 10);
    const k = rng.int(2, 3);
    if (rng.chance(0.3)) { c = a * k; d = b * k; } else { [c, d] = coprimePair(rng, 3, 10); }
  } else {
    [a, b] = coprimePair(rng, 4, 12);
    [c, d] = coprimePair(rng, 4, 12);
  }
  // The very same fraction on both sides is not a real comparison.
  if (a === c && b === d) return compareProblem(rng, tier);
  return [a, b, c, d];
}

const compare = {
  id: 'frac_compare', domain: D, grade: 4, cc: '4.NF.2', name: 'Compare fractions', short: 'compare < > =',
  gen(rng, tier) {
    const [a, b, c, d] = compareProblem(rng, tier);
    const cmp = F(a, b).cmp(F(c, d));
    const sign = cmp < 0 ? '<' : cmp > 0 ? '>' : '=';
    const L = lcm(b, d);
    const A = a * (L / b), C = c * (L / d);
    let why;
    if (b !== d && a === c) why = `Both have ${a} on top. Smaller pieces (a bigger bottom number) make a smaller fraction.`;
    else why = `Use a common denominator: {${a}/${b}} = {${A}/${L}} and {${c}/${d}} = {${C}/${L}}.`;
    const choices = ['<', '>', '='].map((s) => ({ label: s, value: s, correct: s === sign, why: s === sign ? undefined : why }));
    return P({
      skill: this.id, tier,
      text: `Which sign makes this true?  {${a}/${b}} ○ {${c}/${d}}`,
      answer: pick(),
      choices,
      visual: tier < 3 ? { kind: 'bars', bars: [{ parts: b, shaded: a }, { parts: d, shaded: c }] } : null,
      hint: b === d ? 'The pieces are the same size, so compare the top numbers.'
        : a === c ? `Both have ${a} piece${a > 1 ? 's' : ''}. Which fraction has bigger pieces?`
          : `Rename both fractions with the same bottom number, like ${L}.`,
      steps: b === d
        ? [`Same size pieces: compare ${a} and ${c}.`, `So {${a}/${b}} ${sign} {${c}/${d}}.`]
        : a === c
          ? [`Both fractions have ${a} piece${a > 1 ? 's' : ''}.`, `The bigger the bottom number, the smaller each piece. ${b}ths are ${b > d ? 'smaller' : 'bigger'} than ${d}ths.`, `So {${a}/${b}} ${sign} {${c}/${d}}.`]
          : [`{${a}/${b}} = {${A}/${L}}.`, `{${c}/${d}} = {${C}/${L}}.`, `${A} ${sign} ${C}, so {${a}/${b}} ${sign} {${c}/${d}}.`],
      answerText: sign,
      meta: { sign, a: F(a, b), b: F(c, d) },
    });
  },
};

const addLike = {
  id: 'frac_add_like', domain: D, grade: 4, cc: '4.NF.3', name: 'Add and subtract like fractions', short: 'like denominators',
  gen(rng, tier) {
    const d = rng.int(3, 12);
    if (tier === 3) {
      const w1 = rng.int(2, 5), n1 = rng.int(1, d - 1), w2 = rng.int(1, w1 - 1), n2 = rng.int(1, d - 1);
      const x = F(w1 * d + n1, d), y = F(w2 * d + n2, d);
      const add = rng.chance(0.5);
      const ans = add ? x.add(y) : x.sub(y);
      const op = add ? '+' : '−';
      return P({
        skill: this.id, tier,
        text: `What is {${w1} ${n1}/${d}} ${op} {${w2} ${n2}/${d}}?`,
        answer: frac(ans),
        choices: makeChoices(rng, ans, [
          add ? F(w1 + w2, 1).add(F(Math.abs(n1 - n2), d)) : F(w1 - w2, 1).add(F(Math.abs(n1 - n2), d)),
          ans.add(F(1, d)), ans.sub(F(1, d)), ans.add(1),
        ], labMixed),
        hint: 'Change both mixed numbers into fractions with the same bottom number, then add or subtract the tops.',
        steps: [
          `{${w1} ${n1}/${d}} = {${w1 * d + n1}/${d}} and {${w2} ${n2}/${d}} = {${w2 * d + n2}/${d}}.`,
          `${w1 * d + n1} ${op} ${w2 * d + n2} = ${add ? w1 * d + n1 + w2 * d + n2 : w1 * d + n1 - (w2 * d + n2)}, so the answer is {${add ? w1 * d + n1 + w2 * d + n2 : w1 * d + n1 - (w2 * d + n2)}/${d}}.`,
          `That is ${fm(ans, { mixed: true })}.`,
        ],
        meta: { value: ans },
      });
    }
    let a = rng.int(1, d - 1), b = rng.int(1, d - 1);
    if (tier === 1) { while (a + b >= d) { a = rng.int(1, d - 2); b = rng.int(1, d - 1 - a); } }
    const add = tier === 1 || rng.chance(0.6);
    if (!add && a < b) [a, b] = [b, a];
    if (!add && a === b) {
      if (a < d - 1) a += 1;
      else b -= 1;
    }
    const top = add ? a + b : a - b;
    const ans = F(top, d);
    const op = add ? '+' : '−';
    const steps = [
      `The pieces are the same size (${d} in a whole), so ${add ? 'add' : 'subtract'} the tops: ${a} ${op} ${b} = ${top}.`,
      `The bottom number stays ${d}: {${top}/${d}}.`,
    ];
    if (top > d && top % d) steps.push(`That is the same as ${fm(ans, { mixed: true })}.`);
    if (top % d === 0 && top > 0) steps.push(`{${top}/${d}} = ${top / d}.`);
    return P({
      skill: this.id, tier,
      text: `What is {${a}/${d}} ${op} {${b}/${d}}?`,
      answer: frac(ans),
      choices: makeChoices(rng, ans, [
        add ? { value: F(top, 2 * d), why: 'Only add the top numbers. The bottom number stays the same because the pieces are the same size.' } : { value: F(top, 1), why: 'Keep the bottom number the same.' },
        F(top + 1, d), F(Math.max(1, top - 1), d), add ? F(Math.abs(a - b) || 1, d) : F(a + b, d),
      ], lab),
      hintVisual: { kind: 'bars', bars: [{ parts: d, shaded: a }, { parts: d, shaded: b }] },
      hint: `Same bottom numbers! Just ${add ? 'add' : 'subtract'} the top numbers.`,
      steps,
      meta: { value: ans },
    });
  },
};

const mixed = {
  id: 'frac_mixed', domain: D, grade: 4, cc: '4.NF.3b', name: 'Mixed numbers and improper fractions', short: 'mixed ↔ improper',
  gen(rng, tier) {
    const d = rng.int(2, tier === 1 ? 6 : 10);
    const w = rng.int(1, tier === 3 ? 9 : 4);
    const n = rng.int(1, d - 1);
    const top = w * d + n;
    const v = F(top, d);
    if (tier === 1 || (tier === 3 && rng.chance(0.5))) {
      return P({
        skill: this.id, tier,
        text: `Write {${top}/${d}} as a mixed number.`,
        answer: frac(v, { form: 'mixed' }),
        answerText: `{${w} ${n}/${d}}`,
        choices: makeChoices(rng, v, [
          { value: F(n * d + w, d), why: `The whole number is how many times ${d} fits into ${top}.` },
          { value: F((w + 1) * d + n, d) },
          { value: F(w * d + Math.max(1, n - 1 === 0 ? n + 1 : n - 1), d) },
        ], labMixed),
        hint: `How many groups of ${d} fit into ${top}? That's the whole number. The leftover is the top of the fraction.`,
        steps: [`${top} ÷ ${d} = ${w} R${n}.`, `${w} whole${w > 1 ? 's' : ''} and ${n} left over: {${w} ${n}/${d}}.`],
        meta: { value: v },
      });
    }
    return P({
      skill: this.id, tier,
      text: `Write {${w} ${n}/${d}} as an improper fraction.`,
      answer: frac(v, { form: 'improper' }),
      answerText: `{${top}/${d}}`,
      choices: makeChoices(rng, v, [
        { value: F(w + n, d), why: `Each whole is {${d}/${d}}, so ${w} wholes is ${w * d} pieces. Add the ${n} extra.` },
        { value: F(w * n + d, d), why: `Multiply the whole number by the bottom number: ${w} × ${d}.` },
        { value: F(top + d, d) },
      ], lab),
      hint: `Each whole has ${d} pieces. How many pieces are in ${w} wholes? Add the ${n} extra pieces.`,
      steps: [`${w} wholes = ${w} × ${d} = ${w * d} pieces.`, `${w * d} + ${n} = ${top}.`, `So {${w} ${n}/${d}} = {${top}/${d}}.`],
      meta: { value: v },
    });
  },
};

const fill = {
  id: 'frac_fill', domain: D, grade: 4, cc: '4.NF.3a', name: 'Make one whole', short: 'fill to 1 whole',
  gen(rng, tier) {
    if (tier === 3) {
      const d = rng.pick([6, 8, 10, 12]);
      const halfD = rng.pick([2, 3, 4].filter((x) => d % x === 0));
      const a = F(1, halfD);
      let b = rng.int(1, d - d / halfD - 1);
      const rest = F(1, 1).sub(a).sub(F(b, d));
      return P({
        skill: this.id, tier,
        text: `This crystal lock needs exactly 1 whole. It has {1/${halfD}} and {${b}/${d}}. How much more is needed?`,
        answer: frac(rest),
        choices: makeChoices(rng, rest, [rest.add(F(1, d)), rest.sub(F(1, d)), F(1, 1).sub(F(b, d)), F(d - b, d)], lab),
        hint: `Rename {1/${halfD}} in ${d}ths first.`,
        steps: [
          `{1/${halfD}} = {${d / halfD}/${d}}.`,
          `{${d / halfD}/${d}} + {${b}/${d}} = {${d / halfD + b}/${d}}.`,
          `One whole is {${d}/${d}}, so {${d}/${d}} − {${d / halfD + b}/${d}} = {${d - d / halfD - b}/${d}}.`,
        ],
        meta: { value: rest },
      });
    }
    const d = tier === 1 ? rng.int(2, 6) : rng.int(5, 12);
    const n = rng.int(1, d - 1);
    const ans = F(d - n, d);
    return P({
      skill: this.id, tier,
      text: `This crystal lock is {${n}/${d}} full. How much more fills it to exactly 1 whole?`,
      visual: { kind: 'bar', parts: d, shaded: n },
      answer: frac(ans),
      choices: makeChoices(rng, ans, [
        { value: F(n, d), why: `That is how full it already is. How many more ${d}ths make {${d}/${d}}?` },
        F(d - n + 1, d), F(Math.max(1, d - n - 1), d), F(d - n, d + 1),
      ], lab),
      hint: `One whole is {${d}/${d}}. How many more pieces do you need?`,
      steps: [`One whole = {${d}/${d}}.`, `${d} − ${n} = ${d - n}.`, `So it needs {${d - n}/${d}} more.`],
      meta: { value: ans },
    });
  },
};

const timesWhole = {
  id: 'frac_times_whole', domain: D, grade: 4, cc: '4.NF.4', name: 'Multiply a fraction by a whole number', short: 'whole × fraction',
  gen(rng, tier) {
    const [a, b] = coprimePair(rng, 2, tier === 1 ? 6 : 10);
    const k = tier === 1 ? rng.int(2, 3) : rng.int(2, 9);
    const ans = F(a * k, b);
    const word = tier === 3;
    return P({
      skill: this.id, tier,
      text: word ? `Each penguin eats {${a}/${b}} of a fish for breakfast. How much fish do ${k} penguins eat?` : `What is ${k} × {${a}/${b}}?`,
      answer: frac(ans),
      choices: makeChoices(rng, ans, [
        { value: F(a * k, b * k), why: `Only the top gets multiplied: ${k} groups of ${a} pieces, each piece still a ${b}th.` },
        F(a + k, b), F(a * k + 1, b), F(a, b * k),
      ], labMixed),
      hint: `${k} × {${a}/${b}} means ${k} groups of {${a}/${b}}. Multiply the top number by ${k}.`,
      steps: [
        `${k} × {${a}/${b}} means ${k} groups of {${a}/${b}}.`,
        `Multiply the top: ${k} × ${a} = ${a * k}. The bottom stays ${b}: {${a * k}/${b}}.`,
        ...(a * k > b ? [`That is ${fm(ans, { mixed: true })}.`] : []),
      ],
      meta: { value: ans },
    });
  },
};

const addUnlike = {
  id: 'frac_add_unlike', domain: D, grade: 5, cc: '5.NF.1', name: 'Add and subtract unlike fractions', short: 'unlike denominators',
  gen(rng, tier) {
    let a, b, c, d;
    if (tier === 1) { b = rng.pick([2, 3, 4, 5]); d = b * rng.int(2, 3); a = rng.int(1, b - 1); c = rng.int(1, d - 1); }
    else { [a, b] = coprimePair(rng, 2, 6); [c, d] = coprimePair(rng, 2, 8); if (b === d) d += 1; }
    if (gcd(a, b) !== 1 || gcd(c, d) !== 1) { a = 1; c = 1; }
    const add = tier === 1 || rng.chance(0.55);
    let x = F(a, b), y = F(c, d);
    if (!add && x.cmp(y) < 0) { [x, y] = [y, x]; [a, b, c, d] = [c, d, a, b]; }
    if (!add && x.eq(y)) { return addUnlike.gen(rng, 1); }
    const ans = add ? x.add(y) : x.sub(y);
    const L = lcm(b, d), A = a * (L / b), C = c * (L / d);
    const op = add ? '+' : '−';
    return P({
      skill: this.id, tier,
      text: `What is {${a}/${b}} ${op} {${c}/${d}}?`,
      answer: frac(ans),
      choices: makeChoices(rng, ans, [
        add ? { value: F(a + c, b + d), why: 'You can\'t add the bottoms. First rename the fractions so they have the same bottom number.' }
          : { value: F(Math.abs(a - c) || 1, Math.abs(b - d) || 1), why: 'You can\'t subtract the bottoms. First rename the fractions so they have the same bottom number.' },
        ans.add(F(1, L)), F(Math.abs(add ? A + C : A - C) + 1, L), F(add ? A + C : A - C, L * 2),
      ], lab),
      hint: `Find a common bottom number. ${L} works for both ${b} and ${d}.`,
      steps: [
        `A common denominator is ${L}.`,
        `{${a}/${b}} = {${A}/${L}} and {${c}/${d}} = {${C}/${L}}.`,
        `{${A}/${L}} ${op} {${C}/${L}} = {${add ? A + C : A - C}/${L}}${ans.d !== L ? ` = ${fm(ans)}` : ''}.`,
      ],
      meta: { value: ans },
    });
  },
};

const mult = {
  id: 'frac_mult', domain: D, grade: 5, cc: '5.NF.4', name: 'Multiply fractions', short: 'fraction × fraction',
  gen(rng, tier) {
    let x, y, text;
    if (tier === 1) { x = F(1, rng.int(2, 5)); y = F(1, rng.int(2, 6)); }
    else { const [a, b] = coprimePair(rng, 2, 6); const [c, d] = coprimePair(rng, 2, 8); x = F(a, b); y = F(c, d); }
    if (tier === 3) {
      const w = rng.int(1, 3);
      const mixedX = F(w * x.d + x.n, x.d);
      text = `What is ${fm(mixedX, { mixed: true })} × {${y.n}/${y.d}}?`;
      const ans = mixedX.mul(y);
      return P({
        skill: this.id, tier, text,
        answer: frac(ans),
        choices: makeChoices(rng, ans, [F(w, 1).add(x.mul(y)), ans.add(F(1, y.d)), F(mixedX.n * y.n, mixedX.d + y.d), x.mul(y)], labMixed),
        hint: `Change ${fm(mixedX, { mixed: true })} to an improper fraction first.`,
        steps: [
          `${fm(mixedX, { mixed: true })} = {${mixedX.n}/${mixedX.d}}.`,
          `Multiply tops and bottoms: ${mixedX.n} × ${y.n} = ${mixedX.n * y.n} and ${mixedX.d} × ${y.d} = ${mixedX.d * y.d}.`,
          fm(ans, { mixed: true }) === `{${mixedX.n * y.n}/${mixedX.d * y.d}}`
            ? `The answer is {${mixedX.n * y.n}/${mixedX.d * y.d}}.`
            : `{${mixedX.n * y.n}/${mixedX.d * y.d}} = ${fm(ans, { mixed: true })}.`,
        ],
        meta: { value: ans },
      });
    }
    const ans = x.mul(y);
    return P({
      skill: this.id, tier,
      text: `What is {${x.n}/${x.d}} × {${y.n}/${y.d}}?`,
      answer: frac(ans),
      choices: makeChoices(rng, ans, [
        { value: F(x.n * y.n, x.d + y.d), why: 'Multiply the bottoms too, don\'t add them.' },
        { value: x.add(y), why: 'That is adding. To multiply fractions, multiply the tops and multiply the bottoms.' },
        F(x.n * y.d, x.d * y.n), F(x.n + y.n, x.d * y.d),
      ], lab),
      hint: 'Multiply the top numbers, then multiply the bottom numbers.',
      hintVisual: { kind: 'fracgrid', rows: x.d, cols: y.d, rowsShaded: x.n, colsShaded: y.n },
      steps: [
        `Tops: ${x.n} × ${y.n} = ${x.n * y.n}.`,
        `Bottoms: ${x.d} × ${y.d} = ${x.d * y.d}.`,
        `{${x.n * y.n}/${x.d * y.d}}${ans.d !== x.d * y.d ? ` = ${fm(ans)} in simplest form` : ''}.`,
      ],
      meta: { value: ans },
    });
  },
};

const ofWhole = {
  id: 'frac_of_whole', domain: D, grade: 5, cc: '5.NF.4a', name: 'Fraction of a number', short: 'fraction of a number',
  gen(rng, tier) {
    const b = rng.int(2, tier === 1 ? 5 : 10);
    const a = tier === 1 ? 1 : rng.int(1, b - 1);
    const unit = rng.int(2, tier === 3 ? 15 : 9);
    const n = b * unit;
    const ans = a * unit;
    const word = tier === 3 || rng.chance(0.3);
    return P({
      skill: this.id, tier,
      text: word ? `There are ${n} fish in the bucket. {${a}/${b}} of them are silver. How many silver fish are there?` : `What is {${a}/${b}} of ${n}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: n - ans, why: `That is the part that is NOT {${a}/${b}}.` }, unit, ans + unit, ans - 1, ...nearInts(rng, ans, 3)], labelNum),
      hint: `First find {1/${b}} of ${n} by dividing by ${b}.`,
      steps: [`{1/${b}} of ${n} is ${n} ÷ ${b} = ${unit}.`, a > 1 ? `{${a}/${b}} is ${a} of those: ${a} × ${unit} = ${ans}.` : `So the answer is ${ans}.`],
      meta: { value: ans },
    });
  },
};

const divUnit = {
  id: 'frac_div_unit', domain: D, grade: 5, cc: '5.NF.7', name: 'Divide with unit fractions', short: 'unit fraction ÷',
  gen(rng, tier) {
    const k = rng.int(2, 6);
    if (tier === 2) {
      const w = rng.int(2, 6);
      const ans = F(1, k * w);
      return P({
        skill: this.id, tier,
        text: `What is {1/${k}} ÷ ${w}?`,
        answer: frac(ans),
        choices: makeChoices(rng, ans, [{ value: F(w, k), why: `Dividing {1/${k}} into ${w} parts makes the pieces smaller, not bigger.` }, F(1, k + w), F(k, w), F(1, k * w + 1)], lab),
        hint: `Split {1/${k}} into ${w} equal pieces. How big is each piece?`,
        hintVisual: { kind: 'bar', parts: k * w, shaded: 1 },
        steps: [`Splitting {1/${k}} into ${w} equal parts is the same as {1/${k}} × {1/${w}}.`, `{1/${k}} × {1/${w}} = {1/${k * w}}.`],
        meta: { value: ans },
      });
    }
    const w = rng.int(2, tier === 3 ? 8 : 6);
    const ans = w * k;
    const word = tier === 3;
    return P({
      skill: this.id, tier,
      text: word ? `A scoop holds {1/${k}} of a cup of fish flakes. How many scoops are in ${w} cups?` : `What is ${w} ÷ {1/${k}}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: F(w, k), why: `Ask: how many {1/${k}} pieces fit into ${w}? Each whole has ${k} of them.` }, w + k, ans + k, ans - w], (v) => (v instanceof Frac ? lab(v) : labelNum(v))),
      hint: `How many {1/${k}} pieces fit into one whole? Then into ${w} wholes?`,
      steps: [`One whole has ${k} pieces that are each {1/${k}}.`, `${w} wholes have ${w} × ${k} = ${ans} pieces.`],
      meta: { value: ans },
    });
  },
};

const divFrac = {
  id: 'frac_div', domain: D, grade: 6, cc: '6.NS.1', name: 'Divide fractions', short: 'fraction ÷ fraction',
  gen(rng, tier) {
    let x, y;
    if (tier === 1) { const d = rng.int(3, 10); const c = rng.int(1, 3); const a = c * rng.int(2, 4); if (a >= d * 3) return divFrac.gen(rng, 2); x = F(a, d); y = F(c, d); }
    else if (tier === 2) { const [a, b] = coprimePair(rng, 2, 6); const [c, d] = coprimePair(rng, 2, 6); x = F(a, b); y = F(c, d); }
    else { const w = rng.int(1, 3); const [a, b] = coprimePair(rng, 2, 5); x = F(w * b + a, b); const [c, d] = coprimePair(rng, 2, 6); y = F(c, d); }
    const ans = x.div(y);
    const xs = tier === 3 ? fm(x, { mixed: true }) : `{${x.n}/${x.d}}`;
    return P({
      skill: this.id, tier,
      text: `What is ${xs} ÷ {${y.n}/${y.d}}?`,
      answer: frac(ans),
      choices: makeChoices(rng, ans, [
        { value: x.mul(y), why: 'Dividing by a fraction means multiplying by its flip (reciprocal).' },
        { value: F(y.n * x.d, y.d * x.n), why: 'Flip the second fraction (the divisor), not the first.' },
        ans.add(F(1, ans.reduced.d)), ans.add(1),
      ], labMixed),
      hint: `Keep the first fraction, change ÷ to ×, and flip {${y.n}/${y.d}} to {${y.d}/${y.n}}.`,
      steps: [
        ...(tier === 3 ? [`${xs} = {${x.n}/${x.d}}.`] : []),
        `{${x.n}/${x.d}} ÷ {${y.n}/${y.d}} = {${x.n}/${x.d}} × {${y.d}/${y.n}}.`,
        `= {${x.n * y.d}/${x.d * y.n}}${!F(x.n * y.d, x.d * y.n).isReduced || x.n * y.d > x.d * y.n ? ` = ${fm(ans, { mixed: true })}` : ''}.`,
      ],
      meta: { value: ans },
    });
  },
};

// Word problems with like denominators (join, separate) and a fraction times a whole number.
const fracWord = {
  id: 'frac_word', domain: D, grade: 4, cc: '4.NF.3d', name: 'Fraction word problems', short: 'fraction stories',
  gen(rng, tier) {
    if (tier === 3) {
      const [a, b] = coprimePair(rng, 3, 8);
      const k = rng.int(3, 7);
      const ans = F(a * k, b);
      return P({
        skill: this.id, tier,
        text: `Each lantern uses {${a}/${b}} of a cup of glow oil. How many cups of oil do ${k} lanterns use?`,
        answer: frac(ans),
        choices: makeChoices(rng, ans, [
          { value: F(a * k, b * k), why: `${k} lanterns use ${k} groups of {${a}/${b}}. Multiply only the top number.` },
          F(a + k, b), F(a * k, b).add(1), F(a, b * k),
        ], labMixed),
        hint: `${k} lanterns × {${a}/${b}} cup each. Multiply the top number by ${k}.`,
        hintVisual: { kind: 'tape', rows: [{ segs: Array.from({ length: k }, () => ({ v: 1, label: `${a}/${b}` })), totalLabel: '?' }] },
        steps: [`${k} × {${a}/${b}} = {${a * k}/${b}}.`, ...(a * k > b ? [`{${a * k}/${b}} = ${fm(ans, { mixed: true })} cups.`] : [])],
        meta: { value: ans },
      });
    }
    const d = rng.pick(tier === 1 ? [4, 5, 6, 8] : [6, 8, 10, 12]);
    const join = tier === 1 || rng.chance(0.5);
    let a = rng.int(1, d - 2), c = rng.int(1, d - 1 - a);
    if (!join) { const whole = rng.int(a + 1, d); [a, c] = [whole, rng.int(1, whole - 1)]; }
    const ans = join ? F(a + c, d) : F(a - c, d);
    const story = join
      ? `Fern waters {${a}/${d}} of her garden in the morning and {${c}/${d}} of it in the afternoon. What fraction of the garden did she water?`
      : `Pebble had {${a}/${d}} of a tank of lamp oil. The lamp burned {${c}/${d}} of a tank. How much oil is left?`;
    return P({
      skill: this.id, tier,
      text: story,
      answer: frac(ans),
      choices: makeChoices(rng, ans, join ? [
        { value: F(a + c, d + d), why: `The pieces are still ${d}ths, so the bottom number stays ${d}. Add only the tops.` },
        F(a + c + 1, d), F(a, d), F(a * c, d),
      ] : [
        { value: F(a + c, d), why: 'Some oil burned away, so take it away: subtract.' },
        F(a - c + 1, d), F(c, d), F(a, d),
      ], labMixed),
      hint: join ? `Both parts are ${d}ths. Add the numbers on top; the bottom stays ${d}.` : `Both amounts are ${d}ths. Subtract the tops; the bottom stays ${d}.`,
      hintVisual: { kind: 'bars', bars: [{ parts: d, shaded: a }, { parts: d, shaded: c }] },
      steps: join
        ? [`{${a}/${d}} + {${c}/${d}}: add the tops, ${a} + ${c} = ${a + c}.`, `The bottom stays ${d}: {${a + c}/${d}}.`]
        : [`{${a}/${d}} − {${c}/${d}}: subtract the tops, ${a} − ${c} = ${a - c}.`, `The bottom stays ${d}: {${a - c}/${d}}.`],
      meta: { value: ans },
    });
  },
};

const asDiv = {
  id: 'frac_as_div', domain: D, grade: 5, cc: '5.NF.3', name: 'Fractions as division', short: 'fraction = division',
  gen(rng, tier) {
    if (tier === 1) {
      const [a, b] = coprimePair(rng, 3, 9);
      const ans = F(a, b);
      return P({
        skill: this.id, tier,
        text: `What is ${a} ÷ ${b} written as a fraction?`,
        answer: frac(ans),
        choices: makeChoices(rng, ans, [
          { value: F(b, a), why: `The number being shared goes on top: ${a} ÷ ${b} = {${a}/${b}}.` },
          { value: F(1, b), why: `That is 1 ÷ ${b}. Here ${a} wholes are shared, so each share is ${a} times as big.` },
          F(a, b + 1), F(a + 1, b),
        ], lab),
        hint: `A fraction is a division: the top number is shared into the bottom number of equal parts.`,
        steps: [`Sharing ${a} wholes into ${b} equal parts gives each part {${a}/${b}} of a whole.`, `So ${a} ÷ ${b} = {${a}/${b}}.`],
        meta: { value: ans },
      });
    }
    const b = rng.int(2, tier === 2 ? 5 : 8);
    let a = rng.int(b + 1, b * (tier === 2 ? 3 : 4));
    if (a % b === 0) a += 1;
    const ans = F(a, b);
    const who = friend(rng);
    const story = tier === 2
      ? rng.pick([
        `${who} shares ${a} pizzas equally among ${b} friends. How much pizza does each friend get?`,
        `${a} pies are cut up and shared equally by ${b} penguins. How much pie does each penguin get?`,
      ])
      : rng.pick([
        `${who} pours ${a} liters of juice equally into ${b} jugs. How many liters go in each jug?`,
        `A rope ${a} meters long is cut into ${b} equal pieces. How long is each piece, in meters?`,
      ]);
    const w = Math.floor(a / b), r = a % b;
    return P({
      skill: this.id, tier,
      text: story,
      answer: frac(ans),
      choices: makeChoices(rng, ans, [
        { value: F(b, a), why: `Each share is (amount) ÷ (number of shares) = ${a} ÷ ${b}, and ${a} is more than ${b}, so each share is more than 1.` },
        { value: F(r, b), why: `Each share also gets ${w} whole${w > 1 ? 's' : ''}: the answer is ${fm(ans, { mixed: true })}.` },
        F(a, b + 1), F(w + 1, 1),
      ], labMixed),
      hint: `Each share is ${a} ÷ ${b}. Write that as a fraction, then see how many wholes fit.`,
      steps: [`Each share is ${a} ÷ ${b} = {${a}/${b}}.`, `${b} goes into ${a} ${w} time${w > 1 ? 's' : ''} with ${r} left, so {${a}/${b}} = ${fm(ans, { mixed: true })}.`],
      meta: { value: ans },
    });
  },
};

const SCALE_THINGS = ['shells', 'fish', 'coins', 'beads', 'stones'];

const scale = {
  id: 'frac_scale', domain: D, grade: 5, cc: '5.NF.5', name: 'Does it grow or shrink?', short: 'scaling',
  gen(rng, tier) {
    const n = rng.int(2, 12) * rng.pick([2, 3, 4]);
    if (tier === 2) {
      const d = rng.int(3, 8);
      const small = F(rng.int(1, d - 1), d), big = F(d + rng.int(1, d - 1), d);
      const first = rng.chance(0.5);
      const [x, y] = first ? [small, big] : [big, small];
      const lx = `${fm(x)} × ${n}`, ly = `${fm(y)} × ${n}`;
      const bigLabel = first ? ly : lx;
      return P({
        skill: this.id, tier,
        text: `Without multiplying: which product is greater?`,
        answer: pick(),
        choices: [
          { label: lx, value: 'x', correct: !first, why: first ? `${fm(x)} is less than 1, so ${lx} is less than ${n}. ${fm(y)} is more than 1.` : undefined },
          { label: ly, value: 'y', correct: first, why: first ? undefined : `${fm(y)} is less than 1, so ${ly} is less than ${n}. ${fm(x)} is more than 1.` },
          { label: 'They are equal', value: '=', correct: false, why: 'The two fractions are different, so the products are different.' },
        ],
        hint: `Compare each fraction to 1. Multiplying by more than 1 makes ${n} bigger; less than 1 makes it smaller.`,
        steps: [`${fm(big)} is more than 1, so ${fm(big)} × ${n} is more than ${n}.`, `${fm(small)} is less than 1, so ${fm(small)} × ${n} is less than ${n}.`, `So ${bigLabel} is greater.`],
        answerText: bigLabel,
      });
    }
    const d = rng.int(2, 9);
    const kind = rng.pick(tier === 1 ? ['less', 'less', 'more', 'equal'] : ['less', 'more', 'more', 'mixed']);
    let f, label;
    if (kind === 'less') f = F(rng.int(1, d - 1), d);
    else if (kind === 'more') f = F(d + rng.int(1, d - 1), d);
    else if (kind === 'equal') f = F(d, d);
    else f = F(d * rng.int(1, 2) + rng.int(1, d - 1), d);
    if (kind === 'mixed') label = fm(f, { mixed: true }); else label = fm(f);
    const cmp = f.cmp(1);
    const right = cmp < 0 ? 'less' : cmp > 0 ? 'more' : 'equal';
    const thing = rng.pick(SCALE_THINGS);
    const text = tier === 3 && rng.chance(0.5)
      ? `A crate holds ${n} ${thing}. A second crate holds ${label} times as many. Without multiplying: does the second crate hold more than, less than, or the same as ${n}?`
      : `Without multiplying: is ${label} × ${n} more than, less than, or equal to ${n}?`;
    const reason = { less: `${label} is less than 1, so the product is only part of ${n}.`, more: `${label} is more than 1, so the product is more than ${n}.`, equal: `${label} is the same as 1, and 1 × ${n} = ${n}.` };
    const lbl = { more: `More than ${n}`, less: `Less than ${n}`, equal: `Equal to ${n}` };
    return P({
      skill: this.id, tier,
      text,
      answer: pick(),
      choices: ['more', 'less', 'equal'].map((k) => ({ label: lbl[k], value: k, correct: k === right, why: k === right ? undefined : reason[right] })),
      hint: `Is ${label} more than 1, less than 1, or exactly 1?`,
      steps: [reason[right], `So the answer is ${lbl[right].toLowerCase()}.`],
      answerText: lbl[right],
    });
  },
};

const word5 = {
  id: 'frac_word5', domain: D, grade: 5, cc: '5.NF.2', name: 'Fraction word problems', short: 'fraction stories',
  gen(rng, tier) {
    const who = friend(rng);
    if (tier === 3) {
      const [a, b] = coprimePair(rng, 2, 6);
      const [c, d] = coprimePair(rng, 2, 6);
      const x = F(a, b), y = F(c, d);
      const ans = x.mul(y);
      const story = rng.pick([
        { text: `A garden bed is {${a}/${b}} meter long and {${c}/${d}} meter wide. What is its area in square meters?`, step: `Area = length × width = {${a}/${b}} × {${c}/${d}}.` },
        { text: `A trail is {${c}/${d}} mile long. ${who} has walked {${a}/${b}} of it. How far has ${who} walked, in miles?`, step: `{${a}/${b}} of {${c}/${d}} means {${a}/${b}} × {${c}/${d}}.` },
        { text: `{${c}/${d}} of a pan of fruit bars is left. ${who} eats {${a}/${b}} of what is left. What fraction of the whole pan is that?`, step: `{${a}/${b}} of {${c}/${d}} means {${a}/${b}} × {${c}/${d}}.` },
      ]);
      return P({
        skill: this.id, tier,
        text: story.text,
        answer: frac(ans),
        choices: makeChoices(rng, ans, [
          { value: x.add(y), why: 'This story is multiplying ("of", or length × width), not adding.' },
          { value: F(a * c, b + d), why: 'Multiply the bottom numbers too, don\'t add them.' },
          F(a * d, b * c), ans.add(F(1, b * d)),
        ], lab),
        hint: '"Of" a fraction, or length × width, means multiply. Multiply the tops, then the bottoms.',
        steps: [story.step, `Tops: ${a} × ${c} = ${a * c}. Bottoms: ${b} × ${d} = ${b * d}.`, `The answer is {${a * c}/${b * d}}${ans.d !== b * d ? ` = ${fm(ans)}` : ''}.`],
        meta: { value: ans },
      });
    }
    let a, b, c, d;
    if (tier === 1) { b = rng.pick([2, 3, 4]); d = b * rng.int(2, 3); a = rng.int(1, b - 1); c = rng.int(1, d - 1); if (gcd(c, d) !== 1) c = 1; }
    else { [a, b] = coprimePair(rng, 2, 6); [c, d] = coprimePair(rng, 3, 8); if (b === d) d += 1; if (gcd(c, d) !== 1) c = 1; }
    let x = F(a, b), y = F(c, d);
    const add = tier === 1 || rng.chance(0.5);
    if (!add && x.cmp(y) <= 0) { [x, y] = [y, x]; [a, b, c, d] = [c, d, a, b]; }
    if (!add && x.eq(y)) return word5.gen(rng, 1);
    const ans = add ? x.add(y) : x.sub(y);
    const L = lcm(b, d), A = a * (L / b), C = c * (L / d);
    const text = add
      ? rng.pick([
        `${who} swims {${a}/${b}} mile in the morning and {${c}/${d}} mile in the afternoon. How far does ${who} swim in all?`,
        `A bucket has {${a}/${b}} gallon of water. ${who} adds {${c}/${d}} gallon more. How much water is in the bucket now?`,
      ])
      : rng.pick([
        `A jug holds {${a}/${b}} liter of juice. ${who} pours out {${c}/${d}} liter. How much juice is left?`,
        `${who} has a ribbon {${a}/${b}} yard long and cuts off {${c}/${d}} yard. How long is the ribbon now?`,
      ]);
    return P({
      skill: this.id, tier,
      text,
      answer: frac(ans),
      choices: makeChoices(rng, ans, [
        add ? { value: F(a + c, b + d), why: 'You can\'t add the bottom numbers. Rename both fractions with the same bottom number first.' }
          : { value: F(Math.abs(a - c) || 1, Math.abs(b - d) || 1), why: 'You can\'t subtract the bottom numbers. Rename both fractions with the same bottom number first.' },
        { value: add ? x.sub(y).value > 0 ? x.sub(y) : x.add(y).add(F(1, L)) : x.add(y), why: add ? 'The story puts the amounts together: add.' : 'The story takes some away: subtract.' },
        ans.add(F(1, L)), F(Math.abs(add ? A + C : A - C) + 1, L),
      ], labMixed),
      hint: `Find a common bottom number: ${L} works for both ${b} and ${d}. Then ${add ? 'add' : 'subtract'}.`,
      steps: [
        `{${a}/${b}} = {${A}/${L}} and {${c}/${d}} = {${C}/${L}}.`,
        `{${A}/${L}} ${add ? '+' : '−'} {${C}/${L}} = {${add ? A + C : A - C}/${L}}${ans.d !== L || ans.n > ans.d ? ` = ${fm(ans, { mixed: true })}` : ''}.`,
      ],
      meta: { value: ans },
    });
  },
};

export const GROVE_SKILLS = [identify, equiv, compare, addLike, fill, simplify, mixed, timesWhole, fracWord, addUnlike, asDiv, ofWhole, scale, mult, word5, divUnit, divFrac];
