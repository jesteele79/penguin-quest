// Observatory star charts: data and statistics (grades 3-6).
import { P, num, frac, pick, makeChoices, labelNum, labelFrac, nearInts } from '../build.js';
import { Frac } from '../frac.js';

const D = 'stars';
const NIGHTS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };

const readBar = {
  id: 'read_bar', domain: D, grade: 3, cc: '3.MD.3', name: 'Read bar graphs', short: 'bar graphs',
  gen(rng, tier) {
    const scale = tier === 1 ? 1 : tier === 2 ? 2 : 5;
    const values = NIGHTS.map(() => rng.int(1, 9) * scale);
    let i = rng.int(0, 4), j = rng.int(0, 4);
    while (j === i || values[j] === values[i]) { j = rng.int(0, 4); if (values.every((v) => v === values[0])) values[0] += scale; }
    if (values[i] < values[j]) [i, j] = [j, i];
    const moreQ = rng.chance(0.55);
    const visual = { kind: 'barchart', labels: NIGHTS, values, scale, title: 'Shooting stars seen each night' };
    if (moreQ) {
      const ans = values[i] - values[j];
      return P({
        skill: this.id, tier,
        text: `How many more shooting stars were seen on ${FULL[NIGHTS[i]]} than on ${FULL[NIGHTS[j]]}?`,
        visual,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: values[i] + values[j], why: '"How many more" means find the difference: subtract.' }, values[i], ans + scale, Math.max(1, ans - scale)], labelNum),
        hint: `Read both bars carefully${scale > 1 ? ` (each line is worth ${scale})` : ''}, then subtract.`,
        steps: [`${FULL[NIGHTS[i]]}: ${values[i]}.`, `${FULL[NIGHTS[j]]}: ${values[j]}.`, `${values[i]} − ${values[j]} = ${ans}.`],
        meta: { value: ans },
      });
    }
    const total = values.reduce((a, b) => a + b, 0);
    return P({
      skill: this.id, tier,
      text: 'How many shooting stars were seen in all five nights?',
      visual,
      answer: num(total),
      choices: makeChoices(rng, total, [total + scale, total - scale, Math.max(...values), total + 10], labelNum),
      hint: 'Read each bar, then add them all up.',
      steps: [`${values.join(' + ')} = ${total}.`],
      meta: { value: total },
    });
  },
};

const linePlot = {
  id: 'line_plot', domain: D, grade: 4, cc: '4.MD.4', name: 'Line plots with fractions', short: 'line plots',
  gen(rng, tier) {
    const den = tier === 1 ? 2 : tier === 2 ? 4 : 8;
    const ticks = [];
    for (let k = 1; k <= den * 2; k++) ticks.push(new Frac(k, den));
    const counts = ticks.map(() => 0);
    const n = rng.int(6, 10);
    const lo = rng.int(0, Math.max(0, ticks.length - 5));
    const hi = Math.min(ticks.length - 1, lo + 4);
    for (let i = 0; i < n; i++) counts[rng.int(lo, hi)] += 1;
    const values = [];
    counts.forEach((c, k) => { for (let t = 0; t < c; t++) values.push(ticks[k]); });
    const visual = { kind: 'lineplot', den, min: 0, max: 2, counts: ticks.map((t, k) => ({ v: t.value, n: counts[k] })), title: 'Icicle lengths (inches)' };
    const max = values.reduce((a, b) => (b.cmp(a) > 0 ? b : a));
    const min = values.reduce((a, b) => (b.cmp(a) < 0 ? b : a));
    if (tier >= 2 && rng.chance(0.5) && !max.eq(min)) {
      const diff = max.sub(min);
      return P({
        skill: this.id, tier,
        text: 'How much longer is the longest icicle than the shortest?',
        visual,
        answer: frac(diff),
        choices: makeChoices(rng, diff, [max.add(min), diff.add(new Frac(1, den)), max, diff.sub(new Frac(1, den))], labelFrac(true)),
        hint: 'Find the X furthest right and the X furthest left. Subtract.',
        steps: [`Longest: ${labelFrac(true)(max)} inch. Shortest: ${labelFrac(true)(min)} inch.`, `${labelFrac(true)(max)} − ${labelFrac(true)(min)} = ${labelFrac(true)(diff)} inch.`],
        meta: { value: diff },
      });
    }
    const cut = ticks[rng.int(lo, Math.max(lo, hi - 1))];
    const ans = values.filter((v) => v.cmp(cut) > 0).length;
    return P({
      skill: this.id, tier,
      text: `How many icicles are longer than ${labelFrac(true)(cut)} inch?`,
      visual,
      answer: num(ans),
      choices: makeChoices(rng, ans, [values.filter((v) => v.cmp(cut) >= 0).length, n - ans, ans + 1, Math.max(0, ans - 1)], labelNum),
      hint: `Count the Xs to the right of ${labelFrac(true)(cut)}. Don't count the ones right on it.`,
      steps: [`Xs to the right of ${labelFrac(true)(cut)}: ${ans}.`],
      meta: { value: ans },
    });
  },
};

const mean = {
  id: 'mean', domain: D, grade: 6, cc: '6.SP.5c', name: 'Mean (average)', short: 'mean',
  gen(rng, tier) {
    const n = tier === 1 ? 3 : tier === 2 ? 4 : rng.int(5, 6);
    const m = rng.int(3, tier === 3 ? 40 : 15);
    const vals = [];
    for (let i = 0; i < n - 1; i++) vals.push(Math.max(0, m + rng.int(-Math.min(m, 6), 6)));
    const last = m * n - vals.reduce((a, b) => a + b, 0);
    if (last < 0) return mean.gen(rng, tier);
    vals.push(last);
    const shuffled = rng.shuffle(vals);
    const sum = m * n;
    return P({
      skill: this.id, tier,
      text: `Over ${n} nights the telescope spotted ${shuffled.join(', ')} comets. What is the mean (average) number per night?`,
      answer: num(m),
      choices: makeChoices(rng, m, [{ value: sum, why: `That is the total. Share it equally over the ${n} nights: divide by ${n}.` }, [...shuffled].sort((a, b) => a - b)[Math.floor(n / 2)], m + 1, m - 1], labelNum),
      hint: `Add them all up, then divide by how many there are (${n}).`,
      steps: [`Total: ${shuffled.join(' + ')} = ${sum}.`, `${sum} ÷ ${n} = ${m}.`],
      meta: { value: m },
    });
  },
};

const mmr = {
  id: 'median_mode_range', domain: D, grade: 6, cc: '6.SP.5c', name: 'Median, mode and range', short: 'median, mode, range',
  gen(rng, tier) {
    const n = tier === 1 ? 5 : tier === 2 ? 7 : 9;
    const vals = [];
    for (let i = 0; i < n; i++) vals.push(rng.int(2, tier === 3 ? 60 : 20));
    const sorted = [...vals].sort((a, b) => a - b);
    const kind = rng.pick(['median', 'range', 'mode']);
    if (kind === 'mode') {
      const m = rng.pick(vals);
      vals[(vals.indexOf(m) + 1) % n] = m;
      vals[(vals.indexOf(m) + 3) % n] = m;
      const counts = {};
      vals.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      const best = Math.max(...Object.values(counts));
      const modes = Object.keys(counts).filter((k) => counts[k] === best);
      if (modes.length !== 1) return mmr.gen(rng, tier);
      const mode = Number(modes[0]);
      return P({
        skill: this.id, tier,
        text: `Snowflake counts: ${vals.join(', ')}. What is the mode?`,
        answer: num(mode),
        choices: makeChoices(rng, mode, [[...vals].sort((a, b) => a - b)[Math.floor(n / 2)], Math.max(...vals), Math.min(...vals), ...nearInts(rng, mode, 2)], labelNum),
        hint: 'The mode is the number that shows up most often.',
        steps: [`${mode} appears ${best} times, more than any other number.`, `The mode is ${mode}.`],
        meta: { value: mode },
      });
    }
    if (kind === 'range') {
      const r = sorted[n - 1] - sorted[0];
      return P({
        skill: this.id, tier,
        text: `Snowflake counts: ${vals.join(', ')}. What is the range?`,
        answer: num(r),
        choices: makeChoices(rng, r, [{ value: sorted[n - 1], why: 'Range is the biggest minus the smallest.' }, sorted[Math.floor(n / 2)], r + 1, sorted[n - 1] + sorted[0], ...nearInts(rng, r, 2)], labelNum),
        hint: 'Range = biggest number − smallest number.',
        steps: [`Biggest: ${sorted[n - 1]}. Smallest: ${sorted[0]}.`, `${sorted[n - 1]} − ${sorted[0]} = ${r}.`],
        meta: { value: r },
      });
    }
    const med = sorted[Math.floor(n / 2)];
    return P({
      skill: this.id, tier,
      text: `Snowflake counts: ${vals.join(', ')}. What is the median?`,
      answer: num(med),
      choices: makeChoices(rng, med, [{ value: vals[Math.floor(n / 2)], why: 'Put the numbers in order first, then find the middle one.' }, sorted[Math.floor(n / 2) + 1], sorted[Math.floor(n / 2) - 1], Math.round(vals.reduce((a, b) => a + b, 0) / n), ...nearInts(rng, med, 2)], labelNum),
      hint: 'Put the numbers in order from smallest to biggest. The median is the one in the middle.',
      steps: [`In order: ${sorted.join(', ')}.`, `The middle number (number ${Math.floor(n / 2) + 1} of ${n}) is ${med}.`],
      meta: { value: med },
    });
  },
};

const linePlotFrac = {
  id: 'line_plot_frac', domain: D, grade: 5, cc: '5.MD.2', name: 'Line plots: share it out', short: 'fraction line plots',
  gen(rng, tier) {
    const den = tier === 1 ? 4 : 8;
    const ticks = [];
    for (let k = 1; k <= den; k++) ticks.push(new Frac(k, den));
    const counts = ticks.map(() => 0);
    const n = tier === 3 ? rng.pick([4, 5, 6, 8]) : rng.int(5, 8);
    const lo = rng.int(0, Math.max(0, den - 4));
    for (let i = 0; i < n; i++) counts[rng.int(lo, Math.min(den - 1, lo + 3))] += 1;
    const values = [];
    counts.forEach((c, k) => { for (let t = 0; t < c; t++) values.push(ticks[k]); });
    const total = values.reduce((a, b) => a.add(b), new Frac(0, 1));
    const visual = { kind: 'lineplot', den, min: 0, max: 1, counts: ticks.map((t, k) => ({ v: t.value, n: counts[k] })), title: 'Juice in each cup (liter)' };
    const show = labelFrac(true);
    if (tier === 3) {
      const each = total.div(n);
      return P({
        skill: this.id, tier,
        text: `There are ${n} cups. If all the juice were poured together and shared equally among the ${n} cups, how much juice would each cup hold, in liters?`,
        visual,
        answer: frac(each),
        choices: makeChoices(rng, each, [
          { value: total, why: `That is all the juice together. Share it among ${n} cups: divide by ${n}.` },
          { value: ticks[Math.min(den - 1, lo + 1)], why: 'Add up all the juice first, then divide it equally.' },
          each.add(new Frac(1, den * n)), total.div(n + 1),
        ], show),
        hint: 'First add up the juice in all the cups. Then divide the total equally among the cups.',
        steps: [`Total: ${values.map(show).join(' + ')} = ${show(total)} liters.`, `${show(total)} ÷ ${n} = ${show(each)} liter in each cup.`],
        meta: { value: each },
      });
    }
    if (tier === 2) {
      return P({
        skill: this.id, tier,
        text: 'How much juice is there in all the cups together, in liters?',
        visual,
        answer: frac(total),
        choices: makeChoices(rng, total, [
          { value: new Frac(n, 1), why: 'Each X is a cup with less than 1 liter. Add the amounts, not the number of cups.' },
          total.add(new Frac(1, den)), total.sub(new Frac(1, den)), total.add(new Frac(1, 2)),
        ], show),
        hint: 'Each X is one cup. Add the amount for every X.',
        steps: [`${values.map(show).join(' + ')} = ${show(total)} liters.`],
        meta: { value: total },
      });
    }
    const k = counts.findIndex((c, i) => c >= 2 && i >= lo);
    const pickK = k >= 0 ? k : counts.findIndex((c) => c > 0);
    const amount = ticks[pickK].mul(counts[pickK]);
    return P({
      skill: this.id, tier,
      text: `How much juice is in all the cups that hold ${show(ticks[pickK])} liter, together?`,
      visual,
      answer: frac(amount),
      choices: makeChoices(rng, amount, [
        { value: new Frac(counts[pickK], 1), why: `That counts the cups. Each one holds ${show(ticks[pickK])} liter: multiply.` },
        ticks[pickK], amount.add(ticks[pickK]), amount.add(new Frac(1, den)),
      ], show),
      hint: `Count the X marks above ${show(ticks[pickK])}. Each one is a cup holding ${show(ticks[pickK])} liter.`,
      steps: [`There are ${counts[pickK]} cups at ${show(ticks[pickK])} liter.`, `${counts[pickK]} × ${show(ticks[pickK])} = ${show(amount)} liter${amount.value > 1 ? 's' : ''}.`],
      meta: { value: amount },
    });
  },
};

// Statistical questions expect answers that vary; the others have just one answer.
const STAT_Q = [
  { yes: 'How many hours did each cadet sleep last night?', no: ['How many hours did Vela sleep last night?', 'How many hours are in a day?', 'What time does the guild hall open?'] },
  { yes: 'How tall are the kites in the Glider Guild?', no: ['How tall is the tallest kite?', 'How many kites does the guild own?', 'What color is Captain Swoop\'s kite?'] },
  { yes: 'How many stars did each cadet spot this week?', no: ['How many stars are on the guild flag?', 'How many days are in a week?', 'How many stars did Tock spot on Monday?'] },
  { yes: 'How far can the gliders in the race fly?', no: ['How far is it to the Starwell?', 'How far did Rocco fly yesterday?', 'How many gliders are in the race?'] },
  { yes: 'What are the ages of the penguins at the festival?', no: ['How old is the Professor?', 'In what year was the festival first held?', 'How many penguins are named Pip?'] },
];
const statQuestion = {
  id: 'stat_question', domain: D, grade: 6, cc: '6.SP.1', name: 'Statistical questions', short: 'statistical questions',
  gen(rng, tier) {
    const q = rng.pick(STAT_Q);
    const askNo = tier === 3 && rng.chance(0.5);
    if (askNo) {
      // Which is NOT statistical: one single-answer question among statistical ones from other sets.
      const others = rng.shuffle(STAT_Q.filter((o) => o !== q)).slice(0, 3).map((o) => o.yes);
      const odd = rng.pick(q.no);
      return P({
        skill: this.id, tier,
        text: 'Which question is NOT a statistical question?',
        answer: pick(),
        choices: rng.shuffle([{ label: odd, value: 'c', correct: true }, ...others.map((o, i) => ({ label: o, value: 'w' + i, why: 'This one has many different answers, so it is statistical.' }))]),
        hint: 'A statistical question has answers that vary. Which one has just one answer?',
        steps: [`"${odd}" has only one answer.`, 'So it is not a statistical question.'],
        answerText: odd,
        meta: {},
      });
    }
    const wrong = tier === 1 ? q.no.slice(0, 2) : q.no;
    return P({
      skill: this.id, tier,
      text: 'Which is a statistical question?',
      answer: pick(),
      choices: rng.shuffle([{ label: q.yes, value: 'c', correct: true }, ...wrong.map((w, i) => ({ label: w, value: 'w' + i, why: 'This question has only one answer. A statistical question expects answers that vary.' }))]),
      hint: 'A statistical question collects many answers that are not all the same.',
      steps: [`"${q.yes}" gets a different answer from each one.`, 'Answers that vary make it a statistical question.'],
      answerText: q.yes,
      meta: {},
    });
  },
};

// Box plots: the five-number summary, with the middle half of the data inside the box.
const boxPlot = {
  id: 'box_plot', domain: D, grade: 6, cc: '6.SP.4', name: 'Box plots', short: 'box plots',
  gen(rng, tier) {
    const step = tier === 1 ? 1 : rng.pick([1, 2, 5]);
    const base = rng.int(0, 10) * step;
    const gaps = [rng.int(1, 4), rng.int(1, 4), rng.int(1, 4), rng.int(1, 4)].map((g) => g * step);
    const min = base, q1 = min + gaps[0], med = q1 + gaps[1], q3 = med + gaps[2], max = q3 + gaps[3];
    const title = rng.pick(['Kite flight times (seconds)', 'Stars spotted each night', 'Glider race distances (km)', 'Lanterns lit per evening']);
    const vis = { kind: 'boxplot', min, q1, med, q3, max, lo: min - step, hi: max + step, step, title };
    const kind = tier === 1 ? rng.pick(['median', 'max']) : tier === 2 ? rng.pick(['median', 'range', 'iqr']) : rng.pick(['iqr', 'quarter', 'half']);
    if (kind === 'quarter' || kind === 'half') {
      const ans = kind === 'quarter' ? 25 : 50;
      const where = kind === 'quarter' ? `above ${q3}` : `between ${q1} and ${q3}`;
      return P({
        skill: this.id, tier,
        text: `About what percent of the data is ${where}?`,
        visual: vis,
        answer: num(ans),
        choices: makeChoices(rng, ans, [kind === 'quarter' ? 50 : 25, 75, 100, 10], (v) => `${v}%`),
        hint: 'The box plot splits the data into four parts with about the same number of values: 25% each.',
        steps: kind === 'quarter' ? [`From ${q3} up to ${max} is the top quarter of the data.`, 'That is about 25%.'] : [`The box, from ${q1} to ${q3}, holds the middle two quarters.`, 'That is about 50%.'],
        meta: { value: ans },
      });
    }
    const ans = kind === 'median' ? med : kind === 'max' ? max : kind === 'range' ? max - min : q3 - q1;
    const name = { median: 'median', max: 'greatest value', range: 'range', iqr: 'interquartile range (IQR)' }[kind];
    return P({
      skill: this.id, tier,
      text: `What is the ${name} of the data in this box plot?`,
      visual: vis,
      answer: num(ans),
      choices: makeChoices(rng, ans, kind === 'median'
        ? [{ value: Math.round((min + max) / 2) === med ? med + step : Math.round((min + max) / 2), why: 'The median is the line inside the box, not the middle of the whole plot.' }, q1, q3]
        : kind === 'iqr' ? [{ value: max - min, why: 'That is the range. The IQR is the length of the box: Q3 − Q1.' }, q3, med - q1]
          : kind === 'range' ? [{ value: q3 - q1, why: 'That is the IQR. The range goes from the lowest whisker end to the highest.' }, max, max - med]
            : [q3, med, max + step], labelNum),
      hint: kind === 'median' ? 'The median is the line inside the box.' : kind === 'max' ? 'Follow the right whisker to its end.' : kind === 'range' ? 'Range = greatest − least: the two whisker ends.' : 'IQR = the right edge of the box (Q3) minus the left edge (Q1).',
      steps: kind === 'median' ? [`The line inside the box is at ${med}.`] : kind === 'max' ? [`The right whisker ends at ${max}.`] : kind === 'range' ? [`${max} − ${min} = ${ans}.`] : [`Q3 = ${q3} and Q1 = ${q1}.`, `${q3} − ${q1} = ${ans}.`],
      meta: { value: ans },
    });
  },
};

// Mean absolute deviation: how far the values sit from the mean, on average.
const mad = {
  id: 'mad', domain: D, grade: 6, cc: '6.SP.5c', name: 'Mean absolute deviation', short: 'mean absolute deviation',
  gen(rng, tier) {
    // Values in matched pairs around the mean keep both the mean and the MAD whole numbers.
    const m = rng.int(6, 20);
    const n = tier === 3 ? 6 : 4;
    const ds = [];
    for (let i = 0; i < n / 2; i++) ds.push(rng.int(1, 5));
    const sumD = ds.reduce((a, b) => a + b, 0) * 2;
    if (sumD % n) return mad.gen(rng, tier);
    const vals = rng.shuffle(ds.flatMap((d) => [m - d, m + d]));
    const madV = sumD / n;
    const thing = rng.pick(['kites flown', 'stars spotted', 'feathers found', 'laps flown']);
    if (tier === 1) {
      const v = rng.pick(vals);
      const ans = Math.abs(v - m);
      return P({
        skill: this.id, tier,
        text: `The cadets' ${thing}: ${vals.join(', ')}. The mean is ${m}. How far is ${v} from the mean?`,
        answer: num(ans),
        choices: makeChoices(rng, ans, [{ value: v, why: 'Find the distance between the value and the mean.' }, ans + 1, m, ans + 2], labelNum),
        hint: `Subtract: the bigger of ${v} and ${m} minus the smaller.`,
        steps: [`${Math.max(v, m)} − ${Math.min(v, m)} = ${ans}.`],
        meta: { value: ans },
      });
    }
    return P({
      skill: this.id, tier,
      text: `The cadets' ${thing}: ${vals.join(', ')}. The mean is ${m}. What is the mean absolute deviation?`,
      answer: num(madV),
      choices: makeChoices(rng, madV, [{ value: sumD, why: `That is the total distance. Divide by ${n}, how many values there are.` }, m, madV + 1, Math.max(...vals) - Math.min(...vals)], labelNum),
      hint: `Find how far each value is from ${m}, then find the mean of those distances.`,
      steps: [`Distances from ${m}: ${vals.map((v) => Math.abs(v - m)).join(', ')}.`, `They add to ${sumD}.`, `${sumD} ÷ ${n} = ${madV}.`],
      meta: { value: madV },
    });
  },
};

// Histograms: counts in equal intervals that touch each other.
const histogram = {
  id: 'histogram', domain: D, grade: 6, cc: '6.SP.4', name: 'Histograms', short: 'histograms',
  gen(rng, tier) {
    const width = rng.pick([5, 10]);
    const bins = 5;
    const start = rng.int(0, 3) * width;
    const labels = Array.from({ length: bins }, (_, i) => `${start + i * width}–${start + (i + 1) * width - 1}`);
    const counts = Array.from({ length: bins }, () => rng.int(1, 9));
    const title = rng.pick(['Glider flight times (minutes)', 'Cadet heights (cm, last two digits)', 'Stars spotted per night']);
    const vis = { kind: 'histogram', labels, values: counts, title };
    const kind = tier === 1 ? 'one' : tier === 2 ? rng.pick(['one', 'total', 'atleast']) : rng.pick(['atleast', 'most', 'total']);
    if (kind === 'most') {
      const best = Math.max(...counts);
      if (counts.filter((c) => c === best).length > 1) return histogram.gen(rng, 2);
      const i = counts.indexOf(best);
      return P({
        skill: this.id, tier,
        text: 'Which interval has the most data?',
        visual: vis,
        answer: pick(),
        choices: rng.shuffle([i, ...rng.shuffle([0, 1, 2, 3, 4].filter((k) => k !== i)).slice(0, 3)]).map((k) => ({ label: labels[k], value: k, correct: k === i, why: k === i ? undefined : `That bar is only ${counts[k]} tall.` })),
        hint: 'Find the tallest bar.',
        steps: [`The tallest bar is ${labels[i]}, with ${best}.`],
        answerText: labels[i],
        meta: {},
      });
    }
    if (kind === 'one') {
      const i = rng.int(0, bins - 1);
      return P({
        skill: this.id, tier,
        text: `How many values are in the ${labels[i]} interval?`,
        visual: vis,
        answer: num(counts[i]),
        choices: makeChoices(rng, counts[i], [counts[(i + 1) % bins], counts[(i + bins - 1) % bins], counts[i] + 1, counts[i] + 2], labelNum),
        hint: `Find the ${labels[i]} bar and read its height on the scale.`,
        steps: [`The ${labels[i]} bar reaches ${counts[i]}.`],
        meta: { value: counts[i] },
      });
    }
    if (kind === 'total') {
      const total = counts.reduce((a, b) => a + b, 0);
      return P({
        skill: this.id, tier,
        text: 'How many values are shown in the histogram altogether?',
        visual: vis,
        answer: num(total),
        choices: makeChoices(rng, total, [{ value: bins, why: 'That is the number of bars. Add up all their heights.' }, Math.max(...counts), total + 1, total - 2], labelNum),
        hint: 'Add up the heights of all the bars.',
        steps: [`${counts.join(' + ')} = ${total}.`],
        meta: { value: total },
      });
    }
    const from = rng.int(1, bins - 2);
    const ans = counts.slice(from).reduce((a, b) => a + b, 0);
    const lo = start + from * width;
    return P({
      skill: this.id, tier,
      text: `How many values are ${lo} or more?`,
      visual: vis,
      answer: num(ans),
      choices: makeChoices(rng, ans, [{ value: counts[from], why: `Include every bar from ${labels[from]} to the end.` }, ans + counts[from - 1], ans - 1, ans + 1], labelNum),
      hint: `Add the bars from ${labels[from]} to the right.`,
      steps: [`${counts.slice(from).join(' + ')} = ${ans}.`],
      meta: { value: ans },
    });
  },
};

export const STAR_SKILLS = [readBar, linePlot, linePlotFrac, statQuestion, mean, mmr, histogram, boxPlot, mad];
