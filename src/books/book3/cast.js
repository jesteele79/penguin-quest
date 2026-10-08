// Skyreach's friends. Guildmaster Astra is an emperor penguin (the tallest kind) who keeps the Starwell;
// Captain Swoop leads the Glider Guild; Vela is a chinstrap cadet. Tock is a clockwork owl and Wren a puffin.
// The Professor, Rocco and Cinder came up from the Ember Isles.
import * as THREE from 'three';
import { LOC } from './layout.js';
import { bowTie, apron, soot, solid } from '../../actors/accessories.js';

const K = LOC.kids;

// An emperor penguin's golden ear patches.
function earPatches(p) {
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), solid(0xffc23d));
    m.position.set(s * 0.66, -0.18, 0.22);
    m.scale.set(0.55, 1, 0.4);
    m.rotation.z = s * 0.4;
    p.head.add(m);
  }
}

export const NPCS = {
  professor: {
    name: 'Professor Waddlesworth', pos: LOC.professor, pitch: 360, accent: '#d8333f', faceTo: LOC.start,
    look: { scale: 1.12, body: 0x2c3252, scarf: null, hat: 'scholar', extras: (p) => { const b = bowTie(0xd8333f); b.position.set(0, 1.58, 0.82); p.body.add(b); } },
    portrait: { glasses: true, hat: 'cap', accent: '#d8333f' },
  },
  cinder: {
    name: 'Cinder', pos: LOC.cinder, pitch: 600, accent: '#ff7f50', faceTo: { x: 0, z: 90 },
    look: { scale: 0.96, hat: 'goggles', scarf: 0x8a5a3a, extras: soot },
    portrait: { goggles: true, soot: true, accent: '#ff7f50' },
  },
  vela: {
    name: 'Vela', pos: LOC.vela, pitch: 720, accent: '#2ec4b6', faceTo: LOC.start,
    look: { scale: 0.8, body: 0x2a2e40, hat: 'aviator', scarf: 0x2ec4b6 },
    portrait: { hat: 'aviator', body: '#2a2e40', accent: '#2ec4b6' },
  },
  swoop: {
    name: 'Captain Swoop', pos: LOC.swoop, pitch: 480, accent: '#ffb000', faceTo: { x: -80, z: 0 },
    look: { scale: 1.02, iris: 0x8a3a1a, hat: 'aviator', hatColor: 0x5a3a2a, scarf: 0xffd23d },
    portrait: { hat: 'aviator', iris: '#8a3a1a', accent: '#ffb000' },
  },
  astra: {
    name: 'Guildmaster Astra', pos: LOC.astra, pitch: 330, accent: '#7a7aff', faceTo: { x: -4, z: -60 },
    look: { scale: 1.22, body: 0x1e2440, hat: 'starhood', scarf: null, extras: earPatches },
    portrait: { hat: 'starhood', body: '#1e2440', accent: '#7a7aff' },
  },
  tock: {
    name: 'Tock', pos: LOC.tock, pitch: 900, accent: '#c9a25a', faceTo: { x: 90, z: 34 }, model: 'owl',
    look: { scale: 0.95 }, portrait: { species: 'owl', accent: '#c9a25a' },
  },
  rocco: {
    name: 'Rocco', pos: LOC.rocco, pitch: 560, accent: '#ff6b35', faceTo: { x: 70, z: 116 },
    look: { scale: 0.92, body: 0x22263a, iris: 0xd0302a, scarf: 0xff6b35, hat: 'crest' },
    portrait: { crest: true, iris: '#d0302a', accent: '#ff6b35' },
  },
  nimbus: {
    name: 'Nimbus', pos: LOC.nimbus, pitch: 780, accent: '#ff8fc8', faceTo: { x: 12, z: 66 },
    look: { scale: 0.88, body: 0x3c5a9a, hat: 'beanie', hatColor: 0xff8fc8, scarf: 0xffffff, extras: (p) => p.body.add(apron(0xffe0f0)) },
    portrait: { hat: 'beanie', body: '#3c5a9a', accent: '#ff8fc8' },
  },
  wren: {
    name: 'Wren', pos: LOC.wren, pitch: 860, accent: '#ff6a2a', faceTo: { x: -10, z: 80 }, model: 'puffin',
    look: { scale: 1.0 }, portrait: { species: 'puffin', accent: '#ff6a2a' },
  },
  zephyr: {
    name: 'Zephyr', pos: { x: K.x - 3, z: K.z + 1 }, pitch: 840, accent: '#5aa9e6', faceTo: LOC.start,
    look: { scale: 0.6, scarf: 0x5aa9e6, hat: 'propeller' }, portrait: { kid: true, hat: 'propeller', accent: '#5aa9e6' },
  },
  comet: {
    name: 'Comet', pos: { x: K.x, z: K.z - 2 }, pitch: 760, accent: '#ffd23d', faceTo: LOC.start,
    look: { scale: 0.62, scarf: 0xffd23d, hat: 'aviator', hatColor: 0xb05cff }, portrait: { kid: true, hat: 'aviator', accent: '#ffd23d' },
  },
  skye: {
    name: 'Skye', pos: { x: K.x + 3, z: K.z + 1.5 }, pitch: 800, accent: '#ff72c8', faceTo: LOC.start,
    look: { scale: 0.58, scarf: 0xff72c8, hat: 'bow', hatColor: 0xff72c8 }, portrait: { kid: true, hat: 'bow', accent: '#ff72c8' },
  },
};

export const REGION_INFO = {
  lake: { name: 'Wind Gardens', subject: 'Ratios & Rates' },
  grove: { name: 'Cloud Valleys', subject: 'Negative Numbers' },
  huts: { name: 'Clockwork Observatory', subject: 'Expressions & Equations' },
  cave: { name: 'Crystal Workshop', subject: 'Geometry' },
  ridge: { name: 'Star Guild', subject: 'Statistics' },
};
