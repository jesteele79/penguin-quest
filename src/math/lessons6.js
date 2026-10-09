// Grade 6 lessons, taught by the friends of Skyreach. Same shape and rules as lessons.js: hook, a hands-on
// explore (models in ui/manip6.js and ui/manip.js), a picture to see, a worked example to watch, and a
// faded example to finish.
import { num } from './build.js';

const sg = (v) => (v < 0 ? `−${-v}` : String(v));
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

export const LESSONS6 = {
  // ------------------------------------------------------------------ ratios, rates and percents
  ratio_lang: {
    title: 'Ratio language', mentor: 'swoop',
    hook: 'Captain Swoop packs the glider hangar: for every 3 kites there are 2 gliders. That "for every" is a **ratio**, and it stays the same as the hangar fills up.',
    explore: {
      model: 'ratiotable', prompt: 'Add more batches of 3 kites and 2 gliders until there are 12 kites.', success: '12 kites go with 8 gliders. Still 3 kites for every 2 gliders!',
      cfg: { names: ['kites', 'gliders'], one: ['kite', 'glider'], a: 3, b: 2, target: { row: 0, value: 12 }, ops: ['add'] },
    },
    see: { text: 'A ratio compares two amounts. **3 to 2**, **3 : 2** and **for every 3 kites there are 2 gliders** all say the same thing. Order matters: kites to gliders is 3 : 2, but gliders to kites is 2 : 3.', visual: { kind: 'ratioTable', a: 3, b: 2, k: 4, A: 'kites', B: 'gliders' } },
    watch: {
      text: 'A ratio can compare a part to a part, or a part to the whole.',
      steps: ['Each batch has 3 kites and 2 gliders.', 'Kites to gliders: 3 : 2.', 'Gliders to kites: 2 : 3.', 'Kites to all of them: 3 kites out of 3 + 2 = 5 things, so 3 : 5.'],
    },
    practice(rng) {
      const a = rng.int(2, 7), b = rng.pick([2, 3, 4, 5, 6, 7].filter((x) => x !== a));
      return {
        steps: [`There are ${a} kites and ${b} gliders.`, `All of them together: ${a} + ${b}.`],
        prompt: `The ratio of kites to all of them is ${a} : ?. What is the missing number?`,
        answer: num(a + b),
      };
    },
  },

  ratio: {
    title: 'Equivalent ratios', mentor: 'swoop',
    hook: 'Swoop mixes glider paint: 2 cups of blue for every 5 cups of white. A bigger batch has to keep the same ratio, or the color changes!',
    explore: {
      model: 'ratiotable', prompt: 'Make a bigger batch with 20 cups of white. Use the × buttons.', success: '8 cups of blue to 20 cups of white: the same color, just more of it!',
      cfg: { names: ['blue cups', 'white cups'], one: ['blue cup', 'white cup'], a: 2, b: 5, target: { row: 1, value: 20 }, ops: ['times'], times: [2, 3, 4, 10] },
    },
    see: { text: 'Multiply **both** numbers in a ratio by the same number and you get an **equivalent ratio**: 2 : 5 = 4 : 10 = 8 : 20.', visual: { kind: 'ratioTable', a: 2, b: 5, k: 4, A: 'blue', B: 'white' } },
    watch: {
      text: 'To fill in a missing number, find what the known number was multiplied by.',
      steps: ['2 : 5 = ? : 15', '5 was multiplied by 3 to make 15.', 'Multiply 2 by 3 too: 2 × 3 = 6.', 'So 2 : 5 = 6 : 15.'],
    },
    practice(rng) {
      const [a, b] = rng.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7], [5, 6], [4, 9]]);
      const k = rng.int(2, 6);
      return {
        steps: [`${a} : ${b} = ? : ${b * k}`, `${b} times ${k} is ${b * k}.`],
        prompt: `Multiply ${a} by ${k} too. What is the missing number?`,
        answer: num(a * k),
      };
    },
  },

  ratio_table: {
    title: 'Ratio tables and double number lines', mentor: 'swoop',
    hook: 'Every 4 laps of the race course take 6 minutes. A table keeps track as the laps add up.',
    explore: {
      model: 'ratiotable', prompt: 'Grow the table until it shows 16 laps.', success: '16 laps take 24 minutes!',
      cfg: { names: ['laps', 'minutes'], one: ['lap', 'minute'], a: 4, b: 6, target: { row: 0, value: 16 }, ops: ['add', 'times'], times: [2, 5] },
    },
    see: { text: 'A **double number line** is a ratio table stretched out: the laps line and the minutes line match up tick for tick.', visual: { kind: 'dnl', names: ['laps', 'minutes'], top: ['0', '4', '8', '12', '16'], bottom: ['0', '6', '12', '18', '24'] } },
    watch: {
      text: 'Sometimes it helps to go down to a smaller column first, then build up.',
      steps: ['4 laps take 6 minutes. How long for 10 laps?', 'Halve both: 2 laps take 3 minutes.', '10 laps is 5 groups of 2 laps.', '5 × 3 = 15 minutes.'],
    },
    practice(rng) {
      const a = rng.int(2, 5), b = rng.int(3, 9), n = rng.int(3, 8);
      return {
        steps: [`${a} laps take ${b} minutes. How long do ${a * n} laps take?`, `${a * n} laps is ${n} groups of ${a} laps.`],
        prompt: `Each group takes ${b} minutes. How many minutes for ${a * n} laps?`,
        answer: num(n * b),
      };
    },
  },

  unit_rate: {
    title: 'Unit rates', mentor: 'nimbus',
    hook: 'Nimbus sells cloud candy by the bag. Which bag is the better deal? Find the price of **one** candy.',
    explore: {
      model: 'ratiotable', prompt: 'A bag of 12 candies costs 36 coins. Divide to find the price of 1 candy.', success: 'One candy costs 3 coins. That is the **unit rate**!',
      cfg: { names: ['candies', 'coins'], one: ['candy', 'coin'], a: 12, b: 36, target: { row: 0, value: 1 }, ops: ['divide'], divide: [2, 3, 4, 6, 12] },
    },
    see: { text: 'A **unit rate** tells how much for **one**: 3 coins per candy. "Per" means "for each".', visual: { kind: 'dnl', names: ['candies', 'coins'], top: ['0', '1', '4', '12'], bottom: ['0', '3', '12', '36'] } },
    watch: {
      text: 'Divide the amount by how many there are.',
      steps: ['5 star cookies cost 40 coins.', 'For 1 cookie, divide by 5.', '40 ÷ 5 = 8.', 'They cost 8 coins per cookie.'],
    },
    practice(rng) {
      const n = rng.int(3, 9), u = rng.int(2, 9);
      return {
        steps: [`${n} berry pops cost ${n * u} coins.`, `Divide by ${n} to find the cost of 1.`],
        prompt: `${n * u} ÷ ${n} = ?. How many coins for one berry pop?`,
        answer: num(u),
      };
    },
  },

  rate_speed: {
    title: 'Speed and other rates', mentor: 'swoop',
    hook: 'A glider flies 60 meters in 3 seconds. How fast is that? Find how far it goes in **one** second.',
    explore: {
      model: 'ratiotable', prompt: 'Divide to find how far the glider flies in 1 second.', success: '20 meters in 1 second: 20 meters per second. That is its speed!',
      cfg: { names: ['seconds', 'meters'], one: ['second', 'meter'], a: 3, b: 60, target: { row: 0, value: 1 }, ops: ['divide'], divide: [3] },
    },
    see: { text: '**Speed** is a unit rate: distance for each unit of time, like 20 meters per second. Once you know it, any time is easy.', visual: { kind: 'dnl', names: ['seconds', 'meters'], top: ['0', '1', '3', '5'], bottom: ['0', '20', '60', '100'] } },
    watch: {
      text: 'Find the unit rate, then multiply.',
      steps: ['60 meters in 3 seconds. How far in 5 seconds?', '60 ÷ 3 = 20 meters each second.', 'In 5 seconds: 5 × 20 = 100 meters.'],
    },
    practice(rng) {
      const t = rng.int(2, 6), v = rng.int(3, 12), m = rng.pick([2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== t));
      return {
        steps: [`A glider flies ${t * v} meters in ${t} seconds.`, `${t * v} ÷ ${t} = ${v} meters each second.`],
        prompt: `How many meters does it fly in ${m} seconds?`,
        answer: num(m * v),
      };
    },
  },

  convert_ratio: {
    title: 'Converting units', mentor: 'rocco',
    hook: 'Rocco\'s glass rods are measured in feet, but his chart uses inches. 1 foot is always 12 inches: a ratio that never changes.',
    explore: {
      model: 'ratiotable', prompt: 'How many inches are 4 feet? Grow the table.', success: '4 feet is 48 inches!',
      cfg: { names: ['feet', 'inches'], one: ['foot', 'inch'], a: 1, b: 12, target: { row: 0, value: 4 }, ops: ['add', 'times'], times: [2, 3, 5, 10] },
    },
    see: { text: '1 foot = 12 inches, so feet to inches is always **1 : 12**. Multiply feet by 12 to get inches; divide inches by 12 to get feet.', visual: { kind: 'ratioTable', a: 1, b: 12, k: 4, A: 'feet', B: 'inches' } },
    watch: {
      text: 'Going from the small unit to the big one, divide.',
      steps: ['How many feet is 36 inches?', 'Every 12 inches make 1 foot.', '36 ÷ 12 = 3.', '36 inches = 3 feet.'],
    },
    practice(rng) {
      const [big, one, small, k] = rng.pick([['feet', 'foot', 'inches', 12], ['yards', 'yard', 'feet', 3], ['meters', 'meter', 'centimeters', 100], ['minutes', 'minute', 'seconds', 60], ['hours', 'hour', 'minutes', 60]]);
      const n = rng.int(2, 9);
      return {
        steps: [`1 ${one} = ${k} ${small}.`, `${n} ${big} is ${n} times as many: ${n} × ${k}.`],
        prompt: `How many ${small} are in ${n} ${big}?`,
        answer: num(n * k),
      };
    },
  },

  percent: {
    title: 'Percents', mentor: 'nimbus',
    hook: 'Nimbus hangs up a sign: 35% off! **Percent** means "out of 100". Let us see what 35% looks like.',
    explore: { model: 'hundred', prompt: 'Shade 35 squares out of 100.', success: '35 out of 100: that is 35%!', cfg: { target: 35 } },
    see: { text: '**Percent** means **per hundred**. 35% is 35 out of 100, the same as {35/100} or 0.35. All of it is 100%.', visual: { kind: 'hundred', tenths: 3, hundredths: 5 } },
    watch: {
      text: 'To find a percent of a number, find 10% first.',
      steps: ['What is 30% of 80?', '10% of 80 is 80 ÷ 10 = 8.', '30% is 3 times as much: 3 × 8 = 24.', '30% of 80 is 24.'],
    },
    practice(rng) {
      const p = rng.pick([20, 30, 40, 60, 70, 80, 90]), n = rng.int(2, 20) * 10;
      return {
        steps: [`What is ${p}% of ${n}?`, `10% of ${n} is ${n / 10}.`],
        prompt: `${p}% is ${p / 10} times as much. What is ${p}% of ${n}?`,
        answer: num((p * n) / 100),
      };
    },
  },

  percent_whole: {
    title: 'Finding the whole', mentor: 'nimbus',
    hook: 'Nimbus sold 12 cloud candies, and that was 30% of all she made. How many did she make?',
    explore: {
      model: 'tape', prompt: '30% is 12 candies, so each 10% is 4 candies. Build the whole 100%.', success: 'Ten pieces of 10% make 100%: 40 candies in all!',
      cfg: { unit: 4, count: 10, unitLabel: '10%' },
    },
    see: { text: 'If you know a part and its percent, find 10% (or 1%) first, then build up to 100%.', visual: { kind: 'tape', rows: [{ segs: [{ v: 30, label: '30% = 12' }, { v: 70, label: '?', unknown: true }], totalLabel: '100% = ?' }] } },
    watch: {
      text: 'Think: how many of this part make 100%?',
      steps: ['25% of the feathers is 6 feathers. How many in all?', '100% is 4 times 25%.', '4 × 6 = 24.', 'There are 24 feathers in all.'],
    },
    practice(rng) {
      const p = rng.pick([10, 20, 25, 50]), part = rng.int(2, 15), k = 100 / p;
      return {
        steps: [`${p}% of the kites is ${part} kites.`, `100% is ${k} times ${p}%.`],
        prompt: `Multiply ${part} by ${k}. How many kites are there in all?`,
        answer: num(part * k),
      };
    },
  },

  // ------------------------------------------------------------------ negative numbers
  integers: {
    title: 'Negative numbers', mentor: 'vela',
    hook: 'Vela measures heights from the cloud line. Above it is positive. Below it is negative: −3 means 3 meters under the clouds!',
    explore: {
      model: 'numberline', prompt: 'Move the marker to −4: four steps below zero.', success: '−4 is 4 below zero. It is the **opposite** of 4.',
      cfg: { min: -10, max: 10, den: 1, target: [-4, 1], start: 10 },
    },
    see: { text: 'Numbers below zero are **negative**. Every number has an **opposite**, the same distance from zero on the other side: 4 and −4.', visual: { kind: 'numline', min: -6, max: 6, step: 1, marks: [{ v: -4, label: '−4' }, { v: 4, label: '4' }] } },
    watch: {
      text: 'On a number line, numbers get greater to the right.',
      steps: ['Which is greater, −2 or −7?', '−2 is to the right of −7.', 'So −2 > −7.', '2 meters under the clouds is higher than 7 meters under!'],
    },
    practice(rng) {
      const n = rng.int(2, 12);
      return {
        steps: [`The balloon is at −${n} meters: ${n} meters below the cloud line.`, 'To reach 0, it must rise the same distance.'],
        prompt: `How many meters must it rise to reach the cloud line?`,
        answer: num(n),
      };
    },
  },

  abs_order: {
    title: 'Absolute value and order', mentor: 'vela',
    hook: 'One balloon is 5 meters below the clouds and one is 3 meters above. Which one is lower? Which one is farther from the cloud line?',
    explore: {
      model: 'cards', prompt: 'Line the heights up from least to greatest.', success: 'The most negative number is the least!',
      cfg: { values: [3, -5, 0, -1, 4, -3], mode: 'order' },
    },
    see: { text: '**Absolute value** is the distance from zero, so it is never negative: |−5| = 5 and |3| = 3. The balloon at −5 is lower, and farther from the cloud line.', visual: { kind: 'numline', min: -6, max: 6, step: 1, marks: [{ v: -5, label: '−5' }, { v: 3, label: '3' }] } },
    watch: {
      text: 'To order numbers, picture them on a number line.',
      steps: ['Order −3, 2, −6, 0 from least to greatest.', 'The most negative is least: −6.', 'Then −3, then 0, then 2.', '−6 < −3 < 0 < 2.'],
    },
    practice(rng) {
      const n = rng.int(2, 15);
      return {
        steps: [`|−${n}| means the distance from −${n} to 0.`, 'Count the steps back to zero.'],
        prompt: `What is |−${n}|?`,
        answer: num(n),
      };
    },
  },

  rational_line: {
    title: 'Fractions and decimals below zero', mentor: 'vela',
    hook: 'The cloud gauges measure in halves and tenths, even below zero. Halfway between −1 and −2 is a number too!',
    explore: {
      model: 'numberline', prompt: 'Move the marker to −1.5: halfway between −1 and −2.', success: '−1.5 is halfway between −1 and −2!',
      cfg: { min: -3, max: 1, den: 2, target: [-3, 2], start: 6, decimal: true, places: 1, labelAll: true },
    },
    see: { text: '−1.5 and −{1/2} sit between the whole numbers, just like 1.5 and {1/2}, only on the other side of zero.', visual: { kind: 'numline', min: -3, max: 3, step: 0.5, places: 1, marks: [{ v: -1.5, label: '−1.5' }, { v: 0.5, label: '0.5' }] } },
    watch: {
      text: 'The farther left, the less the number.',
      steps: ['Which is less, −2.5 or −1.5?', '−2.5 is farther left on the number line.', 'So −2.5 < −1.5.'],
    },
    practice(rng) {
      const w = rng.int(1, 9);
      return {
        steps: [`−${w}.5 is ${w} and a half steps below zero.`, 'Its distance from zero is the same number without the minus sign.'],
        prompt: `How far is −${w}.5 from 0?`,
        answer: num(w + 0.5),
      };
    },
  },

  coord4: {
    title: 'Four-quadrant coordinates', mentor: 'tock',
    hook: 'Tock\'s star chart has zero in the middle, so stars can hide left of zero and below it too!',
    explore: {
      model: 'plot', prompt: 'Plot the stars at (−3, 2) and (4, −1).', success: 'Negative x goes left. Negative y goes down!',
      cfg: { n: 5, min: -5, targets: [[-3, 2], [4, -1]] },
    },
    see: { text: 'The **x-axis** and **y-axis** cross at (0, 0), the **origin**, and split the grid into four **quadrants**. The first number says left or right; the second says up or down.', visual: { kind: 'grid', lo: -5, hi: 5, points: [{ x: -3, y: 2, icon: 'star' }, { x: 4, y: -1, icon: 'star' }], quadrants: true } },
    watch: {
      text: 'Always start at the origin.',
      steps: ['Find (−2, −4).', 'Start at the origin, (0, 0).', 'x is −2: go 2 left.', 'y is −4: go 4 down. That is quadrant III.'],
    },
    practice(rng) {
      const x = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), y = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
      const q = x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3;
      return {
        steps: [`A star is at (${sg(x)}, ${sg(y)}).`, `x is ${sg(x)}: go ${Math.abs(x)} ${x < 0 ? 'left' : 'right'}. y is ${sg(y)}: go ${Math.abs(y)} ${y < 0 ? 'down' : 'up'}.`],
        prompt: 'Which quadrant is it in? Type 1, 2, 3 or 4.',
        answer: num(q),
      };
    },
  },

  coord_dist: {
    title: 'Distance on the coordinate plane', mentor: 'tock',
    hook: 'Two stars sit on the same row of Tock\'s chart. How far apart are they?',
    explore: {
      model: 'plot', prompt: 'Plot (−3, 2) and (4, 2), then count the steps between them.', success: 'From −3 to 4 is 7 steps: 3 to reach zero, then 4 more.',
      cfg: { n: 5, min: -5, targets: [[-3, 2], [4, 2]], line: true },
    },
    see: { text: 'When two points share a y-coordinate, count across. If they are on opposite sides of zero, **add** their distances from zero: 3 + 4 = 7.', visual: { kind: 'grid', lo: -5, hi: 5, points: [{ x: -3, y: 2, icon: 'star' }, { x: 4, y: 2, icon: 'star' }] } },
    watch: {
      text: 'The same works up and down.',
      steps: ['How far is it from (2, −5) to (2, 3)?', 'Same x, so count up and down.', 'From −5 to 0 is 5. From 0 to 3 is 3.', '5 + 3 = 8 units.'],
    },
    practice(rng) {
      const x1 = -rng.int(1, 6), x2 = rng.int(1, 6), y = rng.pick([-3, -2, -1, 1, 2, 3, 4]);
      return {
        steps: [`From (${sg(x1)}, ${sg(y)}) to (${x2}, ${sg(y)}): same y, so count across.`, `From ${sg(x1)} to 0 is ${-x1}. From 0 to ${x2} is ${x2}.`],
        prompt: 'How far apart are the two points?',
        answer: num(x2 - x1),
      };
    },
  },

  // ------------------------------------------------------------------ number sense and algebra
  gcf_lcm: {
    title: 'Common multiples and factors', mentor: 'tock',
    hook: 'Tock\'s two gears click 4 and 6 teeth at a time. When do their marks line up again?',
    explore: {
      model: 'multiples', prompt: 'Grow both rows of multiples until a number shows up in both.', success: '12 is the first number in both rows: the least common multiple of 4 and 6!',
      cfg: { a: 4, b: 6, names: ['Gear of 4', 'Gear of 6'] },
    },
    see: { text: 'The **least common multiple** (LCM) is the smallest number in both lists of multiples. The **greatest common factor** (GCF) is the greatest number that divides both evenly.', visual: { kind: 'rtable', rows: [{ name: 'multiples of 4', cells: ['4', '8', '12', '16', '20', '24'] }, { name: 'multiples of 6', cells: ['6', '12', '18', '24', '30', '36'] }] } },
    watch: {
      text: 'For the GCF, list the factors of both numbers.',
      steps: ['Find the GCF of 12 and 18.', 'Factors of 12: 1, 2, 3, 4, 6, 12.', 'Factors of 18: 1, 2, 3, 6, 9, 18.', 'The greatest one in both lists is 6.'],
    },
    practice(rng) {
      const [a, b] = rng.pick([[2, 3], [3, 4], [4, 6], [3, 5], [6, 8], [4, 10], [6, 9], [2, 5], [5, 6], [8, 12]]);
      const l = (a * b) / gcd(a, b);
      const list = (n) => Array.from({ length: l / n }, (_, i) => n * (i + 1)).join(', ');
      return {
        steps: [`Multiples of ${a}: ${list(a)}.`, `Multiples of ${b}: ${list(b)}.`],
        prompt: `What is the least common multiple of ${a} and ${b}?`,
        answer: num(l),
      };
    },
  },

  eval_expr: {
    title: 'Evaluating expressions', mentor: 'tock',
    hook: 'Tock\'s clock rule says 3 × h + 2. What does the rule give when h is 4?',
    explore: {
      model: 'steptap', prompt: 'Put 4 in for h: 3 × 4 + 2. Tap the operation to do first, then the next.', success: '3 × 4 + 2 = 14. When h is 4, the rule gives 14!',
      cfg: { tokens: [3, '×', 4, '+', 2] },
    },
    see: { text: 'To **evaluate** an expression, **substitute** the number for the letter, then follow the order of operations. 3h means 3 × h.', visual: { kind: 'rtable', rows: [{ name: 'h', cells: ['1', '2', '3', '4'] }, { name: '3h + 2', cells: ['5', '8', '11', '14'] }] } },
    watch: {
      text: 'Exponents come before multiplying.',
      steps: ['Evaluate 2x² − 5 when x = 3.', 'Substitute: 2 × 3² − 5.', 'Exponent first: 3² = 9.', 'Then 2 × 9 = 18, and 18 − 5 = 13.'],
    },
    practice(rng) {
      const a = rng.int(2, 6), x = rng.int(2, 9), b = rng.int(1, 9);
      return {
        steps: [`Evaluate ${a}n + ${b} when n = ${x}.`, `Substitute: ${a} × ${x} + ${b}.`, `Multiply first: ${a} × ${x} = ${a * x}.`],
        prompt: `Now add ${b}. What is ${a}n + ${b}?`,
        answer: num(a * x + b),
      };
    },
  },

  write_expr: {
    title: 'Writing expressions', mentor: 'tock',
    hook: 'Tock writes his rules in a code of letters and numbers. "5 more than n" becomes n + 5!',
    explore: {
      model: 'tags', prompt: 'Pick every expression that means "5 more than n".', success: 'n + 5 and 5 + n both mean 5 more than n!',
      cfg: { tags: ['n + 5', '5n', '5 + n', 'n − 5', 'n ÷ 5'], correct: ['n + 5', '5 + n'], noun: 'expressions', big: true },
    },
    see: { text: 'Words become operations: **more than** and **sum** mean +, **less than** and **difference** mean −, **times** and **product** mean ×, **quotient** means ÷. Careful: "3 less than n" is n − 3, not 3 − n.', visual: null },
    watch: {
      text: 'Read the words in order and build the expression.',
      steps: ['Write "twice a number, plus 7".', 'Twice a number is 2 × n, written 2n.', 'Plus 7: 2n + 7.'],
    },
    practice(rng) {
      const k = rng.int(2, 6), x = rng.int(3, 9), m = rng.int(1, k * x - 1);
      return {
        steps: [`"${k} times a number, minus ${m}" is ${k}n − ${m}.`, `When the number is ${x}: ${k} × ${x} − ${m}.`],
        prompt: `What is ${k}n − ${m} when n is ${x}?`,
        answer: num(k * x - m),
      };
    },
  },

  equiv_expr: {
    title: 'Equivalent expressions', mentor: 'tock',
    hook: 'Tock has 3 boxes, each holding x gears and 2 springs. Is that 3(x + 2), or 3x + 6? It is both!',
    explore: {
      model: 'tags', prompt: 'Pick every expression that is the same as 3(x + 2).', success: 'They all mean 3 groups of x + 2!',
      cfg: { tags: ['3x + 6', '3x + 2', '6 + 3x', 'x + 6', '3(2 + x)'], correct: ['3x + 6', '6 + 3x', '3(2 + x)'], noun: 'expressions', big: true },
    },
    see: { text: 'The **distributive property**: 3(x + 2) = 3 × x + 3 × 2 = 3x + 6. Expressions that are equal whatever x is are **equivalent**.', visual: { kind: 'tape', rows: [{ segs: [{ v: 3, label: 'x' }, { v: 2, label: '2', alt: true }, { v: 3, label: 'x' }, { v: 2, label: '2', alt: true }, { v: 3, label: 'x' }, { v: 2, label: '2', alt: true }], totalLabel: '3(x + 2) = 3x + 6' }] } },
    watch: {
      text: 'You can also put **like terms** together.',
      steps: ['Simplify 4y + 3 + 2y.', '4y and 2y are like terms: both count y.', '4y + 2y = 6y.', 'So 4y + 3 + 2y = 6y + 3.'],
    },
    practice(rng) {
      const a = rng.int(2, 9), b = rng.int(2, 9);
      return {
        steps: [`${a}(x + ${b}): multiply ${a} by each part inside the parentheses.`, `${a} × x = ${a}x.`],
        prompt: `${a}(x + ${b}) = ${a}x + ?. What number goes with ${a}x?`,
        answer: num(a * b),
      };
    },
  },

  one_step: {
    title: 'Solving equations', mentor: 'tock',
    hook: 'On Tock\'s balance, a bag of x gears and 3 more gears balance 11 gears. How many gears are in the bag?',
    explore: {
      model: 'balance', prompt: 'Get the bag on its own, and keep the scale balanced.', success: 'x = 8! Whatever you do to one side, do to the other.',
      cfg: { bags: 1, ones: 3, right: 11, x: 8, name: 'x' },
    },
    see: { text: 'An **equation** says two sides are equal. To solve x + 3 = 11, **undo** the + 3 by subtracting 3 from **both sides**: x = 8.', visual: null },
    watch: {
      text: 'To undo multiplying, divide both sides.',
      steps: ['Solve 4x = 28.', '4x means 4 times x.', 'Divide both sides by 4: x = 28 ÷ 4.', 'x = 7. Check: 4 × 7 = 28.'],
    },
    practice(rng) {
      if (rng.int(0, 1)) {
        const a = rng.int(2, 15), x = rng.int(2, 20);
        return { steps: [`Solve x + ${a} = ${x + a}.`, `Subtract ${a} from both sides: x = ${x + a} − ${a}.`], prompt: 'What is x?', answer: num(x) };
      }
      const k = rng.int(2, 9), x = rng.int(2, 12);
      return { steps: [`Solve ${k}x = ${k * x}.`, `Divide both sides by ${k}: x = ${k * x} ÷ ${k}.`], prompt: 'What is x?', answer: num(x) };
    },
  },

  inequality: {
    title: 'Inequalities', mentor: 'tock',
    hook: 'Riders on the balloon lift must be taller than 3 feathers. Lots of heights work, not just one!',
    explore: {
      model: 'tags', prompt: 'Pick every number that makes h > 3 true.', success: 'An inequality has many answers: every number greater than 3!',
      cfg: { tags: ['2', '3', '3.5', '5', '−1', '10'], correct: ['3.5', '5', '10'], noun: 'numbers', big: true },
    },
    see: { text: '**x > 3** means x is greater than 3. On a number line, an open circle at 3 shows that 3 itself does not count, and the ray shows every number that does. **x ≥ 3** fills the circle in.', visual: { kind: 'ineq', min: -2, max: 8, at: 3, dir: 'right', closed: false } },
    watch: {
      text: 'Test each number in the inequality.',
      steps: ['Which numbers make x ≤ 2 true: 0, 2 or 4?', 'x ≤ 2 means less than or equal to 2.', '0 is less than 2: yes. 2 equals 2: yes.', '4 is greater than 2: no.'],
    },
    practice(rng) {
      const n = rng.int(3, 20);
      return {
        steps: [`x < ${n} means x is less than ${n}.`, `${n} itself does not count.`],
        prompt: `What is the greatest whole number that makes x < ${n} true?`,
        answer: num(n - 1),
      };
    },
  },

  var_table: {
    title: 'Variables that change together', mentor: 'tock',
    hook: 'Every turn of Tock\'s big gear moves the clock hand 3 steps. Turns and steps change together!',
    explore: {
      model: 'plot', prompt: 'Plot (1, 3), (2, 6) and (3, 9): turns across, steps up.', success: 'The points make a straight line: steps = 3 × turns!',
      cfg: { n: 10, targets: [[1, 3], [2, 6], [3, 9]], line: true },
    },
    see: { text: 'The turns are the **independent variable**: you choose them. The steps **depend** on the turns: s = 3t. A table, a graph and an equation can all show the same rule.', visual: { kind: 'rtable', rows: [{ name: 'turns (t)', cells: ['1', '2', '3', '4'] }, { name: 'steps (s)', cells: ['3', '6', '9', '12'] }] } },
    watch: {
      text: 'Use the equation to find any value.',
      steps: ['The rule is s = 3t.', 'When t = 5, s = 3 × 5.', 's = 15.'],
    },
    practice(rng) {
      const k = rng.int(2, 9), x = rng.int(4, 12);
      return {
        steps: [`The rule is s = ${k}t.`, `Put ${x} in for t: s = ${k} × ${x}.`],
        prompt: `What is s when t = ${x}?`,
        answer: num(k * x),
      };
    },
  },

  // ------------------------------------------------------------------ geometry
  area_tri: {
    title: 'Area of triangles', mentor: 'rocco',
    hook: 'Rocco cuts triangle windows from sheets of sky glass. How much glass does one triangle take?',
    explore: {
      model: 'shapecut', prompt: 'Copy the triangle and turn it around.', success: 'Two triangles make a parallelogram, so one triangle is half of it!',
      cfg: { shape: 'tri', b: 6, h: 4, unit: 'cm' },
    },
    see: { text: 'A **parallelogram** has area **base × height**. A triangle is half of a parallelogram, so its area is **base × height ÷ 2**. The height goes straight up from the base.', visual: { kind: 'triangle', shape: 'tri', b: 6, h: 4, unit: 'cm' } },
    watch: {
      text: 'Multiply the base and height, then halve it.',
      steps: ['A triangle has base 10 cm and height 7 cm.', 'base × height = 10 × 7 = 70.', 'Half of 70 is 35.', 'Area = 35 square cm.'],
    },
    practice(rng) {
      const b = rng.int(2, 8) * 2, h = rng.int(3, 12);
      return {
        steps: [`A triangle has base ${b} and height ${h}.`, `base × height = ${b} × ${h} = ${b * h}.`],
        prompt: 'A triangle is half of that. What is its area?',
        answer: num((b * h) / 2),
      };
    },
  },

  area_poly: {
    title: 'Trapezoids and other shapes', mentor: 'rocco',
    hook: 'Rocco\'s new window is a trapezoid: a short top and a long bottom. Two of them fit together into a shape you already know!',
    explore: {
      model: 'shapecut', prompt: 'Copy the trapezoid and turn it around.', success: 'Two trapezoids make a parallelogram, so one trapezoid is half of it!',
      cfg: { shape: 'trap', b: 8, b2: 4, h: 3, unit: 'cm' },
    },
    see: { text: 'Area of a trapezoid = **(top + bottom) × height ÷ 2**. Other shapes can be **cut** into rectangles and triangles, then the pieces added up.', visual: { kind: 'poly', pts: [[0, 0], [8, 0], [6, 3], [2, 3]], labels: [{ at: [4, -0.5], text: '8 cm' }, { at: [4, 3.5], text: '4 cm' }, { at: [2.3, 1.5], text: '3 cm', anchor: 'start' }], height: [2, 0, 2, 3] } },
    watch: {
      text: 'For an odd shape, cut it into rectangles.',
      steps: ['An L-shaped floor: a strip 10 by 4, and a block 3 by 5 on top of it.', 'Cut it into those two rectangles.', '10 × 4 = 40 and 3 × 5 = 15.', '40 + 15 = 55 square units.'],
    },
    practice(rng) {
      const b1 = rng.int(4, 12), b2 = rng.int(2, b1 - 1), h = rng.int(1, 5) * 2;
      return {
        steps: [`A trapezoid has bases ${b1} and ${b2} and height ${h}.`, `Add the bases: ${b1} + ${b2} = ${b1 + b2}.`, `Times the height: ${b1 + b2} × ${h} = ${(b1 + b2) * h}.`],
        prompt: 'Halve it. What is the area?',
        answer: num(((b1 + b2) * h) / 2),
      };
    },
  },

  volume_frac: {
    title: 'Volume with fraction edges', mentor: 'rocco',
    hook: 'Rocco packs tiny glass cubes, each {1/2} cm on a side, into a box 2 cm long, 1 cm wide and 1 cm high. How many fit?',
    explore: {
      model: 'cubes', prompt: 'Fill the box with half-centimeter cubes: 4 long, 2 wide and 2 high.', success: '16 little cubes! 8 of them make one cubic centimeter, so the box holds 2 cubic cm.',
      cfg: { l: 4, w: 2, h: 2 },
    },
    see: { text: 'Volume is still **length × width × height**, even with fractions: 2 × 1 × 1 = 2 cubic cm. Counting {1/2}-cm cubes works too: 8 of them fill each cubic centimeter.', visual: { kind: 'box3d', l: 4, w: 2, h: 2, unit: 'cubes', cubes: true } },
    watch: {
      text: 'Multiply the edges, fractions and all.',
      steps: ['A box is 3 m long, {1/2} m wide and 2 m high.', 'V = 3 × {1/2} × 2.', '3 × {1/2} = {3/2}, and {3/2} × 2 = 3.', 'V = 3 cubic meters.'],
    },
    practice(rng) {
      const l = rng.int(2, 7), h = rng.int(1, 4) * 2;
      return {
        steps: [`A box is ${l} m long, {1/2} m wide and ${h} m high.`, `V = ${l} × {1/2} × ${h}.`, `${l} × ${h} = ${l * h}.`],
        prompt: `Now take half of ${l * h}. What is the volume in cubic meters?`,
        answer: num((l * h) / 2),
      };
    },
  },

  coord_poly: {
    title: 'Shapes on the coordinate plane', mentor: 'rocco',
    hook: 'Rocco plans a glass tile on Tock\'s star chart. Its corners are points, and its sides can be counted!',
    explore: {
      model: 'plot', prompt: 'Plot the corners (−3, 2), (2, 2), (2, −2) and (−3, −2).', success: 'A rectangle 5 wide and 4 tall: its area is 5 × 4 = 20!',
      cfg: { n: 5, min: -5, targets: [[-3, 2], [2, 2], [2, -2], [-3, -2]], closed: true },
    },
    see: { text: 'To find a side length, count between corners that share an x or a y. From −3 to 2 is 5; from −2 to 2 is 4.', visual: { kind: 'grid', lo: -5, hi: 5, points: [], poly: [[-3, 2], [2, 2], [2, -2], [-3, -2]] } },
    watch: {
      text: 'Count each side, then use it.',
      steps: ['A square has corners (−1, −1), (3, −1), (3, 3) and (−1, 3).', 'Bottom side: from −1 to 3 is 4.', 'A square has 4 equal sides.', 'Perimeter = 4 × 4 = 16.'],
    },
    practice(rng) {
      const x1 = -rng.int(1, 5), x2 = rng.int(1, 5), y = -rng.int(1, 4);
      return {
        steps: [`The bottom corners of a rectangle are (${sg(x1)}, ${sg(y)}) and (${x2}, ${sg(y)}).`, `From ${sg(x1)} to 0 is ${-x1}. From 0 to ${x2} is ${x2}.`],
        prompt: 'How long is the bottom side?',
        answer: num(x2 - x1),
      };
    },
  },

  nets: {
    title: 'Nets of solids', mentor: 'rocco',
    hook: 'Rocco folds paper patterns into lantern boxes. A flat pattern that folds into a solid is called a **net**.',
    explore: { model: 'net', prompt: 'Paint every face of the box\'s net.', success: 'A box has 6 faces, in 3 matching pairs!', cfg: { l: 4, w: 3, h: 2, unit: 'cm' } },
    see: { text: 'A **net** shows every face of a solid laid flat. A box has 6 rectangle faces. A square pyramid has 1 square and 4 triangles.', visual: { kind: 'net', solid: 'sqpyr' } },
    watch: {
      text: 'Count the faces of the net.',
      steps: ['How many faces does a triangular prism have?', 'Two triangles, one at each end.', 'Three rectangles around the sides.', '2 + 3 = 5 faces.'],
      visual: { kind: 'net', solid: 'prism' },
    },
    practice(rng) {
      const [name, n, parts] = rng.pick([['a box', 6, '4 sides, a top and a bottom'], ['a square pyramid', 5, 'a square base and 4 triangles'], ['a triangular prism', 5, '2 triangles and 3 rectangles'], ['a triangular pyramid', 4, 'a triangle base and 3 more triangles'], ['a cube', 6, 'squares on every side, top and bottom']]);
      return {
        steps: [`Picture the net of ${name}.`, `It has ${parts}.`],
        prompt: `How many faces does ${name} have?`,
        answer: num(n),
      };
    },
  },

  surface_area: {
    title: 'Surface area', mentor: 'rocco',
    hook: 'Rocco wraps a gift box in starry paper. How much paper covers every face?',
    explore: { model: 'net', prompt: 'Paint every face of the net to add up the paper you need.', success: 'All 6 faces added up: that is the surface area!', cfg: { l: 5, w: 3, h: 2, unit: 'cm' } },
    see: { text: '**Surface area** is the total area of all the faces. A box\'s faces come in pairs: 2 × (l × w) + 2 × (l × h) + 2 × (w × h).', visual: { kind: 'net', solid: 'box' } },
    watch: {
      text: 'A cube is easy: 6 matching squares.',
      steps: ['A cube has edges of 3 cm.', 'Each face is 3 × 3 = 9 square cm.', 'A cube has 6 faces.', '6 × 9 = 54 square cm.'],
    },
    practice(rng) {
      const e = rng.int(2, 9);
      return {
        steps: [`A cube has edges of ${e} cm.`, `Each face is ${e} × ${e} = ${e * e} square cm.`],
        prompt: 'A cube has 6 faces. What is its surface area?',
        answer: num(6 * e * e),
      };
    },
  },

  // ------------------------------------------------------------------ data and statistics
  stat_question: {
    title: 'Statistical questions', mentor: 'astra',
    hook: 'Astra asks, "How bright are the stars tonight?" Every star gives a different answer. That makes it a **statistical question**.',
    explore: {
      model: 'tags', prompt: 'Pick every statistical question: the ones whose answers will vary.', success: 'Those have many different answers. You would collect data to answer them!',
      cfg: { tags: ['How tall is Astra?', 'How tall are the cadets?', 'How many feathers did each penguin find?', 'What time does the festival start?'], correct: ['How tall are the cadets?', 'How many feathers did each penguin find?'], noun: 'questions' },
    },
    see: { text: 'A **statistical question** expects answers that **vary**. "How old is Vela?" has one answer. "How old are the penguins in Guild Town?" has many, so you would collect data.', visual: null },
    watch: {
      text: 'Ask: would different penguins give different answers?',
      steps: ['"How many stars did each guild member count?"', 'Each member might count a different number.', 'The answers vary, so it is statistical.'],
    },
    practice(rng) {
      const pool = rng.shuffle([
        ['how tall each cadet is', true], ['how tall Astra is', false], ['how many kites each penguin owns', true], ['what day the festival is', false],
        ['how long each glider flight lasts', true], ['how many bridges Skyreach has', false], ['how many feathers each penguin found', true], ['what color the Starwell glows', false],
      ]);
      const picks = pool.slice(0, 4);
      if (!picks.some((p) => p[1])) picks[0] = ['how far each penguin can glide', true];
      const n = picks.filter((p) => p[1]).length;
      return {
        steps: [`Questions about: ${picks.map((p) => p[0]).join('; ')}.`, 'A statistical question has answers that vary.'],
        prompt: 'How many of those questions are statistical?',
        answer: num(n),
      };
    },
  },

  median_mode_range: {
    title: 'Median, mode and range', mentor: 'astra',
    hook: 'Astra\'s cadets counted shooting stars. What is a typical count, and how spread out are they?',
    explore: {
      model: 'cards', prompt: 'Line up the counts from least to greatest.', success: 'The middle count is the median, and the count that shows up most is the mode.',
      cfg: { values: [7, 3, 9, 4, 6, 4, 8], mode: 'median' },
    },
    see: { text: 'The **median** is the middle value when the data is in order. The **mode** is the value that shows up most. The **range** is greatest − least, and it shows how spread out the data is.', visual: null },
    watch: {
      text: 'With an even number of values, the median is halfway between the two middle ones.',
      steps: ['Find the median of 2, 9, 5, 8.', 'In order: 2, 5, 8, 9.', 'The two middle values are 5 and 8.', 'Halfway between: (5 + 8) ÷ 2 = 6.5.'],
    },
    practice(rng) {
      const vals = rng.shuffle(Array.from({ length: 20 }, (_, i) => i + 1)).slice(0, 5);
      const sorted = [...vals].sort((a, b) => a - b);
      return {
        steps: [`Find the median of ${vals.join(', ')}.`, `In order: ${sorted.join(', ')}.`],
        prompt: 'Which value is in the middle?',
        answer: num(sorted[2]),
      };
    },
  },

  histogram: {
    title: 'Histograms', mentor: 'astra',
    hook: 'Astra timed every shooting star tonight. A histogram shows how many lasted each length of time.',
    explore: {
      model: 'bins', prompt: 'Drop each time into the bar for its interval.', success: 'The tallest bar shows the most common times!',
      cfg: { values: [12, 25, 7, 18, 31, 22, 15, 28, 9, 24], bins: [[0, 9], [10, 19], [20, 29], [30, 39]] },
    },
    see: { text: 'A **histogram** groups numbers into equal **intervals** and draws a bar for how many land in each. The bars touch because the intervals do.', visual: { kind: 'histogram', labels: ['0–9', '10–19', '20–29', '30–39'], values: [2, 3, 4, 1], title: 'Shooting stars (seconds)' } },
    watch: {
      text: 'Read a bar by its height.',
      steps: ['The bar over 10–19 reaches 3.', 'So 3 of the times are from 10 to 19 seconds.', 'A histogram does not show exactly which times they were.'],
    },
    practice(rng) {
      const lo = rng.pick([10, 20, 30]), hi = lo + 9;
      const inside = Array.from({ length: rng.int(2, 4) }, () => rng.int(lo, hi));
      const outside = Array.from({ length: rng.int(3, 4) }, () => rng.pick([rng.int(0, lo - 1), rng.int(hi + 1, 49)]));
      const vals = rng.shuffle([...inside, ...outside]);
      return {
        steps: [`The times are ${vals.join(', ')}.`, `Check each one: is it from ${lo} to ${hi}?`],
        prompt: `How tall is the bar for ${lo}–${hi}?`,
        answer: num(inside.length),
      };
    },
  },

  box_plot: {
    title: 'Box plots', mentor: 'astra',
    hook: 'A box plot squeezes a whole night of star counts into five numbers. Let us find them!',
    explore: {
      model: 'cards', prompt: 'Line up the star counts from least to greatest.', success: 'The median splits the data in half, and each half has its own middle: Q1 and Q3!',
      cfg: { values: [9, 2, 14, 6, 12, 5, 8], mode: 'quartiles' },
    },
    see: { text: 'A **box plot** shows the least value, **Q1**, the **median**, **Q3** and the greatest value. The middle half of the data is inside the box. The **interquartile range** is Q3 − Q1.', visual: { kind: 'boxplot', min: 2, q1: 5, med: 8, q3: 12, max: 14, lo: 0, hi: 16, step: 1, title: 'Star counts' } },
    watch: {
      text: 'The box shows how spread out the middle half is.',
      steps: ['Q1 is 5 and Q3 is 12.', 'The box goes from 5 to 12.', 'IQR = 12 − 5 = 7.', 'The middle half of the counts spreads over 7.'],
    },
    practice(rng) {
      const vals = rng.shuffle(Array.from({ length: 25 }, (_, i) => i + 1)).slice(0, 7).sort((a, b) => a - b);
      return {
        steps: [`In order, the counts are ${vals.join(', ')}.`, `The median is ${vals[3]}. The upper half is ${vals.slice(4).join(', ')}.`],
        prompt: 'Q3 is the middle of the upper half. What is Q3?',
        answer: num(vals[5]),
      };
    },
  },

  mad: {
    title: 'Mean absolute deviation', mentor: 'astra',
    hook: 'Two cadets both count 5 stars a night on average, but one is steady and one is up and down. The MAD measures how spread out the counts are.',
    explore: {
      model: 'spread', prompt: 'Tap each dot to measure how far it is from the mean.', success: 'On average the counts are 2 away from the mean. That is the MAD!',
      cfg: { values: [2, 4, 6, 8], min: 0, max: 10 },
    },
    see: { text: 'The **mean absolute deviation** (MAD) is the mean of the distances from the mean. A small MAD means the data is close together; a big MAD means it is spread out.', visual: { kind: 'numline', min: 0, max: 10, step: 1, marks: [{ v: 2, label: '2' }, { v: 4, label: '4' }, { v: 6, label: '6' }, { v: 8, label: '8' }] } },
    watch: {
      text: 'Find the mean, then the distances, then their mean.',
      steps: ['Data: 1, 5, 6, 8. The mean is 20 ÷ 4 = 5.', 'Distances from 5: 4, 0, 1, 3.', 'Their total is 8.', 'MAD = 8 ÷ 4 = 2.'],
    },
    practice(rng) {
      const m = rng.int(7, 12), b = rng.int(0, 3), a = b + rng.pick([2, 4]);
      const vals = rng.shuffle([m - a, m - b, m + b, m + a]);
      return {
        steps: [`The data is ${vals.join(', ')}, and the mean is ${m}.`, `The distances from ${m} are ${a}, ${b}, ${b} and ${a}: ${2 * (a + b)} in all.`],
        prompt: `Share ${2 * (a + b)} over the 4 values. What is the mean absolute deviation?`,
        answer: num((a + b) / 2),
      };
    },
  },
};
