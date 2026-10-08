// Glacier Bay's friends: who they are, where they stand, how they look and sound.
import { LOC } from './layout.js';
import { bowTie, apron } from '../../actors/accessories.js';

export const NPCS = {
  professor: {
    name: 'Professor Waddlesworth', pos: LOC.professor, pitch: 360, accent: '#d8333f',
    look: { scale: 1.12, body: 0x2c3252, scarf: null, hat: 'scholar', extras: (p) => { const b = bowTie(0xd8333f); b.position.set(0, 1.58, 0.82); p.body.add(b); } },
    portrait: { glasses: true, hat: 'cap', accent: '#d8333f' },
  },
  mo: { name: 'Mo', pos: { x: LOC.kids.x - 3, z: LOC.kids.z + 1 }, pitch: 760, accent: '#4ddb7a', look: { scale: 0.62, scarf: 0x4ddb7a }, portrait: { kid: true, accent: '#4ddb7a' } },
  lulu: { name: 'Lulu', pos: { x: LOC.kids.x, z: LOC.kids.z - 1.5 }, pitch: 840, accent: '#b05cff', look: { scale: 0.6, scarf: 0xb05cff, hat: 'bow', hatColor: 0xb05cff }, portrait: { kid: true, hat: 'bow', accent: '#b05cff' } },
  sunny: { name: 'Sunny', pos: { x: LOC.kids.x + 3, z: LOC.kids.z + 1.5 }, pitch: 700, accent: '#ffd23d', look: { scale: 0.64, scarf: 0xffd23d }, portrait: { kid: true, accent: '#ffd23d' } },
  captain: { name: 'Captain Flipper', pos: null, pitch: 300, accent: '#2b4a9a', look: { scale: 1.06, hat: 'sailor', scarf: 0x2b4a9a }, portrait: { hat: 'sailor', accent: '#2b4a9a' } },
  fern: { name: 'Fern', pos: LOC.fern, pitch: 620, accent: '#38c9a8', look: { hat: 'flowers', scarf: 0x38c9a8 }, portrait: { hat: 'flowers', accent: '#38c9a8' } },
  mittens: {
    name: 'Mama Mittens', pos: LOC.mittens, pitch: 520, accent: '#ff7ab8',
    look: { scale: 1.08, hat: 'beanie', hatColor: 0xff7ab8, scarf: 0xff7ab8, extras: (p) => p.body.add(apron(0xffc2dc)) },
    portrait: { hat: 'beanie', accent: '#ff7ab8' },
  },
  pebble: { name: 'Pebble', pos: LOC.pebble, pitch: 660, accent: '#ff9a3c', look: { hat: 'helmetLamp', scarf: 0xff9a3c }, portrait: { hat: 'helmet', accent: '#ff9a3c' } },
  skipper: { name: 'Scout Skipper', pos: LOC.skipper, pitch: 440, accent: '#3aa0ff', look: { scale: 1.04, hat: 'beanie', hatColor: 0x3aa0ff, scarf: 0x3aa0ff }, portrait: { hat: 'beanie', accent: '#3aa0ff' } },
  purl: {
    name: 'Granny Purl', pos: LOC.purl, pitch: 460, accent: '#e8434b', faceTo: LOC.campfire,
    look: { scale: 0.98, body: 0x333a58, hat: 'beanie', hatColor: 0xe8434b, scarf: 0xe8434b, extras: (p) => { const b = bowTie(0xffffff); b.position.set(0, 1.36, 0.9); p.body.add(b); } },
    portrait: { hat: 'beanie', glasses: true, accent: '#e8434b' },
  },
  nestle: {
    name: 'Nana Nestle', pos: LOC.nestle, pitch: 560, accent: '#ffb347', faceTo: LOC.huts,
    look: { scale: 1.06, hat: 'earmuffs', hatColor: 0xffb347, scarf: 0xffb347, extras: (p) => p.body.add(apron(0xfff0c8)) },
    portrait: { accent: '#ffb347' },
  },
  king: {
    name: 'The Glimmer King', pos: LOC.kingSpot, pitch: 200, accent: '#ffd86b', faceTo: { x: LOC.spire.x, z: LOC.spire.z + 40 },
    look: { scale: 1.6, body: 0x3a3070, belly: 0xfff6e0, scarf: 0xffd86b, hat: 'crown' },
    portrait: { accent: '#ffd86b', hat: 'crown' },
  },
};

export const REGION_INFO = {
  lake: { name: 'Glimmer Lake', subject: 'Multiply & Divide' },
  grove: { name: 'Crystal Grove', subject: 'Fractions' },
  huts: { name: 'Heart Huts', subject: 'Decimals, Money & Percents' },
  cave: { name: 'Glacier Cave', subject: 'Geometry & Measurement' },
  ridge: { name: 'Gloom Ridge', subject: 'Number Sense & Algebra' },
};
