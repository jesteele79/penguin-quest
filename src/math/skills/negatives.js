// Negative numbers (grade 6): opposites, absolute value, ordering, rational numbers on a number line, and
// all four quadrants of the coordinate plane. Book 3's Cloud Valleys, above and below the cloud line.
import { P, num, pick, makeChoices, labelNum } from '../build.js';
import { gcd } from '../frac.js';
import { fmtNum } from '../fmt.js';

const D = 'neg';
const neg = (n) => (n < 0 ? `−${-n}` : String(n));

const integers = {
  id: 'integers', domain: D, grade: 6, cc: '6.NS.7', name: 'Negative numbers', short: 'negative numbers',
  gen(rng, tier) {
    const kind = tier === 1 ? rng.int(0, 1) : tier === 2 ? rng.int(1, 2) : rng.int(2, 3);
    if (kind === 0) {
      const a = -rng.int(1, 15);
      let b = -rng.int(1, 15);
      if (a === b) b -= 2;
      const colder = Math.min(a, b);
      return P({
        skill: this.id, tier,
        text: `Which temperature is colder: ${neg(a)}°C or ${neg(b)}°C?`,
        visual: { kind: 'numline', min: -16, max: 2, marks: [{ v: a, label: neg(a) }, { v: b, label: neg(b) }], places: 0, step: 2 },
        answer: pick(),
        choices: [a, b].map((v) => ({ label: `${neg(v)}°C`, value: v, correct: v === colder, why: v === colder ? undefined : 'Below zero, the bigger the number after the minus sign, the colder it is. It is further left on the number line.' })),
        hint: 'Colder means further left on the number line.',
        steps: [`${neg(colder)} is further left on the number line than ${neg(colder === a ? b : a)}.`, `So ${neg(colder)}°C is colder.`],
        answerText: `${neg(colder)}°C`,
        meta: {},
      });
    }
    if (kind === 1) {
      const n = rng.int(2, 40) * (rng.chance(0.6) ? -1 : 1);
      const abs = rng.chance(0.5);
      const ans = abs ? Math.abs(n) : -n;
      return P({
        skill: this.id, tier,
        text: abs ? `What is |${neg(n)}|? (the absolute value)` : `What is the opposite of ${neg(n)}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, abs
          ? [{ value: -Math.abs(n), why: 'Absolute value is distance from 0, and distance is never negative.' }, Math.abs(n) + 1, Math.abs(n) - 1, Math.abs(n) * 2]
          : [{ value: n, why: 'The opposite is on the other side of 0, the same distance away.' }, ans + 1, ans - 1, -n + (n > 0 ? -10 : 10)], (v) => neg(v), 4, { allowNeg: true }),
        hint: abs ? 'Absolute value means: how far is it from 0?' : 'The opposite is the same distance from 0, on the other side.',
        steps: abs ? [`${neg(n)} is ${Math.abs(n)} steps from 0.`, `|${neg(n)}| = ${Math.abs(n)}.`] : [`${neg(n)} is ${Math.abs(n)} steps ${n < 0 ? 'left' : 'right'} of 0.`, `The opposite is ${Math.abs(n)} steps ${n < 0 ? 'right' : 'left'}: ${neg(-n)}.`],
        meta: { value: ans },
      });
    }
    if (kind === 2) {
      const a = -rng.int(1, 9), b = rng.int(1, 9);
      const d = b - a;
      return P({
        skill: this.id, tier,
        text: `How far apart are ${neg(a)} and ${b} on a number line?`,
        visual: { kind: 'numline', min: -10, max: 10, marks: [{ v: a, label: neg(a) }, { v: b, label: String(b) }], places: 0, step: 2 },
        answer: num(d),
        choices: makeChoices(rng, d, [{ value: Math.abs(b + a), why: `Count the steps from ${neg(a)} up to 0 (${-a}), then from 0 to ${b} (${b}). Add them.` }, d + 1, d - 1], labelNum),
        hint: `Count from ${neg(a)} to 0, then from 0 to ${b}.`,
        steps: [`From ${neg(a)} to 0 is ${-a}.`, `From 0 to ${b} is ${b}.`, `${-a} + ${b} = ${d}.`],
        meta: { value: d },
      });
    }
    const start = -rng.int(2, 12), rise = rng.int(3, 18);
    const ans = start + rise;
    return P({
      skill: this.id, tier,
      text: `At midnight it was ${neg(start)}°C on the mountain. By noon it warmed up ${rise} degrees. What was the temperature at noon?`,
      visual: { kind: 'numline', min: -14, max: 12, marks: [{ v: start, label: neg(start) }], places: 0, step: 2 },
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: start - rise, why: 'Warming up means moving right (up) on the number line.' }, -ans === ans ? ans + 2 : -ans, ans + 1, ans - 1, rise], (v) => neg(v), 4, { allowNeg: true }),
      hint: `Start at ${neg(start)} and move ${rise} steps to the right.`,
      steps: [`Start at ${neg(start)}.`, ans >= 0 ? `${-start} steps gets you to 0, then ${rise + start} more.` : `Move ${rise} steps right.`, `You land on ${neg(ans)}°C.`],
      meta: { value: ans },
    });
  },
};

// Ordering and absolute value: which is further from zero, which is less, and what that means outside.
const absOrder = {
  id: 'abs_order', domain: D, grade: 6, cc: '6.NS.7', name: 'Order and absolute value', short: 'order & absolute value',
  gen(rng, tier) {
    const kind = tier === 1 ? rng.int(0, 1) : tier === 2 ? rng.int(1, 2) : rng.int(2, 3);
    if (kind === 0) {
      // Compare with < or >.
      const a = -rng.int(1, 12);
      let b = rng.chance(0.5) ? -rng.int(1, 12) : rng.int(0, 9);
      if (a === b) b -= 3;
      const sign = a < b ? '<' : '>';
      const correct = `${neg(a)} ${sign} ${neg(b)}`;
      const wrong = `${neg(a)} ${sign === '<' ? '>' : '<'} ${neg(b)}`;
      return P({
        skill: this.id, tier,
        text: 'Which is true?',
        visual: { kind: 'numline', min: -14, max: 10, marks: [{ v: a, label: neg(a) }, { v: b, label: neg(b) }], places: 0, step: 2 },
        answer: pick(),
        choices: rng.shuffle([
          { label: correct, value: 'c', correct: true },
          { label: wrong, value: 'w', why: 'On a number line, the number further left is less.' },
        ]),
        hint: 'Find both numbers on the number line. The one further left is less.',
        steps: [`${neg(Math.min(a, b))} is further left than ${neg(Math.max(a, b))}.`, `So ${correct}.`],
        answerText: correct,
        meta: {},
      });
    }
    if (kind === 1) {
      // Least to greatest.
      const set = new Set();
      while (set.size < 4) set.add(rng.int(-12, 9));
      const vals = [...set];
      const up = [...vals].sort((x, y) => x - y);
      const show = (arr) => arr.map(neg).join(', ');
      const byMagnitude = [...vals].sort((x, y) => Math.abs(x) - Math.abs(y) || x - y);
      const negsBackwards = [...up.filter((v) => v < 0).sort((x, y) => y - x), ...up.filter((v) => v >= 0)];
      const choices = [
        { label: show(up), value: 'c', correct: true },
        { label: show([...up].reverse()), value: 'w1', why: 'That is greatest to least.' },
        { label: show(byMagnitude), value: 'w2', why: 'That orders them by distance from 0. Order means left to right on the number line.' },
        { label: show(negsBackwards), value: 'w3', why: 'For negative numbers, the bigger the number after the minus sign, the further left it is.' },
      ];
      return P({
        skill: this.id, tier,
        text: `Put these in order from least to greatest: ${show(rng.shuffle(vals))}`,
        answer: pick(),
        choices: rng.shuffle(choices.filter((c, i, arr) => arr.findIndex((q) => q.label === c.label) === i)),
        hint: 'Least means furthest left on the number line. Start with the most negative number.',
        steps: [`From left to right on the number line: ${show(up)}.`],
        answerText: show(up),
        meta: {},
      });
    }
    if (kind === 2) {
      // Absolute value as "how far" in a story.
      const a = rng.int(3, 20);
      let b = rng.int(3, 20);
      if (a === b) b += 2;
      const story = rng.pick([
        { say: (w, v) => `${w}'s glider is ${v} meters below the cloud line (${neg(-v)}).`, q: 'Whose glider is deeper below the clouds?', who: ['Swoop', 'Vela'], label: (w) => `${w}'s glider`, is: 'is deeper' },
        { say: (w, v) => `${w} owes the kite shop $${v} (${neg(-v)}).`, q: 'Who owes more money?', who: ['Rocco', 'Cinder'], label: (w) => w, is: 'owes more' },
      ]);
      const more = a > b ? 0 : 1;
      return P({
        skill: this.id, tier,
        text: `${story.say(story.who[0], a)} ${story.say(story.who[1], b)} ${story.q}`,
        answer: pick(),
        choices: story.who.map((w, i) => ({ label: story.label(w), value: i, correct: i === more, why: i === more ? undefined : `Compare the absolute values: |${neg(-a)}| = ${a} and |${neg(-b)}| = ${b}.` })),
        hint: 'Absolute value tells how far from zero. Which number is further from 0?',
        steps: [`|${neg(-a)}| = ${a} and |${neg(-b)}| = ${b}.`, `${Math.max(a, b)} is further from 0, so ${story.label(story.who[more])} ${story.is}.`],
        answerText: story.label(story.who[more]),
        meta: {},
      });
    }
    // Greatest absolute value, where the trap is picking the greatest number.
    const set = new Set();
    while (set.size < 4) set.add(rng.int(-12, 10) || 1);
    const vals = [...set];
    const pickMax = [...vals].sort((x, y) => Math.abs(y) - Math.abs(x) || x - y)[0];
    if (vals.filter((v) => Math.abs(v) === Math.abs(pickMax)).length > 1) return absOrder.gen(rng, 2);
    return P({
      skill: this.id, tier,
      text: `Which number has the greatest absolute value: ${vals.map(neg).join(', ')}?`,
      answer: pick(),
      choices: rng.shuffle(vals.map((v) => ({ label: neg(v), value: v, correct: v === pickMax, why: v === pickMax ? undefined : `|${neg(v)}| = ${Math.abs(v)}, but |${neg(pickMax)}| = ${Math.abs(pickMax)} is further from 0.` }))),
      hint: 'Absolute value ignores the sign. Which number is furthest from 0?',
      steps: [vals.map((v) => `|${neg(v)}| = ${Math.abs(v)}`).join(', ') + '.', `The greatest is ${Math.abs(pickMax)}, from ${neg(pickMax)}.`],
      answerText: neg(pickMax),
      meta: {},
    });
  },
};

const QUAD = ['I', 'II', 'III', 'IV'];
const quadrant = (x, y) => (x > 0 ? (y > 0 ? 0 : 3) : y > 0 ? 1 : 2);
const pt = (x, y) => `(${neg(x)}, ${neg(y)})`;
const nz = (rng, lo, hi) => { let v = 0; while (v === 0) v = rng.int(lo, hi); return v; };

const coord4 = {
  id: 'coord4', domain: D, grade: 6, cc: '6.NS.6c', name: 'Four-quadrant coordinates', short: 'four quadrants',
  gen(rng, tier) {
    const x = nz(rng, -6, 6), y = nz(rng, -6, 6);
    const kind = tier === 1 ? 0 : tier === 2 ? rng.int(0, 1) : rng.int(1, 2);
    if (kind === 0) {
      const correct = pt(x, y);
      const choices = [
        { label: correct, value: 'c', correct: true },
        { label: pt(y, x), value: 'w1', why: 'The x number comes first: go across, then up or down.' },
        { label: pt(-x, y), value: 'w2', why: `Check the sign of x: the star is ${x < 0 ? 'left' : 'right'} of the y-axis.` },
        { label: pt(x, -y), value: 'w3', why: `Check the sign of y: the star is ${y < 0 ? 'below' : 'above'} the x-axis.` },
      ];
      return P({
        skill: this.id, tier,
        text: 'What are the coordinates of the star?',
        visual: { kind: 'grid', lo: -6, hi: 6, points: [{ x, y, icon: 'star' }] },
        answer: pick(),
        choices: rng.shuffle(choices.filter((c, i, arr) => arr.findIndex((q) => q.label === c.label) === i)),
        hint: 'Start at (0, 0). Go left or right first for x, then down or up for y.',
        steps: [`From (0, 0), go ${Math.abs(x)} ${x < 0 ? 'left' : 'right'}: x = ${neg(x)}.`, `Then go ${Math.abs(y)} ${y < 0 ? 'down' : 'up'}: y = ${neg(y)}.`, `The star is at ${correct}.`],
        answerText: correct,
        meta: {},
      });
    }
    if (kind === 1) {
      const q = quadrant(x, y);
      return P({
        skill: this.id, tier,
        text: `Which quadrant is the point ${pt(x, y)} in?`,
        visual: tier === 2 ? { kind: 'grid', lo: -6, hi: 6, points: [], quadrants: true } : undefined,
        answer: pick(),
        choices: QUAD.map((name, i) => ({ label: `Quadrant ${name}`, value: i, correct: i === q, why: i === q ? undefined : `x is ${x < 0 ? 'negative (left)' : 'positive (right)'} and y is ${y < 0 ? 'negative (down)' : 'positive (up)'}.` })),
        hint: 'Quadrant I is top right. The numbers go around counterclockwise: II top left, III bottom left, IV bottom right.',
        steps: [`x = ${neg(x)} is ${x < 0 ? 'left of' : 'right of'} the y-axis and y = ${neg(y)} is ${y < 0 ? 'below' : 'above'} the x-axis.`, `That is Quadrant ${QUAD[q]}.`],
        answerText: `Quadrant ${QUAD[q]}`,
        meta: {},
      });
    }
    const acrossX = rng.chance(0.5);
    const rx = acrossX ? x : -x, ry = acrossX ? -y : y;
    const correct = pt(rx, ry);
    const choices = [
      { label: correct, value: 'c', correct: true },
      { label: pt(acrossX ? -x : x, acrossX ? y : -y), value: 'w1', why: `Reflecting across the ${acrossX ? 'x' : 'y'}-axis flips the ${acrossX ? 'y' : 'x'} number only.` },
      { label: pt(-x, -y), value: 'w2', why: 'Only one number changes sign in a reflection across one axis.' },
      { label: pt(y, x), value: 'w3', why: 'A reflection keeps the numbers in the same order.' },
    ];
    return P({
      skill: this.id, tier,
      text: `The point ${pt(x, y)} is reflected across the ${acrossX ? 'x' : 'y'}-axis. Where does it land?`,
      visual: { kind: 'grid', lo: -6, hi: 6, points: [{ x, y, icon: 'star' }] },
      answer: pick(),
      choices: rng.shuffle(choices.filter((c, i, arr) => arr.findIndex((q) => q.label === c.label) === i)),
      hint: `Across the ${acrossX ? 'x-axis means a flip up and down: the y number' : 'y-axis means a flip left and right: the x number'} changes sign.`,
      steps: [`Reflecting across the ${acrossX ? 'x' : 'y'}-axis changes the sign of ${acrossX ? 'y' : 'x'}.`, `${pt(x, y)} becomes ${correct}.`],
      answerText: correct,
      meta: {},
    });
  },
};

const coordDist = {
  id: 'coord_dist', domain: D, grade: 6, cc: '6.NS.8', name: 'Distance on the coordinate plane', short: 'coordinate distance',
  gen(rng, tier) {
    if (tier === 3 && rng.chance(0.6)) {
      // A rectangle's perimeter from two opposite corners.
      const x1 = -rng.int(1, 6), x2 = rng.int(1, 6), y1 = -rng.int(1, 5), y2 = rng.int(1, 5);
      const w = x2 - x1, h = y2 - y1, ans = 2 * (w + h);
      return P({
        skill: this.id, tier,
        text: `A rectangle has corners at ${pt(x1, y1)}, ${pt(x2, y1)}, ${pt(x2, y2)} and ${pt(x1, y2)}. What is its perimeter?`,
        visual: { kind: 'grid', lo: -6, hi: 6, points: [], poly: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]] },
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: w * h, why: 'That is the area. Perimeter adds up the sides.' }, { value: 2 * (Math.abs(x2 + x1) + Math.abs(y2 + y1)) || ans + 4, why: 'Count across zero: from a negative number to a positive one, add the two distances.' }, ans + 2, w + h], labelNum),
        hint: `Width: from x = ${neg(x1)} to x = ${x2}. Height: from y = ${neg(y1)} to y = ${y2}.`,
        steps: [`Width = ${-x1} + ${x2} = ${w}.`, `Height = ${-y1} + ${y2} = ${h}.`, `Perimeter = 2 × (${w} + ${h}) = ${ans}.`],
        meta: { value: ans },
      });
    }
    const sameY = rng.chance(0.5);
    let a, b;
    if (tier === 1) { a = rng.int(1, 5); b = a + rng.int(2, 7); } else { a = -rng.int(1, 6); b = rng.int(1, 6); }
    const c = tier === 1 ? rng.int(1, 5) : nz(rng, -5, 5);
    const P1 = sameY ? [a, c] : [c, a], P2 = sameY ? [b, c] : [c, b];
    const d = b - a;
    return P({
      skill: this.id, tier,
      text: `How far apart are ${pt(...P1)} and ${pt(...P2)}?`,
      visual: { kind: 'grid', lo: -6, hi: Math.max(6, b), points: [{ x: P1[0], y: P1[1], icon: 'star' }, { x: P2[0], y: P2[1], icon: 'star' }] },
      answer: num(d),
      choices: makeChoices(rng, d, [{ value: Math.abs(a + b) || d + 2, why: a < 0 ? `One point is on each side of the axis. Add the distances: ${-a} + ${b}.` : 'Subtract the smaller number from the bigger one.' }, d + 1, d - 1, Math.abs(c) + d], labelNum),
      hint: sameY ? `The y numbers match, so count across from x = ${neg(a)} to x = ${b}.` : `The x numbers match, so count up from y = ${neg(a)} to y = ${b}.`,
      steps: a < 0
        ? [`From ${neg(a)} to 0 is ${-a}.`, `From 0 to ${b} is ${b}.`, `${-a} + ${b} = ${d}.`]
        : [`${b} − ${a} = ${d}.`],
      meta: { value: d },
    });
  },
};

const rationalLine = {
  id: 'rational_line', domain: D, grade: 6, cc: '6.NS.6c', name: 'Negative fractions and decimals on a number line', short: 'rational number line',
  gen(rng, tier) {
    const den = tier === 1 ? 1 : tier === 2 ? 2 : 4;
    const lo = -3, hi = 3;
    const pool = [];
    for (let k = lo * den; k <= hi * den; k++) if (k !== 0 && (den === 1 || k % den !== 0 || tier === 1)) pool.push(k);
    const picks = rng.shuffle(pool).slice(0, 4);
    const target = picks[0];
    const show = (k) => {
      if (den === 1) return neg(k);
      const w = Math.trunc(Math.abs(k) / den), r = Math.abs(k) % den, g = gcd(r, den);
      const sign = k < 0 ? '-' : '';
      return w ? `{${sign}${w} ${r / g}/${den / g}}` : `{${sign}${r / g}/${den / g}}`;
    };
    const decimal = tier === 3 && rng.chance(0.5);
    const asText = (k) => (decimal ? fmtNum(k / den) : show(k));
    const letters = ['A', 'B', 'C', 'D'];
    const order = rng.shuffle([0, 1, 2, 3]);
    const marks = order.map((i, j) => ({ v: picks[i] / den, label: letters[j] }));
    const right = letters[order.indexOf(0)];
    return P({
      skill: this.id, tier,
      text: `Which point shows ${asText(target)}?`,
      visual: { kind: 'numline', min: lo, max: hi, marks, places: 2, step: 1 / den },
      answer: pick(),
      choices: letters.map((L, j) => ({ label: `Point ${L}`, value: L, correct: L === right, why: L === right ? undefined : `Point ${L} is at ${asText(picks[order[j]])}.` })),
      hint: target < 0 ? `${asText(target)} is left of 0. Count the small steps from 0.` : `${asText(target)} is right of 0. Count the small steps from 0.`,
      steps: [`Each small step is ${den === 1 ? '1' : `{1/${den}}`}.`, `${asText(target)} is ${Math.abs(target)} step${Math.abs(target) === 1 ? '' : 's'} ${target < 0 ? 'left' : 'right'} of 0: point ${right}.`],
      answerText: `Point ${right}`,
      meta: {},
    });
  },
};

export const NEG_SKILLS = [integers, absOrder, rationalLine, coord4, coordDist];
