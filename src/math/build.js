// Helpers shared by the skill generators.
import { Frac } from './frac.js';
import { fmtNum, fracMarkup, fracTyped } from './fmt.js';

// A problem's answer:
//   { kind: 'num', value: Frac }                      whole numbers and decimals
//   { kind: 'frac', value: Frac, simplest?, form? }   form: 'mixed' | 'improper' | undefined
//   { kind: 'rem', q, r }                             division with remainder
//   { kind: 'choice' }                                pick from `choices` (the correct one has correct: true)
export const num = (v) => ({ kind: 'num', value: Frac.of(v) });
export const frac = (v, opts = {}) => ({ kind: 'frac', value: Frac.of(v), ...opts });
export const rem = (q, r) => ({ kind: 'rem', q, r });
export const pick = () => ({ kind: 'choice' });

// Markup for showing an answer value.
export function showValue(answer) {
  switch (answer.kind) {
    case 'num': return answer.money ? '$' + answer.value.value.toFixed(2) : fmtNum(answer.value);
    case 'frac': {
      const v = answer.value;
      if (answer.form) return fracMarkup(v, { mixed: answer.form === 'mixed' });
      const improper = fracMarkup(v);
      const mixed = fracMarkup(v.reduced, { mixed: true });
      return improper === mixed ? improper : `${improper} = ${mixed}`;
    }
    case 'rem': return answer.r ? `${fmtNum(answer.q)} R${answer.r}` : fmtNum(answer.q);
    default: return '';
  }
}

// What a kid would type for this answer.
export function typedValue(answer) {
  switch (answer.kind) {
    case 'num': return answer.value.toDecimal() ?? String(answer.value.value);
    case 'frac': return fracTyped(answer.value.reduced, { mixed: answer.form === 'mixed' });
    case 'rem': return answer.r ? `${answer.q} R${answer.r}` : String(answer.q);
    default: return '';
  }
}

const keyOf = (v) => (v instanceof Frac ? 'f' + v.reduced.toString() : 's' + String(v));

// Build a 3-4 option list from the correct value and candidate wrong values.
// wrong: [{ value, why? }] or plain values. label(value) -> markup.
// byLabel: allow equal values written differently (e.g. 6/8 vs 3/4 in "simplest form" questions).
export function makeChoices(rng, correct, wrong, label, count = 4, { byLabel = false, allowNeg = false } = {}) {
  const seen = new Set([byLabel ? 'l' + label(correct) : keyOf(correct)]);
  const out = [{ label: label(correct), value: correct, correct: true }];
  // Zero and negatives only appear as choices when the question itself lives there.
  const lowOk = allowNeg || (correct instanceof Frac ? correct.value : correct) <= 0;
  for (const w of wrong) {
    const item = w && typeof w === 'object' && !(w instanceof Frac) && 'value' in w ? w : { value: w };
    if (item.value === undefined || item.value === null) continue;
    if (item.value instanceof Frac && item.value.value <= 0 && !lowOk) continue;
    if (typeof item.value === 'number' && (!Number.isFinite(item.value) || (item.value <= 0 && !lowOk))) continue;
    const k = byLabel ? 'l' + label(item.value) : keyOf(item.value);
    if (seen.has(k)) continue;
    const lab = label(item.value);
    if (out.some((o) => o.label === lab)) continue;
    seen.add(k);
    out.push({ label: lab, value: item.value, why: item.why });
    if (out.length >= count) break;
  }
  return rng.shuffle(out);
}

// Nearby integers as fallback distractors.
export function nearInts(rng, v, spread = 3, n = 6) {
  const out = [];
  const steps = [1, -1, 2, -2, 10, -10, spread, -spread];
  for (const s of rng.shuffle(steps)) {
    if (v + s > 0) out.push(v + s);
    if (out.length >= n) break;
  }
  return out;
}

// Assemble and sanity-check a problem.
export function P(def) {
  if (!def.text) throw new Error('problem without text');
  if (!def.answer) throw new Error('problem without answer');
  if (!def.hint) throw new Error('problem without hint: ' + def.text);
  if (!def.steps || !def.steps.length) throw new Error('problem without steps: ' + def.text);
  if (def.answer.kind === 'choice' && !(def.choices && def.choices.some((c) => c.correct))) throw new Error('choice problem without correct choice');
  return {
    visual: null,
    format: def.answer.kind === 'choice' ? 'choice' : 'input',
    ...def,
    answerText: def.answerText ?? (def.answer.kind === 'choice' ? def.choices.find((c) => c.correct).label : showValue(def.answer)),
  };
}

export const labelNum = (v) => fmtNum(v);
export const labelFrac = (mixed = false) => (v) => fracMarkup(Frac.of(v), { mixed });
