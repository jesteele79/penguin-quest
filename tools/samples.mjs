// Prints sample problems for proofreading: node tools/samples.mjs [skillIdFilter]
import { SKILL_LIST } from '../src/math/skills.js';
import { Rng } from '../src/core/rng.js';
import { typedValue } from '../src/math/build.js';

const filter = process.argv[2];
for (const s of SKILL_LIST) {
  if (filter && !s.id.includes(filter)) continue;
  console.log(`\n=== ${s.id} (G${s.grade} ${s.cc}) ${s.name}`);
  for (let tier = 1; tier <= 3; tier++) {
    const p = s.gen(new Rng(tier * 31 + 5), tier);
    const ans = p.answer.kind === 'choice' ? p.answerText : `${p.answerText}  [type: ${typedValue(p.answer)}]`;
    console.log(`  T${tier}: ${p.text}`);
    console.log(`      = ${ans}`);
    if (p.choices) console.log(`      choices: ${p.choices.map((c) => c.label + (c.correct ? '*' : '')).join(' | ')}`);
    console.log(`      hint: ${p.hint}`);
    console.log(`      steps: ${p.steps.join(' / ')}`);
  }
}
