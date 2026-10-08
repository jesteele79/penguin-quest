// Short lessons that teach an idea before (or after struggling with) its practice. Pure data, so they
// can be checked in Node. Each follows the concrete-pictures-numbers sequence:
//   hook      a friend's reason to care, one or two sentences
//   explore   a hands-on model with a goal (see ui/manip.js); no wrong answers, just "not yet"
//   see       the same idea as a picture with words
//   watch     a worked example, revealed one step at a time
//   practice  a fresh example with its last step left for the child (a faded worked example)
// Markup: {3/4} is a fraction, {2 1/4} a mixed number, **bold** is a key word.
import { num } from './build.js';
import { lcm } from './frac.js';

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
    see: { text: 'Put the centre on the corner and one ray on **0**. Read along the row that starts at that 0.', visual: { kind: 'protractor', deg: 120, from: 'right' } },
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
};

// Lessons for these skills start automatically the first time the skill comes up (ideas above the
// child's grade); every other lesson starts after a first struggle, and all of them can be replayed.
export const lessonFor = (skillId) => LESSONS[skillId] ?? null;
