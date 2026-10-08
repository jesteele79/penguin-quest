// The Ember Isles' friends. Most are penguins: Isa is a Galapagos penguin (the only kind that lives north of
// the equator), Rocco a rockhopper with golden plumes, Keeper Lumi a little blue penguin (the smallest
// kind). Tortuga, an old sea turtle, and Shelldon, a hermit crab, use their own models.
import { LOC } from './layout.js';
import { bowTie, apron, lei, soot } from '../../actors/accessories.js';

const K = LOC.kids;

export const NPCS = {
  professor: {
    name: 'Professor Waddlesworth', pos: LOC.professor, pitch: 360, accent: '#d8333f', faceTo: LOC.start,
    look: { scale: 1.12, body: 0x2c3252, scarf: null, hat: 'scholar', extras: (p) => { const b = bowTie(0xd8333f); b.position.set(0, 1.58, 0.82); p.body.add(b); } },
    portrait: { glasses: true, hat: 'cap', accent: '#d8333f' },
  },
  captain: {
    name: 'Captain Flipper', pos: { x: -6, z: 124 }, pitch: 300, accent: '#2b4a9a', faceTo: { x: 0, z: 104 },
    look: { scale: 1.06, hat: 'sailor', scarf: 0x2b4a9a }, portrait: { hat: 'sailor', accent: '#2b4a9a' },
  },
  isa: {
    name: 'Isa', pos: LOC.isa, pitch: 700, accent: '#2ec4b6', faceTo: { x: -80, z: 16 },
    look: { scale: 0.86, body: 0x2e2a3a, scarf: null, hat: 'hibiscus', extras: (p) => p.body.add(lei()) },
    portrait: { hat: 'hibiscus', lei: true, body: '#2e2a3a', accent: '#2ec4b6' },
  },
  rocco: {
    name: 'Rocco', pos: LOC.rocco, pitch: 560, accent: '#ff6b35', faceTo: { x: -38, z: -30 },
    look: { scale: 0.92, body: 0x22263a, iris: 0xd0302a, scarf: 0xff6b35, hat: 'crest' },
    portrait: { crest: true, iris: '#d0302a', accent: '#ff6b35' },
  },
  marlo: {
    name: 'Chef Marlo', pos: LOC.marlo, pitch: 500, accent: '#ff9f1c', faceTo: { x: 110, z: 30 },
    look: { scale: 1.1, hat: 'chef', scarf: 0xff9f1c, extras: (p) => p.body.add(apron(0xfff4dc)) },
    portrait: { hat: 'chef', accent: '#ff9f1c' },
  },
  shelldon: {
    name: 'Shelldon', pos: LOC.shelldon, pitch: 820, accent: '#e84a5f', faceTo: { x: 118, z: 34 }, model: 'crab',
    look: { scale: 1.3 }, portrait: { species: 'crab', accent: '#e84a5f' },
  },
  tortuga: {
    name: 'Tortuga', pos: LOC.tortuga, pitch: 230, accent: '#2a9d8f', faceTo: { x: -60, z: 104 }, model: 'turtle',
    look: { scale: 1.25 }, portrait: { species: 'turtle', accent: '#2a9d8f' },
  },
  lumi: {
    name: 'Keeper Lumi', pos: LOC.lumi, pitch: 640, accent: '#5aa9e6', faceTo: { x: 80, z: -84 },
    look: { scale: 0.74, body: 0x41639a, hat: 'souwester', scarf: 0x5aa9e6 },
    portrait: { hat: 'souwester', body: '#41639a', accent: '#5aa9e6' },
  },
  cinder: {
    name: 'Cinder', pos: LOC.cinder, pitch: 600, accent: '#ff7f50', faceTo: { x: 40, z: -50 },
    look: { scale: 0.96, hat: 'goggles', scarf: 0x8a5a3a, extras: soot },
    portrait: { goggles: true, soot: true, accent: '#ff7f50' },
  },
  nori: {
    name: 'Nori', pos: { x: K.x - 3, z: K.z + 1 }, pitch: 840, accent: '#ff5c8a', faceTo: LOC.start,
    look: { scale: 0.6, scarf: 0xff5c8a, hat: 'hibiscus' }, portrait: { kid: true, hat: 'hibiscus', accent: '#ff5c8a' },
  },
  kai: {
    name: 'Kai', pos: { x: K.x, z: K.z - 2 }, pitch: 760, accent: '#3ac4ff', faceTo: LOC.start,
    look: { scale: 0.62, scarf: 0x3ac4ff, hat: 'sunhat' }, portrait: { kid: true, hat: 'sunhat', accent: '#3ac4ff' },
  },
  lani: {
    name: 'Lani', pos: { x: K.x + 3, z: K.z + 1.5 }, pitch: 800, accent: '#ffd23d', faceTo: LOC.start,
    look: { scale: 0.58, scarf: null, extras: (p) => p.body.add(lei([0xffd23d, 0xffffff, 0xff8a3d])) },
    portrait: { kid: true, lei: true, accent: '#ffd23d' },
  },
};

export const REGION_INFO = {
  lake: { name: 'Forge Volcano', subject: 'Multiply & Divide' },
  grove: { name: 'Coral Lagoon', subject: 'Fractions' },
  huts: { name: 'Harbor Market', subject: 'Decimals & Place Value' },
  cave: { name: 'Sunken Temple', subject: 'Geometry & Measurement' },
  ridge: { name: 'Lighthouse Cliffs', subject: 'Expressions & Patterns' },
};
