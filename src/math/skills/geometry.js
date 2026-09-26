// Glacier Cave: geometry and measurement (grades 3-6).
import { P, num, pick, makeChoices, labelNum, nearInts } from '../build.js';
import { Frac } from '../frac.js';
import { fmtInt, fmtNum } from '../fmt.js';

const D = 'cave';
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

export const CAVE_SKILLS = [perimeter, areaRect, angleType, convert, areaMissing, angleAdd, volume, coord, areaTri, surface];
