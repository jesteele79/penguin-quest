// Heart Huts: decimals, money, ratios and percents (grades 4-6).
import { P, num, frac, pick, makeChoices, labelNum, labelFrac, nearInts } from '../build.js';
import { Frac, gcd } from '../frac.js';
import { fmtNum, fmtInt, fmtMoney } from '../fmt.js';

const D = 'huts';
const F = (n, d) => new Frac(n, d);
const PLACE_NAMES = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands', '0.1': 'tenths', '0.01': 'hundredths', '0.001': 'thousandths' };
const ITEMS = [
  ['fish taco', 'fish tacos'], ['snow cone', 'snow cones'], ['kelp cookie', 'kelp cookies'], ['cocoa', 'cocoas'],
  ['shrimp roll', 'shrimp rolls'], ['ice pop', 'ice pops'], ['mitten', 'mittens'], ['scarf', 'scarves'],
];
const money = (v) => ({ ...num(v), money: true });
const labelMoney = (v) => fmtMoney(v instanceof Frac ? v.value : v);
const cents = (c) => F(c, 100);

// Number with distinct digits, `w` whole digits and `p` decimal places.
function distinctDecimal(rng, w, p) {
  const digits = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]).slice(0, w + p);
  if (digits[0] === 0 && w > 0) [digits[0], digits[1]] = [digits[1], digits[0]];
  if (digits[w + p - 1] === 0) [digits[w + p - 1], digits[w + p - 2]] = [digits[w + p - 2], digits[w + p - 1]];
  const whole = w ? digits.slice(0, w).join('') : '0';
  const dec = digits.slice(w).join('');
  return { str: `${whole}.${dec}`, digits: digits.slice(), w, p };
}

const place = {
  id: 'dec_place', domain: D, grade: 5, cc: '5.NBT.3', name: 'Decimal place value', short: 'decimal place value',
  gen(rng, tier) {
    const w = tier === 1 ? 1 : 2, p = tier === 3 ? 3 : 2;
    const x = distinctDecimal(rng, w, p);
    const idx = rng.int(tier === 1 ? w : 0, w + p - 1);
    const digit = x.digits[idx];
    if (digit === 0) return place.gen(rng, tier);
    const power = w - 1 - idx;
    const placeVal = new Frac(power >= 0 ? 10 ** power : 1, power >= 0 ? 1 : 10 ** -power);
    const value = placeVal.mul(digit);
    const placeName = PLACE_NAMES[String(placeVal.value)];
    const askValue = rng.chance(0.6);
    if (askValue) {
      return P({
        skill: this.id, tier,
        text: `What is the value of the ${digit} in ${x.str}?`,
        visual: { kind: 'placeValue', digits: x.digits, whole: w, highlight: idx },
        answer: num(value),
        choices: makeChoices(rng, value, [
          { value: digit, why: `The digit is ${digit}, but it is in the ${placeName} place, so it is worth ${fmtNum(value.value)}.` },
          value.mul(10), value.div(10), value.div(100),
        ], labelNum),
        hint: `Find which place the ${digit} is in. What is one of that place worth?`,
        steps: [`The ${digit} is in the ${placeName} place.`, `${digit} ${placeName} = ${fmtNum(value.value)}.`],
        meta: { value },
      });
    }
    return P({
      skill: this.id, tier,
      text: `Which digit is in the ${placeName} place of ${x.str}?`,
      visual: { kind: 'placeValue', digits: x.digits, whole: w, highlight: -1 },
      answer: num(digit),
      choices: makeChoices(rng, digit, x.digits.filter((d) => d !== digit), labelNum),
      hint: 'The places after the decimal point go tenths, hundredths, thousandths.',
      steps: [`Read the places: ${x.digits.map((d, i) => `${d} (${PLACE_NAMES[String(w - 1 - i >= 0 ? 10 ** (w - 1 - i) : Math.round(10 ** (w - 1 - i) * 1000) / 1000)]})`).join(', ')}.`, `The ${placeName} digit is ${digit}.`],
      meta: { value: digit },
    });
  },
};

const decFrac = {
  id: 'dec_frac', domain: D, grade: 4, cc: '4.NF.6', name: 'Decimals and fractions', short: 'decimal ↔ fraction',
  gen(rng, tier) {
    if (tier === 3 && rng.chance(0.5)) {
      const [n, d] = rng.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 20], [3, 20], [7, 25]]);
      const k = 100 / d;
      const v = F(n, d);
      return P({
        skill: this.id, tier,
        text: `Write {${n}/${d}} as a decimal.`,
        answer: num(v),
        choices: makeChoices(rng, v, [{ value: F(n * 10 + d, 100), why: `The fraction bar means divide: ${n} ÷ ${d}. Try making the bottom 100.` }, v.add(F(1, 10)), F(n, 10), F(d, 100)], labelNum),
        hint: `Make an equivalent fraction with 100 on the bottom.`,
        steps: [`{${n}/${d}} = {${n * k}/100} (multiply top and bottom by ${k}).`, `{${n * k}/100} = ${fmtNum(v.value)}.`],
        meta: { value: v },
      });
    }
    const d = tier === 1 ? 10 : tier === 2 ? rng.pick([10, 100]) : rng.pick([100, 1000]);
    let n = rng.int(1, d - 1);
    if (n % 10 === 0 && d > 10) n += 1;
    const v = F(n, d);
    const places = String(d).length - 1;
    if (rng.chance(0.5)) {
      return P({
        skill: this.id, tier,
        text: `Write {${n}/${d}} as a decimal.`,
        answer: num(v),
        choices: makeChoices(rng, v, [
          { value: F(n, 10 ** (places - 1 || 1)), why: `${d} has ${places} zero${places > 1 ? 's' : ''}, so the decimal needs ${places} place${places > 1 ? 's' : ''} after the point.` },
          v.mul(10), v.div(10), F(n, 1),
        ], labelNum),
        hint: `{${n}/${d}} means ${n} ${PLACE_NAMES[String(1 / d)]}.`,
        steps: [`{${n}/${d}} is ${n} ${PLACE_NAMES[String(1 / d)]}.`, `Write it with ${places} digit${places > 1 ? 's' : ''} after the point: ${fmtNum(v.value, places)}.`],
        meta: { value: v },
      });
    }
    const str = fmtNum(v.value, places);
    return P({
      skill: this.id, tier,
      text: `Write ${str} as a fraction.`,
      answer: frac(v),
      choices: makeChoices(rng, v, [{ value: F(n, d * 10), why: `Count the places after the point: ${places} place${places > 1 ? 's' : ''} means ${PLACE_NAMES[String(1 / d)]}.` }, F(n, Math.max(10, d / 10)), F(d - n, d), F(n + 1, d)], labelFrac(false)),
      hint: `How many digits are after the decimal point? That tells you tenths, hundredths or thousandths.`,
      steps: [`${str} has ${places} digit${places > 1 ? 's' : ''} after the point, so it is ${n} ${PLACE_NAMES[String(1 / d)]}.`, `${str} = {${n}/${d}}.`],
      meta: { value: v },
    });
  },
};

const decCompare = {
  id: 'dec_compare', domain: D, grade: 4, cc: '4.NF.7', name: 'Compare decimals', short: 'compare decimals',
  gen(rng, tier) {
    let a, b;
    if (tier === 1) { a = F(rng.int(1, 9), 10); b = F(rng.int(11, 99), 100); }
    else if (tier === 2) { a = F(rng.int(11, 99), 100); b = F(rng.int(1, 99), 10 * rng.pick([1, 10])); }
    else { a = F(rng.int(101, 999), 1000); b = F(rng.int(11, 99), 100); }
    if (rng.chance(0.15)) b = F(a.n * 10, a.d * 10);
    if (rng.chance(0.5)) [a, b] = [b, a];
    // Show each number with the places its (unreduced) denominator implies, so 0.5 vs 0.50 stays visible.
    const show = (f) => f.value.toFixed(String(f.d).length - 1);
    const sa = show(a), sb = show(b);
    const cmp = a.cmp(b);
    const sign = cmp < 0 ? '<' : cmp > 0 ? '>' : '=';
    const places = Math.max(sa.split('.')[1]?.length || 0, sb.split('.')[1]?.length || 0);
    const pa = a.value.toFixed(places), pb = b.value.toFixed(places);
    const why = `Give them the same number of decimal places: ${pa} and ${pb}. Now compare.`;
    return P({
      skill: this.id, tier,
      text: `Which sign makes this true?  ${sa} ○ ${sb}`,
      answer: pick(),
      choices: ['<', '>', '='].map((s) => ({ label: s, value: s, correct: s === sign, why: s === sign ? undefined : why })),
      hint: 'Line up the decimal points. Add zeros so both have the same number of digits after the point.',
      steps: [`${sa} = ${pa} and ${sb} = ${pb}.`, `Compare them like whole numbers of ${places === 1 ? 'tenths' : places === 2 ? 'hundredths' : 'thousandths'}.`, `${sa} ${sign} ${sb}.`],
      answerText: sign,
      meta: { sign, a, b },
    });
  },
};

const decRound = {
  id: 'dec_round', domain: D, grade: 5, cc: '5.NBT.4', name: 'Round decimals', short: 'round decimals',
  gen(rng, tier) {
    const targetPlaces = tier === 1 ? 0 : tier === 2 ? 1 : 2;
    const extra = targetPlaces + 1;
    const n = rng.int(10 ** extra + 1, 10 ** (extra + 1) * 3);
    if (n % 10 === 0) return decRound.gen(rng, tier);
    const x = F(n, 10 ** extra);
    const scaled = Math.floor(n / 10);
    const up = n % 10 >= 5;
    const rounded = F(scaled + (up ? 1 : 0), 10 ** targetPlaces);
    const other = F(scaled + (up ? 0 : 1), 10 ** targetPlaces);
    const placeName = ['whole number', 'tenth', 'hundredth'][targetPlaces];
    const xs = fmtNum(x.value, extra);
    return P({
      skill: this.id, tier,
      text: `Round ${xs} to the nearest ${placeName}.`,
      visual: { kind: 'numline', min: F(scaled, 10 ** targetPlaces).value, max: F(scaled + 1, 10 ** targetPlaces).value, marks: [{ v: x.value, label: xs }], places: targetPlaces },
      answer: num(rounded),
      choices: makeChoices(rng, rounded, [
        { value: other, why: `Look at the next digit (${n % 10}). ${up ? '5 or more rounds up.' : 'Less than 5 rounds down.'}` },
        x, rounded.add(F(1, 10 ** targetPlaces)),
      ], (v) => fmtNum(Frac.of(v).value)),
      hint: `Look at the digit just after the ${placeName} place. 5 or more rounds up.`,
      steps: [`${xs} is between ${fmtNum(F(scaled, 10 ** targetPlaces).value, targetPlaces)} and ${fmtNum(F(scaled + 1, 10 ** targetPlaces).value, targetPlaces)}.`, `The next digit is ${n % 10}, so round ${up ? 'up' : 'down'}.`, `${xs} rounds to ${fmtNum(rounded.value, targetPlaces)}.`],
      meta: { value: rounded },
    });
  },
};

const addSub = {
  id: 'dec_addsub', domain: D, grade: 5, cc: '5.NBT.7', name: 'Add and subtract decimals', short: 'decimal + −',
  gen(rng, tier) {
    const pa = tier === 1 ? 1 : rng.int(1, 2), pb = tier === 1 ? 1 : 2;
    let A = rng.int(11, tier === 3 ? 999 : 99), B = rng.int(11, tier === 3 ? 999 : 99);
    if (A % 10 === 0) A += 1;
    if (B % 10 === 0) B += 1;
    let a = F(A, 10 ** pa), b = F(B, 10 ** pb);
    const add = tier === 1 || rng.chance(0.5);
    if (!add && a.cmp(b) < 0) [a, b] = [b, a];
    if (!add && a.eq(b)) return addSub.gen(rng, tier);
    const ans = add ? a.add(b) : a.sub(b);
    const sa = fmtNum(a.value), sb = fmtNum(b.value);
    const places = Math.max(pa, pb);
    const na = Math.round(a.value * 10 ** (sa.split('.')[1]?.length || 0)), nb = Math.round(b.value * 10 ** (sb.split('.')[1]?.length || 0));
    const misaligned = F(add ? na + nb : Math.abs(na - nb), 10 ** places);
    const op = add ? '+' : '−';
    return P({
      skill: this.id, tier,
      text: `What is ${sa} ${op} ${sb}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [
        { value: misaligned, why: 'Line up the decimal points first, so tenths add to tenths and hundredths to hundredths.' },
        ans.add(F(1, 10)), ans.sub(F(1, 10 ** places)), ans.add(1),
      ], labelNum),
      hintVisual: { kind: 'column', rows: [a.value.toFixed(places), b.value.toFixed(places)], op },
      hint: 'Line up the decimal points. Fill empty places with zeros.',
      steps: [`Line up the points: ${a.value.toFixed(places)} ${op} ${b.value.toFixed(places)}.`, `${add ? 'Add' : 'Subtract'} each place, starting from the right.`, `${sa} ${op} ${sb} = ${fmtNum(ans.value)}.`],
      meta: { value: ans },
    });
  },
};

const shop = {
  id: 'money', domain: D, grade: 4, cc: '4.MD.2', name: 'Money word problems', short: 'money',
  gen(rng, tier) {
    const [one, many] = rng.pick(ITEMS);
    if (tier === 1) {
      const p1 = rng.int(1, 8) * 25, p2 = rng.int(1, 8) * 25;
      const [o2] = rng.pick(ITEMS.filter((i) => i[0] !== one));
      const total = cents(p1 + p2);
      return P({
        skill: this.id, tier,
        text: `A ${one} costs ${fmtMoney(p1 / 100)} and a ${o2} costs ${fmtMoney(p2 / 100)}. How much for both?`,
        answer: money(total),
        choices: makeChoices(rng, total, [cents(p1 + p2 + 25), cents(Math.abs(p1 - p2) || 25), cents(p1 + p2 - 10), cents(p1 + p2 + 100)], labelMoney),
        hint: 'Add the dollars and cents. 100 cents make a dollar.',
        steps: [`${fmtMoney(p1 / 100)} + ${fmtMoney(p2 / 100)} = ${fmtMoney((p1 + p2) / 100)}.`],
        meta: { value: total },
      });
    }
    if (tier === 2) {
      const price = rng.int(3, 12) * 25, k = rng.int(2, 5);
      const total = price * k;
      if (rng.chance(0.5)) {
        return P({
          skill: this.id, tier,
          text: `One ${one} costs ${fmtMoney(price / 100)}. How much do ${k} ${many} cost?`,
          answer: money(cents(total)),
          choices: makeChoices(rng, cents(total), [{ value: cents(price + k * 100), why: `${k} ${many} means ${k} groups of ${fmtMoney(price / 100)}. Multiply.` }, cents(total + 25), cents(total - 50), cents(price * (k + 1))], labelMoney),
          hint: `Multiply the price by ${k}. Think of the price in cents: ${price}¢.`,
          steps: [`${price}¢ × ${k} = ${total}¢.`, `${total}¢ = ${fmtMoney(total / 100)}.`],
          meta: { value: cents(total) },
        });
      }
      const pay = total <= 500 ? 500 : 1000;
      if (pay < total) return shop.gen(rng, 1);
      const change = cents(pay - total);
      return P({
        skill: this.id, tier,
        text: `${k} ${many} cost ${fmtMoney(total / 100)} in all. You pay with ${fmtMoney(pay / 100)}. How much change do you get?`,
        answer: money(change),
        choices: makeChoices(rng, change, [cents(pay - total + 100), cents(pay - total - 25), cents(total), cents(pay - total + 10)], labelMoney),
        hint: `Subtract the cost from ${fmtMoney(pay / 100)}. You can count up from ${fmtMoney(total / 100)}.`,
        steps: [`${fmtMoney(pay / 100)} − ${fmtMoney(total / 100)} = ${fmtMoney((pay - total) / 100)}.`],
        meta: { value: change },
      });
    }
    const price = rng.int(40, 199) * 5, k = rng.int(2, 4), extra = rng.int(20, 90) * 5;
    const total = price * k + extra;
    const pay = [1000, 2000, 5000].find((p) => p > total);
    const change = cents(pay - total);
    const [o2] = rng.pick(ITEMS.filter((i) => i[0] !== one));
    return P({
      skill: this.id, tier,
      text: `You buy ${k} ${many} at ${fmtMoney(price / 100)} each and one ${o2} for ${fmtMoney(extra / 100)}. You pay with ${fmtMoney(pay / 100)}. What is your change?`,
      answer: money(change),
      choices: makeChoices(rng, change, [{ value: cents(pay - price - extra), why: `Remember there are ${k} ${many}, not just one.` }, cents(total), cents(pay - total + 100), cents(pay - total - 5)], labelMoney),
      hint: 'First find the total cost, then subtract it from what you paid.',
      steps: [`${k} × ${fmtMoney(price / 100)} = ${fmtMoney((price * k) / 100)}.`, `Total: ${fmtMoney((price * k) / 100)} + ${fmtMoney(extra / 100)} = ${fmtMoney(total / 100)}.`, `Change: ${fmtMoney(pay / 100)} − ${fmtMoney(total / 100)} = ${fmtMoney((pay - total) / 100)}.`],
      meta: { value: change },
    });
  },
};

// Story version of the money skill for the cocoa deliveries: the friend in front of you is the one paying.
export function cocoaOrder(rng, tier, who) {
  const cup = rng.int(5, 12) * 25;
  if (tier === 1) {
    const pay = cup < 200 ? 200 : 500;
    const change = cents(pay - cup);
    return P({
      skill: 'money', tier,
      text: `A cup of Mama Mittens' cocoa costs ${fmtMoney(cup / 100)}. ${who} pays with ${fmtMoney(pay / 100)}. How much change should you give back?`,
      answer: money(change),
      choices: makeChoices(rng, change, [cents(pay - cup + 100), cents(cup), cents(pay - cup + 25), cents(Math.max(5, pay - cup - 25))], labelMoney),
      hint: `Count up from ${fmtMoney(cup / 100)} to ${fmtMoney(pay / 100)}.`,
      steps: [`${fmtMoney(pay / 100)} − ${fmtMoney(cup / 100)} = ${fmtMoney((pay - cup) / 100)}.`],
      meta: { value: change },
    });
  }
  const k = tier === 2 ? 2 : rng.int(3, 4);
  const extra = tier === 3 ? rng.int(2, 6) * 15 : 0;
  const total = cup * k + extra;
  const pay = [500, 1000, 2000].find((v) => v > total);
  const change = cents(pay - total);
  const extraText = extra ? ` plus a bag of marshmallows for ${fmtMoney(extra / 100)}` : '';
  const steps = [`${k} × ${fmtMoney(cup / 100)} = ${fmtMoney((cup * k) / 100)}.`];
  if (extra) steps.push(`Add the marshmallows: ${fmtMoney((cup * k) / 100)} + ${fmtMoney(extra / 100)} = ${fmtMoney(total / 100)}.`);
  steps.push(`Change: ${fmtMoney(pay / 100)} − ${fmtMoney(total / 100)} = ${fmtMoney((pay - total) / 100)}.`);
  return P({
    skill: 'money', tier,
    text: `${who} wants ${k} cups of cocoa at ${fmtMoney(cup / 100)} each${extraText}, and pays with ${fmtMoney(pay / 100)}. How much change should you give back?`,
    answer: money(change),
    choices: makeChoices(rng, change, [{ value: cents(pay - cup - extra), why: `${who} wants ${k} cups, not just one.` }, cents(total), cents(pay - total + 100), cents(Math.max(5, pay - total - 25))], labelMoney),
    hint: 'First find the total cost, then subtract it from what was paid.',
    steps,
    meta: { value: change },
  });
}

const pow10 = {
  id: 'pow10', domain: D, grade: 5, cc: '5.NBT.2', name: 'Multiply and divide by 10, 100, 1000', short: '× ÷ 10, 100, 1000',
  gen(rng, tier) {
    const p = tier === 1 ? 1 : rng.int(1, tier === 2 ? 2 : 3);
    const k = 10 ** p;
    const x = tier === 1 ? F(rng.int(2, 99), rng.pick([1, 10])) : F(rng.int(11, 999), rng.pick([10, 100]));
    const mul = rng.chance(0.5);
    const ans = mul ? x.mul(k) : x.div(k);
    const xs = fmtNum(x.value);
    return P({
      skill: this.id, tier,
      text: `What is ${xs} ${mul ? '×' : '÷'} ${fmtInt(k)}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [
        { value: mul ? x.div(k) : x.mul(k), why: mul ? 'Multiplying by 10, 100 or 1000 makes a number bigger.' : 'Dividing by 10, 100 or 1000 makes a number smaller.' },
        mul ? ans.mul(10) : ans.div(10), mul ? ans.div(10) : ans.mul(10),
      ], labelNum),
      hint: `${fmtInt(k)} has ${p} zero${p > 1 ? 's' : ''}. Each digit moves ${p} place${p > 1 ? 's' : ''} to the ${mul ? 'left' : 'right'}.`,
      steps: [`${mul ? 'Multiplying' : 'Dividing'} by ${fmtInt(k)} moves every digit ${p} place${p > 1 ? 's' : ''} ${mul ? 'left (bigger)' : 'right (smaller)'}.`, `${xs} ${mul ? '×' : '÷'} ${fmtInt(k)} = ${fmtNum(ans.value)}.`],
      meta: { value: ans },
    });
  },
};

const ratio = {
  id: 'ratio', domain: D, grade: 6, cc: '6.RP.3a', name: 'Ratios', short: 'ratios',
  gen(rng, tier) {
    const pairs = [['fish', 'crabs'], ['red scarves', 'blue scarves'], ['snowballs', 'icicles'], ['cocoas', 'cookies']];
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

// Tenths as hundredths, then adding tenths and hundredths (the bridge from fractions to decimals).
const tenthsHundredths = {
  id: 'dec_hundredths', domain: D, grade: 4, cc: '4.NF.5', name: 'Tenths and hundredths', short: 'tenths + hundredths',
  gen(rng, tier) {
    const t = rng.int(1, 9);
    if (tier === 1) {
      return P({
        skill: this.id, tier,
        text: `{${t}/10} is the same as how many hundredths? {${t}/10} = {?/100}`,
        answer: num(t * 10),
        choices: makeChoices(rng, t * 10, [{ value: t, why: `Each tenth is 10 hundredths, so ${t} tenths is ${t} × 10 hundredths.` }, t * 100, t + 10, t * 10 + 1], labelNum),
        hint: 'One column of the hundred grid is a tenth. It has 10 little squares.',
        hintVisual: { kind: 'hundred', tenths: t, hundredths: 0 },
        steps: [`1 tenth = 10 hundredths.`, `${t} tenths = ${t} × 10 = ${t * 10} hundredths, so {${t}/10} = {${t * 10}/100}.`],
        meta: { value: t * 10 },
      });
    }
    const h = rng.int(1, 9);
    const ans = F(t * 10 + h, 100);
    const story = tier === 3
      ? `Mama Mittens sold {${t}/10} of her cocoa in the morning and {${h}/100} of it at lunch. What fraction of the cocoa has she sold?`
      : `What is {${t}/10} + {${h}/100}?`;
    return P({
      skill: this.id, tier,
      text: story,
      answer: frac(ans),
      choices: makeChoices(rng, ans, [
        { value: F(t + h, 100), why: `Change {${t}/10} into hundredths first: {${t}/10} = {${t * 10}/100}.` },
        { value: F(t + h, 110), why: 'Add pieces of the same size. Make both fractions hundredths, then add the tops.' },
        F(t * 10 + h, 10), F(h * 10 + t, 100),
      ], labelFrac()),
      hint: `Tenths and hundredths are different sizes. Write {${t}/10} as hundredths first.`,
      hintVisual: { kind: 'hundred', tenths: t, hundredths: h },
      steps: [`{${t}/10} = {${t * 10}/100}.`, `{${t * 10}/100} + {${h}/100} = {${t * 10 + h}/100}.`],
      meta: { value: ans },
    });
  },
};

const labelAny = (v) => (v instanceof Frac && !v.toDecimal() ? labelFrac(false)(v) : labelNum(v));

const placeTen = {
  id: 'place_ten', domain: D, grade: 5, cc: '5.NBT.1', name: 'Each place is 10 times the next', short: 'place-value patterns',
  gen(rng, tier) {
    if (tier === 2) {
      const n = rng.int(1, 9), places = rng.int(1, 2);
      const x = F(n, 10 ** places);
      const xs = fmtNum(x.value, places);
      const mode = rng.pick(['tenth', 'times', 'what']);
      if (mode === 'tenth') {
        const ans = x.div(10);
        return P({
          skill: this.id, tier,
          text: `What is {1/10} of ${xs}?`,
          answer: num(ans),
          choices: makeChoices(rng, ans, [{ value: x.mul(10), why: `{1/10} of a number is smaller: each digit moves one place to the RIGHT.` }, x.div(100), x, F(n, 1)], labelNum),
          hint: 'Taking {1/10} of a number moves every digit one place to the right.',
          steps: [`The ${n} is in the ${PLACE_NAMES[String(1 / 10 ** places)]} place.`, `{1/10} of it moves the ${n} one place right: ${fmtNum(ans.value)}.`],
          meta: { value: ans },
        });
      }
      if (mode === 'times') {
        const ans = x.mul(10);
        return P({
          skill: this.id, tier,
          text: `What is 10 × ${xs}?`,
          answer: num(ans),
          choices: makeChoices(rng, ans, [{ value: x.div(10), why: `10 times a number is bigger: each digit moves one place to the LEFT.` }, x.mul(100), F(n * 10, 1), x], labelNum),
          hint: 'Multiplying by 10 moves every digit one place to the left.',
          steps: [`The ${n} is in the ${PLACE_NAMES[String(1 / 10 ** places)]} place.`, `10 times as much moves it one place left: ${fmtNum(ans.value)}.`],
          meta: { value: ans },
        });
      }
      const ans = x.div(10);
      return P({
        skill: this.id, tier,
        text: `${xs} is 10 times as much as what number?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: x.mul(10), why: `${xs} is 10 times the answer, so the answer is smaller: divide by 10.` }, x.div(100), x], labelNum),
        hint: `Which number, times 10, makes ${xs}? Move the digit one place right.`,
        steps: [`10 × ? = ${xs}.`, `? = ${xs} ÷ 10 = ${fmtNum(ans.value)}.`],
        meta: { value: ans },
      });
    }
    // Same digit in two places: how many times as much is the left one worth?
    const digit = rng.int(1, 9);
    const gap = tier === 3 ? 2 : 1;
    const decimal = tier === 3 && rng.chance(0.5);
    const len = decimal ? 3 : 4;
    const hi = rng.int(gap, len - 1);
    const lo = hi - gap;
    const digits = Array.from({ length: len }, (_, i) => (i === len - 1 - hi || i === len - 1 - lo ? digit : rng.int(0, 9)));
    if (digits[0] === 0) digits[0] = digit === 1 ? 2 : 1;
    for (let i = 0; i < len; i++) if (i !== len - 1 - hi && i !== len - 1 - lo && digits[i] === digit) digits[i] = (digit % 9) + 1;
    // Place k (counting from the right, starting at 0) is worth 10^k, or 10^(k-2) once two decimal places are added.
    const shift = decimal ? 2 : 0;
    const str = decimal ? `${digits[0]}.${digits.slice(1).join('')}` : fmtInt(Number(digits.join('')));
    const placeName = (k) => PLACE_NAMES[String(k - shift >= 0 ? 10 ** (k - shift) : 1 / 10 ** (shift - k))];
    const worth = (k) => (k - shift >= 0 ? F(digit * 10 ** (k - shift), 1) : F(digit, 10 ** (shift - k)));
    const ans = 10 ** gap;
    return P({
      skill: this.id, tier,
      text: `In ${str}, the ${digit} in the ${placeName(hi)} place is how many times as much as the ${digit} in the ${placeName(lo)} place?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [
        { value: gap === 1 ? 100 : 10, why: gap === 1 ? 'The two places are next to each other, so it is 10 times as much.' : 'The places are two apart: 10 × 10 = 100 times as much.' },
        { value: F(1, 10 ** gap), why: `The ${placeName(hi)} place is further LEFT, so its digit is worth more, not less.` },
        { value: digit, why: `Compare what the digits are worth (${fmtNum(worth(hi).value)} and ${fmtNum(worth(lo).value)}), not the digits themselves.` },
        1000,
      ], labelAny),
      hint: 'Each place is worth 10 times the place to its right.',
      steps: [`The ${digit} in the ${placeName(hi)} place is worth ${fmtNum(worth(hi).value)}.`, `The ${digit} in the ${placeName(lo)} place is worth ${fmtNum(worth(lo).value)}.`, `${fmtNum(worth(hi).value)} is ${ans} times ${fmtNum(worth(lo).value)}.`],
      meta: { value: ans },
    });
  },
};

// Four decimals built from the same two digits in different places: the classic "longer is bigger" trap.
function trapSet(rng, whole) {
  const a = rng.int(1, 9);
  let b = rng.int(1, 9);
  if (b === a) b = (a % 9) + 1;
  const w = whole ? rng.int(1, 9) : 0;
  const base = w * 1000;
  return [
    F(base + a * 100, 1000), F(base + a * 100 + b * 10, 1000), F(base + a * 100 + b, 1000), F(base + a * 10 + b, 1000),
  ];
}
const showDec = (f) => fmtNum(f.value);

const decCompare3 = {
  id: 'dec_compare3', domain: D, grade: 5, cc: '5.NBT.3b', name: 'Compare to thousandths', short: 'compare thousandths',
  gen(rng, tier) {
    const set = trapSet(rng, tier >= 2);
    const sorted = [...set].sort((x, y) => x.cmp(y));
    const why = 'Line up the decimal points and compare place by place, starting with the biggest place. More digits does not mean bigger.';
    if (tier === 3) {
      const three = rng.shuffle(set).slice(0, 3).sort((x, y) => x.cmp(y));
      const fmt = (list) => list.map(showDec).join(', ');
      const right = fmt(three);
      const bySize = [...three].sort((x, y) => showDec(x).length - showDec(y).length || x.cmp(y));
      const options = [right, fmt([...three].reverse()), fmt(bySize), fmt([three[1], three[0], three[2]]), fmt([three[0], three[2], three[1]])];
      const seen = new Set();
      const choices = [];
      for (const o of options) {
        if (seen.has(o) || choices.length >= 4) continue;
        seen.add(o);
        choices.push({ label: o, value: o, correct: o === right, why: o === right ? undefined : why });
      }
      return P({
        skill: this.id, tier,
        text: 'Which list goes from least to greatest?',
        answer: pick(),
        choices: rng.shuffle(choices),
        hint: 'Write each number with three decimal places, then compare them like whole numbers.',
        steps: [three.map((f) => `${showDec(f)} = ${f.value.toFixed(3)}`).join(', ') + '.', `From least to greatest: ${right}.`],
        answerText: right,
      });
    }
    const greatest = rng.chance(0.5);
    const target = greatest ? sorted[3] : sorted[0];
    return P({
      skill: this.id, tier,
      text: `Which number is the ${greatest ? 'greatest' : 'least'}?`,
      answer: pick(),
      choices: rng.shuffle(set).map((f) => ({ label: showDec(f), value: showDec(f), correct: f.eq(target), why: f.eq(target) ? undefined : why })),
      hint: 'Write each number with three decimal places (add zeros), then compare them like whole numbers.',
      steps: [set.map((f) => `${showDec(f)} = ${f.value.toFixed(3)}`).join(', ') + '.', `The ${greatest ? 'greatest' : 'least'} is ${showDec(target)}.`],
      answerText: showDec(target),
    });
  },
};

const decOps = {
  id: 'dec_ops', domain: D, grade: 6, cc: '6.NS.3', name: 'Decimal fluency', short: 'decimal + − × ÷',
  gen(rng, tier) {
    if (tier === 1) {
      const add = rng.chance(0.5);
      const A = rng.int(101, 999), B = rng.int(101, 999);
      const x = F(A, 10), y = F(B, 100);
      const [p, q] = add || x.cmp(y) > 0 ? [x, y] : [y, x];
      const ans = add ? p.add(q) : p.sub(q);
      const naive = F(add ? A + B : Math.abs(A - B), 100);
      return P({
        skill: this.id, tier,
        text: `What is ${showDec(p)} ${add ? '+' : '−'} ${showDec(q)}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: naive, why: `Line up the decimal points first: write ${showDec(x)} as ${x.value.toFixed(2)}.` }, ans.add(F(1, 10)), ans.add(F(1, 1)), ans.sub(F(1, 100))], labelNum),
        hint: 'Line up the decimal points. Add a zero so both numbers have two decimal places.',
        steps: [`${p.value.toFixed(2)} ${add ? '+' : '−'} ${q.value.toFixed(2)}.`, `= ${fmtNum(ans.value)}.`],
        meta: { value: ans },
      });
    }
    if (tier === 2) {
      const A = rng.int(11, 99), B = rng.int(2, 9);
      const x = F(A, 10), y = F(B, 10);
      const ans = x.mul(y);
      return P({
        skill: this.id, tier,
        text: `What is ${showDec(x)} × ${showDec(y)}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: ans.mul(10), why: 'Count the decimal places: 1 + 1 = 2 places in the answer.' }, ans.div(10), F(A * B, 1), ans.add(F(1, 10))], labelNum),
        hint: `Multiply ${A} × ${B} like whole numbers, then put back 2 decimal places.`,
        steps: [`${A} × ${B} = ${A * B}.`, `${showDec(x)} has 1 decimal place and ${showDec(y)} has 1, so the answer has 2: ${fmtNum(ans.value)}.`],
        meta: { value: ans },
      });
    }
    const dv = rng.pick([2, 4, 5, 8]);
    const qv = rng.int(12, 60);
    const divisor = F(dv, 10), dividend = F(dv * qv, 10);
    const ans = dividend.div(divisor);
    return P({
      skill: this.id, tier,
      text: `What is ${showDec(dividend)} ÷ ${showDec(divisor)}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: ans.div(10), why: `Move both decimal points one place right: ${dv * qv} ÷ ${dv}. The answer does not shrink.` }, ans.mul(10), ans.add(1), ans.sub(1)], labelNum),
      hint: `Multiply both numbers by 10 so you divide by a whole number: ${dv * qv} ÷ ${dv}.`,
      steps: [`${showDec(dividend)} ÷ ${showDec(divisor)} = ${dv * qv} ÷ ${dv} (both × 10).`, `${dv * qv} ÷ ${dv} = ${qv}.`],
      meta: { value: ans },
    });
  },
};

export const HUTS_SKILLS = [decFrac, tenthsHundredths, decCompare, shop, place, placeTen, decCompare3, pow10, decRound, addSub, decOps, ratio, unitRate, percent];
