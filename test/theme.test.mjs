import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKILL_LIST } from '../src/math/skills.js';
import { setTheme } from '../src/math/theme.js';
import { Rng } from '../src/core/rng.js';

// Words that belong to Book 1's snowy island and should never reach a Book 2 word problem.
const SNOWY = /\b(snow\w*|ice|icy|icicles?|igloos?|sleds?|cocoas?|mittens?|scarf|scarves|Pebble|Fern|Mittens|Skipper|Lulu|Sunny|Mo|Glimmer|aurora)\b/i;

test('Book 2 word problems use island words and names', () => {
  setTheme('book2');
  try {
    for (const skill of SKILL_LIST) {
      for (let tier = 1; tier <= 3; tier++) {
        for (let seed = 1; seed <= 120; seed++) {
          const p = skill.gen(new Rng(seed * 131 + tier), tier);
          const texts = [p.text, p.hint, p.answerText, ...p.steps, ...(p.choices ?? []).flatMap((c) => [c.label, c.why ?? ''])];
          for (const s of texts) assert.ok(!SNOWY.test(s), `${skill.id} t${tier} s${seed}: "${s}"`);
          assert.ok(!/\b(a|A) ([aeiou])/.test(p.text.replace(/\b(a|A) (one|unit|uni)/g, '')), `${skill.id}: article before a vowel in "${p.text}"`);
        }
      }
    }
  } finally {
    setTheme('book1');
  }
});

test('Book 1 wording is untouched by the theme layer', () => {
  setTheme('book1');
  const skill = SKILL_LIST.find((s) => s.id === 'mul_word');
  const p = skill.gen(new Rng(3), 1);
  assert.ok(!/coconut|canoe/.test(p.text));
});
