import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAnswer, Frac } from '../src/math/frac.js';
import { checkAnswer } from '../src/math/check.js';
import { typedValue } from '../src/math/build.js';
import { SKILL_LIST, DOMAIN_ORDER } from '../src/math/skills.js';
import { Tutor, emptyTutorState } from '../src/math/tutor.js';
import { Rng } from '../src/core/rng.js';
import { fracTyped, toHTML } from '../src/math/fmt.js';
import { cocoaOrder } from '../src/math/skills/decimals.js';

const SEEDS = 300;

test('parseAnswer reads the ways kids type answers', () => {
  const v = (s) => parseAnswer(s).value?.toString();
  assert.equal(v('42'), '42');
  assert.equal(v('1,234'), '1234');
  assert.equal(v('.5'), '5/10');
  assert.equal(v('-3'), '-3');
  assert.equal(v('−3'), '-3');
  assert.equal(v('$3.50'), '350/100');
  assert.equal(v('3/4'), '3/4');
  assert.equal(v(' 3 / 4 '), '3/4');
  assert.equal(parseAnswer('2 1/4').kind, 'mixed');
  assert.equal(v('2 1/4'), '9/4');
  assert.equal(v('26 ft'), '26');
  assert.equal(v('12 square cm'), '12');
  assert.equal(v('45°'), '45');
  assert.equal(v('25%'), '25');
  assert.deepEqual(parseAnswer('12 R3'), { kind: 'remainder', q: 12, r: 3 });
  assert.deepEqual(parseAnswer('12r3'), { kind: 'remainder', q: 12, r: 3 });
  assert.deepEqual(parseAnswer('12 remainder 3'), { kind: 'remainder', q: 12, r: 3 });
  assert.equal(parseAnswer('abc').kind, 'invalid');
  assert.equal(parseAnswer('').kind, 'invalid');
  assert.equal(parseAnswer('3/0').kind, 'invalid');
});

test('Frac arithmetic', () => {
  assert.ok(new Frac(1, 2).add(new Frac(1, 3)).eq(new Frac(5, 6)));
  assert.ok(new Frac(3, 4).div(new Frac(1, 8)).eq(6));
  assert.equal(new Frac(3, 8).toDecimal(), '0.375');
  assert.equal(new Frac(1, 3).toDecimal(), null);
});

function independentCheck(p) {
  const m = p.meta || {};
  const a = p.answer;
  if (m.op === '*' && a.kind === 'num') assert.ok(Math.abs(a.value.value - m.a * m.b) < 1e-9, `${p.text}: ${m.a}*${m.b} != ${a.value}`);
  if (m.op === '/' && a.kind === 'num') assert.ok(Math.abs(a.value.value - m.a / m.b) < 1e-9, `${p.text}: ${m.a}/${m.b} != ${a.value}`);
  if (m.op === '/r') { assert.equal(a.q, Math.floor(m.a / m.b), p.text); assert.equal(a.r, m.a % m.b, p.text); }
  if (m.op === '+' && a.kind === 'num') assert.equal(a.value.value, m.a + m.b, p.text);
  if (m.op === '-' && a.kind === 'num') assert.equal(a.value.value, m.a - m.b, p.text);
  if (m.value !== undefined && (a.kind === 'num' || a.kind === 'frac')) assert.ok(a.value.eq(Frac.of(m.value)), `${p.text}: meta ${m.value} vs ${a.value}`);
  if (m.sign) {
    const cmp = Frac.of(m.a).cmp(Frac.of(m.b));
    assert.equal(m.sign, cmp < 0 ? '<' : cmp > 0 ? '>' : '=', p.text);
  }
}

function validMarkup(s) {
  const stripped = s.replace(/\{-?[\d?]+( [\d?]+)?\/[\d?]+\}/g, '');
  return !/[{}]/.test(stripped);
}

for (const skill of SKILL_LIST) {
  test(`skill ${skill.id} generates correct, checkable problems`, () => {
    for (let tier = 1; tier <= 3; tier++) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const rng = new Rng(seed * 7919 + tier * 104729 + skill.id.length);
        const p = skill.gen(rng, tier);
        const ctx = `${skill.id} t${tier} s${seed}: ${p.text}`;
        for (const field of ['text', 'hint', 'answerText']) {
          assert.equal(typeof p[field], 'string', `${ctx} missing ${field}`);
          assert.ok(p[field].length > 0, `${ctx} empty ${field}`);
          assert.ok(!/undefined|NaN|Infinity|\[object/.test(p[field]), `${ctx} bad ${field}: ${p[field]}`);
          assert.ok(validMarkup(p[field]), `${ctx} bad markup in ${field}: ${p[field]}`);
        }
        assert.ok(Array.isArray(p.steps) && p.steps.length > 0, `${ctx} steps`);
        for (const s of p.steps) {
          assert.ok(!/undefined|NaN|Infinity|\[object/.test(s), `${ctx} bad step: ${s}`);
          assert.ok(validMarkup(s), `${ctx} bad markup in step: ${s}`);
        }
        assert.ok(toHTML(p.text).length > 0);
        independentCheck(p);

        if (p.answer.kind !== 'choice') {
          const typed = typedValue(p.answer);
          const r = checkAnswer(p, { text: typed });
          assert.ok(r.correct, `${ctx} canonical answer "${typed}" rejected: ${JSON.stringify(r)}`);
          if (p.answer.kind === 'frac' && !p.answer.form && !p.answer.simplest && p.answer.value.d !== 1) {
            for (const mixed of [true, false]) {
              const alt = fracTyped(p.answer.value, { mixed });
              assert.ok(checkAnswer(p, { text: alt }).correct, `${ctx} equivalent "${alt}" rejected`);
            }
            const unreduced = `${p.answer.value.reduced.n * 2}/${p.answer.value.reduced.d * 2}`;
            assert.ok(checkAnswer(p, { text: unreduced }).correct, `${ctx} unreduced "${unreduced}" rejected`);
          }
          if (p.answer.kind === 'num' && p.answer.value.value > 1) {
            const off = checkAnswer(p, { text: String(p.answer.value.value + 1) });
            assert.ok(!off.correct, `${ctx} off-by-one accepted`);
          }
        }

        if (p.choices) {
          assert.ok(p.choices.length >= 2, `${ctx} too few choices`);
          assert.equal(p.choices.filter((c) => c.correct).length, 1, `${ctx} must have exactly one correct choice`);
          const labels = p.choices.map((c) => c.label);
          assert.equal(new Set(labels).size, labels.length, `${ctx} duplicate labels ${labels}`);
          for (const c of p.choices) {
            assert.ok(typeof c.label === 'string' && c.label.length, `${ctx} empty label`);
            assert.ok(!/undefined|NaN|Infinity/.test(c.label), `${ctx} bad label ${c.label}`);
            assert.ok(validMarkup(c.label), `${ctx} bad label markup ${c.label}`);
          }
          if (p.answer.kind === 'num' || p.answer.kind === 'frac') {
            const good = p.choices.find((c) => c.correct);
            if (good.value instanceof Frac || typeof good.value === 'number') {
              assert.ok(p.answer.value.eq(Frac.of(good.value)), `${ctx} correct choice ${good.label} != answer`);
            }
            for (const c of p.choices.filter((q) => !q.correct)) {
              if (c.value instanceof Frac || typeof c.value === 'number') {
                const same = p.answer.value.eq(Frac.of(c.value));
                const allowedByForm = p.answer.simplest || p.answer.form || skill.id === 'frac_identify';
                assert.ok(!same || allowedByForm, `${ctx} distractor ${c.label} equals the answer`);
              }
            }
          }
          const idx = p.choices.findIndex((c) => c.correct);
          assert.ok(checkAnswer(p, { choice: idx }).correct, `${ctx} choice check`);
          const wrongIdx = p.choices.findIndex((c) => !c.correct);
          if (wrongIdx >= 0) assert.ok(!checkAnswer(p, { choice: wrongIdx }).correct, `${ctx} wrong choice accepted`);
        } else {
          assert.notEqual(p.answer.kind, 'choice', `${ctx} choice answer without choices`);
        }
      }
    }
  });
}

test('form rules: mixed, improper and simplest', () => {
  const skill = SKILL_LIST.find((s) => s.id === 'frac_simplify');
  const p = skill.gen(new Rng(5), 2);
  const v = p.answer.value;
  const bigger = `${v.n * 2}/${v.d * 2}`;
  const r = checkAnswer(p, { text: bigger });
  assert.ok(!r.correct && r.formOnly, 'unsimplified answer should ask to simplify');
  const mixedSkill = SKILL_LIST.find((s) => s.id === 'frac_mixed');
  for (let s = 1; s < 50; s++) {
    const q = mixedSkill.gen(new Rng(s), 1);
    if (q.answer.form === 'mixed') {
      const imp = `${q.answer.value.n}/${q.answer.value.d}`;
      const res = checkAnswer(q, { text: imp });
      assert.ok(!res.correct && res.formOnly, `${q.text} should ask for a mixed number`);
    }
  }
});

test('tutor adapts: a strong student climbs, a struggling one gets easier work', () => {
  const state = emptyTutorState();
  const tutor = new Tutor(state, 4, 42);
  for (const d of DOMAIN_ORDER) assert.ok(tutor.next(d), `no problem for ${d}`);
  // Strong student in the lake domain.
  for (let i = 0; i < 80; i++) {
    const p = tutor.next('lake');
    tutor.record(p, { solved: true, firstTry: true, hintUsed: false });
  }
  const summary = tutor.domainSummary('lake');
  const g4 = summary.rows.filter((r) => r.grade <= 4);
  assert.ok(g4.every((r) => r.mastered), 'grade 4 lake skills should be mastered: ' + JSON.stringify(g4.map((r) => [r.id, r.m.toFixed(2), r.attempts])));
  assert.ok(summary.rows.some((r) => r.grade === 5 && r.attempts > 0), 'grade 5 skills should open up for a strong student');

  // Struggling student gets retries and tier 1.
  const s2 = emptyTutorState();
  const t2 = new Tutor(s2, 5, 7);
  const p = t2.next('grove');
  t2.record(p, { solved: false, firstTry: false, hintUsed: true, given: 'x' });
  assert.ok(s2.retry.length === 1 && s2.mistakes.length === 1);
  assert.equal(t2.tierFor(p.skill), 1);
});

test('tutor honors format constraints', () => {
  const tutor = new Tutor(emptyTutorState(), 6, 3);
  for (const d of DOMAIN_ORDER) {
    for (let i = 0; i < 40; i++) {
      const c = tutor.next(d, { format: 'choice', minChoices: 3 });
      assert.ok(c && c.choices.length >= 3, `${d} choice`);
      const n = tutor.next(d, { format: 'input' });
      assert.ok(n && n.format === 'input' && n.answer.kind !== 'choice', `${d} input`);
    }
  }
});

test('a skill missed twice in a row rests while other skills fill in', () => {
  const state = emptyTutorState();
  const tutor = new Tutor(state, 5, 11);
  const first = tutor.next('grove');
  const miss = { solved: false, firstTry: false, hintUsed: false, given: 'x' };
  tutor.record(first, miss);
  tutor.record({ ...first }, miss);
  state.retry.length = 0;
  for (let i = 0; i < 3; i++) {
    const p = tutor.next('grove');
    assert.notEqual(p.skill, first.skill, 'resting skill came straight back');
    tutor.record(p, { solved: true, firstTry: true, hintUsed: false });
  }
});

test('tutor reports a skill the moment it becomes mastered', () => {
  const tutor = new Tutor(emptyTutorState(), 4, 5);
  const p = tutor.next('lake', { skills: ['mul_3x2'] });
  let hits = 0;
  for (let i = 0; i < 12; i++) if (tutor.record(p, { solved: true, firstTry: true, hintUsed: false }).newlyMastered) hits += 1;
  assert.equal(hits, 1);
});

test('a review skill answered cleanly at the first go stays mastered', () => {
  const tutor = new Tutor(emptyTutorState(), 5, 3);
  const [kept, missed] = SKILL_LIST.filter((s) => s.grade === 4);
  assert.ok(tutor.isMastered(kept.id), 'earlier-grade skills start out taken as known');
  tutor.record(tutor.next(kept.domain, { skills: [kept.id] }), { solved: true, firstTry: true, hintUsed: false });
  assert.ok(tutor.isMastered(kept.id), 'a clean answer keeps it mastered');
  tutor.record(tutor.next(missed.domain, { skills: [missed.id] }), { solved: true, firstTry: false, hintUsed: false });
  assert.ok(!tutor.isMastered(missed.id), 'a miss means it needs practice again');
  const old = emptyTutorState();
  old.skills[kept.id] = { m: 0.9, n: 1, c: 1, s: 1, t: 0, assumed: false };
  assert.ok(new Tutor(old, 5, 3).isMastered(kept.id), 'and one answered cleanly in an older save');
});

test('cocoa orders: the typed answer is correct and choices are sound', () => {
  for (let tier = 1; tier <= 3; tier++) {
    for (let seed = 1; seed <= 300; seed++) {
      const p = cocoaOrder(new Rng(seed * 7 + tier), tier, 'Captain Flipper');
      assert.ok(checkAnswer(p, { text: typedValue(p.answer) }).correct, p.text);
      assert.equal(p.choices.filter((c) => c.correct).length, 1);
      assert.ok(p.answer.value.value > 0, p.text);
    }
  }
});
