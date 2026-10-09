import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKILL_LIST } from '../src/math/skills.js';
import { setTheme } from '../src/math/theme.js';
import { Rng } from '../src/core/rng.js';

// Words that belong to Book 1's snowy island and should never reach a Book 2 word problem.
const SNOWY = /\b(snow\w*|ice|icy|icicles?|igloos?|sleds?|cocoas?|mittens?|scarf|scarves|Pebble|Fern|Mittens|Skipper|Lulu|Sunny|Mo|Glimmer|aurora)\b/i;

// Every string drawn inside a problem's picture, leaving out the keys that name drawing parts.
function visualWords(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => visualWords(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!['kind', 'icon', 'color', 'colors', 'cls', 'shape'].includes(k)) visualWords(x, out);
  return out;
}

for (const book of ['book2', 'book3']) {
  test(`${book} word problems and their pictures use the book's words and names`, () => {
    setTheme(book);
    try {
      for (const skill of SKILL_LIST) {
        for (let tier = 1; tier <= 3; tier++) {
          for (let seed = 1; seed <= 120; seed++) {
            const p = skill.gen(new Rng(seed * 131 + tier), tier);
            const texts = [p.text, p.hint, p.answerText, ...p.steps, ...(p.choices ?? []).flatMap((c) => [c.label, c.why ?? '']), ...visualWords(p.visual)];
            for (const s of texts) assert.ok(!SNOWY.test(s), `${book} ${skill.id} t${tier} s${seed}: "${s}"`);
            assert.ok(!/\b(a|A) ([aeiou])/.test(p.text.replace(/\b(a|A) (one|unit|uni)/g, '')), `${skill.id}: article before a vowel in "${p.text}"`);
          }
        }
      }
    } finally {
      setTheme('book1');
    }
  });
}

test('Book 1 wording is untouched by the theme layer', () => {
  setTheme('book1');
  const skill = SKILL_LIST.find((s) => s.id === 'mul_word');
  const p = skill.gen(new Rng(3), 1);
  assert.ok(!/coconut|canoe/.test(p.text));
});
