// What makes the Ember Isles themselves, for the shared game systems (see book1/hooks.js for the shape).
import * as THREE from 'three';
import { G } from '../../core/state.js';
import { LOC, PATROL_BOARD, CAULDRON, SLALOM, REGIONS as PLACES } from './layout.js';
import { SPIRE_TOP, FESTIVAL_SPOT } from './story.js';
import { startTideCharts } from './games.js';
import { startArrival } from './scenes.js';
import { Turtle } from '../../actors/critters.js';
import { sandcastle } from './props.js';
import { buildLavaBridge, lavaFrame } from './lavahop.js';

// Sea glass: smooth, frosted pebbles in five old-bottle colours.
const GLASS = [0x7fe0d0, 0x8fd88a, 0x7ab8f0, 0xf0c070, 0xe8f4f0];
const glassGeo = new THREE.IcosahedronGeometry(0.42, 1);
glassGeo.scale(1.25, 0.55, 0.9);
const glassMats = GLASS.map((c) => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, transparent: true, opacity: 0.88 }));

const V = (x, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const SUBJECTS = ['lake', 'grove', 'huts', 'cave', 'ridge'];

export const HOOKS = {
  extras() {},

  gameAnchors: ['fishSpot', 'counter', 'pad', 'arena', 'slalomTop', 'lavaStart', 'forgeFire', 'snorkelStart', 'station', 'templeSteps'],

  interactions(I) {
    I.add({ id: 'easel', pos: { x: LOC.easel.x, z: LOC.easel.z }, radius: 3.2, label: () => (G.quests.done('ch0') ? 'Work on the Tide Charts' : null), action: () => startTideCharts() });
    I.add({ id: 'board', pos: PATROL_BOARD, radius: 3.4, label: () => (G.quests.done('ch0') ? 'Read the Island Patrol board' : null), action: () => G.screens.journal('patrol') });
  },

  // The title screen flies over warm, glowing islands.
  titleWorld() {
    for (const r of [...SUBJECTS, 'crown']) G.world.sky.setRestored(r, true, true);
    G.world.ctx.crater.setHeat(1);
    G.world.ctx.lighthouse.setOn(true);
  },

  syncWorld(d, ctx) {
    const lit = SUBJECTS.filter((r) => d.crystals[r]).length;
    G.world.sky.setRestored('crown', !!d.finale, true);
    ctx.crater.setHeat(d.finale ? 1 : lit * 0.06);
    ctx.lighthouse.setOn(!!d.crystals.ridge);
    if (d.flags.lavaBridge) buildLavaBridge(d.flags.lavaBridge);
  },

  // Soot on Mount Ember's upper slopes lifts once the Heart-Ember is rekindled.
  gloomCleared: (d) => !!d.finale,

  anchor(key, ctx) {
    switch (key) {
      case 'professor': case 'cinder': return G.npcs.get(key).pos;
      case 'fishSpot': return V(ctx.dock.waterEnd.x + 1.2, 0, ctx.dock.waterEnd.z);
      case 'counter': return V(LOC.counter.x - 2.2, 0, LOC.counter.z + 1.2);
      case 'pad': return V(ctx.buildPad.x, 0, ctx.buildPad.z);
      case 'arena': return V(LOC.arena.x, 0, LOC.arena.z);
      case 'cauldron': return V(CAULDRON.x, 0, CAULDRON.z);
      case 'slalomTop': return V(SLALOM.top.x, 0, SLALOM.top.z);
      case 'easel': return V(LOC.easel.x, 0, LOC.easel.z);
      case 'board': return V(PATROL_BOARD.x, 0, PATROL_BOARD.z);
      case 'lavaStart': return V(LOC.lavaStart.x, 0, LOC.lavaStart.z);
      case 'forgeFire': return V(LOC.forgeFront.x, 0, LOC.forgeFront.z);
      case 'snorkelStart': return V(LOC.snorkelStart.x, 0, LOC.snorkelStart.z);
      case 'station': return V(ctx.station.landEnd.x + 1.5, 0, ctx.station.landEnd.z);
      case 'templeSteps': return V(LOC.temple.x, 0, LOC.temple.z + 12);
      case 'craterRim': case 'spireTop': return V(SPIRE_TOP.x, 0, SPIRE_TOP.z);
      case 'festival': return V(FESTIVAL_SPOT.x, 0, FESTIVAL_SPOT.z);
      default: return null;
    }
  },

  intro: startArrival,

  onRestore(region, ctx) {
    if (region === 'ridge') ctx.lighthouse.setOn(true);
    const lit = SUBJECTS.filter((r) => G.save.data.crystals[r] || r === region).length;
    ctx.crater.setHeat(lit * 0.06);
  },

  frame: lavaFrame,

  // Cinder hides until he is found at the crater, then stays a friend at his camp.
  update(q) {
    const here = q.done('ch6') || (q.active('ch6') && q.st('ch6').step >= 2);
    const cinder = G.npcs.get('cinder');
    if (cinder && cinder.visible !== here) G.npcs.setVisible('cinder', here);
  },

  prologueFriends: ['professor', 'nori', 'kai', 'lani', 'captain'],
  prologueLine: 'Hello there! The Professor has been looking for you. His tent is right by the campfire.',
  shop: { npc: 'marlo', after: 'ch3', line: 'Want to try something on, sweet pea? My wardrobe trunk is open!' },
  nursery: 'lani',
  slalomSkills: ['pow10', 'place_ten', 'dec_round', 'exponents', 'rounding', 'factors', 'patterns'],
  architect: {
    title: 'Temple Builder', contestTitle: 'Sandcastle Contest', color: '#2a9d8f', subtitle: (n) => `Help Tortuga rebuild the temple (${n} builds)`,
    skills: ['volume', 'volume_composite', 'area_rect', 'area_missing', 'perimeter', 'convert5', 'coord', 'area_tri'],
    sculptSkills: ['volume', 'volume_composite', 'area_rect', 'area_missing', 'perimeter'],
    cube: { color: 0xd8c39a, emissive: 0x3a2a14, emissiveIntensity: 0.25 }, ghost: 0xfff1c8,
    sculpt: (seed) => sandcastle(seed),
  },
  market: {
    title: "Chef Marlo's Stall", rushTitle: 'Lunch Rush', color: '#ff9f1c',
    skills: ['money', 'dec_addsub', 'dec_compare', 'dec_round', 'dec_compare3', 'place_ten', 'pow10'],
    lines: ['One mango tart, please!', 'Can you help me with my order?', "I'm so hungry!", 'What do I owe?', 'Mmm, mango weather!', 'Two coconut rolls, please!', 'Is the five-fish soup ready?', 'Keep the change? Just kidding!'],
    hats: [null, null, 'sunhat', 'hibiscus', 'souwester', 'party', 'headphones'],
  },
  gloomLook: { soot: true },
  collectible: {
    height: 0.75, glow: 0x9ff0e4, glowSize: 2.2, glowAmount: 0.45,
    make: (i) => new THREE.Mesh(glassGeo, glassMats[i % GLASS.length]),
  },
  young: {
    kind: 'hatchling', names: ['Sandy', 'Coco', 'Ripple', 'Kelp', 'Shelly', 'Bubbles', 'Mango', 'Tiki'],
    make: (scene) => new Turtle(scene, { name: 'hatchling', scale: 0.3, shell: 0x6f8f46, plate: 0x9ab866, skin: 0x9ad0b0 }),
    home: 'the nest beach by the camp', homeShort: 'the nest beach', keeper: 'lani',
    firstHome: 'Your first little turtle is home! Seven more are still out there.', moreHome: (n) => `That makes ${n}! They are so tiny!`,
  },
  helpers: { lake: 'Rocco at the Lava Forge', grove: 'Isa at the Coral Lagoon', huts: 'Chef Marlo at the harbor', cave: 'Tortuga by the sandbar', ridge: 'Keeper Lumi on the cliffs' },
  places: PLACES,
};
