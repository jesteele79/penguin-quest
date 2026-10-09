// Short lessons that teach an idea before (or after struggling with) its practice. Pure data, so they
// can be checked in Node. Each follows the concrete-pictures-numbers sequence:
//   hook      a friend's reason to care, one or two sentences
//   explore   a hands-on model with a goal (see ui/manip.js); no wrong answers, just "not yet"
//   see       the same idea as a picture with words
//   watch     a worked example, revealed one step at a time
//   practice  a fresh example with its last step left for the child (a faded worked example)
// Markup: {3/4} is a fraction, {2 1/4} a mixed number, **bold** is a key word.
import { num, frac } from './build.js';
import { lcm, Frac } from './frac.js';
import { LESSONS6 } from './lessons6.js';

const same = (a, b) => a[0] * b[1] === b[0] * a[1] && a[0] > 0;

export const LESSONS = {
  // ------------------------------------------------------------------ fractions (Fern)
  frac_equiv: {
    title: 'Equivalent fractions', mentor: 'fern',
    hook: 'These crystal bars are cut into different numbers of pieces. Watch closely: different-looking fractions can be exactly the same amount!',
    explore: {
      model: 'strips', prompt: 'Tap the eighths until they cover the same length as one half.', success: 'Four eighths is the same as one half!',
      cfg: { rows: [{ parts: 2, filled: 1, fixed: true, name: 'One half' }, { parts: 8, name: 'Eighths' }], goal: (v) => same(v[1], v[0]) },
      solve: (rows) => { rows[1].filled = 4; },
    },
    see: { text: '{1/2} and {4/8} cover the same length, so they are **equivalent fractions**. Each half was cut into 4 smaller pieces.', visual: { kind: 'bars', bars: [{ parts: 2, shaded: 1 }, { parts: 8, shaded: 4 }] } },
    watch: {
      text: 'To make an equivalent fraction, multiply the top and the bottom by the **same number**.',
      steps: ['Start with {2/3}.', 'Cut every third into 4 pieces: the bottom becomes 3 × 4 = 12.', 'The shaded part has 4 times as many pieces too: 2 × 4 = 8.', 'So {2/3} = {8/12}.'],
      visual: { kind: 'bars', bars: [{ parts: 3, shaded: 2 }, { parts: 12, shaded: 8 }] },
    },
    practice(rng) {
      const [a, b] = rng.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]);
      const k = rng.int(2, 4);
      return {
        steps: [`Start with {${a}/${b}}.`, `The bottom changes from ${b} to ${b * k}: that is × ${k}.`, `Multiply the top by ${k} too.`],
        prompt: `{${a}/${b}} = {?/${b * k}}. What is the top number?`,
        answer: num(a * k),
      };
    },
  },

  frac_compare: {
    title: 'Comparing fractions', mentor: 'fern',
    hook: 'Which is more crystal juice: {3/4} of a cup, or {2/3} of a cup? Let us find out.',
    explore: {
      model: 'strips', prompt: 'Shade {3/4} on the top bar and {2/3} on the bottom bar.', success: 'See which one reaches further?',
      cfg: { rows: [{ parts: 4, name: 'Fourths' }, { parts: 3, name: 'Thirds' }], goal: (v) => v[0][0] === 3 && v[1][0] === 2 },
      solve: (rows) => { rows[0].filled = 3; rows[1].filled = 2; },
    },
    see: { text: '{3/4} reaches further than {2/3}, so {3/4} > {2/3}.', visual: { kind: 'bars', bars: [{ parts: 4, shaded: 3 }, { parts: 3, shaded: 2 }] } },
    watch: {
      text: 'Without a picture, give both fractions the **same bottom number**, then compare the tops.',
      steps: ['Compare {3/4} and {2/3}.', '12 is a multiple of both 4 and 3.', '{3/4} = {9/12} and {2/3} = {8/12}.', '9 twelfths is more than 8 twelfths, so {3/4} > {2/3}.'],
    },
    practice(rng) {
      // Pairs whose common bottom number is new for both fractions, so each one has to change.
      const [a, b, c, d] = rng.pick([[2, 3, 3, 4], [3, 5, 1, 2], [5, 6, 3, 4], [1, 3, 2, 5], [3, 8, 1, 3], [2, 5, 1, 2]]);
      const L = lcm(b, d);
      return {
        steps: [`Compare {${a}/${b}} and {${c}/${d}}.`, `${L} is a multiple of both ${b} and ${d}.`, `{${c}/${d}} = {${(c * L) / d}/${L}}.`],
        prompt: `Now write {${a}/${b}} with ${L} on the bottom: {${a}/${b}} = {?/${L}}`,
        answer: num((a * L) / b),
      };
    },
  },

  frac_add_like: {
    title: 'Adding fractions', mentor: 'fern',
    hook: 'Adding fractions is like adding pieces of the same size. Let us try it with crystal bars.',
    explore: {
      model: 'strips', prompt: 'How many eighths are there together? Shade them on the bottom bar.', success: '3 eighths and 2 eighths make 5 eighths!',
      cfg: {
        rows: [{ parts: 8, filled: 3, fixed: true, name: '3 eighths' }, { parts: 8, filled: 2, fixed: true, name: '2 eighths' }, { parts: 8, name: 'Together' }],
        goal: (v) => v[2][0] === 5,
      },
      solve: (rows) => { rows[2].filled = 5; },
    },
    see: { text: '{3/8} + {2/8} = {5/8}. The pieces are still eighths, so the **bottom number stays 8**.', visual: { kind: 'bars', bars: [{ parts: 8, shaded: 3 }, { parts: 8, shaded: 5 }] } },
    watch: {
      text: 'Add the tops. Keep the bottom.',
      steps: ['{4/10} + {3/10}', 'Both are tenths.', '4 tenths + 3 tenths = 7 tenths.', '{4/10} + {3/10} = {7/10}.'],
    },
    practice(rng) {
      const d = rng.pick([5, 6, 8, 10, 12]);
      const a = rng.int(1, d - 2), c = rng.int(1, d - 1 - a);
      return {
        steps: [`{${a}/${d}} + {${c}/${d}}`, `Both have ${d} on the bottom, so the bottom stays ${d}.`],
        prompt: `Add the tops: {${a}/${d}} + {${c}/${d}} = {?/${d}}`,
        answer: num(a + c),
      };
    },
  },

  frac_mixed: {
    title: 'Mixed numbers', mentor: 'fern',
    hook: 'When you have more pieces than fit in one whole, you can say it as wholes and pieces.',
    explore: {
      model: 'strips', prompt: 'Shade {7/4}: seven fourths.', success: 'That is one whole bar and 3 more fourths!',
      cfg: { rows: [{ parts: 4, wholes: 3, name: 'Fourths' }], goal: (v) => v[0][0] === 7 },
      solve: (rows) => { rows[0].filled = 7; },
    },
    see: { text: '{7/4} fills 1 whole and {3/4} more, so {7/4} = {1 3/4}. That is a **mixed number**.', visual: { kind: 'bars', bars: [{ parts: 4, shaded: 4 }, { parts: 4, shaded: 3 }] } },
    watch: {
      text: 'Divide the top by the bottom: the answer is the wholes, the remainder is the pieces left.',
      steps: ['Write {11/4} as a mixed number.', 'How many groups of 4 fit in 11? 11 ÷ 4 = 2 R3.', '2 wholes, and 3 fourths left over.', '{11/4} = {2 3/4}.'],
    },
    practice(rng) {
      const d = rng.pick([3, 4, 5, 6]);
      const w = rng.int(1, 3), r = rng.int(1, d - 1);
      const n = w * d + r;
      return {
        steps: [`Write {${n}/${d}} as a mixed number.`, `${n} ÷ ${d} = ${w} R${r}.`, `So there are ${w} whole${w > 1 ? 's' : ''}.`],
        prompt: `{${n}/${d}} = {${w} ?/${d}}. How many ${d === 3 ? 'thirds' : d === 4 ? 'fourths' : d === 5 ? 'fifths' : 'sixths'} are left over?`,
        answer: num(r),
      };
    },
  },

  frac_times_whole: {
    title: 'A fraction times a whole number', mentor: 'fern',
    hook: 'Each glow potion needs {2/3} of a cup of crystal juice. How much for 4 potions?',
    explore: {
      model: 'strips', prompt: 'Shade 2 thirds for each of the 4 potions.', success: '4 groups of 2 thirds make 8 thirds!',
      cfg: { rows: [{ parts: 3, wholes: 3, name: 'Crystal juice' }], goal: (v) => v[0][0] === 8 },
      solve: (rows) => { rows[0].filled = 8; },
    },
    see: { text: '4 × {2/3} means 4 groups of {2/3}. That is 8 thirds: {8/3} = {2 2/3} cups.' },
    watch: {
      text: 'Multiply the **top** by the whole number. The size of the pieces (the bottom) does not change.',
      steps: ['5 × {3/4}', 'That is 5 groups of 3 fourths.', '5 × 3 = 15 fourths.', '{15/4} = {3 3/4}.'],
    },
    practice(rng) {
      const [a, b] = rng.pick([[1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [1, 6], [5, 6]]);
      const k = rng.int(2, 6);
      return {
        steps: [`${k} × {${a}/${b}}`, `That is ${k} groups of {${a}/${b}}.`, `The bottom stays ${b}.`],
        prompt: `${k} × {${a}/${b}} = {?/${b}}`,
        answer: num(a * k),
      };
    },
  },

  frac_add_unlike: {
    title: 'Adding different-sized pieces', mentor: 'fern',
    hook: 'Can you add {1/2} and {1/3}? The pieces are different sizes, so first we cut them into pieces of the same size.',
    explore: {
      model: 'strips', prompt: 'Shade sixths to show {1/2} and {1/3} together.', success: '{1/2} + {1/3} = {5/6}!',
      cfg: {
        rows: [{ parts: 2, filled: 1, fixed: true, name: 'One half' }, { parts: 3, filled: 1, fixed: true, name: 'One third' }, { parts: 6, name: 'Sixths' }],
        goal: (v) => v[2][0] === 5,
      },
      solve: (rows) => { rows[2].filled = 5; },
    },
    see: { text: '{1/2} = {3/6} and {1/3} = {2/6}. Now the pieces are the same size: {3/6} + {2/6} = {5/6}.', visual: { kind: 'bars', bars: [{ parts: 6, shaded: 3 }, { parts: 6, shaded: 2 }] } },
    watch: {
      text: 'Find a **common denominator**: a bottom number both fractions can change to.',
      steps: ['{1/4} + {2/3}', 'Both 4 and 3 go into 12.', '{1/4} = {3/12} and {2/3} = {8/12}.', '{3/12} + {8/12} = {11/12}.'],
    },
    practice(rng) {
      const [b, d] = rng.pick([[2, 3], [2, 5], [3, 4], [4, 6], [2, 6], [3, 5]]);
      const a = rng.int(1, b - 1), c = rng.int(1, d - 1);
      const L = lcm(b, d), A = (a * L) / b, C = (c * L) / d;
      return {
        steps: [`{${a}/${b}} + {${c}/${d}}`, `Both ${b} and ${d} go into ${L}.`, `{${a}/${b}} = {${A}/${L}} and {${c}/${d}} = {${C}/${L}}.`],
        prompt: `{${A}/${L}} + {${C}/${L}} = {?/${L}}`,
        answer: num(A + C),
      };
    },
  },

  // ------------------------------------------------------------------ decimals (Mama Mittens)
  dec_frac: {
    title: 'Hundredths and decimals', mentor: 'mittens',
    hook: 'Money uses hundredths! One cent is one hundredth of a dollar.',
    explore: { model: 'hundred', prompt: 'Shade 35 hundredths. Each little square is one hundredth.', success: '35 hundredths is written 0.35!', cfg: { target: 35 } },
    see: { text: '{35/100} = 0.35. The first digit after the point counts **tenths** (whole columns), the second counts **hundredths** (single squares).', visual: { kind: 'hundred', tenths: 3, hundredths: 5 } },
    watch: { text: 'Tenths go in the first place after the point.', steps: ['Write {7/10} as a decimal.', '7 tenths: put 7 in the tenths place.', '{7/10} = 0.7.'] },
    practice(rng) {
      const n = rng.int(11, 99);
      return { steps: [`{${n}/100} means ${n} hundredths.`, `${Math.floor(n / 10)} tenths and ${n % 10} hundredths.`], prompt: `Write {${n}/100} as a decimal.`, answer: num(n / 100) };
    },
  },

  dec_hundredths: {
    title: 'Tenths plus hundredths', mentor: 'mittens',
    hook: 'Tenths and hundredths are different-sized pieces. To add them, make them the same size first.',
    explore: { model: 'hundred', prompt: 'Shade 3 tenths (3 whole columns), then 4 more hundredths.', success: '3 tenths and 4 hundredths make 34 hundredths!', cfg: { target: 34 } },
    see: { text: 'One column (a tenth) is 10 hundredths, so {3/10} = {30/100}. Then {30/100} + {4/100} = {34/100}.', visual: { kind: 'hundred', tenths: 3, hundredths: 4 } },
    watch: { text: 'Change the tenths into hundredths, then add.', steps: ['{6/10} + {5/100}', 'Change tenths to hundredths: {6/10} = {60/100}.', '{60/100} + {5/100} = {65/100}.'] },
    practice(rng) {
      const t = rng.int(1, 9), h = rng.int(1, 9);
      return { steps: [`{${t}/10} + {${h}/100}`, `{${t}/10} = {${t * 10}/100}.`], prompt: `{${t * 10}/100} + {${h}/100} = {?/100}`, answer: num(t * 10 + h) };
    },
  },

  dec_compare: {
    title: 'Comparing decimals', mentor: 'mittens',
    hook: 'Is 0.5 more than 0.45? Careful: the longer number is not always the bigger one!',
    explore: { model: 'hundred', prompt: 'Shade 0.5. (Hint: 5 tenths is 5 whole columns.)', success: '0.5 is 50 hundredths, more than 45 hundredths!', cfg: { target: 50 } },
    see: { text: '0.5 = 50 hundredths and 0.45 = 45 hundredths, so 0.5 > 0.45. Compare the **tenths** first.', visual: { kind: 'hundred', tenths: 5, hundredths: 0 } },
    watch: { text: 'Line up the points. If the numbers have different lengths, add a zero at the end.', steps: ['Compare 0.6 and 0.58.', 'Write 0.6 as 0.60, so both have hundredths.', '60 hundredths is more than 58 hundredths.', 'So 0.6 > 0.58.'] },
    practice(rng) {
      const t = rng.int(2, 9);
      return { steps: [`Compare 0.${t} and 0.${t - 1}${rng.int(1, 9)}.`, `Add a zero: 0.${t} = 0.${t}0.`], prompt: `0.${t} is how many hundredths?`, answer: num(t * 10) };
    },
  },

  dec_place: {
    title: 'Decimal place value', mentor: 'mittens',
    hook: 'Every digit has a job that depends on its place. After the point come tenths, hundredths and thousandths.',
    explore: { model: 'place', prompt: 'Tap the digit in the hundredths place.', success: 'The 8 is in the hundredths place: it means 8 hundredths, or 0.08.', cfg: { number: '4.385', target: 2 } },
    see: { text: 'In 4.385: 4 ones, 3 tenths, 8 hundredths, 5 thousandths. Each place is **ten times smaller** than the place to its left.', visual: { kind: 'placeValue', digits: ['4', '3', '8', '5'], whole: 1, highlight: 2 } },
    watch: { text: 'Name each place, starting from the point.', steps: ['What is the 7 worth in 2.075?', 'After the point: 0 tenths, 7 hundredths, 5 thousandths.', 'So the 7 means 7 hundredths = 0.07.'] },
    practice(rng) {
      const d = [rng.int(1, 9), rng.int(1, 9), rng.int(0, 9), rng.int(1, 9)];
      return { steps: [`Look at ${d[0]}.${d[1]}${d[2]}${d[3]}.`, 'The first digit after the point is the tenths place.'], prompt: `Which digit is in the tenths place of ${d[0]}.${d[1]}${d[2]}${d[3]}?`, answer: num(d[1]) };
    },
  },

  // ------------------------------------------------------------------ multiplying and dividing (Captain Flipper)
  mul_2x2: {
    title: 'Multiplying in parts', mentor: 'captain',
    hook: 'Big multiplications get easier in pieces. Let us split 23 × 14 into friendly parts.',
    explore: { model: 'area', prompt: 'Fill in each box, then add them all up.', success: '23 × 14 = 322!', cfg: { a: [20, 3], b: [10, 4] } },
    see: { text: 'Every part of 23 gets multiplied by every part of 14. The four boxes together are the **whole answer**.', visual: { kind: 'area', rows: [20, 3], cols: [10, 4] } },
    watch: { text: 'Split each number into tens and ones.', steps: ['32 × 15: split into 30 + 2 and 10 + 5.', '30 × 10 = 300 and 30 × 5 = 150.', '2 × 10 = 20 and 2 × 5 = 10.', '300 + 150 + 20 + 10 = 480.'] },
    practice(rng) {
      const a = rng.int(2, 4), b = rng.int(1, 9), c = 1, d = rng.int(1, 9);
      const A = a * 10, C = c * 10;
      const parts = [A * C, A * d, b * C, b * d];
      return {
        steps: [`${A + b} × ${C + d}: split into ${A} + ${b} and ${C} + ${d}.`, `${A} × ${C} = ${parts[0]}, ${A} × ${d} = ${parts[1]}, ${b} × ${C} = ${parts[2]}, ${b} × ${d} = ${parts[3]}.`],
        prompt: `Add the parts: ${parts.join(' + ')} = ?`,
        answer: num(parts.reduce((s, x) => s + x, 0)),
      };
    },
  },

  mul_3x2: {
    title: 'Multiplying bigger numbers', mentor: 'captain',
    hook: 'The area trick works for bigger numbers too. There are just more boxes!',
    explore: { model: 'area', prompt: 'Fill in all six boxes, then add them up.', success: '124 × 13 = 1,612!', cfg: { a: [100, 20, 4], b: [10, 3] } },
    see: { text: 'Split 124 into 100 + 20 + 4 and 13 into 10 + 3. Six small multiplications make one big one.', visual: { kind: 'area', rows: [100, 20, 4], cols: [10, 3] } },
    watch: { text: 'Multiply every part by every part, then add.', steps: ['213 × 12: split into 200 + 10 + 3 and 10 + 2.', '200 × 10 = 2000, 10 × 10 = 100, 3 × 10 = 30.', '200 × 2 = 400, 10 × 2 = 20, 3 × 2 = 6.', '2000 + 100 + 30 + 400 + 20 + 6 = 2556.'] },
    practice(rng) {
      const h = rng.int(1, 3) * 100, t = rng.int(1, 4) * 10, o = rng.int(1, 9), d = rng.int(2, 5);
      const parts = [h * 10, t * 10, o * 10, h * d, t * d, o * d];
      return {
        steps: [`${h + t + o} × ${10 + d}: split into ${h} + ${t} + ${o} and 10 + ${d}.`, `The six parts are ${parts.join(', ')}.`],
        prompt: `Add them up: ${parts.join(' + ')} = ?`,
        answer: num(parts.reduce((s, x) => s + x, 0)),
      };
    },
  },

  div_rem: {
    title: 'Sharing with leftovers', mentor: 'captain',
    hook: 'Captain Flipper has 17 fish to share fairly with 5 penguins. Let us share them out.',
    explore: { model: 'share', prompt: 'Give one fish to each penguin, again and again, until there are not enough to go around.', success: 'Each penguin got 3 fish, and 2 are left over. 17 ÷ 5 = 3 R2.', cfg: { total: 17, groups: 5, thing: 'fish' } },
    see: { text: 'The fish left over are the **remainder**. 17 ÷ 5 = 3 R2, because 5 × 3 = 15, and 15 + 2 = 17.' },
    watch: { text: 'Find the biggest multiple that fits, then see what is left.', steps: ['29 ÷ 4', '4 × 7 = 28 fits. 4 × 8 = 32 is too many.', '29 − 28 = 1 left over.', '29 ÷ 4 = 7 R1.'] },
    practice(rng) {
      const k = rng.int(3, 9), q = rng.int(3, 9), r = rng.int(1, k - 1);
      const n = k * q + r;
      return { steps: [`${n} ÷ ${k}`, `${k} × ${q} = ${k * q} fits.`], prompt: `How many are left over? ${n} − ${k * q} = ?`, answer: num(r) };
    },
  },

  multistep: {
    title: 'Two-step problems', mentor: 'captain',
    hook: 'Some problems take two steps. Drawing a picture helps you see both of them.',
    explore: {
      model: 'tape', prompt: 'Mo has 4 buckets with 6 fish each, and then catches 5 more. Build the picture.', success: 'Now you can see every fish!',
      cfg: { unit: 6, count: 4, extra: 5, unitLabel: 'a bucket', extraLabel: 'Add the 5 extra fish' },
    },
    see: { text: 'The picture shows **two steps**: 4 groups of 6, then 5 more.', visual: { kind: 'tape', rows: [{ segs: [6, 6, 6, 6].map((v) => ({ v, label: '6' })).concat([{ v: 5, label: '+5', alt: true }]), totalLabel: '?' }] } },
    watch: { text: 'Do one step at a time.', steps: ['Step 1, the buckets: 4 × 6 = 24.', 'Step 2, the extra fish: 24 + 5 = 29.', 'Mo has 29 fish.'] },
    practice(rng) {
      const a = rng.int(3, 7), b = rng.int(4, 9), c = rng.int(2, 12);
      return { steps: [`${a} boxes of ${b} shells, and ${c} more.`, `Step 1: ${a} × ${b} = ${a * b}.`], prompt: `Step 2: ${a * b} + ${c} = ?`, answer: num(a * b + c) };
    },
  },

  // ------------------------------------------------------------------ geometry (Pebble)
  protractor: {
    title: 'Measuring angles', mentor: 'pebble',
    hook: 'A protractor measures how wide an angle opens. The trick is reading the right row of numbers.',
    explore: { model: 'protractor', prompt: 'Drag the yellow ray to make an angle of 120°.', success: '120° is wider than a square corner!', cfg: { target: 120, from: 'right', start: 30 } },
    see: { text: 'Put the center on the corner and one ray on **0**. Read along the row that starts at that 0.', visual: { kind: 'protractor', deg: 120, from: 'right' } },
    watch: {
      text: 'Check where the first ray points before you read.',
      steps: ['This angle starts on the left.', 'So read the row that starts at 0 on the left.', 'The other ray points to 45: the angle is 45°.', 'The other row says 135. That is the wrong row!'],
      visual: { kind: 'protractor', deg: 45, from: 'left' },
    },
    practice(rng) {
      const d = rng.pick([20, 40, 60, 70, 110, 130, 150]);
      return {
        steps: ['The first ray sits on the 0 on the right.', `The other ray points to ${d} on the row that starts there, and ${180 - d} on the other row.`],
        prompt: 'How many degrees is the angle?',
        answer: num(d),
      };
    },
  },

  volume: {
    title: 'Volume', mentor: 'pebble',
    hook: 'Volume is how many cubes it takes to fill a box. Let us build one!',
    explore: { model: 'cubes', prompt: 'Build a box 4 cubes long, 3 wide and 2 tall.', success: '24 cubes fill the box!', cfg: { l: 4, w: 3, h: 2 } },
    see: { text: 'One layer has 4 × 3 = 12 cubes. Two layers have 12 × 2 = 24. **Volume = length × width × height**.', visual: { kind: 'box3d', l: 4, w: 3, h: 2, unit: 'cm', cubes: true } },
    watch: { text: 'Count one layer, then multiply by the number of layers.', steps: ['A box 5 long, 2 wide and 3 tall.', 'One layer: 5 × 2 = 10 cubes.', '3 layers: 10 × 3 = 30 cubes.', 'The volume is 30 cubic units.'] },
    practice(rng) {
      const l = rng.int(2, 6), w = rng.int(2, 5), h = rng.int(2, 4);
      return { steps: [`A box ${l} long, ${w} wide and ${h} tall.`, `One layer: ${l} × ${w} = ${l * w} cubes.`], prompt: `${h} layers: ${l * w} × ${h} = ?`, answer: num(l * w * h) };
    },
  },

  // ------------------------------------------------------------------ number sense (Scout Skipper)
  order_ops: {
    title: 'Order of operations', mentor: 'skipper',
    hook: 'When a problem has more than one operation, everyone agrees on the order. Otherwise we would all get different answers!',
    explore: {
      model: 'steptap', prompt: 'Tap the operation that comes first, again and again, until only the answer is left.', success: '3 + 4 × 2 − 1 = 10.',
      cfg: { tokens: [3, '+', 4, '×', 2, '−', 1] },
    },
    see: { text: '**Multiply and divide first** (left to right), then **add and subtract** (left to right).' },
    watch: { text: 'Find the × and ÷ first.', steps: ['20 − 6 ÷ 2 + 1', 'Divide first: 6 ÷ 2 = 3.', 'Now 20 − 3 + 1.', 'Left to right: 20 − 3 = 17, then 17 + 1 = 18.'] },
    practice(rng) {
      const a = rng.int(2, 12), b = rng.int(2, 9), c = rng.int(2, 9);
      return { steps: [`${a} + ${b} × ${c}`, `Multiply first: ${b} × ${c} = ${b * c}.`], prompt: `${a} + ${b * c} = ?`, answer: num(a + b * c) };
    },
  },
  // ================================================================== grade 5 (Book 2: The Ember Isles)
  // ------------------------------------------------------------------ fractions (Isa, the reef keeper)
  frac_as_div: {
    title: 'Fractions are division', mentor: 'isa',
    hook: 'Three coconut pies and four hungry friends. How much pie does each friend get?',
    explore: {
      model: 'strips', prompt: 'Give one friend a fair share: tap one quarter from each pie.', success: 'One quarter from each of 3 pies: that friend gets {3/4} of a pie!',
      cfg: { rows: [{ parts: 4, name: 'Pie 1' }, { parts: 4, name: 'Pie 2' }, { parts: 4, name: 'Pie 3' }], goal: (v) => v.every(([f]) => f === 1) },
      solve: (rows) => { for (const r of rows) r.filled = 1; },
    },
    see: { text: 'Sharing 3 pies among 4 friends gives each friend {3/4} of a pie. So **3 ÷ 4 = {3/4}**. Every fraction is a division!', visual: { kind: 'bars', bars: [{ parts: 4, shaded: 1 }, { parts: 4, shaded: 1 }, { parts: 4, shaded: 1 }] } },
    watch: {
      text: 'The top number is what is shared. The bottom number is how many shares.',
      steps: ['Share 5 pizzas among 2 friends.', 'Each friend gets 5 ÷ 2 = {5/2} of a pizza.', '{5/2} is 2 whole pizzas and {1/2} more.', 'So each friend gets {2 1/2} pizzas.'],
    },
    practice(rng) {
      const [a, b] = rng.pick([[2, 3], [3, 5], [4, 5], [5, 6], [3, 8], [5, 8], [7, 10], [2, 7]]);
      return {
        steps: [`Share ${a} pies among ${b} friends.`, `Each friend gets ${a} ÷ ${b} of a pie.`],
        prompt: `Write ${a} ÷ ${b} as a fraction.`,
        answer: frac(new Frac(a, b)),
      };
    },
  },

  frac_of_whole: {
    title: 'A fraction of a number', mentor: 'isa',
    hook: 'Isa counted 12 sea stars on the reef. {2/3} of them are orange. How many orange sea stars is that?',
    explore: {
      model: 'share', prompt: 'Split the 12 sea stars into 3 equal groups.', success: 'Each group has 4. Two of the three groups make {2/3}: 8 sea stars!',
      cfg: { total: 12, groups: 3, thing: 'sea star', groupName: 'Group' },
    },
    see: { text: '{1/3} of 12 means split 12 into 3 equal groups: 4 in each. {2/3} is 2 of those groups: **8**.', visual: { kind: 'tape', rows: [{ segs: [{ v: 4, label: '4' }, { v: 4, label: '4' }, { v: 4, label: '4', alt: true }], totalLabel: '12' }] } },
    watch: {
      text: 'To find a fraction of a number: **divide by the bottom**, then **multiply by the top**.',
      steps: ['Find {3/4} of 20.', 'Divide by the bottom: 20 ÷ 4 = 5. That is {1/4} of 20.', 'Multiply by the top: 3 × 5 = 15.', 'So {3/4} of 20 is 15.'],
    },
    practice(rng) {
      const b = rng.int(3, 6), a = rng.int(2, b - 1), unit = rng.int(2, 9), n = b * unit;
      return {
        steps: [`Find {${a}/${b}} of ${n}.`, `Divide by the bottom: ${n} ÷ ${b} = ${unit}.`],
        prompt: `Now multiply by the top. What is {${a}/${b}} of ${n}?`,
        answer: num(a * unit),
      };
    },
  },

  frac_scale: {
    title: 'Does it grow or shrink?', mentor: 'isa',
    hook: 'When you multiply, does the answer always get bigger? Not always! Let us test it with jumps.',
    explore: {
      model: 'jumps', prompt: 'Each jump is {3/4}. Jump 8 times. Do you land before 8 or after it?', success: '8 jumps of {3/4} land on 6, before 8. Multiplying 8 by less than 1 made it smaller!',
      cfg: { max: 9, den: 4, jump: [3, 4], target: [6, 1] },
    },
    see: { text: 'Multiplying by a number **less than 1** makes it smaller. By **more than 1**, bigger. By exactly 1, it stays the same.', visual: { kind: 'numline', min: 0, max: 12, step: 1, marks: [{ v: 6, label: '¾ × 8' }, { v: 10, label: '1¼ × 8' }] } },
    watch: {
      text: 'You can tell before you multiply: just compare the fraction with 1.',
      steps: ['Look at {5/4} × 8.', '{5/4} is more than 1 (it is 1 and {1/4}).', 'So {5/4} × 8 is more than 8.', 'Check: {5/4} × 8 = 10, and 10 is more than 8.'],
    },
    practice(rng) {
      const b = rng.pick([3, 4, 5, 6]), a = rng.int(1, b - 1), k = rng.int(2, 6), n = b * k;
      return {
        steps: [`{${a}/${b}} is less than 1, so {${a}/${b}} × ${n} is less than ${n}.`, `${n} ÷ ${b} = ${k}.`],
        prompt: `Now multiply by ${a}. What is {${a}/${b}} × ${n}?`,
        answer: num(a * k),
      };
    },
  },

  frac_mult: {
    title: 'Multiplying fractions', mentor: 'isa',
    hook: 'Isa plants new coral in {2/3} of her garden, and puts sea fans in {3/4} of that part. How much of the whole garden has both?',
    explore: {
      model: 'fracgrid', prompt: 'Shade {2/3} of the rows (left bar) and {3/4} of the columns (top bar).', success: 'They overlap in 6 of 12 boxes: {2/3} × {3/4} = {6/12}!',
      cfg: { rows: 3, cols: 4, goalRows: 2, goalCols: 3 },
    },
    see: { text: 'The overlap is the answer: 2 × 3 = 6 boxes are shaded twice, out of 3 × 4 = 12. So {2/3} × {3/4} = {6/12}, which is {1/2}.', visual: { kind: 'fracgrid', rows: 3, cols: 4, rowsShaded: 2, colsShaded: 3 } },
    watch: {
      text: 'No picture needed: **multiply the tops**, then **multiply the bottoms**.',
      steps: ['Find {1/2} × {3/5}.', 'Tops: 1 × 3 = 3.', 'Bottoms: 2 × 5 = 10.', 'So {1/2} × {3/5} = {3/10}.'],
    },
    practice(rng) {
      const [a, b, c, d] = rng.pick([[1, 2, 3, 4], [2, 3, 1, 5], [3, 4, 2, 5], [1, 3, 5, 6], [2, 5, 3, 4], [3, 5, 1, 2]]);
      return {
        steps: [`Find {${a}/${b}} × {${c}/${d}}.`, `Tops: ${a} × ${c} = ${a * c}.`],
        prompt: `Now the bottoms. {${a}/${b}} × {${c}/${d}} = {${a * c}/?}. What is the bottom number?`,
        answer: num(b * d),
      };
    },
  },

  frac_div_unit: {
    title: 'Dividing by a unit fraction', mentor: 'isa',
    hook: 'Each scoop holds {1/3} of a cup of seaweed seeds. How many scoops fill 2 cups?',
    explore: {
      model: 'jumps', prompt: 'Jump {1/3} at a time. How many jumps reach 2?', success: '6 jumps! 2 ÷ {1/3} = 6.',
      cfg: { max: 3, den: 3, jump: [1, 3], target: [2, 1] },
    },
    see: { text: 'Dividing by {1/3} asks: **how many thirds fit?** Each whole holds 3 thirds, so 2 wholes hold 6. 2 ÷ {1/3} = 6.', visual: { kind: 'bars', bars: [{ parts: 3, shaded: 3 }, { parts: 3, shaded: 3 }] } },
    watch: {
      text: 'Going the other way, dividing a fraction by a whole number shares it out.',
      steps: ['Find {1/4} ÷ 2: share {1/4} of a pan between 2 friends.', 'Cut the quarter into 2 equal pieces.', 'Each piece is {1/8} of the whole pan.', 'So {1/4} ÷ 2 = {1/8}.'],
      visual: { kind: 'bars', bars: [{ parts: 4, shaded: 1 }, { parts: 8, shaded: 1 }] },
    },
    practice(rng) {
      const w = rng.int(2, 5), k = rng.int(2, 5);
      return {
        steps: [`Find ${w} ÷ {1/${k}}.`, `Each whole holds ${k} pieces that are {1/${k}}.`],
        prompt: `How many {1/${k}} pieces fit in ${w} wholes?`,
        answer: num(w * k),
      };
    },
  },

  frac_div: {
    title: 'Dividing fractions', mentor: 'isa',
    hook: 'How many {1/4}-cup scoops of rice are in {3/2} cups? Fractions can divide fractions too!',
    explore: {
      model: 'jumps', prompt: 'Jump {1/4} at a time until you reach {3/2}. Count the jumps.', success: '6 jumps of {1/4} make {3/2}. So {3/2} ÷ {1/4} = 6.',
      cfg: { max: 2, den: 4, jump: [1, 4], target: [3, 2] },
    },
    see: { text: 'Dividing by a fraction asks how many of it fit. A shortcut: **flip the second fraction and multiply**. {3/2} × {4/1} = {12/2} = 6.' },
    watch: {
      text: 'Keep the first fraction, flip the second, multiply.',
      steps: ['Find {2/3} ÷ {1/6}.', 'Flip the second fraction: {1/6} becomes {6/1}.', 'Multiply: {2/3} × {6/1} = {12/3}.', '{12/3} = 4, so {2/3} ÷ {1/6} = 4.'],
    },
    practice(rng) {
      const [a, b, c, d] = rng.pick([[1, 2, 1, 4], [3, 4, 1, 8], [2, 3, 1, 6], [5, 6, 1, 12], [3, 2, 1, 4], [4, 3, 1, 6]]);
      const top = a * d, bottom = b * c;
      return {
        steps: [`Find {${a}/${b}} ÷ {${c}/${d}}.`, `Flip and multiply: {${a}/${b}} × {${d}/${c}} = {${top}/${bottom}}.`],
        prompt: `What is {${top}/${bottom}} as a whole number?`,
        answer: num(top / bottom),
      };
    },
  },

  // ------------------------------------------------------------------ decimals and place value (Chef Marlo)
  place_ten: {
    title: 'Each place is ten times the next', mentor: 'marlo',
    hook: 'Chef Marlo pours mango juice into bottles that hold 0.35 liters. How much do ten bottles hold?',
    explore: {
      model: 'slide', prompt: 'Press × 10 to find ten bottles of 0.35 liters.', success: '0.35 × 10 = 3.5. Every digit slid one place to the left!',
      cfg: { start: '0.35', target: '3.5' },
    },
    see: { text: 'Each place is worth **10 times** the place to its right. So × 10 slides every digit one place left, and ÷ 10 slides it one place right.' },
    watch: {
      text: 'Look at the same digit in different places.',
      steps: ['In 444, the first 4 is worth 400.', 'The next 4 is worth 40: that is {1/10} of 400.', 'The last 4 is worth 4: that is {1/10} of 40.', 'Each place is worth 10 times the place to its right.'],
    },
    practice(rng) {
      const n = rng.int(11, 99);
      const x = (n / 100).toFixed(2);
      return {
        steps: [`Start with ${x}.`, '× 10 slides every digit one place to the left.'],
        prompt: `What is 10 × ${x}?`,
        answer: num(new Frac(n, 10)),
      };
    },
  },

  pow10: {
    title: 'Multiplying by 10, 100 and 1,000', mentor: 'marlo',
    hook: 'Chef Marlo is making 1,000 times her salt recipe of 0.004 kilograms. The place-value slide makes it easy.',
    explore: {
      model: 'slide', prompt: 'Press × 10 until you have 1,000 times as much. How many presses does it take?', success: 'Three presses! × 1,000 slides each digit 3 places, because 1,000 = 10 × 10 × 10.',
      cfg: { start: '0.004', target: '4' },
    },
    see: { text: '× 100 slides the digits 2 places left. × 1,000 slides them 3 places. **Count the zeros**: that is how many places to slide.' },
    watch: {
      text: 'Dividing slides the other way.',
      steps: ['Find 2.5 ÷ 100.', '100 has 2 zeros, so slide 2 places to the right.', '2.5 → 0.25 → 0.025.', 'So 2.5 ÷ 100 = 0.025.'],
    },
    practice(rng) {
      const n = rng.int(11, 99);
      const x = (n / 10).toFixed(1);
      return {
        steps: [`Find ${x} × 100.`, '100 has 2 zeros: slide the digits 2 places to the left.'],
        prompt: `What is ${x} × 100?`,
        answer: num(n * 10),
      };
    },
  },

  dec_round: {
    title: 'Rounding decimals', mentor: 'marlo',
    hook: 'A coconut weighs 2.37 kilograms. Is that closer to 2.3 or to 2.4?',
    explore: {
      model: 'numberline', prompt: 'Drag the marker to 2.37. Which end is it closer to?', success: '2.37 is past the halfway point, 2.35. It rounds up to 2.4!',
      cfg: { min: 2.3, max: 2.4, den: 100, decimal: true, major: 5, target: [237, 100] },
    },
    see: { text: 'To round to the nearest tenth, look at the **hundredths** digit. 5 or more rounds up; less than 5 stays.', visual: { kind: 'numline', min: 2.3, max: 2.4, step: 0.01, places: 2, marks: [{ v: 2.37, label: '2.37' }] } },
    watch: {
      text: 'The next digit to the right decides.',
      steps: ['Round 6.82 to the nearest tenth.', 'It is between 6.8 and 6.9.', 'The hundredths digit is 2, which is less than 5.', 'So 6.82 rounds to 6.8.'],
    },
    practice(rng) {
      const w = rng.int(1, 9), t = rng.int(0, 8), h = rng.int(1, 9);
      const x = `${w}.${t}${h}`;
      const lo = `${w}.${t}`, hi = (w + (t + 1) / 10).toFixed(1);
      return {
        steps: [`Round ${x} to the nearest tenth.`, `It is between ${lo} and ${hi}.`, `The hundredths digit is ${h}.`],
        prompt: `What is ${x} rounded to the nearest tenth?`,
        answer: num(new Frac(w * 10 + t + (h >= 5 ? 1 : 0), 10)),
      };
    },
  },

  dec_addsub: {
    title: 'Adding and subtracting decimals', mentor: 'marlo',
    hook: 'Chef Marlo pours 0.45 liters of juice, then 0.3 liters more. How much juice is that?',
    explore: {
      model: 'hundred', prompt: '45 hundredths are shaded. Shade 3 more tenths: that is 3 more whole columns.', success: '0.45 + 0.3 = 0.75!',
      cfg: { start: 45, target: 75 },
    },
    see: { text: 'Tenths add to tenths, hundredths to hundredths. **Line up the decimal points**: 0.45 + 0.30 = 0.75.', visual: { kind: 'hundred', tenths: 7, hundredths: 5 } },
    watch: {
      text: 'Write zeros so both numbers have the same number of places, then work like whole numbers.',
      steps: ['Find 3.6 − 1.25.', 'Line up the points: 3.60 − 1.25.', 'Subtract like whole numbers: 360 − 125 = 235.', 'Put the point back: 2.35.'],
    },
    practice(rng) {
      const A = rng.int(12, 99), B = rng.int(11, 99);
      const a = (A / 10).toFixed(1), b = (B / 100).toFixed(2);
      return {
        steps: [`Find ${a} + ${b}.`, `Line up the points: ${(A / 10).toFixed(2)} + ${b}.`],
        prompt: `What is ${a} + ${b}?`,
        answer: num(new Frac(A * 10 + B, 100)),
      };
    },
  },

  dec_compare3: {
    title: 'Comparing to thousandths', mentor: 'marlo',
    hook: 'Two shells weigh 0.45 kilograms and 0.405 kilograms. The second number is longer. Is it heavier?',
    explore: {
      model: 'rows2', prompt: 'Tap the first place, from the left, where the digits are different.', success: 'In the hundredths place, 5 beats 0. So 0.45 is heavier, even though 0.405 has more digits!',
      cfg: { a: '0.45', b: '0.405' },
    },
    see: { text: 'Give both numbers the same number of places: 0.450 and 0.405. Then compare place by place **from the left**. More digits does not mean bigger!' },
    watch: {
      text: 'Compare the biggest places first.',
      steps: ['Compare 3.09 and 3.1.', 'Write them as 3.09 and 3.10.', 'The ones match (3 and 3). Tenths: 0 and 1.', '1 tenth is more than 0 tenths, so 3.1 is greater.'],
    },
    practice(rng) {
      const a = rng.int(1, 9), b = rng.int(1, 9);
      return {
        steps: [`Compare 0.${a}${b} and 0.${a}0${b}.`, `Write them with three places: 0.${a}${b}0 and 0.${a}0${b}.`],
        prompt: `Which is greater: 0.${a}${b} or 0.${a}0${b}? Type it.`,
        answer: num(new Frac(a * 10 + b, 100)),
      };
    },
  },

  // ------------------------------------------------------------------ multiply and divide (Rocco, at the Lava Forge)
  div_2digit: {
    title: 'Dividing by 2-digit numbers', mentor: 'rocco',
    hook: 'Rocco has 816 glass beads to pack in bags of 24. How many bags? Big division gets easy in friendly chunks.',
    explore: {
      model: 'area', prompt: 'Rocco guesses 30 bags, then 4 more. Fill in each box to check that they use all 816 beads.', success: '720 + 96 = 816. So 816 ÷ 24 = 30 + 4 = 34 bags!',
      cfg: { a: [30, 4], b: [24] },
    },
    see: { text: 'Division undoes multiplication. Build the answer in chunks: 30 bags use 720 beads, 4 more bags use 96. **30 + 4 = 34**.' },
    watch: {
      text: 'Try a friendly multiple of 10 first, then use up the rest.',
      steps: ['Find 672 ÷ 16.', 'Try 16 × 40 = 640. That leaves 672 − 640 = 32.', '16 × 2 = 32 uses up the rest.', '40 + 2 = 42, so 672 ÷ 16 = 42.'],
    },
    practice(rng) {
      const d = rng.int(12, 25), t = rng.int(2, 4), o = rng.int(1, 9), q = t * 10 + o, n = d * q;
      return {
        steps: [`Find ${n} ÷ ${d}.`, `Try ${d} × ${t * 10} = ${d * t * 10}. That leaves ${n - d * t * 10}.`, `${d} × ${o} = ${d * o} uses up the rest.`],
        prompt: `So what is ${n} ÷ ${d}?`,
        answer: num(q),
      };
    },
  },

  long_div: {
    title: 'Long division', mentor: 'rocco',
    hook: 'The forge made 1,722 bolts for crates of 14. Long division handles big numbers one place at a time.',
    explore: {
      model: 'area', prompt: 'Rocco fills 100 crates, then 20, then 3. Fill in each box to check they hold all 1,722 bolts.', success: '1,400 + 280 + 42 = 1,722. So 1,722 ÷ 14 = 123!',
      cfg: { a: [100, 20, 3], b: [14] },
    },
    see: { text: 'Long division does the same chunks in order, biggest place first: **divide, multiply, subtract, bring down**.' },
    watch: {
      text: 'One place at a time, from the left.',
      steps: ['Find 1,722 ÷ 14.', '17 ÷ 14 = 1. 17 − 14 = 3. Bring down the 2: 32.', '32 ÷ 14 = 2. 32 − 28 = 4. Bring down the 2: 42.', '42 ÷ 14 = 3. Nothing left, so 1,722 ÷ 14 = 123.'],
    },
    practice(rng) {
      const d = rng.int(12, 19), q = rng.int(112, 299), n = d * q;
      const h = Math.floor(q / 100), rest = q - h * 100;
      return {
        steps: [`Find ${n.toLocaleString('en-US')} ÷ ${d}.`, `${d} × ${h * 100} = ${(d * h * 100).toLocaleString('en-US')}. That leaves ${(n - d * h * 100).toLocaleString('en-US')}.`, `${d} × ${rest} = ${(d * rest).toLocaleString('en-US')} uses up the rest.`],
        prompt: `So what is ${n.toLocaleString('en-US')} ÷ ${d}?`,
        answer: num(q),
      };
    },
  },

  mul_dec: {
    title: 'Multiplying decimals', mentor: 'rocco',
    hook: 'A glass tile is 0.3 meters by 0.4 meters. What is its area? Tenths times tenths make something smaller.',
    explore: {
      model: 'fracgrid', prompt: 'Shade 0.3 of the rows (left bar) and 0.4 of the columns (top bar).', success: 'The overlap is 12 of 100 squares: 0.3 × 0.4 = 0.12!',
      cfg: { rows: 10, cols: 10, goalRows: 3, goalCols: 4, decimal: true },
    },
    see: { text: 'Tenths times tenths make **hundredths**. 3 × 4 = 12, so the answer is 12 hundredths: 0.12.', visual: { kind: 'fracgrid', rows: 10, cols: 10, rowsShaded: 3, colsShaded: 4 } },
    watch: {
      text: 'Multiply like whole numbers, then count the decimal places.',
      steps: ['Find 2.4 × 0.3.', 'Multiply like whole numbers: 24 × 3 = 72.', '2.4 has 1 decimal place and 0.3 has 1: that makes 2.', 'Put 2 places back: 0.72.'],
    },
    practice(rng) {
      let A = rng.int(11, 49);
      if (A % 10 === 0) A += 1;
      const B = rng.int(2, 9);
      const a = (A / 10).toFixed(1), b = (B / 10).toFixed(1);
      return {
        steps: [`Find ${a} × ${b}.`, `${A} × ${B} = ${A * B}.`, 'Count the decimal places: 1 + 1 = 2.'],
        prompt: `What is ${a} × ${b}?`,
        answer: num(new Frac(A * B, 100)),
      };
    },
  },

  div_dec: {
    title: 'Dividing by a decimal', mentor: 'rocco',
    hook: 'A glass rod 1.2 meters long is cut into pieces 0.3 meters long. How many pieces?',
    explore: {
      model: 'jumps', prompt: 'Jump 0.3 at a time. How many jumps reach 1.2?', success: '4 jumps! 1.2 ÷ 0.3 = 4.',
      cfg: { max: 2, den: 10, jump: [3, 10], target: [12, 10], decimal: true },
    },
    see: { text: 'Dividing by 0.3 asks how many 0.3s fit. Multiply **both** numbers by 10 and it becomes 12 ÷ 3 = 4. Same answer!' },
    watch: {
      text: 'Make the number you divide by a whole number.',
      steps: ['Find 4.5 ÷ 0.5.', 'Multiply both numbers by 10: 45 ÷ 5.', '45 ÷ 5 = 9.', 'So 4.5 ÷ 0.5 = 9.'],
    },
    practice(rng) {
      const dv = rng.int(2, 5), q = rng.int(2, 9);
      const top = ((dv * q) / 10).toFixed(1), bottom = (dv / 10).toFixed(1);
      return {
        steps: [`Find ${top} ÷ ${bottom}.`, `Multiply both by 10: ${dv * q} ÷ ${dv}.`],
        prompt: `What is ${top} ÷ ${bottom}?`,
        answer: num(q),
      };
    },
  },

  // ------------------------------------------------------------------ geometry (Tortuga, the old navigator)
  coord: {
    title: 'Coordinates', mentor: 'tortuga',
    hook: 'Tortuga reads the sea like a map. Every spot has two numbers: how far across, then how far up.',
    explore: {
      model: 'plot', prompt: 'Mark the sunken chest at (3, 5): go 3 across, then 5 up.', success: '(3, 5): across first, then up!',
      cfg: { n: 8, targets: [[3, 5]] },
    },
    see: { text: 'In **(3, 5)**, the first number is x (across) and the second is y (up). (5, 3) is a different place!', visual: { kind: 'grid', lo: 0, hi: 6, points: [{ x: 3, y: 5, icon: 'star' }, { x: 5, y: 3, icon: 'fish' }] } },
    watch: {
      text: 'Always start at (0, 0), the corner where the lines meet.',
      steps: ['Find the shell at (4, 2).', 'Start at (0, 0).', 'Go 4 across.', 'Go 2 up. That is where the shell is.'],
    },
    practice(rng) {
      const x = rng.int(1, 6), y = rng.int(1, 6), k = rng.int(2, 4);
      return {
        steps: [`Buoy A is at (${x}, ${y}).`, `Buoy B is ${k} squares to the right of A, so B goes ${k} further across.`],
        prompt: `What is the first number (x) for buoy B?`,
        answer: num(x + k),
      };
    },
  },

  volume_composite: {
    title: 'Volume of joined boxes', mentor: 'tortuga',
    hook: 'The temple steps are two stone boxes joined together. How much stone is in them?',
    explore: {
      model: 'cubes', prompt: 'Build box A first: 4 long, 2 wide and 2 tall.', success: 'Box A holds 16 cubes. Find box B the same way, then add the two!',
      cfg: { l: 4, w: 2, h: 2 },
    },
    see: { text: 'Split the shape into boxes. **Find each volume, then add**: 16 + 12 = 28 cubic meters.', visual: { kind: 'boxes', a: { l: 4, h: 2 }, b: { l: 2, h: 3 }, w: 2, unit: 'm' } },
    watch: {
      text: 'Each box is length × width × height.',
      steps: ['Box A is 3 × 2 × 4 = 24 cubic meters.', 'Box B is 5 × 2 × 2 = 20 cubic meters.', 'Add them: 24 + 20 = 44 cubic meters.'],
    },
    practice(rng) {
      const w = rng.int(2, 3), la = rng.int(2, 5), ha = rng.int(2, 5), lb = rng.int(2, 5), hb = rng.int(1, 4);
      const Va = la * w * ha, Vb = lb * w * hb;
      return {
        steps: [`Box A: ${la} × ${w} × ${ha} = ${Va}.`, `Box B: ${lb} × ${w} × ${hb} = ${Vb}.`],
        prompt: 'What is the total volume?',
        answer: num(Va + Vb),
      };
    },
  },

  convert5: {
    title: 'Metric conversions', mentor: 'tortuga',
    hook: 'Tortuga swam 2.5 kilometers today. How many meters is that?',
    explore: {
      model: 'slide', prompt: '1 kilometer is 1,000 meters. Press × 10 three times.', success: '2.5 kilometers = 2,500 meters. Three slides for 1,000!',
      cfg: { start: '2.5', target: '2500' },
    },
    see: { text: 'Metric units grow by 10, 100 or 1,000. Big units to small: **multiply** (slide left). Small units to big: **divide** (slide right).' },
    watch: {
      text: 'Ask: are you going to bigger units or smaller ones?',
      steps: ['Change 450 centimeters to meters.', '100 centimeters make 1 meter.', 'Small units to big units: divide by 100.', '450 ÷ 100 = 4.5 meters.'],
    },
    practice(rng) {
      const n = rng.int(11, 99);
      const x = (n / 10).toFixed(1);
      return {
        steps: [`Change ${x} meters to centimeters.`, '1 meter is 100 centimeters, so multiply by 100.'],
        prompt: `How many centimeters is ${x} meters?`,
        answer: num(n * 10),
      };
    },
  },

  shape_hierarchy: {
    title: 'Shape families', mentor: 'tortuga',
    hook: 'Shapes come in families, like turtles and tortoises. A square belongs to more than one!',
    explore: {
      model: 'tags', prompt: 'Tap every family name this square belongs to.', success: 'A square is a quadrilateral, a parallelogram, a rectangle, a rhombus AND a square!',
      cfg: { shape: 'square', tags: ['quadrilateral', 'parallelogram', 'rectangle', 'rhombus', 'square', 'trapezoid', 'triangle'], correct: ['quadrilateral', 'parallelogram', 'rectangle', 'rhombus', 'square'] },
    },
    see: { text: 'Each family has rules. A square follows them all: 4 sides (**quadrilateral**), 2 pairs of parallel sides (**parallelogram**), 4 right angles (**rectangle**) and 4 equal sides (**rhombus**).', visual: { kind: 'shape', name: 'square' } },
    watch: {
      text: 'Check the rules one family at a time.',
      steps: ['Is every rectangle a square?', 'A square needs 4 equal sides.', 'A long, thin rectangle does not have 4 equal sides.', 'So a rectangle is only SOMETIMES a square.'],
    },
    practice(rng) {
      const q = rng.pick([
        { s: 'rhombus', n: 3, steps: ['A rhombus has 4 sides: a quadrilateral.', 'Its opposite sides are parallel: a parallelogram.', 'It has 4 equal sides: a rhombus. It does not need right angles.'] },
        { s: 'rectangle', n: 3, steps: ['A rectangle has 4 sides: a quadrilateral.', 'Its opposite sides are parallel: a parallelogram.', 'It has 4 right angles: a rectangle. Its sides do not all need to be equal.'] },
        { s: 'square', n: 4, steps: ['A square has 4 sides, parallel opposite sides, 4 right angles and 4 equal sides.'] },
      ]);
      return {
        steps: q.steps,
        prompt: `How many of these families does a ${q.s} always belong to: quadrilateral, parallelogram, rectangle, rhombus?`,
        answer: num(q.n),
      };
    },
  },

  // ------------------------------------------------------------------ expressions and patterns (Keeper Lumi)
  expr_read: {
    title: 'Writing expressions', mentor: 'lumi',
    hook: 'The lighthouse lamps flash in codes. Keeper Lumi writes the codes as expressions, and the parentheses matter!',
    explore: {
      model: 'paren', prompt: 'Lumi wants to "add 8 and 7, then multiply by 2". Tap 8, then 7, to put them in parentheses.', success: '(8 + 7) × 2 = 30. Without parentheses, 8 + 7 × 2 would be 22!',
      cfg: { tokens: [8, '+', 7, '×', 2], target: [0, 2] },
    },
    see: { text: 'Parentheses say **do this first**. "Add 8 and 7, then multiply by 2" is written (8 + 7) × 2.' },
    watch: {
      text: 'The step the words do first goes in parentheses.',
      steps: ['Write: subtract 3 from 10, then multiply by 4.', 'Subtracting comes first, so it goes in parentheses: (10 − 3).', 'Then multiply: (10 − 3) × 4.', 'Its value is 7 × 4 = 28.'],
    },
    practice(rng) {
      const a = rng.int(3, 12), b = rng.int(2, 9), c = rng.int(2, 5);
      return {
        steps: [`Write: add ${a} and ${b}, then multiply by ${c}.`, `The expression is (${a} + ${b}) × ${c}.`],
        prompt: 'What is its value?',
        answer: num((a + b) * c),
      };
    },
  },

  patterns2: {
    title: 'Two patterns side by side', mentor: 'lumi',
    hook: 'Two lamps blink in patterns. Lamp A adds 2 each night and lamp B adds 4. How are they related?',
    explore: {
      model: 'plot', prompt: 'Plot the pairs (A, B): (0, 0), (2, 4), (4, 8) and (6, 12).', success: 'They line up! Each B is 2 times its A.',
      cfg: { n: 12, targets: [[0, 0], [2, 4], [4, 8], [6, 12]], line: true },
    },
    see: { text: 'Pair the matching terms as (A, B). Each B is **2 times** its A, so the points make a straight line.' },
    watch: {
      text: 'Line the patterns up and compare matching terms.',
      steps: ['Pattern A: 0, 3, 6, 9.', 'Pattern B: 0, 6, 12, 18.', 'Pairs: (0, 0), (3, 6), (6, 12), (9, 18).', 'Each B is 2 times its A.'],
    },
    practice(rng) {
      const a = rng.int(2, 5), m = rng.int(2, 4), b = a * m;
      return {
        steps: [`A: 0, ${a}, ${2 * a}, ${3 * a}.`, `B: 0, ${b}, ${2 * b}, ${3 * b}.`],
        prompt: 'Each B number is how many times its A number?',
        answer: num(m),
      };
    },
  },

  exponents: {
    title: 'Exponents', mentor: 'lumi',
    hook: 'Lumi\'s lamp doubles its brightness every second: 2 × 2 × 2 × 2... There is a short way to write that!',
    explore: {
      model: 'steptap', prompt: '3^4 means four 3s multiplied together. Tap each × to multiply.', success: '3 × 3 × 3 × 3 = 81, so 3^4 = 81!',
      cfg: { tokens: [3, '×', 3, '×', 3, '×', 3] },
    },
    see: { text: '**3^4** means 3 × 3 × 3 × 3. The small number says how many times to use 3 as a factor. It is NOT 3 × 4.' },
    watch: {
      text: 'Multiply one factor at a time.',
      steps: ['Find 2^5.', '2 × 2 = 4.', '4 × 2 = 8, then 8 × 2 = 16.', '16 × 2 = 32, so 2^5 = 32.'],
    },
    practice(rng) {
      const b = rng.int(2, 5), e = b === 2 ? rng.int(3, 5) : rng.int(2, 3);
      const sq = b * b;
      return {
        steps: [`Find ${b}^${e}.`, `${b} × ${b} = ${sq}.`],
        prompt: `Keep multiplying by ${b}. What is ${b}^${e}?`,
        answer: num(b ** e),
      };
    },
  },

  // ------------------------------------------------------------------ data (the Professor)
  line_plot_frac: {
    title: 'Sharing it out evenly', mentor: 'professor',
    hook: 'The Professor has 4 cups of juice: {1/4}, {1/2}, {1/4} and 1 liter. If he pours them out evenly, how much is in each cup?',
    explore: {
      model: 'level', prompt: 'Each block is {1/4} liter. Move blocks until every cup has the same.', success: 'Every cup gets 2 quarters: {1/2} liter each!',
      cfg: { heights: [1, 2, 1, 4], unit: 'quarter-liters', names: ['¼ L', '½ L', '¼ L', '1 L'] },
    },
    see: { text: 'Leveling out is **sharing equally**: add up all the juice (2 liters), then divide by the number of cups (4). Each cup gets {1/2} liter.' },
    watch: {
      text: 'Add everything, then divide by how many.',
      steps: ['Cups hold {1/8}, {3/8}, {3/8} and {5/8} liter.', 'Total: {12/8} liters.', 'Share among 4 cups: {12/8} ÷ 4 = {3/8}.', 'Each cup would hold {3/8} liter.'],
    },
    practice(rng) {
      const each = rng.int(2, 5), n = 4;
      const xs = [each - 1, each + 1, each - 1, each + 1].map((v, i) => v + (i === 0 ? rng.int(0, 1) : 0));
      const total = xs.reduce((a, b) => a + b, 0);
      return {
        steps: [`Cups hold ${xs.map((v) => `{${v}/8}`).join(', ')} liter.`, `Total: {${total}/8} liters.`],
        prompt: `Share it among ${n} cups. How much is in each cup?`,
        answer: frac(new Frac(total, 8 * n)),
      };
    },
  },

  mean: {
    title: 'The mean is a fair share', mentor: 'professor',
    hook: 'Four friends caught 3, 7, 4 and 6 fish. If they shared them all evenly, how many would each get?',
    explore: {
      model: 'level', prompt: 'Move fish from the tall towers to the short ones until every tower is the same.', success: 'Every friend gets 5. The mean is 5!',
      cfg: { heights: [3, 7, 4, 6], unit: 'fish', names: ['Isa', 'Kai', 'Nori', 'Rocco'] },
    },
    see: { text: 'The **mean** is the fair share: add them all up, then divide by how many. (3 + 7 + 4 + 6) ÷ 4 = 20 ÷ 4 = 5.' },
    watch: {
      text: 'Add, then divide.',
      steps: ['Find the mean of 8, 2, 6 and 4.', 'Add them: 8 + 2 + 6 + 4 = 20.', 'There are 4 numbers.', '20 ÷ 4 = 5, so the mean is 5.'],
    },
    practice(rng) {
      const m = rng.int(4, 9), d = rng.int(1, 2);
      const xs = [m - d, m + d, m - 2 * d + 1, m + 2 * d - 1];
      const sum = xs.reduce((a, b) => a + b, 0);
      return {
        steps: [`Find the mean of ${xs.join(', ')}.`, `Add them: ${xs.join(' + ')} = ${sum}.`],
        prompt: `Divide by how many numbers there are. What is the mean?`,
        answer: num(sum / xs.length),
      };
    },
  },
};

// Lessons for these skills start automatically the first time the skill comes up (ideas above the
// child's grade); every other lesson starts after a first struggle, and all of them can be replayed.
export const lessonFor = (skillId) => LESSONS[skillId] ?? null;

// The grade 6 lessons live in their own file.
Object.assign(LESSONS, LESSONS6);
