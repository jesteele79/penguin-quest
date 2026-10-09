// What makes Skyreach itself, for the shared game systems (see book1/hooks.js for the shape). Its five island
// slots teach Book 3's own subjects: regionDomain says which subject each slot's chapter, anchor and
// practice use.
import * as THREE from 'three';
import { G } from '../../core/state.js';
import { LOC, PATROL_BOARD, CAULDRON, SLALOM, REGIONS as PLACES } from './layout.js';
import { SPIRE_TOP, FESTIVAL_SPOT } from './story.js';
import { startSkyCharts } from './games.js';
import { startSkyArrival } from './scenes.js';
import { skyFrame } from './glider.js';
import { Puffin } from '../../actors/critters.js';
import { mergeColored, mat } from '../../core/geo.js';

const V = (x, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const SUBJECTS = ['lake', 'grove', 'huts', 'cave', 'ridge'];

// A golden sky feather: a long, softly curved vane on a thin quill.
const featherGeo = (() => {
  const vane = new THREE.SphereGeometry(0.5, 10, 6);
  vane.scale(0.32, 1.2, 0.06);
  return mergeColored([
    { geo: vane, color: 0xffd166, matrix: mat(0, 0.15, 0) },
    { geo: new THREE.CylinderGeometry(0.025, 0.03, 1.3, 4), color: 0xc8902a, matrix: mat(0, 0.05, 0.02) },
  ]);
})();
const featherMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0xffc040, emissiveIntensity: 0.4, side: THREE.DoubleSide });

// A glassy sculpture for the workshop contest: a twisted prism tower.
function glassSculpture(seed) {
  const parts = [];
  const n = 3 + (seed % 3);
  for (let i = 0; i < n; i++) {
    const h = 1.2 - i * 0.15;
    parts.push({ geo: new THREE.CylinderGeometry(0.9 - i * 0.18, 1.0 - i * 0.18, h, 6), color: [0x9fe8ff, 0xd8b8ff, 0xffb8e8][(i + seed) % 3], matrix: mat(0, 0.6 + i * 1.05, 0, 0, i * 0.4 + seed, 0) });
  }
  parts.push({ geo: new THREE.OctahedronGeometry(0.4, 0), color: 0xfff1b0, matrix: mat(0, 0.9 + n * 1.05, 0) });
  const m = new THREE.Mesh(mergeColored(parts), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x2a2048, transparent: true, opacity: 0.88, flatShading: true }));
  m.castShadow = true;
  return m;
}

export const HOOKS = {
  extras() {},

  gameAnchors: ['fishSpot', 'counter', 'pad', 'arena', 'slalomTop', 'towerTop', 'meadow', 'vale', 'dome', 'clockFace', 'kiln', 'scope'],

  interactions(I) {
    I.add({ id: 'easel', pos: { x: LOC.easel.x, z: LOC.easel.z }, radius: 3.2, label: () => (G.quests.done('ch0') ? 'Work on the Sky Charts' : null), action: () => startSkyCharts() });
    I.add({ id: 'board', pos: PATROL_BOARD, radius: 3.4, label: () => (G.quests.done('ch0') ? 'Read the Sky Patrol board' : null), action: () => G.screens.journal('patrol') });
  },

  // The title screen flies over the islands with every constellation lit.
  titleWorld() {
    for (const r of [...SUBJECTS, 'crown']) G.world.sky.setRestored(r, true, true);
    G.world.ctx.spire.setOpen(true, true);
  },

  syncWorld(d, ctx) {
    G.world.sky.setRestored('crown', !!d.finale, true);
    ctx.spire.setOpen(!!d.finale || G.quests.started('ch6'), true);
    ctx.spire.setFinale(!!d.finale, true);
    if (d.q?.ch3?.done) ctx.clock.running = true;
  },

  // The Hush's grey over the Starwell lifts once the Star Map is whole.
  gloomCleared: (d) => !!d.finale,

  anchor(key, ctx) {
    switch (key) {
      case 'professor': case 'cinder': return G.npcs.get(key).pos;
      case 'fishSpot': return V(ctx.dock.waterEnd.x - 1.2, 0, ctx.dock.waterEnd.z);
      case 'counter': return V(LOC.counter.x - 2.2, 0, LOC.counter.z + 1.2);
      case 'pad': return V(ctx.buildPad.x, 0, ctx.buildPad.z + 5);
      case 'arena': return V(LOC.arena.x, 0, LOC.arena.z);
      case 'cauldron': return V(CAULDRON.x, 0, CAULDRON.z);
      case 'slalomTop': return V(SLALOM.top.x, 0, SLALOM.top.z);
      case 'easel': return V(LOC.easel.x, 0, LOC.easel.z);
      case 'board': return V(PATROL_BOARD.x, 0, PATROL_BOARD.z);
      case 'towerTop': return V(LOC.tower.x + 6, 0, LOC.tower.z + 12);
      case 'meadow': return V(LOC.meadow.x, 0, LOC.meadow.z);
      // A couple of steps inland from the balloon lift's landing.
      case 'vale': return V(LOC.vale.x + (LOC.vale.x - LOC.lift.x) * 0.25, 0, LOC.vale.z + (LOC.vale.z - LOC.lift.z) * 0.25);
      case 'dome': return V(LOC.dome.x - 8, 0, LOC.dome.z);
      case 'clockFace': return V(LOC.clockFace.x - 2, 0, LOC.clockFace.z);
      case 'kiln': return V(LOC.kiln.x - 4, 0, LOC.kiln.z - 3);
      case 'scope': return V(LOC.scope.x, 0, LOC.scope.z + 4);
      case 'wellTop': case 'spireTop': case 'craterRim': return V(SPIRE_TOP.x, 0, SPIRE_TOP.z);
      case 'festival': return V(FESTIVAL_SPOT.x, 0, FESTIVAL_SPOT.z);
      default: return null;
    }
  },

  intro: startSkyArrival,

  onRestore(region) { G.world.sky.pulse(region, 2.5); },

  frame: skyFrame,

  // Sky carp swim in the air just below the end of the mooring pier, rising to the bait.
  fishWater: (dock) => dock.top - 1.6,

  // Glider wings come from Captain Swoop once the wind pinwheels are balanced.
  update(q) {
    G.player.canGlide = q.done('ch1') || (q.active('ch1') && q.st('ch1').step >= 2);
    G.hud.setGlide(G.player.canGlide);
  },

  regionDomain: { lake: 'ratios', grove: 'neg', huts: 'ridge', cave: 'cave', ridge: 'stars' },
  // Cinder's airship flies down to the seas of the other books.
  ferries: { cinder: ['book1', 'book2'] },
  prologueFriends: ['professor', 'vela', 'zephyr', 'comet', 'skye', 'cinder'],
  prologueLine: 'Hello up there! The Professor is waiting for you by his telescope.',
  shop: {
    npc: 'nimbus', after: 'ch3', line: 'Want to try something on? My wardrobe chest is open!',
    title: "Nimbus's Wardrobe Chest", where: "Buy new things from Nimbus's wardrobe chest in Guild Town.",
  },
  nursery: 'wren',
  mentors: { captain: 'swoop', fern: 'vela', mittens: 'nimbus', pebble: 'rocco', skipper: 'tock', isa: 'vela', marlo: 'nimbus', tortuga: 'astra', lumi: 'astra' },
  slalomSkills: ['ratio', 'unit_rate', 'percent', 'integers', 'exponents', 'gcf_lcm', 'dec_ops'],
  architect: {
    title: 'Workshop Builder', contestTitle: 'Glass Sculpture Contest', color: '#ff6b35', subtitle: (n) => `Help Rocco rebuild the workshop (${n} builds)`,
    skills: ['volume', 'volume_frac', 'surface_area', 'area_poly', 'area_tri', 'coord_poly'],
    sculptSkills: ['volume', 'volume_frac', 'surface_area', 'area_poly'],
    cube: { color: 0xbfe8ff, emissive: 0x2a3a6a, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 }, ghost: 0xe0f4ff,
    sculpt: (seed) => glassSculpture(seed),
  },
  market: {
    title: "Nimbus's Cloud Candy", rushTitle: 'Festival Rush', color: '#ff8fc8',
    skills: ['money', 'dec_ops', 'unit_rate', 'percent', 'ratio', 'dec_addsub'],
    lines: ['One cloud candy, please!', 'Can you help me with my order?', 'What do I owe?', 'Is pink on sale today?', 'Three star cookies, please!', 'Is the starlight flavor ready?', 'Keep the change? Just kidding!', 'Two for my cadets, please!'],
    hats: [null, null, 'propeller', 'aviator', 'beanie', 'party', 'headphones'],
  },
  gloomLook: { hush: true },
  collectible: {
    height: 0.95, glow: 0xffe08a, glowSize: 2.2, glowAmount: 0.45,
    make: () => new THREE.Mesh(featherGeo, featherMat),
  },
  young: {
    kind: 'puffling', names: ['Tuft', 'Nib', 'Dot', 'Scoot', 'Fluff', 'Bean', 'Puff', 'Wisp'],
    make: (scene) => new Puffin(scene, { name: 'puffling', scale: 0.42, baby: true }),
    home: "Wren's nesting bank in Guild Town", homeShort: 'the nesting bank', keeper: 'wren',
    firstHome: 'Your first puffling is home! Seven more are still out there.', moreHome: (n) => `That makes ${n}! Listen to them peep!`,
  },
  helpers: { lake: 'Captain Swoop in the Wind Gardens', grove: 'Vela in the Cloud Valleys', huts: 'Tock at the Clockwork Observatory', cave: 'Rocco at the Crystal Workshop', ridge: 'Guildmaster Astra at the Star Guild' },
  places: PLACES,
};
