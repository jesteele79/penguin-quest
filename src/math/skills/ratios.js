// Ratios and rates (grade 6): ratio language, ratio tables and double number lines, unit rates, speed,
// percents and converting units. The Wind Gardens of Book 3 are built around them.
import { P, num, frac, pick, makeChoices, labelNum, labelFrac } from '../build.js';
import { Frac, gcd } from '../frac.js';
import { fmtNum, fmtMoney } from '../fmt.js';
import { ITEMS, money, labelMoney, cents } from './decimals.js';

const D = 'ratios';
const F = (n, d) => new Frac(n, d);

const ratio = {
  id: 'ratio', domain: D, grade: 6, cc: '6.RP.3a', name: 'Ratios', short: 'ratios',
  gen(rng, tier) {
    const pairs = [['fish', 'crabs'], ['red scarves', 'blue scarves'], ['snowballs', 'icicles'], ['cocoas', 'cookies'], ['kites', 'gliders'], ['lanterns', 'balloons']];
    const [A, B] = rng.pick(pairs);
    let a = rng.int(1, 5), b = rng.int(2, 7);
    if (a === b) b += 1;
    const g = gcd(a, b); a /= g; b /= g;
    if (tier === 3 && rng.chance(0.5)) {
      const k = rng.int(2, 6);
      const label = (v) => v;
      const correct = `${a} : ${b}`;
      const choices = [{ label: correct, value: correct, correct: true },
        { label: `${a * k} : ${b * k + 1}`, value: 'x1' },
        { label: `${b} : ${a}`, value: 'x2', why: `The order matters: ${A} come first.` },
        { label: `${a * k} : ${b}`, value: 'x3', why: 'Divide both numbers by the same amount.' }];
      return P({
        skill: this.id, tier,
        text: `There are ${a * k} ${A} and ${b * k} ${B}. What is the ratio of ${A} to ${B} in simplest form?`,
        answer: pick(), choices: rng.shuffle(choices).filter((c, i, arr) => arr.findIndex((q) => q.label === c.label) === i),
        hint: `Divide both numbers by the biggest number that goes into both.`,
        steps: [`${a * k} : ${b * k}.`, `Both divide by ${k}: ${a * k} ÷ ${k} = ${a} and ${b * k} ÷ ${k} = ${b}.`, `So the ratio is ${correct}.`],
        answerText: correct,
        meta: { label },
      });
    }
    const k = rng.int(2, tier === 1 ? 5 : 9);
    const askB = rng.chance(0.5);
    const given = askB ? a * k : b * k;
    const ans = askB ? b * k : a * k;
    return P({
      skill: this.id, tier,
      text: `For every ${a} ${A} there ${b === 1 ? 'is' : 'are'} ${b} ${B}. If there are ${given} ${askB ? A : B}, how many ${askB ? B : A} are there?`,
      visual: { kind: 'ratioTable', a, b, k, A, B, hideA: !askB, hideB: askB },
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: given + (askB ? b - a : a - b), why: 'A ratio grows by multiplying, not by adding.' }, ans + (askB ? b : a), given, ans - 1], labelNum),
      hint: `How many groups of ${askB ? a : b} are in ${given}?`,
      steps: [`${given} ÷ ${askB ? a : b} = ${k} groups.`, `Each group has ${askB ? b : a} ${askB ? B : A}: ${k} × ${askB ? b : a} = ${ans}.`],
      meta: { value: ans },
    });
  },
};

const unitRate = {
  id: 'unit_rate', domain: D, grade: 6, cc: '6.RP.2', name: 'Unit rates', short: 'unit rates',
  gen(rng, tier) {
    if (tier === 3 && rng.chance(0.5)) {
      const [one, many] = rng.pick(ITEMS);
      const u1 = rng.int(4, 16) * 25, u2 = u1 + rng.pick([-25, 25, 50]);
      const n1 = rng.int(2, 5), n2 = rng.int(2, 6);
      const t1 = u1 * n1, t2 = u2 * n2;
      if (u1 === u2) return unitRate.gen(rng, 2);
      const better = u1 < u2 ? 1 : 2;
      const lA = `${n1} for ${fmtMoney(t1 / 100)}`, lB = `${n2} for ${fmtMoney(t2 / 100)}`;
      return P({
        skill: this.id, tier,
        text: `Which is the better deal on ${many}?`,
        answer: pick(),
        choices: [
          { label: lA, value: 'a', correct: better === 1, why: better === 1 ? undefined : `Find the price of one: ${fmtMoney(t1 / 100)} ÷ ${n1} = ${fmtMoney(u1 / 100)} and ${fmtMoney(t2 / 100)} ÷ ${n2} = ${fmtMoney(u2 / 100)}.` },
          { label: lB, value: 'b', correct: better === 2, why: better === 2 ? undefined : `Find the price of one: ${fmtMoney(t1 / 100)} ÷ ${n1} = ${fmtMoney(u1 / 100)} and ${fmtMoney(t2 / 100)} ÷ ${n2} = ${fmtMoney(u2 / 100)}.` },
        ],
        hint: 'Find the price of ONE in each deal. The lower unit price is the better deal.',
        steps: [`${fmtMoney(t1 / 100)} ÷ ${n1} = ${fmtMoney(u1 / 100)} each.`, `${fmtMoney(t2 / 100)} ÷ ${n2} = ${fmtMoney(u2 / 100)} each.`, `${better === 1 ? lA : lB} costs less per ${one}.`],
        answerText: better === 1 ? lA : lB,
        meta: {},
      });
    }
    if (rng.chance(0.5)) {
      const [, many] = rng.pick(ITEMS);
      const unit = rng.int(tier === 1 ? 4 : 5, 20) * (tier === 1 ? 25 : 5), n = rng.int(2, 6);
      const ans = cents(unit);
      return P({
        skill: this.id, tier,
        text: `${n} ${many} cost ${fmtMoney((unit * n) / 100)}. How much does one cost?`,
        answer: money(ans),
        choices: makeChoices(rng, ans, [cents(unit * n - unit), cents(unit + 5), cents(unit - 25 > 0 ? unit - 25 : unit + 50), cents(unit * 2)], labelMoney),
        hint: `Share the total cost equally among the ${n} ${many}.`,
        steps: [`${fmtMoney((unit * n) / 100)} ÷ ${n} = ${fmtMoney(unit / 100)}.`],
        meta: { value: ans },
      });
    }
    const rate = rng.int(3, tier === 1 ? 9 : 15), t = rng.int(2, 9);
    return P({
      skill: this.id, tier,
      text: `A penguin slides ${rate * t} meters in ${t} seconds at a steady speed. How many meters does it slide each second?`,
      answer: num(rate),
      choices: makeChoices(rng, rate, [{ value: rate * t * t, why: 'Divide the distance by the time to get meters per second.' }, rate * t - t, rate + 1, rate - 1], labelNum),
      hint: `Meters per second means meters ÷ seconds.`,
      steps: [`${rate * t} ÷ ${t} = ${rate}.`, `So it slides ${rate} meters per second.`],
      meta: { value: rate },
    });
  },
};

const percent = {
  id: 'percent', domain: D, grade: 6, cc: '6.RP.3c', name: 'Percents', short: 'percents',
  gen(rng, tier) {
    if (tier === 3 && rng.chance(0.5)) {
      if (rng.chance(0.5)) {
        const [whole, pct] = rng.pick([[20, 10], [20, 25], [20, 50], [40, 25], [40, 75], [50, 10], [50, 20], [80, 25], [80, 75], [200, 10], [200, 25], [200, 75], [40, 20]]);
        const part = (whole * pct) / 100;
        return P({
          skill: this.id, tier,
          text: `What percent of ${whole} is ${part}?`,
          answer: num(pct),
          choices: makeChoices(rng, pct, [part, pct + 5, pct * 2, 100 - pct], (v) => `${fmtNum(Frac.of(v).value)}%`),
          hint: `Write ${part} out of ${whole} as a fraction, then rename it out of 100.`,
          steps: [`{${part}/${whole}} = {${pct}/100}.`, `That is ${pct}%.`],
          meta: { value: pct },
        });
      }
      const price = rng.int(4, 30) * 5, off = rng.pick([10, 20, 25, 50]);
      const sale = F(price * (100 - off), 100);
      return P({
        skill: this.id, tier,
        text: `A scarf costs ${fmtMoney(price)}. It is ${off}% off today. What is the sale price?`,
        answer: money(sale),
        choices: makeChoices(rng, sale, [{ value: F(price * off, 100), why: `That is the discount. Subtract it from ${fmtMoney(price)}.` }, F(price - off, 1), sale.add(5), F(price, 1)], labelMoney),
        hint: `Find ${off}% of ${fmtMoney(price)}, then take it off the price.`,
        steps: [`${off}% of ${fmtMoney(price)} = ${fmtMoney((price * off) / 100)}.`, `${fmtMoney(price)} − ${fmtMoney((price * off) / 100)} = ${fmtMoney(sale.value)}.`],
        meta: { value: sale },
      });
    }
    const pct = tier === 1 ? rng.pick([10, 25, 50]) : rng.pick([5, 10, 15, 20, 30, 40, 60, 75]);
    const whole = rng.int(2, 12) * (tier === 1 ? 20 : 20);
    const ans = F(whole * pct, 100);
    const friendly = pct === 50 ? 'half' : pct === 25 ? 'a quarter' : pct === 10 ? 'one tenth' : null;
    return P({
      skill: this.id, tier,
      text: `What is ${pct}% of ${whole}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: F(whole - pct, 1), why: 'Percent means "out of 100", so find that many hundredths of the number.' }, ans.add(whole / 10), F(pct, 1), ans.mul(2)], labelNum),
      hint: friendly ? `${pct}% is ${friendly}.` : `Find 10% first (divide by 10), then build up to ${pct}%.`,
      steps: friendly
        ? [`${pct}% is ${friendly} of the number.`, `${friendly[0].toUpperCase() + friendly.slice(1)} of ${whole} is ${fmtNum(ans.value)}.`]
        : [
          `10% of ${whole} is ${whole / 10}.`,
          ...(Math.floor(pct / 10) > 1 ? [`${Math.floor(pct / 10) * 10}% is ${Math.floor(pct / 10)} × ${whole / 10} = ${(Math.floor(pct / 10) * whole) / 10}.`] : []),
          ...(pct % 10 === 5 ? [`5% is half of 10%: ${whole / 20}.`] : []),
          `So ${pct}% of ${whole} = ${fmtNum(ans.value)}.`,
        ],
      meta: { value: ans },
    });
  },
};

// Things that come in twos, in the sky islands and everywhere else.
const PAIRS = [['kites', 'gliders'], ['lanterns', 'balloons'], ['red feathers', 'blue feathers'], ['cadets', 'pilots'], ['gears', 'springs'], ['fish', 'crabs']];
const to = (x, y) => `${x} to ${y}`;
const uniq = (list) => list.filter((c, i, arr) => arr.findIndex((q) => q.label === c.label) === i);
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const ratioLang = {
  id: 'ratio_lang', domain: D, grade: 6, cc: '6.RP.1', name: 'Ratio language', short: 'ratio language',
  gen(rng, tier) {
    const [A, B] = rng.pick(PAIRS);
    let a = rng.int(2, 9), b = rng.int(2, 9);
    if (a === b) b += 1;
    const kind = tier === 1 ? rng.int(0, 1) : tier === 2 ? rng.int(0, 2) : rng.int(1, 3);
    if (kind === 0) {
      const correct = to(b, a);
      return P({
        skill: this.id, tier,
        text: `There are ${a} ${A} and ${b} ${B}. What is the ratio of ${B} to ${A}?`,
        answer: pick(),
        choices: rng.shuffle(uniq([
          { label: correct, value: 'c', correct: true },
          { label: to(a, b), value: 'w1', why: `The order matters: the question asks about the ${B} first.` },
          { label: to(b, a + b), value: 'w2', why: `That compares the ${B} with all ${a + b} things, not with the ${A}.` },
          { label: to(a + b, b), value: 'w3', why: `Compare the ${B} with the ${A}, in that order.` },
        ])),
        hint: `Keep the order of the question: ${B} first, then ${A}.`,
        steps: [`There are ${b} ${B} and ${a} ${A}.`, `The ratio of ${B} to ${A} is ${correct}.`],
        answerText: correct,
        meta: {},
      });
    }
    if (kind === 1) {
      const correct = to(a, a + b);
      return P({
        skill: this.id, tier,
        text: `There are ${a} ${A} and ${b} ${B}. What is the ratio of ${A} to all of them together?`,
        answer: pick(),
        choices: rng.shuffle(uniq([
          { label: correct, value: 'c', correct: true },
          { label: to(a, b), value: 'w1', why: `That compares ${A} with ${B}. The question compares ${A} with the whole group.` },
          { label: to(a + b, a), value: 'w2', why: `The ${A} come first in the question.` },
          { label: to(b, a + b), value: 'w3', why: `That is the ${B} compared with the whole group.` },
        ])),
        hint: `First find how many there are altogether: ${a} + ${b}.`,
        steps: [`Altogether there are ${a} + ${b} = ${a + b}.`, `The ratio of ${A} to all of them is ${correct}.`],
        answerText: correct,
        meta: {},
      });
    }
    if (kind === 2) {
      const k = rng.int(2, 4);
      const g = gcd(a, b);
      a /= g; b /= g;
      if (a === b) b += 1;
      const say = (x, y) => `For every ${x} ${A} there are ${y} ${B}.`;
      const correct = say(a * k, b * k);
      return P({
        skill: this.id, tier,
        text: `For every ${a} ${A} there are ${b} ${B}. Which sentence means the same thing?`,
        answer: pick(),
        choices: rng.shuffle(uniq([
          { label: correct, value: 'c', correct: true },
          { label: say(a + k, b + k), value: 'w1', why: 'Adding the same number to both changes the ratio. Multiply both by the same number.' },
          { label: say(b, a), value: 'w2', why: `That swaps the ${A} and the ${B}.` },
          { label: say(a * k, b), value: 'w3', why: 'Both numbers have to be multiplied by the same amount.' },
        ])),
        hint: 'An equal ratio comes from multiplying both numbers by the same amount.',
        steps: [`${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k}.`, `So ${a * k} ${A} for ${b * k} ${B} is the same ratio.`],
        answerText: correct,
        meta: {},
      });
    }
    const ans = F(a, a + b);
    return P({
      skill: this.id, tier,
      text: `For every ${a} ${A} there are ${b} ${B}. What fraction of the whole group are ${A}?`,
      visual: { kind: 'tape', rows: [{ segs: [{ v: a, label: `${a} ${A}` }, { v: b, label: `${b} ${B}`, alt: true }], totalLabel: `${a + b} in all` }] },
      answer: frac(ans),
      choices: makeChoices(rng, ans, [{ value: F(a, b), why: `That compares ${A} with ${B}. A fraction of the group uses the whole group, ${a + b}.` }, F(b, a + b), F(a + b, a)], labelFrac()),
      hint: `Each group has ${a} + ${b} = ${a + b} things in all.`,
      steps: [`Each group has ${a + b} things, and ${a} of them are ${A}.`, `So {${a}/${a + b}} of the group are ${A}.`],
      meta: { value: ans },
    });
  },
};

const ratioTable = {
  id: 'ratio_table', domain: D, grade: 6, cc: '6.RP.3a', name: 'Ratio tables and double number lines', short: 'ratio tables',
  gen(rng, tier) {
    const [A, B] = rng.pick(PAIRS);
    let a = tier === 1 ? 1 : rng.int(2, 5), b = rng.int(2, 7);
    const g = gcd(a, b); a /= g; b /= g;
    if (a === b) b += 1;
    if (tier < 3) {
      const cols = [1, 2, 3];
      const n = rng.int(5, tier === 1 ? 10 : 9);
      const askB = rng.chance(0.6);
      const ans = askB ? b * n : a * n;
      const row = (name, unit, hide) => ({ name, cells: [...cols.map((c) => String(unit * c)), hide ? '?' : String(unit * n)] });
      return P({
        skill: this.id, tier,
        text: askB
          ? `The table shows ${A} and ${B} in the same ratio. How many ${B} go with ${a * n} ${A}?`
          : `The table shows ${A} and ${B} in the same ratio. How many ${A} go with ${b * n} ${B}?`,
        visual: { kind: 'rtable', rows: [row(A, a, !askB), row(B, b, askB)] },
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: (askB ? b * 3 : a * 3) + (n - 3), why: 'Each column multiplies both rows by the same number. Adding 1 to each row changes the ratio.' }, ans + (askB ? b : a), ans - (askB ? b : a), askB ? a * n : b * n], labelNum),
        hint: askB ? `${a * n} ${A} is ${n} times ${a}. Multiply the ${B} by ${n} too.` : `${b * n} ${B} is ${n} times ${b}. Multiply the ${A} by ${n} too.`,
        steps: askB
          ? [`${a * n} ÷ ${a} = ${n}, so this column is ${n} times the first one.`, `${b} × ${n} = ${ans} ${B}.`]
          : [`${b * n} ÷ ${b} = ${n}, so this column is ${n} times the first one.`, `${a} × ${n} = ${ans} ${A}.`],
        meta: { value: ans },
      });
    }
    // Only a scaled-up pair is known, so the way through is the smallest pair: divide down, then multiply up.
    const m = rng.int(2, 4);
    let n = rng.int(2, 9);
    if (n % m === 0) n += 1;
    const ans = b * n;
    return P({
      skill: this.id, tier,
      text: `${a * m} ${A} go with ${b * m} ${B}. At the same rate, how many ${B} go with ${a * n} ${A}?`,
      visual: { kind: 'dnl', names: [A, B], top: ['0', String(a), String(a * m), String(a * n)], bottom: ['0', '', String(b * m), '?'] },
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: b * m + (a * n - a * m), why: 'The amounts grow by multiplying, not by adding the same number to each.' }, b * (n + 1), b * (n - 1), a * n * b], labelNum),
      hint: `Divide both by ${m} to find how many ${B} go with ${a} ${A}.`,
      steps: [`${a * m} ÷ ${m} = ${a} and ${b * m} ÷ ${m} = ${b}: ${a} ${A} go with ${b} ${B}.`, `${a * n} is ${n} times ${a}, so multiply ${b} by ${n}.`, `${b} × ${n} = ${ans} ${B}.`],
      meta: { value: ans },
    });
  },
};

const rateSpeed = {
  id: 'rate_speed', domain: D, grade: 6, cc: '6.RP.3b', name: 'Speed and rate problems', short: 'speed and rates',
  gen(rng, tier) {
    const movers = [['glider', 'kilometers', 'hour', 'hours'], ['kite', 'meters', 'second', 'seconds'], ['balloon', 'meters', 'minute', 'minutes'], ['sky whale', 'kilometers', 'hour', 'hours']];
    const [who, du, tu, tus] = rng.pick(movers);
    const r = rng.int(tier === 1 ? 3 : 6, tier === 1 ? 12 : 25);
    if (tier === 1) {
      const t = rng.int(2, 9);
      const ans = r * t;
      return P({
        skill: this.id, tier,
        text: `A ${who} travels ${r} ${du} every ${tu}. How far does it travel in ${t} ${tus}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: r + t, why: `Each ${tu} adds another ${r} ${du}: multiply instead of adding.` }, ans + r, ans - r, r * (t + 2)], labelNum),
        hint: `${t} ${tus} means ${t} groups of ${r} ${du}.`,
        steps: [`${r} ${du} each ${tu} for ${t} ${tus}.`, `${r} × ${t} = ${ans} ${du}.`],
        meta: { value: ans },
      });
    }
    const kind = tier === 2 ? rng.int(0, 1) : rng.int(1, 2);
    if (kind === 0) {
      const t1 = rng.int(2, 5);
      const t2 = rng.int(t1 + 1, 10);
      const ans = r * t2;
      return P({
        skill: this.id, tier,
        text: `A ${who} travels ${r * t1} ${du} in ${t1} ${tus}. At the same speed, how far does it travel in ${t2} ${tus}?`,
        visual: { kind: 'dnl', names: [du, tus], top: ['0', String(r), String(r * t1), '?'], bottom: ['0', '1', String(t1), String(t2)] },
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: r * t1 + (t2 - t1), why: `Find the distance for one ${tu} first, then multiply.` }, r * t1 * t2, ans + r, ans - r], labelNum),
        hint: `Find how far it goes in 1 ${tu}: ${r * t1} ÷ ${t1}.`,
        steps: [`${r * t1} ÷ ${t1} = ${r} ${du} per ${tu}.`, `${r} × ${t2} = ${ans} ${du}.`],
        meta: { value: ans },
      });
    }
    if (kind === 1) {
      const t = rng.int(3, 12);
      const total = r * t;
      return P({
        skill: this.id, tier,
        text: `A ${who} travels ${r} ${du} per ${tu}. How many ${tus} does it take to travel ${total} ${du}?`,
        answer: num(t),
        choices: makeChoices(rng, t, [{ value: total - r, why: 'Divide the distance by the speed to find the time.' }, t + 1, t - 1, t + r], labelNum),
        hint: `How many groups of ${r} ${du} make ${total}?`,
        steps: [`${total} ÷ ${r} = ${t}.`, `It takes ${t} ${tus}.`],
        meta: { value: t },
      });
    }
    const t1 = rng.int(2, 6), t2 = rng.int(2, 6);
    let r2 = r + rng.pick([-3, -2, -1, 1, 2, 3]);
    if (r2 <= 0) r2 = r + 2;
    const A = `${cap(who)} A: ${r * t1} ${du} in ${t1} ${tus}`;
    const B = `${cap(who)} B: ${r2 * t2} ${du} in ${t2} ${tus}`;
    const aFaster = r > r2;
    const why = `Find each speed for one ${tu}: A goes ${r} and B goes ${r2}.`;
    return P({
      skill: this.id, tier,
      text: `Which ${who} is faster?`,
      answer: pick(),
      choices: [
        { label: A, value: 'a', correct: aFaster, why: aFaster ? undefined : why },
        { label: B, value: 'b', correct: !aFaster, why: !aFaster ? undefined : why },
      ],
      hint: `Compare how far each one goes in 1 ${tu}.`,
      steps: [`A: ${r * t1} ÷ ${t1} = ${r} ${du} per ${tu}.`, `B: ${r2 * t2} ÷ ${t2} = ${r2} ${du} per ${tu}.`, `${aFaster ? 'A' : 'B'} is faster.`],
      answerText: aFaster ? A : B,
      meta: {},
    });
  },
};

// [big unit, big plural, small unit, small plural, how many small in one big]
const UNITS = [
  ['foot', 'feet', 'inch', 'inches', 12], ['yard', 'yards', 'foot', 'feet', 3], ['hour', 'hours', 'minute', 'minutes', 60],
  ['minute', 'minutes', 'second', 'seconds', 60], ['gallon', 'gallons', 'quart', 'quarts', 4], ['quart', 'quarts', 'cup', 'cups', 4],
  ['pound', 'pounds', 'ounce', 'ounces', 16], ['meter', 'meters', 'centimeter', 'centimeters', 100], ['day', 'days', 'hour', 'hours', 24],
];

const convertRatio = {
  id: 'convert_ratio', domain: D, grade: 6, cc: '6.RP.3d', name: 'Convert units with ratios', short: 'unit ratios',
  gen(rng, tier) {
    const [big, bigs, small, smalls, k] = rng.pick(UNITS);
    if (tier === 1) {
      const n = rng.int(3, 9);
      const ans = n * k;
      return P({
        skill: this.id, tier,
        text: `There are ${k} ${smalls} in 1 ${big}. How many ${smalls} are in ${n} ${bigs}?`,
        visual: { kind: 'rtable', rows: [{ name: bigs, cells: ['1', '2', String(n)] }, { name: smalls, cells: [String(k), String(2 * k), '?'] }] },
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: n + k, why: `Every ${big} has ${k} ${smalls}, so multiply.` }, ans + k, ans - k, n * (k + 1)], labelNum),
        hint: `Each ${big} is ${k} ${smalls}.`,
        steps: [`${n} × ${k} = ${ans}.`, `${n} ${bigs} = ${ans} ${smalls}.`],
        meta: { value: ans },
      });
    }
    if (tier === 2) {
      const n = rng.int(3, 9);
      const total = n * k;
      return P({
        skill: this.id, tier,
        text: `How many ${bigs} are in ${total} ${smalls}? (${k} ${smalls} = 1 ${big})`,
        visual: { kind: 'rtable', rows: [{ name: smalls, cells: [String(k), String(2 * k), String(total)] }, { name: bigs, cells: ['1', '2', '?'] }] },
        answer: num(n),
        choices: makeChoices(rng, n, [{ value: total * k, why: `${cap(smalls)} are smaller, so there are fewer ${bigs}: divide.` }, n + 1, n - 1, total - k], labelNum),
        hint: `How many groups of ${k} are in ${total}?`,
        steps: [`${total} ÷ ${k} = ${n}.`, `${total} ${smalls} = ${n} ${bigs}.`],
        meta: { value: n },
      });
    }
    if (rng.chance(0.5)) {
      // A rate per second or per minute, scaled up to the next unit of time.
      const [unitBig, unitSmall, f] = rng.pick([['minute', 'second', 60], ['hour', 'minute', 60]]);
      const r = rng.int(2, 9);
      const [does, what] = rng.pick([['A cloud drifts', 'feet'], ['A gear turns', 'times'], ['A lantern climbs', 'centimeters']]);
      const ans = r * f;
      return P({
        skill: this.id, tier,
        text: `${does} ${r} ${what} every ${unitSmall}. How many ${what} is that every ${unitBig}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: r + f, why: `There are ${f} ${unitSmall}s in a ${unitBig}, so multiply by ${f}.` }, f, ans + f, r * 10], labelNum),
        hint: `How many ${unitSmall}s are in one ${unitBig}?`,
        steps: [`1 ${unitBig} = ${f} ${unitSmall}s.`, `${r} × ${f} = ${ans} ${what} every ${unitBig}.`],
        meta: { value: ans },
      });
    }
    // Small units back to big ones, with a half or a quarter left over.
    const parts = [2, 4].filter((d) => k % d === 0);
    const part = rng.pick(parts.length ? parts : [2]);
    if (k % part) return convertRatio.gen(rng, 2);
    const n = rng.int(1, 5), extra = rng.int(1, part - 1);
    const total = n * k + (extra * k) / part;
    const ans = F(n * part + extra, part);
    return P({
      skill: this.id, tier,
      text: `How many ${bigs} are in ${fmtNum(total)} ${smalls}? (${k} ${smalls} = 1 ${big})`,
      answer: frac(ans),
      choices: makeChoices(rng, ans, [{ value: F(total * k, 1), why: `Divide by ${k}: there are fewer of the bigger unit.` }, F(n, 1), F(n + 1, 1)], labelFrac(true)),
      hint: `${n} ${n === 1 ? big : bigs} is ${n * k} ${smalls}. What part of a ${big} are the other ${fmtNum((extra * k) / part)}?`,
      steps: [`${n} ${n === 1 ? big : bigs} = ${n * k} ${smalls}.`, `${fmtNum((extra * k) / part)} more ${smalls} is {${extra}/${part}} of a ${big}.`, `So ${fmtNum(total)} ${smalls} = {${n} ${extra}/${part}} ${bigs}.`],
      meta: { value: ans },
    });
  },
};

const percentWhole = {
  id: 'percent_whole', domain: D, grade: 6, cc: '6.RP.3c', name: 'Find the whole from a percent', short: 'percent of a whole',
  gen(rng, tier) {
    const p = rng.pick(tier === 1 ? [10, 25, 50] : tier === 2 ? [20, 25, 40, 75] : [15, 30, 35, 60, 80]);
    const g = gcd(p, 100), chunks = p / g, all = 100 / g;
    const per = rng.int(tier === 1 ? 2 : 3, tier === 3 ? 9 : 12);
    const part = per * chunks, whole = per * all;
    const [thing, verb] = rng.pick([['lanterns', 'are lit'], ['cadets', 'have their wings'], ['kites', 'are red'], ['stars on the map', 'are found']]);
    return P({
      skill: this.id, tier,
      text: `${p}% of the ${thing} ${verb}. That is ${part} ${thing}. How many ${thing} are there in all?`,
      visual: { kind: 'tape', rows: [{ segs: [{ v: p, label: `${part}` }, { v: 100 - p, label: '', unknown: true }], totalLabel: '? (100%)' }] },
      answer: num(whole),
      choices: makeChoices(rng, whole, [{ value: part + (100 - p), why: `${part} is ${p}% of the ${thing}. Find how big one ${g}% piece is, then all 100%.` }, whole + per, whole - per, part * 2 === whole ? whole + 2 * per : part * 2], labelNum),
      hint: `${p}% is ${chunks} equal piece${chunks > 1 ? 's' : ''} of ${g}%. Find one ${g}% piece, then all ${all} pieces.`,
      steps: [`${p}% = ${chunks} × ${g}%.`, `One ${g}% piece is ${part} ÷ ${chunks} = ${per}.`, `100% is ${all} pieces: ${all} × ${per} = ${whole}.`],
      meta: { value: whole },
    });
  },
};

export const RATIO_SKILLS = [ratioLang, ratio, ratioTable, unitRate, rateSpeed, convertRatio, percent, percentWhole];
