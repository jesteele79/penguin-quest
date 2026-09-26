// Observatory star charts: data and statistics (grades 3-6).
import { P, num, frac, makeChoices, labelNum, labelFrac, nearInts } from '../build.js';
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

export const STAR_SKILLS = [readBar, linePlot, mean, mmr];
