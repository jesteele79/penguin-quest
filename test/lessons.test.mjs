import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../src/math/lessons.js';
import { SKILLS } from '../src/math/skills.js';
import { checkAnswer } from '../src/math/check.js';
import { typedValue } from '../src/math/build.js';
import { Rng } from '../src/core/rng.js';

const MODELS = ['strips', 'hundred', 'numberline', 'area', 'protractor', 'place', 'cubes', 'share', 'steptap', 'tape', 'fracgrid', 'plot', 'slide', 'jumps', 'level', 'tags', 'paren', 'rows2'];
const MENTORS = ['professor', 'captain', 'fern', 'mittens', 'pebble', 'skipper', 'isa', 'rocco', 'marlo', 'tortuga', 'lumi'];
const clean = (s) => typeof s === 'string' && s.length > 0 && !/undefined|NaN|Infinity|\[object/.test(s) && !/[{}]/.test(s.replace(/\{-?[\d?]+( [\d?]+)?\/[\d?]+\}/g, ''));

for (const [id, L] of Object.entries(LESSONS)) {
  test(`lesson ${id} is complete and its last step checks out`, () => {
    assert.ok(SKILLS[id], `${id} is not a skill`);
    assert.ok(MENTORS.includes(L.mentor), `${id} mentor ${L.mentor}`);
    for (const t of [L.title, L.hook, L.explore.prompt, L.explore.success, L.see.text, L.watch.text, ...L.watch.steps]) assert.ok(clean(t), `${id} text: ${t}`);
    assert.ok(MODELS.includes(L.explore.model), `${id} model ${L.explore.model}`);

    // The hands-on goal can be reached.
    const cfg = L.explore.cfg;
    if (L.explore.model === 'strips') {
      const rows = cfg.rows.map((r) => ({ wholes: 1, filled: 0, ...r }));
      assert.equal(cfg.goal(rows.map((r) => [r.filled, r.parts])), false, `${id} starts solved`);
      L.explore.solve(rows);
      assert.equal(cfg.goal(rows.map((r) => [r.filled, r.parts])), true, `${id} solution misses the goal`);
      for (const r of rows) assert.ok(r.filled <= r.parts * r.wholes, `${id} overfills a strip`);
    }
    if (L.explore.model === 'hundred') assert.ok(cfg.target > 0 && cfg.target <= 100);
    if (L.explore.model === 'place') assert.ok(cfg.target < cfg.number.replace('.', '').length);
    if (L.explore.model === 'cubes') assert.ok(cfg.l * cfg.w * cfg.h <= 60, `${id} too many cubes to draw`);
    if (L.explore.model === 'share') assert.ok(cfg.total > cfg.groups);
    if (L.explore.model === 'fracgrid') assert.ok(cfg.goalRows > 0 && cfg.goalRows <= cfg.rows && cfg.goalCols > 0 && cfg.goalCols <= cfg.cols);
    if (L.explore.model === 'plot') assert.ok(cfg.targets.every(([x, y]) => x >= 0 && y >= 0 && x <= cfg.n && y <= cfg.n));
    if (L.explore.model === 'slide') {
      const r = Number(cfg.target) / Number(cfg.start);
      const k = Math.round(Math.log10(r));
      assert.ok(Math.abs(r - 10 ** k) < 1e-9 && Number(cfg.target) < 10000 && Number(cfg.start) * 1000 >= 1, `${id} slide unreachable`);
    }
    if (L.explore.model === 'jumps') {
      const step = (cfg.jump[0] * cfg.den) / cfg.jump[1], goal = (cfg.target[0] * cfg.den) / cfg.target[1];
      assert.ok(Number.isInteger(step) && Number.isInteger(goal / step) && goal <= cfg.max * cfg.den, `${id} jumps never land on the target`);
    }
    if (L.explore.model === 'level') assert.ok(cfg.heights.reduce((a, b) => a + b, 0) % cfg.heights.length === 0, `${id} towers cannot level out`);
    if (L.explore.model === 'tags') assert.ok(cfg.correct.every((t) => cfg.tags.includes(t)));
    if (L.explore.model === 'paren') assert.ok(cfg.target[0] % 2 === 0 && cfg.target[1] % 2 === 0 && cfg.target[0] < cfg.target[1] && cfg.target[1] < cfg.tokens.length);
    if (L.explore.model === 'rows2') assert.notEqual(Number(cfg.a), Number(cfg.b));
    if (L.explore.model === 'numberline') { const v = cfg.target[0] / cfg.target[1]; assert.ok(v >= cfg.min && v <= cfg.max); }
    if (L.explore.model === 'protractor') assert.ok(cfg.target % 5 === 0 && cfg.target > 0 && cfg.target < 180);

    // "Your turn": the answer is right, positive and typeable, for many examples.
    for (let seed = 1; seed <= 200; seed++) {
      const p = L.practice(new Rng(seed * 31 + id.length));
      assert.ok(p.steps.length > 0 && p.steps.every(clean), `${id} s${seed} steps ${p.steps}`);
      assert.ok(clean(p.prompt), `${id} s${seed} prompt ${p.prompt}`);
      assert.ok(p.answer.value.value > 0, `${id} s${seed} answer ${p.answer.value}`);
      const typed = typedValue(p.answer);
      assert.ok(checkAnswer({ answer: p.answer }, { text: typed }).correct, `${id} s${seed} ${typed}`);
    }
  });
}

test('the order-of-operations lesson ends on a whole number', () => {
  const PREC = { '×': 2, '÷': 2, '+': 1, '−': 1 };
  const F = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b };
  const t = [...LESSONS.order_ops.explore.cfg.tokens];
  while (t.length > 1) {
    let best = 1;
    for (let i = 1; i < t.length; i += 2) if (PREC[t[i]] > PREC[t[best]]) best = i;
    t.splice(best - 1, 3, F[t[best]](t[best - 1], t[best + 1]));
  }
  assert.equal(t[0], 10);
});
