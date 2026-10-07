// Characters, wardrobe items and other game content.
import { LOC } from '../world/layout.js';
import { bowTie, apron } from '../actors/accessories.js';

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

// Wardrobe. price = fish coins; stars = Aurora Stars from the daily patrol; price null = earned.
export const SHOP = {
  sled: [
    { id: null, name: 'Belly (no sled)', price: 0 },
    { id: 'wood', name: 'Wooden Sled', price: 80, color: 0x9a6a44 },
    { id: 'ice', name: 'Ice Sled', price: 140, color: 0x9fe8ff },
    { id: 'royal', name: 'Royal Sled', price: 400, color: 0x8a5cff },
    { id: 'golden', name: 'Golden Sled', price: 700, color: 0xffcc3d },
    { id: 'comet', name: 'Comet Sled', stars: 12, color: 0xffd166 },
  ],
  buddy: [
    { id: null, name: 'No buddy', price: 0 },
    { id: 'chick', name: 'Chick Buddy', price: null, how: 'Bring all 8 lost chicks home' },
    { id: 'glimmer', name: 'Glimmer Buddy', price: null, how: 'Finish the Glimmer Friends quest' },
  ],
  scarf: [
    { id: 'coral', name: 'Coral Red', color: 0xff5a4e, css: '#ff5a4e', price: 0 },
    { id: 'ocean', name: 'Ocean Blue', color: 0x2f8cff, css: '#2f8cff', price: 40 },
    { id: 'mint', name: 'Minty Green', color: 0x39d98a, css: '#39d98a', price: 40 },
    { id: 'sunny', name: 'Sunny Yellow', color: 0xffd23d, css: '#ffd23d', price: 40 },
    { id: 'royal', name: 'Royal Purple', color: 0x8a5cff, css: '#8a5cff', price: 60 },
    { id: 'midnight', name: 'Midnight', color: 0x2a2f6a, css: '#2a2f6a', price: 60 },
    { id: 'candy', name: 'Candy Stripe', color: 0xffffff, tex: 'candy', css: 'repeating-linear-gradient(90deg,#ff4d6d 0 8px,#fff 8px 16px)', price: 120 },
    { id: 'rainbow', name: 'Rainbow', color: 0xffffff, tex: 'rainbow', css: 'linear-gradient(90deg,#ff5a5a,#ffa53d,#ffe14d,#5ee37a,#4db8ff,#9a6bff)', price: 250 },
    { id: 'star', name: 'Star Chart', color: 0xffffff, tex: 'star', css: 'radial-gradient(circle at 30% 40%,#ffe68a 0 2px,transparent 3px),radial-gradient(circle at 70% 60%,#fff 0 2px,transparent 3px),#1b2360', price: null, how: 'Finish star charts on 3 days' },
    { id: 'heart', name: 'Heart Knit', color: 0xffffff, tex: 'heart', css: 'repeating-linear-gradient(90deg,#e8434b 0 10px,#fff4ec 10px 14px)', price: null, how: "Help Granny Purl's knitting" },
    { id: 'frost', name: 'Frost Flakes', color: 0xffffff, tex: 'frost', css: 'repeating-linear-gradient(90deg,#bfe6ff 0 10px,#ffffff 10px 12px)', price: 300 },
    { id: 'aurora', name: 'Aurora Silk', color: 0xffffff, tex: 'aurora', css: 'linear-gradient(90deg,#4dffa0,#38f0d2,#55b4ff,#b483ff,#ff72c8)', price: 500 },
    { id: 'galaxy', name: 'Galaxy', color: 0xffffff, tex: 'galaxy', css: 'linear-gradient(90deg,#2a1a6a,#6a3ad8,#1a2a8a),#2a1a6a', stars: 8 },
  ],
  hat: [
    { id: null, name: 'No hat', price: 0 },
    { id: 'beanie', name: 'Pom Beanie', price: 50, color: 0x3aa0ff },
    { id: 'earmuffs', name: 'Earmuffs', price: 60 },
    { id: 'headphones', name: 'Headphones', price: 90 },
    { id: 'tophat', name: 'Top Hat', price: 100 },
    { id: 'wizard', name: 'Wizard Hat', price: 150 },
    { id: 'viking', name: 'Viking Helmet', price: 150 },
    { id: 'pirate', name: 'Pirate Hat', price: null, how: "Dig up the Captain's 4 treasures" },
    { id: 'party', name: 'Party Hat', price: null, how: 'Bring 10 snowflakes to Mo' },
    { id: 'crown', name: 'Aurora Crown', price: null, how: 'Finish Chapter 6' },
  ],
  trail: [
    { id: 'snow', name: 'Snow Spray', colors: [0xffffff, 0xdfeaff], price: 0 },
    { id: 'sparkle', name: 'Gold Sparkles', colors: [0xffd166, 0xfff3c0], price: 80 },
    { id: 'hearts', name: 'Pink Hearts', colors: [0xff72c8, 0xff4d6d], price: 100 },
    { id: 'stars', name: 'Starlight', colors: [0xfff3a0, 0x9fe8ff], price: null, how: 'Bring 20 snowflakes to Mo' },
    { id: 'rainbow', name: 'Rainbow Slide', colors: [0xff5a5a, 0xffa53d, 0xffe14d, 0x5ee37a, 0x4db8ff, 0x9a6bff], price: 200 },
    { id: 'ember', name: 'Ember Sparks', colors: [0xff9a3c, 0xffd166, 0xff5a4e], price: 300 },
    { id: 'aurora', name: 'Aurora Ribbon', colors: [0x4dffa0, 0x38f0d2, 0xb483ff, 0xff72c8], price: 450 },
    { id: 'comet', name: 'Comet Tail', colors: [0xffd166, 0xff9a3c, 0xffffff], stars: 6 },
  ],
};

export const SLOT_NAMES = { scarf: 'Scarves', hat: 'Hats', trail: 'Slide trails', sled: 'Sleds', buddy: 'Buddies' };

export const findItem = (slot, id) => SHOP[slot].find((i) => i.id === id);

export const REGION_INFO = {
  lake: { name: 'Glimmer Lake', subject: 'Multiply & Divide' },
  grove: { name: 'Crystal Grove', subject: 'Fractions' },
  huts: { name: 'Heart Huts', subject: 'Decimals, Money & Percents' },
  cave: { name: 'Glacier Cave', subject: 'Geometry & Measurement' },
  ridge: { name: 'Gloom Ridge', subject: 'Number Sense & Algebra' },
};

export const REGION_ORDER = ['lake', 'grove', 'huts', 'cave', 'ridge'];
