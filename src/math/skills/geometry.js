// Geometry and measurement (grades 3-6): Glacier Cave in Book 1, the Sunken Temple in Book 2 and the Crystal
// Workshop in Book 3.
import { P, num, frac, pick, makeChoices, labelNum, labelFrac, nearInts } from '../build.js';
import { Frac } from '../frac.js';
import { fmtInt, fmtNum } from '../fmt.js';
import { friend } from '../theme.js';

const D = 'cave';
const F = (n, d) => new Frac(n, d);
const UNITS = ['ft', 'm', 'in', 'cm', 'yd'];

const perimeter = {
  id: 'perimeter', domain: D, grade: 3, cc: '4.MD.3', name: 'Perimeter', short: 'perimeter',
  gen(rng, tier) {
    const u = rng.pick(UNITS);
    let w = tier === 1 ? rng.int(2, 9) : rng.int(5, 20), h = tier === 1 ? rng.int(2, 9) : rng.int(3, 15);
    if (tier === 3 && rng.chance(0.4)) {
      const s = rng.int(4, 25);
      return P({
        skill: this.id, tier,
        text: `Pebble builds a square ice wall. Each side is ${s} ${u} long. What is the perimeter?`,
        visual: { kind: 'rect', w: s, h: s, unit: u },
        answer: num(4 * s),
        choices: makeChoices(rng, 4 * s, [{ value: s * s, why: 'That is the area. Perimeter is the distance around: add all 4 sides.' }, 2 * s, 3 * s, 4 * s + 4], labelNum),
        hint: 'A square has 4 equal sides. Perimeter is the distance all the way around.',
        steps: [`All 4 sides are ${s} ${u}.`, `${s} × 4 = ${4 * s} ${u}.`],
        meta: { value: 4 * s },
      });
    }
    if (w === h) w += 1;
    const p = 2 * (w + h);
    return P({
      skill: this.id, tier,
      text: `What is the perimeter of this ice rectangle?`,
      visual: { kind: 'rect', w, h, unit: u, grid: tier === 1 },
      answer: num(p),
      choices: makeChoices(rng, p, [
        { value: w * h, why: 'That is the area. Perimeter is the distance around the outside.' },
        { value: w + h, why: 'That is only two sides. A rectangle has four.' },
        p + 2, p - 2,
      ], labelNum),
      hint: 'Add up all four sides. Opposite sides are the same length.',
      steps: [`The sides are ${w}, ${h}, ${w} and ${h} ${u}.`, `${w} + ${h} + ${w} + ${h} = ${p} ${u}.`],
      meta: { value: p },
    });
  },
};

const areaRect = {
  id: 'area_rect', domain: D, grade: 3, cc: '4.MD.3', name: 'Area of rectangles', short: 'area',
  gen(rng, tier) {
    const u = rng.pick(UNITS);
    if (tier === 3 && rng.chance(0.5)) {
      const W = rng.int(6, 12), H = rng.int(6, 12), cw = rng.int(2, W - 3), ch = rng.int(2, H - 3);
      const area = W * H - cw * ch;
      return P({
        skill: this.id, tier,
        text: `This ice floor is a big rectangle with a corner cut out. What is its area in square ${u}?`,
        visual: { kind: 'lshape', W, H, cw, ch, unit: u },
        answer: num(area),
        choices: makeChoices(rng, area, [{ value: W * H, why: `Take away the missing corner: ${cw} × ${ch} = ${cw * ch}.` }, 2 * (W + H), area + cw, area - ch], labelNum),
        hint: `Find the area of the whole ${W} × ${H} rectangle, then subtract the cut-out corner.`,
        steps: [`Whole rectangle: ${W} × ${H} = ${W * H}.`, `Corner: ${cw} × ${ch} = ${cw * ch}.`, `${W * H} − ${cw * ch} = ${area} square ${u}.`],
        meta: { value: area },
      });
    }
    const w = tier === 1 ? rng.int(2, 8) : rng.int(4, 15), h = tier === 1 ? rng.int(2, 6) : rng.int(3, 12);
    return P({
      skill: this.id, tier,
      text: `What is the area of this ice floor in square ${u}?`,
      visual: { kind: 'rect', w, h, unit: u, grid: tier === 1 },
      answer: num(w * h),
      choices: makeChoices(rng, w * h, [{ value: 2 * (w + h), why: 'That is the perimeter. Area counts the squares inside: length × width.' }, w + h, w * h + w, w * (h - 1)], labelNum),
      hint: 'Area = length × width. It counts the square tiles inside.',
      steps: [`${w} rows of ${h} squares.`, `${w} × ${h} = ${w * h} square ${u}.`],
      meta: { value: w * h },
    });
  },
};

const areaMissing = {
  id: 'area_missing', domain: D, grade: 4, cc: '4.MD.3', name: 'Find a missing side', short: 'missing side',
  gen(rng, tier) {
    const u = rng.pick(UNITS);
    const w = rng.int(3, 12), h = rng.int(2, 12);
    if (tier === 3 && rng.chance(0.6)) {
      const p = 2 * (w + h);
      return P({
        skill: this.id, tier,
        text: `A rectangle has a perimeter of ${p} ${u}. One side is ${w} ${u}. How long is the other side?`,
        answer: num(h),
        choices: makeChoices(rng, h, [{ value: p - w, why: `There are two sides of ${w}. Take away both, then split what is left in half.` }, p / 2, (p - w) / 2, h + 1], labelNum),
        hint: `Two sides are ${w} ${u}. Subtract them from ${p}, then split the rest between the other two sides.`,
        steps: [`${w} + ${w} = ${2 * w}.`, `${p} − ${2 * w} = ${p - 2 * w}.`, `${p - 2 * w} ÷ 2 = ${h} ${u}.`],
        meta: { value: h },
      });
    }
    return P({
      skill: this.id, tier,
      text: `A rectangle has an area of ${w * h} square ${u}. One side is ${w} ${u}. How long is the other side?`,
      visual: { kind: 'rect', w, h: '?', unit: u },
      answer: num(h),
      choices: makeChoices(rng, h, [{ value: w * h - w, why: 'Area is length × width, so divide the area by the side you know.' }, h + 1, h - 1, w], labelNum),
      hint: `${w} times what number makes ${w * h}?`,
      steps: [`Area = ${w} × ? = ${w * h}.`, `${w * h} ÷ ${w} = ${h} ${u}.`],
      meta: { value: h },
    });
  },
};

function angleKind(deg) {
  if (deg < 90) return 'acute';
  if (deg === 90) return 'right';
  if (deg < 180) return 'obtuse';
  return 'straight';
}

const angleType = {
  id: 'angle_type', domain: D, grade: 4, cc: '4.G.1', name: 'Kinds of angles', short: 'acute, right, obtuse',
  gen(rng, tier) {
    const deg = rng.pick(tier === 1 ? [30, 45, 90, 90, 135, 150, 180] : [20, 60, 75, 85, 90, 95, 110, 170, 180]);
    const kind = angleKind(deg);
    const why = {
      acute: 'An acute angle is smaller than a right angle (less than 90°).',
      right: 'A right angle is a square corner: exactly 90°.',
      obtuse: 'An obtuse angle is bigger than a right angle but less than a straight line (between 90° and 180°).',
      straight: 'A straight angle is a straight line: exactly 180°.',
    };
    return P({
      skill: this.id, tier,
      text: tier === 3 ? `An angle measures ${deg}°. What kind of angle is it?` : 'What kind of angle is this?',
      visual: tier === 3 ? null : { kind: 'angle', deg },
      answer: pick(),
      choices: ['acute', 'right', 'obtuse', 'straight'].map((k) => ({ label: k, value: k, correct: k === kind, why: k === kind ? undefined : why[kind] })),
      hint: 'Compare it with a square corner (90°). Smaller is acute, bigger is obtuse.',
      steps: [`The angle is ${deg}°.`, why[kind]],
      answerText: kind,
      meta: { deg },
    });
  },
};

const angleAdd = {
  id: 'angle_add', domain: D, grade: 4, cc: '4.MD.7', name: 'Find a missing angle', short: 'missing angles',
  gen(rng, tier) {
    const total = tier === 1 ? 90 : tier === 2 ? 180 : 360;
    if (tier === 3) {
      const a = rng.int(6, 14) * 10, b = rng.int(6, 14) * 10;
      const c = 360 - a - b;
      return P({
        skill: this.id, tier,
        text: `Three angles meet at a point and fill a full turn. Two of them are ${a}° and ${b}°. What is the third angle?`,
        answer: num(c),
        choices: makeChoices(rng, c, [{ value: 180 - a - b > 0 ? 180 - a - b : 360 - a, why: 'A full turn around a point is 360°.' }, c + 10, c - 10, a + b], labelNum),
        hint: 'All the way around a point is 360°.',
        steps: [`${a} + ${b} = ${a + b}.`, `360 − ${a + b} = ${c}°.`],
        meta: { value: c },
      });
    }
    const a = tier === 1 ? rng.int(2, 17) * 5 : rng.int(4, 32) * 5;
    const b = total - a;
    return P({
      skill: this.id, tier,
      text: tier === 1
        ? `Two angles together make a right angle (90°). One is ${a}°. What is the other?`
        : `Two angles together make a straight line (180°). One is ${a}°. What is the other?`,
      visual: { kind: 'angle', deg: total, split: a, labelA: `${a}°`, labelB: '?' },
      answer: num(b),
      choices: makeChoices(rng, b, [{ value: (tier === 1 ? 180 : 90) - a, why: `The angles add up to ${total}°${tier === 1 ? ' (a right angle)' : ' (a straight line)'}.` }, b + 10, b - 5, a], labelNum),
      hint: `The two angles add up to ${total}°.`,
      steps: [`${a} + ? = ${total}.`, `${total} − ${a} = ${b}°.`],
      meta: { value: b },
    });
  },
};

const SINGULAR = { feet: 'foot', inches: 'inch' };
const one = (unit) => SINGULAR[unit] ?? unit.replace(/s$/, '');

const CONV = [
  ['feet', 'inches', 12], ['yards', 'feet', 3], ['meters', 'centimeters', 100], ['kilometers', 'meters', 1000],
  ['kilograms', 'grams', 1000], ['hours', 'minutes', 60], ['minutes', 'seconds', 60], ['gallons', 'quarts', 4],
  ['pounds', 'ounces', 16], ['days', 'hours', 24], ['liters', 'milliliters', 1000],
];

const convert = {
  id: 'convert', domain: D, grade: 4, cc: '4.MD.1', name: 'Convert measurements', short: 'unit conversion',
  gen(rng, tier) {
    const [big, small, k] = rng.pick(tier === 1 ? CONV.filter((c) => c[2] <= 60) : CONV);
    if (tier === 3) {
      if (rng.chance(0.5)) {
        const a = rng.int(2, 6), b = rng.int(1, k === 1000 ? 999 : k - 1);
        const ans = a * k + b;
        return P({
          skill: this.id, tier,
          text: `How many ${small} are in ${a} ${big} ${fmtInt(b)} ${small}?`,
          answer: num(ans),
          choices: makeChoices(rng, ans, [{ value: a + b, why: `Change the ${big} to ${small} first: 1 ${one(big)} = ${fmtInt(k)} ${small}.` }, a * k, ans + k, a * 10 + b], labelNum),
          hint: `Change ${a} ${big} into ${small}, then add the extra ${fmtInt(b)} ${small}.`,
          steps: [`${a} × ${fmtInt(k)} = ${fmtInt(a * k)} ${small}.`, `${fmtInt(a * k)} + ${fmtInt(b)} = ${fmtInt(ans)} ${small}.`],
          meta: { value: ans },
        });
      }
      const n = rng.int(2, 9);
      return P({
        skill: this.id, tier,
        text: `How many ${big} are in ${fmtInt(n * k)} ${small}?`,
        answer: num(n),
        choices: makeChoices(rng, n, [{ value: n * k * k, why: `Going from small units to big units means dividing by ${fmtInt(k)}.` }, n + 1, n * 10, n - 1], labelNum),
        hint: `Every ${fmtInt(k)} ${small} make 1 ${one(big)}. Divide.`,
        steps: [`${fmtInt(n * k)} ÷ ${fmtInt(k)} = ${n}.`, `So ${fmtInt(n * k)} ${small} = ${n} ${big}.`],
        meta: { value: n },
      });
    }
    const n = tier === 1 ? rng.int(2, 6) : rng.int(3, 12);
    return P({
      skill: this.id, tier,
      text: `How many ${small} are in ${n} ${big}?`,
      answer: num(n * k),
      choices: makeChoices(rng, n * k, [{ value: n + k, why: `Each ${one(big)} is ${fmtInt(k)} ${small}. Multiply, don't add.` }, n * k + k, (n - 1) * k, n * 10], labelNum),
      hint: `1 ${one(big)} = ${fmtInt(k)} ${small}. Multiply by ${n}.`,
      steps: [`1 ${one(big)} = ${fmtInt(k)} ${small}.`, `${n} × ${fmtInt(k)} = ${fmtInt(n * k)} ${small}.`],
      meta: { value: n * k },
    });
  },
};

const volume = {
  id: 'volume', domain: D, grade: 5, cc: '5.MD.5', name: 'Volume of boxes', short: 'volume',
  gen(rng, tier) {
    const u = rng.pick(['ft', 'cm', 'in', 'm']);
    let l = rng.int(2, tier === 1 ? 4 : 10), w = rng.int(2, tier === 1 ? 4 : 8), h = rng.int(2, tier === 1 ? 4 : 6);
    const V = l * w * h;
    if (tier === 3 && rng.chance(0.5)) {
      return P({
        skill: this.id, tier,
        text: `An ice block has a volume of ${V} cubic ${u}. It is ${l} ${u} long and ${w} ${u} wide. How tall is it?`,
        visual: { kind: 'box3d', l, w, h: '?', unit: u },
        answer: num(h),
        choices: makeChoices(rng, h, [{ value: V - l - w, why: `Volume = length × width × height, so divide ${V} by ${l} × ${w}.` }, h + 1, V / l, h * 2], labelNum),
        hint: `Find the area of the bottom (${l} × ${w}), then divide the volume by it.`,
        steps: [`Bottom layer: ${l} × ${w} = ${l * w}.`, `${V} ÷ ${l * w} = ${h} ${u}.`],
        meta: { value: h },
      });
    }
    return P({
      skill: this.id, tier,
      text: `What is the volume of this ice block in cubic ${u}?`,
      visual: { kind: 'box3d', l, w, h, unit: u, cubes: tier === 1 },
      answer: num(V),
      choices: makeChoices(rng, V, [
        { value: l + w + h, why: 'Volume counts the cubes inside: length × width × height.' },
        { value: 2 * (l * w + l * h + w * h), why: 'That is the surface area (the outside). Volume is length × width × height.' },
        l * w, V + l * w,
      ], labelNum),
      hint: 'Volume = length × width × height. Find one layer, then stack the layers.',
      steps: [`One layer: ${l} × ${w} = ${l * w} cubes.`, `${h} layers: ${l * w} × ${h} = ${V} cubic ${u}.`],
      meta: { value: V },
    });
  },
};

const ICONS = ['fish', 'star', 'igloo', 'crystal'];
const ICON_NAMES = { fish: 'fish', star: 'star', igloo: 'igloo', crystal: 'crystal' };

const coord = {
  id: 'coord', domain: D, grade: 5, cc: '5.G.2', name: 'Coordinate grids', short: 'coordinates',
  gen(rng, tier) {
    const neg = tier === 3;
    const lo = neg ? -5 : 0, hi = neg ? 5 : 8;
    const pts = [];
    const icons = rng.shuffle(ICONS).slice(0, 3);
    for (const icon of icons) {
      let x, y;
      do { x = rng.int(lo, hi); y = rng.int(lo, hi); } while ((neg ? (x === 0 || y === 0) : (x === 0 && y === 0)) || pts.some((p) => p.x === x && p.y === y) || (!neg && x === y));
      pts.push({ x, y, icon });
    }
    const target = pts[0];
    const fmtPair = (x, y) => `(${x < 0 ? '−' + -x : x}, ${y < 0 ? '−' + -y : y})`;
    if (rng.chance(0.6)) {
      const correct = fmtPair(target.x, target.y);
      const wrongs = [
        { label: fmtPair(target.y, target.x), why: 'The first number is x (across). The second is y (up).' },
        { label: fmtPair(target.x + 1, target.y) },
        { label: fmtPair(target.x, target.y - 1) },
        neg ? { label: fmtPair(-target.x, target.y), why: 'Left of the center is negative x.' } : { label: fmtPair(target.x - 1, target.y + 1) },
      ];
      const choices = [{ label: correct, value: correct, correct: true }];
      for (const w of wrongs) if (choices.length < 4 && !choices.some((c) => c.label === w.label)) choices.push({ label: w.label, value: w.label, why: w.why });
      return P({
        skill: this.id, tier,
        text: `What are the coordinates of the ${ICON_NAMES[target.icon]}?`,
        visual: { kind: 'grid', lo, hi, points: pts },
        answer: pick(),
        choices: rng.shuffle(choices),
        hint: 'Go across first to find x, then up (or down) to find y.',
        steps: [
          'Start at the center (0, 0).',
          `Go ${target.x < 0 ? 'left' : 'right'} to x = ${fmtPair(target.x, 0).slice(1, -4)}, then ${target.y < 0 ? 'down' : 'up'} to y = ${target.y < 0 ? '−' + -target.y : target.y}.`,
          `The ${ICON_NAMES[target.icon]} is at ${correct}.`,
        ],
        answerText: correct,
        meta: {},
      });
    }
    const askX = rng.chance(0.5);
    const ans = askX ? target.x : target.y;
    return P({
      skill: this.id, tier,
      text: `What is the ${askX ? 'x' : 'y'}-coordinate of the ${ICON_NAMES[target.icon]}?`,
      visual: { kind: 'grid', lo, hi, points: pts },
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: askX ? target.y : target.x, why: `The x-coordinate goes across. The y-coordinate goes up and down.` }, ans + 1, ans - 1, -ans], labelNum),
      hint: askX ? 'x is how far across (left or right).' : 'y is how far up or down.',
      steps: [`The ${ICON_NAMES[target.icon]} is at ${fmtPair(target.x, target.y)}.`, `The ${askX ? 'first (x)' : 'second (y)'} number is ${ans < 0 ? '−' + -ans : ans}.`],
      meta: { value: ans },
    });
  },
};

const areaTri = {
  id: 'area_tri', domain: D, grade: 6, cc: '6.G.1', name: 'Area of triangles and parallelograms', short: 'triangles',
  gen(rng, tier) {
    const u = rng.pick(UNITS);
    const b = rng.int(3, 14), h = rng.int(2, 12);
    const para = tier === 1 || (tier === 3 && rng.chance(0.3));
    if (para) {
      return P({
        skill: this.id, tier,
        text: `What is the area of this parallelogram in square ${u}?`,
        visual: { kind: 'triangle', shape: 'para', b, h, unit: u },
        answer: num(b * h),
        choices: makeChoices(rng, b * h, [{ value: (b * h) / 2, why: 'A parallelogram is not a triangle. Its area is base × height.' }, b + h, 2 * (b + h), b * h + b], labelNum),
        hint: 'Slide the slanted end over and it becomes a rectangle. Area = base × height.',
        steps: [`Area = base × height.`, `${b} × ${h} = ${b * h} square ${u}.`],
        meta: { value: b * h },
      });
    }
    const A = new Frac(b * h, 2);
    return P({
      skill: this.id, tier,
      text: `What is the area of this triangle in square ${u}?`,
      visual: { kind: 'triangle', shape: 'tri', b, h, unit: u },
      answer: num(A),
      choices: makeChoices(rng, A, [{ value: b * h, why: 'A triangle is half of a rectangle. Divide base × height by 2.' }, b + h, A.add(b), A.sub(1)], labelNum),
      hint: 'A triangle is half of a rectangle with the same base and height.',
      steps: [`Base × height = ${b} × ${h} = ${b * h}.`, `Half of ${b * h} is ${fmtNum(A.value)} square ${u}.`],
      meta: { value: A },
    });
  },
};

const surface = {
  id: 'surface_area', domain: D, grade: 6, cc: '6.G.4', name: 'Surface area', short: 'surface area',
  gen(rng, tier) {
    const u = rng.pick(['ft', 'cm', 'in', 'm']);
    if (tier === 1) {
      const s = rng.int(2, 9);
      return P({
        skill: this.id, tier,
        text: `A cube of ice has edges ${s} ${u} long. What is its surface area in square ${u}?`,
        visual: { kind: 'box3d', l: s, w: s, h: s, unit: u },
        answer: num(6 * s * s),
        choices: makeChoices(rng, 6 * s * s, [{ value: s * s * s, why: 'That is the volume. Surface area adds up the 6 square faces.' }, 4 * s * s, s * s, 6 * s], labelNum),
        hint: 'A cube has 6 faces. Each face is a square.',
        steps: [`One face: ${s} × ${s} = ${s * s}.`, `6 faces: 6 × ${s * s} = ${6 * s * s} square ${u}.`],
        meta: { value: 6 * s * s },
      });
    }
    const l = rng.int(2, 10), w = rng.int(2, 8), h = rng.int(2, 7);
    const SA = 2 * (l * w + l * h + w * h);
    return P({
      skill: this.id, tier,
      text: `What is the surface area of this box in square ${u}?`,
      visual: { kind: 'box3d', l, w, h, unit: u },
      answer: num(SA),
      choices: makeChoices(rng, SA, [
        { value: l * w * h, why: 'That is the volume. Surface area is the area of all 6 faces.' },
        { value: l * w + l * h + w * h, why: 'Every face has a matching face on the opposite side. Double it.' },
        SA + 2 * l, SA - 2 * w,
      ], labelNum),
      hint: 'A box has 3 pairs of matching faces: top and bottom, front and back, left and right.',
      steps: [`Top and bottom: 2 × ${l} × ${w} = ${2 * l * w}.`, `Front and back: 2 × ${l} × ${h} = ${2 * l * h}.`, `Sides: 2 × ${w} × ${h} = ${2 * w * h}.`, `Total: ${2 * l * w} + ${2 * l * h} + ${2 * w * h} = ${SA} square ${u}.`],
      meta: { value: SA },
    });
  },
};

// Reading a protractor: the classic slip is reading the other scale, which gives 180 minus the angle.
const protractor = {
  id: 'protractor', domain: D, grade: 4, cc: '4.MD.6', name: 'Measure angles with a protractor', short: 'protractor',
  gen(rng, tier) {
    let deg = tier === 1 ? rng.int(2, 16) * 10 : rng.int(3, 33) * 5;
    if (deg === 90) deg = tier === 1 ? 70 : 115;
    const from = tier === 3 ? 'left' : 'right';
    return P({
      skill: this.id, tier,
      text: 'Read the protractor. How many degrees is the angle?',
      visual: { kind: 'protractor', deg, from },
      answer: num(deg),
      choices: makeChoices(rng, deg, [
        { value: 180 - deg, why: `Start at the 0 that sits on the angle's first ray (on the ${from}) and use that scale.` },
        deg + 10, deg - 10, deg + 5,
      ], labelNum),
      hint: `Find the 0 where the first ray lies (on the ${from}). Count along that scale to the other ray. Is the angle smaller or bigger than a square corner (90°)?`,
      steps: [`The first ray is on the ${from}, so use the scale that starts at 0 on the ${from}.`, `The other ray points to ${deg}°.`, `The angle is ${deg < 90 ? 'smaller' : 'bigger'} than 90°, so ${deg}° makes sense.`],
      meta: { value: deg },
    });
  },
};

// Lines of symmetry. Lines are in the same units as SHAPES in visuals.js.
const SYMMETRY = {
  square: { n: 4, yes: [[[0.5, -0.1], [0.5, 1.1]], [[0, 0], [1, 1]]], no: [] },
  rectangle: { n: 2, yes: [[[0.85, 0], [0.85, 1]], [[0, 0.5], [1.7, 0.5]]], no: [[[0, 0], [1.7, 1]]] },
  rhombus: { n: 2, yes: [[[0.8, 0], [0.8, 1.2]], [[0, 0.6], [1.6, 0.6]]], no: [] },
  parallelogram: { n: 0, yes: [], no: [[[0.9, 0], [0.9, 0.9]], [[0, 0], [1.8, 0.9]]] },
  trapezoid: { n: 1, yes: [[[0.9, 0], [0.9, 0.9]]], no: [[[0, 0.45], [1.8, 0.45]]] },
  kite: { n: 1, yes: [[[0.6, 0], [0.6, 1.5]]], no: [[[0, 1.0], [1.2, 1.0]]] },
  equilateral: { n: 3, yes: [[[0.5, 0], [0.5, Math.sqrt(3) / 2]]], no: [] },
  isosceles: { n: 1, yes: [[[0.5, 0], [0.5, 1.25]]], no: [[[0, 0.5], [1, 0.5]]] },
  scalene: { n: 0, yes: [], no: [[[0.55, 0], [0.55, 0.8]]] },
  hexagon: { n: 6, yes: [[[-1, 0], [1, 0]]], no: [] },
  pentagon: { n: 5, yes: [[[0, -1], [0, 1]]], no: [] },
};
const SHAPE_WORDS = {
  square: 'square', rectangle: 'rectangle', rhombus: 'rhombus', parallelogram: 'parallelogram', trapezoid: 'trapezoid',
  kite: 'kite', equilateral: 'triangle', isosceles: 'triangle', scalene: 'triangle', hexagon: 'hexagon', pentagon: 'pentagon',
};

const symmetry = {
  id: 'symmetry', domain: D, grade: 4, cc: '4.G.3', name: 'Lines of symmetry', short: 'symmetry',
  gen(rng, tier) {
    if (tier === 1) {
      // Is the dashed line a line of symmetry? Folding along it must match both halves exactly.
      const pool = Object.entries(SYMMETRY).flatMap(([name, s]) => [...s.yes.map((l) => ({ name, l, ok: true })), ...s.no.map((l) => ({ name, l, ok: false }))]);
      const q = rng.pick(pool);
      const word = SHAPE_WORDS[q.name];
      const why = q.ok ? 'Fold along the line: both halves land exactly on top of each other.' : 'Fold along the line: the two halves do not match up, so it is not a line of symmetry.';
      return P({
        skill: this.id, tier,
        text: `Is the dashed line a line of symmetry for this ${word}?`,
        visual: { kind: 'shape', name: q.name, line: q.l },
        answer: pick(),
        choices: [
          { label: 'Yes', value: 'yes', correct: q.ok, why: q.ok ? undefined : why },
          { label: 'No', value: 'no', correct: !q.ok, why: q.ok ? why : undefined },
        ],
        hint: 'Imagine folding the shape along the dashed line. Would the two halves match exactly?',
        steps: [why],
        answerText: q.ok ? 'Yes' : 'No',
      });
    }
    const names = tier === 2 ? ['square', 'rectangle', 'isosceles', 'scalene', 'kite', 'equilateral'] : ['rhombus', 'parallelogram', 'trapezoid', 'hexagon', 'pentagon', 'rectangle', 'equilateral'];
    const name = rng.pick(names);
    const n = SYMMETRY[name].n;
    const word = SHAPE_WORDS[name];
    const tips = {
      rectangle: 'A rectangle folds in half up-and-down and side-to-side, but not along a diagonal.',
      parallelogram: 'A slanted parallelogram has no fold where both halves match, not even the diagonals.',
      square: 'A square folds evenly across the middle both ways and along both diagonals.',
    };
    return P({
      skill: this.id, tier,
      text: `How many lines of symmetry does this ${word} have?`,
      visual: { kind: 'shape', name },
      answer: num(n),
      choices: makeChoices(rng, n, [n + 1, Math.max(0, n - 1), n + 2, name === 'rectangle' ? 4 : 2, 0, 1].map((v) => (v === n ? null : { value: v, why: tips[name] })), (v) => String(v), 4, { allowNeg: true }),
      hint: 'Look for every way to fold the shape so both halves match exactly. Try up-and-down, side-to-side and corner-to-corner.',
      steps: [tips[name] ?? `There ${n === 1 ? 'is' : 'are'} ${n} way${n === 1 ? '' : 's'} to fold this ${word} so both halves match.`, `So it has ${n} line${n === 1 ? '' : 's'} of symmetry.`],
      meta: { value: n },
    });
  },
};

// Classify triangles by angles and quadrilaterals by sides and angles.
const classify = {
  id: 'shape_classify', domain: D, grade: 4, cc: '4.G.2', name: 'Classify shapes', short: 'classify shapes',
  gen(rng, tier) {
    if (tier === 1) {
      const [name, kind] = rng.pick([['rightTriangle', 'right'], ['obtuseTriangle', 'obtuse'], ['acuteTriangle', 'acute'], ['equilateral', 'acute']]);
      const why = { right: 'It has one square corner (90°), so it is a right triangle.', obtuse: 'One angle is wider than a square corner, so it is an obtuse triangle.', acute: 'Every angle is smaller than a square corner, so it is an acute triangle.' };
      return P({
        skill: this.id, tier,
        text: 'What kind of triangle is this?',
        visual: { kind: 'shape', name },
        answer: pick(),
        choices: ['acute', 'right', 'obtuse'].map((k) => ({ label: `${k} triangle`, value: k, correct: k === kind, why: k === kind ? undefined : why[kind] })),
        hint: 'Look at the biggest angle. Is it smaller than, equal to, or bigger than a square corner?',
        steps: [why[kind]],
        answerText: `${kind} triangle`,
      });
    }
    if (tier === 2) {
      const facts = {
        square: '4 equal sides and 4 right angles',
        rectangle: '4 right angles, with opposite sides equal',
        rhombus: '4 equal sides, but no right angles',
        parallelogram: '2 pairs of parallel sides, but no right angles and not all sides equal',
        trapezoid: 'exactly 1 pair of parallel sides',
      };
      const name = rng.pick(Object.keys(facts));
      return P({
        skill: this.id, tier,
        text: 'What is the best name for this shape?',
        visual: { kind: 'shape', name },
        answer: pick(),
        choices: rng.shuffle(Object.keys(facts)).slice(0, 4).concat(name).filter((v, i, a) => a.indexOf(v) === i).slice(-4)
          .map((k) => ({ label: k, value: k, correct: k === name, why: k === name ? undefined : `This shape has ${facts[name]}.` })),
        hint: 'Count the equal sides (the little tick marks) and look for square corners and parallel sides.',
        steps: [`It has ${facts[name]}.`, `So the best name is ${name}.`],
        answerText: name,
      });
    }
    const q = rng.pick([
      { text: 'A shape has 4 equal sides and no right angles. What is it?', a: 'rhombus', why: 'Equal sides with no square corners make a rhombus. A square would need right angles.' },
      { text: 'A four-sided shape has exactly one pair of parallel sides. What is it?', a: 'trapezoid', why: 'Exactly one pair of parallel sides is a trapezoid.' },
      { text: 'A shape has 4 right angles but its sides are not all equal. What is it?', a: 'rectangle', why: 'Four right angles with unequal sides make a rectangle, not a square.' },
      { text: 'A shape has 4 equal sides and 4 right angles. What is the best name for it?', a: 'square', why: 'It is also a rectangle and a rhombus, but square is the most exact name.' },
      { text: 'A triangle has one angle of 120°. What kind of triangle is it?', a: 'obtuse triangle', why: '120° is wider than 90°, so the triangle is obtuse.' },
      { text: 'A triangle has one angle of exactly 90°. What kind of triangle is it?', a: 'right triangle', why: 'A 90° angle is a right angle.' },
    ]);
    const options = q.a.includes('triangle') ? ['acute triangle', 'right triangle', 'obtuse triangle'] : ['square', 'rectangle', 'rhombus', 'trapezoid'];
    return P({
      skill: this.id, tier,
      text: q.text,
      answer: pick(),
      choices: options.map((k) => ({ label: k, value: k, correct: k === q.a, why: k === q.a ? undefined : q.why })),
      hint: 'Picture the shape. Check the sides, the corners and any parallel sides.',
      steps: [q.why],
      answerText: q.a,
    });
  },
};

const volumeComposite = {
  id: 'volume_composite', domain: D, grade: 5, cc: '5.MD.5c', name: 'Volume of joined boxes', short: 'composite volume',
  gen(rng, tier) {
    const u = rng.pick(['ft', 'm', 'cm', 'in']);
    const big = tier === 1 ? 4 : 7;
    const w = rng.int(2, tier === 1 ? 3 : 5);
    const a = { l: rng.int(2, big), h: rng.int(1, big) };
    const b = { l: rng.int(2, big), h: rng.int(1, big) };
    if (a.h === b.h) b.h = a.h === 1 ? 3 : a.h - 1;
    const Va = a.l * w * a.h, Vb = b.l * w * b.h, V = Va + Vb;
    const steps = [`Box A: ${a.l} × ${w} × ${a.h} = ${Va} cubic ${u}.`, `Box B: ${b.l} × ${w} × ${b.h} = ${Vb} cubic ${u}.`];
    if (tier === 3) {
      return P({
        skill: this.id, tier,
        text: `These two boxes are joined together. Their total volume is ${V} cubic ${u}. How tall is box B?`,
        visual: { kind: 'boxes', a, b: { ...b, label: '?' }, w, unit: u },
        answer: num(b.h),
        choices: makeChoices(rng, b.h, [
          { value: Math.max(1, Math.round(V / (b.l * w))), why: `First take away box A's volume: ${V} − ${Va} = ${Vb}. Then divide by ${b.l} × ${w}.` },
          b.h + 1, b.h + 2, Math.max(1, b.h - 1), a.h,
        ], labelNum),
        hint: `Find box A's volume and subtract it from ${V}. What is left is box B. Then divide by its bottom (${b.l} × ${w}).`,
        steps: [steps[0], `Box B: ${V} − ${Va} = ${Vb} cubic ${u}.`, `Height: ${Vb} ÷ (${b.l} × ${w}) = ${Vb} ÷ ${b.l * w} = ${b.h} ${u}.`],
        meta: { value: b.h },
      });
    }
    const story = tier === 2 && rng.chance(0.5)
      ? `A stone step is made of two boxes joined together. How much space does it take up, in cubic ${u}?`
      : `These two boxes are joined together. What is the total volume in cubic ${u}?`;
    return P({
      skill: this.id, tier,
      text: story,
      visual: { kind: 'boxes', a, b, w, unit: u },
      answer: num(V),
      choices: makeChoices(rng, V, [
        { value: (a.l + b.l) * w * Math.max(a.h, b.h), why: 'The boxes have different heights. Find the volume of each box, then add.' },
        { value: Va, why: 'That is only box A. Add box B too.' },
        { value: Vb, why: 'That is only box B. Add box A too.' },
        V + w, (a.l + b.l) * w * Math.min(a.h, b.h),
      ], labelNum),
      hint: 'Split the shape into its two boxes. Find each volume (length × width × height), then add them.',
      steps: [...steps, `Total: ${Va} + ${Vb} = ${V} cubic ${u}.`],
      meta: { value: V },
    });
  },
};

const METRIC = [['meters', 'centimeters', 100], ['kilometers', 'meters', 1000], ['kilograms', 'grams', 1000], ['liters', 'milliliters', 1000]];

const convert5 = {
  id: 'convert5', domain: D, grade: 5, cc: '5.MD.1', name: 'Metric conversions with decimals', short: 'metric decimals',
  gen(rng, tier) {
    if (tier === 3) {
      const who = friend(rng);
      const kind = rng.pick(['juice', 'ribbon', 'walk']);
      if (kind === 'juice') {
        const cup = rng.pick([200, 250, 500]);
        const cups = rng.int(3, 16);
        const total = cup * cups;
        const L = F(total, 1000);
        return P({
          skill: this.id, tier,
          text: `${who} has ${fmtNum(L.value)} liters of juice and pours it into cups that hold ${cup} milliliters each. How many cups can ${who} fill?`,
          answer: num(cups),
          choices: makeChoices(rng, cups, [{ value: Math.max(1, Math.round((L.value * 100) / cup)), why: '1 liter is 1,000 milliliters, not 100.' }, cups + 1, cups * 10, Math.max(1, cups - 2)], labelNum),
          hint: 'Change liters to milliliters first (1 liter = 1,000 milliliters), then divide by the size of one cup.',
          steps: [`${fmtNum(L.value)} liters = ${fmtInt(total)} milliliters.`, `${fmtInt(total)} ÷ ${cup} = ${cups} cups.`],
          meta: { value: cups },
        });
      }
      if (kind === 'ribbon') {
        const piece = rng.pick([20, 25, 50]);
        const pieces = rng.int(3, 18);
        const cm = piece * pieces;
        const m = F(cm, 100);
        return P({
          skill: this.id, tier,
          text: `A ribbon is ${fmtNum(m.value)} meters long. ${who} cuts it into pieces that are ${piece} centimeters long. How many pieces does ${who} get?`,
          answer: num(pieces),
          choices: makeChoices(rng, pieces, [{ value: Math.max(1, Math.round((m.value * 1000) / piece)), why: '1 meter is 100 centimeters.' }, pieces + 1, pieces * 2, Math.max(1, pieces - 1)], labelNum),
          hint: 'Change meters to centimeters first (1 meter = 100 centimeters), then divide by the length of one piece.',
          steps: [`${fmtNum(m.value)} meters = ${fmtInt(cm)} centimeters.`, `${fmtInt(cm)} ÷ ${piece} = ${pieces} pieces.`],
          meta: { value: pieces },
        });
      }
      const km = F(rng.int(11, 39), 10), back = rng.int(2, 9) * 100;
      const ans = km.value * 1000 + back;
      return P({
        skill: this.id, tier,
        text: `${who} walks ${fmtNum(km.value)} kilometers to the market and ${back} meters more to the dock. How many meters is that in all?`,
        answer: num(Math.round(ans)),
        choices: makeChoices(rng, Math.round(ans), [{ value: Math.round(km.value * 100 + back), why: '1 kilometer is 1,000 meters.' }, Math.round(km.value * 1000), Math.round(ans) + 100, Math.round(ans) - 100], labelNum),
        hint: 'Change kilometers to meters (1 kilometer = 1,000 meters), then add.',
        steps: [`${fmtNum(km.value)} kilometers = ${fmtInt(Math.round(km.value * 1000))} meters.`, `${fmtInt(Math.round(km.value * 1000))} + ${back} = ${fmtInt(Math.round(ans))} meters.`],
        meta: { value: Math.round(ans) },
      });
    }
    const [big, small, k] = rng.pick(METRIC);
    const places = k === 100 ? rng.int(1, 2) : rng.int(1, 3);
    let n = rng.int(1, 10 ** places * 9);
    if (n % 10 === 0) n += 1;
    if (tier === 1) {
      const x = F(n + 10 ** places * rng.int(1, 5), 10 ** places);
      const ans = x.mul(k);
      return P({
        skill: this.id, tier,
        text: `${fmtNum(x.value)} ${big} = how many ${small}?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [
          { value: x.mul(k / 10), why: `1 ${one(big)} = ${fmtInt(k)} ${small}. Multiply by ${fmtInt(k)}: move the point ${String(k).length - 1} places right.` },
          { value: x.div(k), why: `Big units to small units means MORE of them: multiply by ${fmtInt(k)}.` },
          x.mul(k * 10), ans.add(1),
        ], labelNum),
        hint: `1 ${one(big)} = ${fmtInt(k)} ${small}. Multiply ${fmtNum(x.value)} by ${fmtInt(k)}.`,
        steps: [`1 ${one(big)} = ${fmtInt(k)} ${small}.`, `${fmtNum(x.value)} × ${fmtInt(k)} = ${fmtNum(ans.value)} ${small}.`],
        meta: { value: ans },
      });
    }
    const whole = rng.int(1, 9) * (k === 100 ? 1 : 10) + (k === 100 ? 0 : rng.int(1, 9));
    const amount = rng.chance(0.3) ? rng.int(1, 9) : whole;
    const ans = F(amount, k);
    return P({
      skill: this.id, tier,
      text: `${fmtInt(amount)} ${small} = how many ${big}?`,
      answer: num(ans),
      choices: makeChoices(rng, ans, [
        { value: F(amount * k, 1), why: `Small units to big units means FEWER of them: divide by ${fmtInt(k)}.` },
        { value: ans.mul(10), why: `Divide by ${fmtInt(k)}: move the point ${String(k).length - 1} places left.` },
        ans.div(10), ans.mul(100),
      ], labelNum),
      hint: `${fmtInt(k)} ${small} make 1 ${one(big)}. Divide ${fmtInt(amount)} by ${fmtInt(k)}.`,
      steps: [`1 ${one(big)} = ${fmtInt(k)} ${small}.`, `${fmtInt(amount)} ÷ ${fmtInt(k)} = ${fmtNum(ans.value)} ${big}.`],
      meta: { value: ans },
    });
  },
};

const HIER = [
  { s: 'A square is ___ a rectangle.', a: 'always', why: 'A square has 4 right angles, so it is always a rectangle.' },
  { s: 'A square is ___ a rhombus.', a: 'always', why: 'A square has 4 equal sides, so it is always a rhombus.' },
  { s: 'A rectangle is ___ a square.', a: 'sometimes', why: 'Only a rectangle with 4 equal sides is a square.' },
  { s: 'A rhombus is ___ a square.', a: 'sometimes', why: 'Only a rhombus with 4 right angles is a square.' },
  { s: 'A rectangle is ___ a parallelogram.', a: 'always', why: 'A rectangle has 2 pairs of parallel sides, so it is always a parallelogram.' },
  { s: 'A rhombus is ___ a parallelogram.', a: 'always', why: 'Opposite sides of a rhombus are parallel, so it is always a parallelogram.' },
  { s: 'A parallelogram is ___ a rectangle.', a: 'sometimes', why: 'Only a parallelogram with right angles is a rectangle.' },
  { s: 'A parallelogram is ___ a quadrilateral.', a: 'always', why: 'A parallelogram has 4 sides, so it is always a quadrilateral.' },
  { s: 'A quadrilateral is ___ a rectangle.', a: 'sometimes', why: 'Some quadrilaterals have 4 right angles, but many do not.' },
  { s: 'A triangle is ___ a quadrilateral.', a: 'never', why: 'A triangle has 3 sides. A quadrilateral has 4.' },
  { s: 'A pentagon is ___ a parallelogram.', a: 'never', why: 'A parallelogram has 4 sides. A pentagon has 5.' },
];

const hierarchy = {
  id: 'shape_hierarchy', domain: D, grade: 5, cc: '5.G.4', name: 'Shape families', short: 'shape families',
  gen(rng, tier) {
    if (tier === 2) {
      const q = rng.pick(HIER);
      return P({
        skill: this.id, tier,
        text: `Fill in the blank: ${q.s}`,
        answer: pick(),
        choices: ['always', 'sometimes', 'never'].map((k) => ({ label: k, value: k, correct: k === q.a, why: k === q.a ? undefined : q.why })),
        hint: 'Think of the rules each shape must follow. Does the first shape always follow the second shape\'s rules?',
        steps: [q.why, `So: ${q.s.replace('___', q.a)}`],
        answerText: q.a,
      });
    }
    if (tier === 1) {
      const q = rng.pick([
        { text: 'Which shape is ALWAYS a rectangle?', a: 'square', wrong: { rhombus: 'A rhombus does not need right angles.', parallelogram: 'A parallelogram does not need right angles.', trapezoid: 'A trapezoid has only one pair of parallel sides.' } },
        { text: 'Which shape is ALWAYS a rhombus?', a: 'square', wrong: { rectangle: 'A rectangle\'s sides do not all have to be equal.', parallelogram: 'A parallelogram\'s sides do not all have to be equal.', trapezoid: 'A trapezoid does not have 4 equal sides.' } },
        { text: 'Which shape is ALWAYS a parallelogram?', a: 'rectangle', wrong: { trapezoid: 'A trapezoid has only one pair of parallel sides.', triangle: 'A triangle has only 3 sides.', pentagon: 'A pentagon has 5 sides.' } },
        { text: 'Which shape is ALWAYS a parallelogram?', a: 'rhombus', wrong: { trapezoid: 'A trapezoid has only one pair of parallel sides.', triangle: 'A triangle has only 3 sides.', hexagon: 'A hexagon has 6 sides.' } },
      ]);
      return P({
        skill: this.id, tier,
        text: q.text,
        answer: pick(),
        choices: rng.shuffle([q.a, ...Object.keys(q.wrong)]).map((k) => ({ label: k, value: k, correct: k === q.a, why: q.wrong[k] })),
        hint: 'Check the rules: a rectangle needs 4 right angles, a rhombus 4 equal sides, a parallelogram 2 pairs of parallel sides.',
        steps: [`A ${q.a} always follows those rules.`, `So the answer is ${q.a}.`],
        answerText: q.a,
      });
    }
    const q = rng.pick([
      {
        text: 'Every square is a rhombus. Is every rhombus a square?',
        a: 'No: a rhombus does not need right angles',
        wrong: ['Yes: they both have 4 equal sides', 'Yes: they are both parallelograms', 'No: a rhombus does not have 4 equal sides'],
        why: 'A rhombus has 4 equal sides, but its corners do not have to be right angles. A square needs both.',
      },
      {
        text: 'Every rectangle is a parallelogram. Is every parallelogram a rectangle?',
        a: 'No: a parallelogram does not need right angles',
        wrong: ['Yes: they both have 2 pairs of parallel sides', 'Yes: they both have 4 sides', 'No: a parallelogram has no parallel sides'],
        why: 'A parallelogram has 2 pairs of parallel sides, but its corners can be slanted. A rectangle needs 4 right angles.',
      },
      {
        text: 'Which shape belongs to ALL of these families: rectangles, rhombuses and parallelograms?',
        a: 'square',
        wrong: ['rectangle', 'rhombus', 'trapezoid'],
        why: 'A square has 4 right angles (a rectangle), 4 equal sides (a rhombus) and 2 pairs of parallel sides (a parallelogram).',
      },
    ]);
    return P({
      skill: this.id, tier,
      text: q.text,
      answer: pick(),
      choices: rng.shuffle([q.a, ...q.wrong]).map((k) => ({ label: k, value: k, correct: k === q.a, why: k === q.a ? undefined : q.why })),
      hint: 'A shape belongs to a family when it follows ALL of that family\'s rules.',
      steps: [q.why],
      answerText: q.a,
    });
  },
};

// Area of trapezoids and of shapes made from a rectangle and a triangle: split, find each part, add.
const areaPoly = {
  id: 'area_poly', domain: D, grade: 6, cc: '6.G.1', name: 'Area of trapezoids and composite shapes', short: 'composite area',
  gen(rng, tier) {
    const u = rng.pick(['ft', 'm', 'cm', 'in']);
    if (tier === 1 || (tier === 2 && rng.chance(0.5))) {
      // A house shape: a rectangle with a triangle roof.
      const w = 2 * rng.int(2, 6), h = rng.int(2, 7), t = rng.int(2, 6);
      const rect = w * h, roof = (w * t) / 2, ans = rect + roof;
      return P({
        skill: this.id, tier,
        text: `This shape is a rectangle with a triangle on top. What is its area in square ${u}?`,
        visual: { kind: 'poly', pts: [[0, 0], [w, 0], [w, h], [w / 2, h + t], [0, h]], split: [[0, h, w, h]], labels: [{ at: [w / 2, -0.6], text: `${w} ${u}` }, { at: [w + 0.4, h / 2], text: `${h} ${u}`, anchor: 'start' }, { at: [w / 2 + 0.4, h + t / 2], text: `${t} ${u}`, anchor: 'start' }], height: [w / 2, h, w / 2, h + t] },
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: rect + w * t, why: 'The roof is a triangle: half of base × height.' }, { value: rect, why: 'Add the triangle on top as well.' }, ans + w, w * (h + t)], labelNum),
        hint: 'Split it into the rectangle and the triangle. Find each area, then add.',
        steps: [`Rectangle: ${w} × ${h} = ${rect}.`, `Triangle: ${w} × ${t} ÷ 2 = ${roof}.`, `Total: ${rect} + ${roof} = ${ans} square ${u}.`],
        meta: { value: ans },
      });
    }
    // A trapezoid: the average of the two parallel sides, times the height.
    let a = rng.int(3, 10), b = rng.int(4, 14);
    if (a === b) b += 2;
    if (a > b) [a, b] = [b, a];
    let h = rng.int(2, 8);
    if ((a + b) % 2 && h % 2) h += 1;
    const ans = ((a + b) * h) / 2;
    const off = (b - a) / 2;
    return P({
      skill: this.id, tier,
      text: `What is the area of this trapezoid in square ${u}?`,
      visual: { kind: 'poly', pts: [[0, 0], [b, 0], [b - off, h], [off, h]], labels: [{ at: [b / 2, -0.6], text: `${b} ${u}` }, { at: [b / 2, h + 0.6], text: `${a} ${u}` }, { at: [off + 0.3, h / 2], text: `${h} ${u}`, anchor: 'start' }], height: [off, 0, off, h] },
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: (a + b) * h, why: 'Two copies of this trapezoid make a parallelogram. The trapezoid is half of it.' }, { value: a * b, why: 'Use the height, not the two bases multiplied together.' }, b * h, ans + h], labelNum),
      hint: `Two copies of this trapezoid fit together into a parallelogram with base ${a} + ${b}.`,
      steps: [`${a} + ${b} = ${a + b}.`, `${a + b} × ${h} = ${(a + b) * h} (two trapezoids).`, `Half of that: ${ans} square ${u}.`],
      meta: { value: ans },
    });
  },
};

// Volume with fraction edges, and packing a box with small unit-fraction cubes.
const volumeFrac = {
  id: 'volume_frac', domain: D, grade: 6, cc: '6.G.2', name: 'Volume with fraction edges', short: 'fraction volume',
  gen(rng, tier) {
    const u = rng.pick(['ft', 'in', 'cm', 'm']);
    if (tier === 3 && rng.chance(0.5)) {
      // How many half-unit cubes pack the box?
      const l = rng.int(1, 4), w = rng.int(1, 3), h = rng.int(1, 3);
      const ans = l * 2 * w * 2 * h * 2;
      return P({
        skill: this.id, tier,
        text: `A box is ${l} ${u} long, ${w} ${u} wide and ${h} ${u} tall. How many cubes with {1/2}-${u} edges fill it?`,
        visual: { kind: 'box3d', l, w, h, unit: u },
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: l * w * h, why: 'Those would be whole cubes. Each edge fits 2 half cubes.' }, { value: l * w * h * 2, why: 'Two half cubes fit along every edge: long, wide and tall. That is 2 × 2 × 2 = 8 per whole cube.' }, ans / 2, ans + 8], labelNum),
        hint: `Along each edge, twice as many half cubes fit: ${l * 2} by ${w * 2} by ${h * 2}.`,
        steps: [`${l * 2} half cubes long, ${w * 2} wide and ${h * 2} tall.`, `${l * 2} × ${w * 2} × ${h * 2} = ${ans} cubes.`],
        meta: { value: ans },
      });
    }
    const half = 2 * rng.int(1, 4) + 1;
    const lFrac = F(half, 2);
    const w = tier === 1 ? 2 * rng.int(1, 3) : rng.int(2, 5), h = rng.int(2, 5);
    const V = lFrac.mul(w * h);
    const lText = `{${(half - 1) / 2} 1/2}`;
    return P({
      skill: this.id, tier,
      text: `A box is ${lText} ${u} long, ${w} ${u} wide and ${h} ${u} tall. What is its volume in cubic ${u}?`,
      visual: { kind: 'box3d', l: half / 2, w, h, unit: u, lLabel: `${(half - 1) / 2}½` },
      answer: frac(V),
      choices: makeChoices(rng, V, [{ value: F((half - 1) / 2 * w * h, 1), why: `Don't drop the half: ${lText} × ${w} × ${h}.` }, V.add(w * h), F(half * w * h, 1), V.add(1)], labelFrac(true)),
      hint: `Volume = length × width × height. ${lText} is the same as {${half}/2}.`,
      steps: [`${w} × ${h} = ${w * h}.`, `{${half}/2} × ${w * h} = {${half * w * h}/2}.`, `That is ${fmtNum(V.value)} cubic ${u}.`],
      meta: { value: V },
    });
  },
};

// Polygons drawn on the coordinate plane: a missing corner, and side lengths from the coordinates.
const coordPoly = {
  id: 'coord_poly', domain: D, grade: 6, cc: '6.G.3', name: 'Polygons on the coordinate plane', short: 'coordinate polygons',
  gen(rng, tier) {
    const lo = tier === 1 ? 1 : -5;
    let x1 = rng.int(lo, 2), x2 = x1 + rng.int(2, 6), y1 = rng.int(lo, 1), y2 = y1 + rng.int(2, 5);
    const p = (x, y) => `(${x < 0 ? '−' + -x : x}, ${y < 0 ? '−' + -y : y})`;
    if (tier === 3 || rng.chance(0.5)) {
      const w = x2 - x1, h = y2 - y1;
      const askArea = rng.chance(0.5);
      const ans = askArea ? w * h : 2 * (w + h);
      return P({
        skill: this.id, tier,
        text: `A rectangle has corners ${p(x1, y1)}, ${p(x2, y1)}, ${p(x2, y2)} and ${p(x1, y2)}. What is its ${askArea ? 'area' : 'perimeter'}?`,
        visual: { kind: 'grid', lo: Math.min(-1, lo), hi: Math.max(6, x2, y2), points: [], poly: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]] },
        answer: num(ans),
        choices: makeChoices(rng, ans, [askArea ? { value: 2 * (w + h), why: 'That is the perimeter. Area is width × height.' } : { value: w * h, why: 'That is the area. Perimeter adds all 4 sides.' }, askArea ? w + h : w + h, ans + 2, Math.abs(x2 + x1) * Math.abs(y2 + y1) + 1], labelNum),
        hint: `Width: subtract the x numbers. Height: subtract the y numbers.`,
        steps: [`Width = ${x2} − ${x1 < 0 ? `(−${-x1})` : x1} = ${w}.`, `Height = ${y2} − ${y1 < 0 ? `(−${-y1})` : y1} = ${h}.`, askArea ? `Area = ${w} × ${h} = ${ans}.` : `Perimeter = 2 × (${w} + ${h}) = ${ans}.`],
        meta: { value: ans },
      });
    }
    const correct = p(x1, y2);
    const choices = [
      { label: correct, value: 'c', correct: true },
      { label: p(y2, x1), value: 'w1', why: 'x comes first, then y.' },
      { label: p(x2, y2 + 1), value: 'w2', why: `The missing corner lines up with ${p(x1, y1)} (same x) and with ${p(x2, y2)} (same y).` },
      { label: p(x1, y1 - 1), value: 'w3', why: `It has to be level with ${p(x2, y2)}: y = ${y2}.` },
    ];
    return P({
      skill: this.id, tier,
      text: `Three corners of a rectangle are ${p(x1, y1)}, ${p(x2, y1)} and ${p(x2, y2)}. Where is the fourth corner?`,
      visual: { kind: 'grid', lo: Math.min(-1, lo), hi: Math.max(6, x2, y2), points: [{ x: x1, y: y1, icon: 'star' }, { x: x2, y: y1, icon: 'star' }, { x: x2, y: y2, icon: 'star' }] },
      answer: pick(),
      choices: rng.shuffle(choices.filter((c, i, arr) => arr.findIndex((q) => q.label === c.label) === i)),
      hint: `A rectangle's corners line up: the missing one has the same x as ${p(x1, y1)} and the same y as ${p(x2, y2)}.`,
      steps: [`Same x as ${p(x1, y1)}: x = ${x1}.`, `Same y as ${p(x2, y2)}: y = ${y2}.`, `The fourth corner is ${correct}.`],
      answerText: correct,
      meta: {},
    });
  },
};

// Nets: which solid a flat pattern folds into, and how many faces it has.
const SOLIDS = {
  cube: { name: 'cube', faces: 6, net: 'cube' },
  box: { name: 'rectangular prism', faces: 6, net: 'box' },
  sqpyr: { name: 'square pyramid', faces: 5, net: 'sqpyr' },
  tripyr: { name: 'triangular pyramid', faces: 4, net: 'tripyr' },
  triprism: { name: 'triangular prism', faces: 5, net: 'triprism' },
};
const nets = {
  id: 'nets', domain: D, grade: 6, cc: '6.G.4', name: 'Nets of solids', short: 'nets',
  gen(rng, tier) {
    const keys = tier === 1 ? ['cube', 'sqpyr', 'tripyr'] : Object.keys(SOLIDS);
    const k = rng.pick(keys);
    const S = SOLIDS[k];
    if (tier === 3 && rng.chance(0.5)) {
      // Surface area from a cube or square pyramid net.
      const s = rng.int(2, 8), u = rng.pick(['cm', 'in', 'ft']);
      if (k === 'sqpyr' || rng.chance(0.4)) {
        const t = 2 * rng.int(2, 5);
        const ans = s * s + 4 * ((s * t) / 2);
        return P({
          skill: this.id, tier,
          text: `This net folds into a square pyramid. The square is ${s} ${u} on each side and each triangle is ${t} ${u} tall. What is the surface area in square ${u}?`,
          visual: { kind: 'net', solid: 'sqpyr' },
          answer: num(ans),
          choices: makeChoices(rng, ans, [{ value: s * s + 4 * s * t, why: 'Each triangle is half of base × height.' }, { value: 4 * ((s * t) / 2), why: 'Add the square base too.' }, ans + s, s * s * t], labelNum),
          hint: 'Add the square and the 4 triangles.',
          steps: [`Square: ${s} × ${s} = ${s * s}.`, `Each triangle: ${s} × ${t} ÷ 2 = ${(s * t) / 2}; four of them: ${4 * ((s * t) / 2)}.`, `Total: ${ans} square ${u}.`],
          meta: { value: ans },
        });
      }
      const ans = 6 * s * s;
      return P({
        skill: this.id, tier,
        text: `This net folds into a cube with ${s}-${u} edges. What is the surface area in square ${u}?`,
        visual: { kind: 'net', solid: 'cube' },
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: s * s * s, why: 'That is the volume. Surface area adds the 6 squares of the net.' }, 4 * s * s, s * s, ans + s], labelNum),
        hint: 'The net has 6 squares. Find one, then multiply by 6.',
        steps: [`One square: ${s} × ${s} = ${s * s}.`, `6 × ${s * s} = ${ans} square ${u}.`],
        meta: { value: ans },
      });
    }
    if (rng.chance(0.5)) {
      return P({
        skill: this.id, tier,
        text: 'Which solid does this net fold into?',
        visual: { kind: 'net', solid: S.net },
        answer: pick(),
        choices: rng.shuffle([k, ...rng.shuffle(Object.keys(SOLIDS).filter((x) => x !== k)).slice(0, 3)].map((x) => ({ label: SOLIDS[x].name, value: x, correct: x === k, why: x === k ? undefined : `A ${SOLIDS[x].name} has ${SOLIDS[x].faces} faces. Count the shapes in the net and look at what they are.` }))),
        hint: 'Count the faces, and look at their shapes: squares, rectangles or triangles?',
        steps: [`The net has ${S.faces} faces.`, `It folds into a ${S.name}.`],
        answerText: S.name,
        meta: {},
      });
    }
    return P({
      skill: this.id, tier,
      text: `How many faces does a ${S.name} have?`,
      visual: { kind: 'net', solid: S.net },
      answer: num(S.faces),
      choices: makeChoices(rng, S.faces, [S.faces + 1, S.faces - 1, S.faces + 2, 8], labelNum),
      hint: 'Every shape in its net becomes one face.',
      steps: [`Its net has ${S.faces} shapes.`, `So a ${S.name} has ${S.faces} faces.`],
      meta: { value: S.faces },
    });
  },
};

export const CAVE_SKILLS = [perimeter, areaRect, angleType, protractor, convert, areaMissing, angleAdd, classify, symmetry, volume, volumeComposite, convert5, hierarchy, coord, areaTri, areaPoly, volumeFrac, coordPoly, nets, surface];
