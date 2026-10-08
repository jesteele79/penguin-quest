import { LAKE_SKILLS } from './skills/muldiv.js';
import { GROVE_SKILLS } from './skills/fractions.js';
import { HUTS_SKILLS } from './skills/decimals.js';
import { CAVE_SKILLS } from './skills/geometry.js';
import { RIDGE_SKILLS } from './skills/algebra.js';
import { STAR_SKILLS } from './skills/data.js';
import { RATIO_SKILLS } from './skills/ratios.js';
import { NEG_SKILLS } from './skills/negatives.js';

export const DOMAINS = {
  lake: { id: 'lake', name: 'Multiply & Divide', place: 'Glimmer Lake', skills: LAKE_SKILLS },
  grove: { id: 'grove', name: 'Fractions', place: 'Crystal Grove', skills: GROVE_SKILLS },
  huts: { id: 'huts', name: 'Decimals & Money', place: 'Heart Huts', skills: HUTS_SKILLS },
  ratios: { id: 'ratios', name: 'Ratios, Rates & Percents', place: 'Wind Gardens', skills: RATIO_SKILLS },
  cave: { id: 'cave', name: 'Geometry & Measurement', place: 'Glacier Cave', skills: CAVE_SKILLS },
  ridge: { id: 'ridge', name: 'Number Sense & Algebra', place: 'Gloom Ridge', skills: RIDGE_SKILLS },
  neg: { id: 'neg', name: 'Negative Numbers', place: 'Cloud Valleys', skills: NEG_SKILLS },
  stars: { id: 'stars', name: 'Data & Statistics', place: 'Observatory', skills: STAR_SKILLS },
};

export const DOMAIN_ORDER = ['lake', 'grove', 'huts', 'ratios', 'cave', 'ridge', 'neg', 'stars'];

export const SKILLS = {};
export const SKILL_LIST = [];
for (const id of DOMAIN_ORDER) {
  DOMAINS[id].skills.forEach((s, i) => {
    s.order = i;
    SKILLS[s.id] = s;
    SKILL_LIST.push(s);
  });
}
