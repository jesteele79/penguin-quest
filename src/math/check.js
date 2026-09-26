import { parseAnswer, Frac, gcd } from './frac.js';

// response: { choice: index } | { text: string }
// Returns { correct, formOnly?, message?, why?, given }
// formOnly: the value was right but written in the wrong form (no penalty, just try again).
export function checkAnswer(problem, response) {
  if (response.choice !== undefined) {
    const c = problem.choices?.[response.choice];
    if (!c) return { correct: false, invalid: true, given: '' };
    return { correct: !!c.correct, why: c.correct ? undefined : c.why, given: c.label };
  }
  const text = String(response.text ?? '').trim();
  const p = parseAnswer(text);
  const a = problem.answer;
  const given = text;
  if (p.kind === 'invalid') {
    return { correct: false, invalid: true, given, message: 'Type a number, like 42, 3.5, 3/4, 2 1/4 or 7 R2.' };
  }

  if (a.kind === 'rem') {
    if (p.kind === 'remainder') return { correct: p.q === a.q && p.r === a.r, given, ...(p.q === a.q && p.r !== a.r ? { why: 'The quotient is right. Check the remainder.' } : {}) };
    if (p.kind === 'number' && p.value.isWhole) {
      if (a.r === 0) return { correct: p.value.eq(a.q), given };
      if (p.value.eq(a.q)) return { correct: false, formOnly: true, given, message: `Almost! There is a remainder too. Type it like ${a.q} R?` };
    }
    return { correct: false, given };
  }

  if (a.kind === 'choice') return { correct: false, invalid: true, given };

  if (p.kind === 'remainder') {
    const v = new Frac(p.q, 1);
    return p.r === 0 ? finish(problem, v, given, p) : { correct: false, given, message: 'This one has no remainder.' };
  }
  if (p.kind === 'pair') return { correct: false, invalid: true, given, message: 'Just type one number.' };
  return finish(problem, p.value, given, p);
}

function finish(problem, value, given, p) {
  const a = problem.answer;
  const right = value.eq(a.value);
  if (!right) {
    const hit = problem.choices?.find((c) => !c.correct && c.value instanceof Frac ? c.value.eq(value) : !c.correct && typeof c.value === 'number' && value.eq(c.value));
    return { correct: false, given, why: hit?.why };
  }
  if (a.kind === 'frac') {
    if (a.form === 'mixed' && !(p.kind === 'mixed' || (p.kind === 'number' && value.isWhole))) {
      return { correct: false, formOnly: true, given, message: 'That is the right amount! Now write it as a mixed number, like 2 1/4.' };
    }
    if (a.form === 'improper' && p.kind !== 'fraction') {
      return { correct: false, formOnly: true, given, message: 'That is the right amount! Now write it as an improper fraction, like 9/4.' };
    }
    if (a.simplest) {
      const reduced = p.kind === 'fraction' ? gcd(p.num, p.den) === 1 && p.den !== 1
        : p.kind === 'mixed' ? gcd(p.num, p.den) === 1 && p.num < p.den
          : value.isWhole;
      if (!reduced) {
        return { correct: false, formOnly: true, given, message: p.kind === 'number' ? 'Write it as a fraction.' : 'That is equal! Can you simplify it even more?' };
      }
    }
  }
  return { correct: true, given };
}
