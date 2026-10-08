// What makes Glacier Bay itself, for the shared game systems: its extra props, interaction points, how the
// world reflects the save, story anchors, the opening scene and a few friends with special jobs.
import * as THREE from 'three';
import { G } from '../../core/state.js';
import { LOC, PATROL_BOARD, CAULDRON, SLALOM, REGIONS as PLACES } from './layout.js';
import { SPIRE_TOP, FESTIVAL_SPOT } from './story.js';
import { buildCauldron, startStarCharts } from '../../game/minigames/simple.js';
import { buildFloeBridge } from '../../game/minigames/floehop.js';
import { startIntro } from '../../game/minigames/scenes.js';
import { signTexture } from '../../core/textures.js';
import { lambert } from '../../core/materials.js';
import { Penguin } from '../../actors/penguin.js';

const V = (x, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const SUBJECTS = ['lake', 'grove', 'huts', 'cave', 'ridge'];

function buildPatrolBoard(ctx) {
  const { x, z } = PATROL_BOARD;
  const y = ctx.terrain.heightAt(x, z);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.atan2(LOC.start.x - x, LOC.start.z - z);
  const wood = lambert({ color: 0x7b5236 });
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3, 6), wood);
    post.position.set(s * 1.3, 1.5, 0);
    g.add(post);
  }
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.8, 0.14), lambert({ color: 0x8a5c38 }));
  board.position.y = 2.1;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.55), lambert({ map: signTexture(['Aurora Patrol']) }, false));
  sign.position.set(0, 3.25, 0.09);
  g.add(board, sign);
  const paper = new THREE.MeshLambertMaterial({ color: 0xfff6e0, emissive: 0x332a10 });
  [-0.85, 0, 0.85].forEach((px, i) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), paper);
    p.position.set(px, 2.05 + (i === 1 ? 0.08 : 0), 0.08);
    p.rotation.z = (i - 1) * 0.08;
    g.add(p);
  });
  ctx.scene.add(g);
  ctx.collision.addCircle(x, z, 1.5, 'board');
  ctx.glow.add(x, y + 2.2, z, 0xffd166, 3.5, 0.5);
}

export const HOOKS = {
  extras(ctx) {
    buildCauldron(ctx);
    buildPatrolBoard(ctx);
  },

  gameAnchors: ['fishSpot', 'jetty', 'counter', 'pad', 'arena', 'cauldron', 'slalomTop'],

  interactions(I) {
    I.add({ id: 'easel', pos: { x: LOC.easel.x, z: LOC.easel.z }, radius: 3.2, label: () => (G.quests.done('ch0') ? 'Solve the Star Charts' : null), action: () => startStarCharts() });
    I.add({ id: 'board', pos: PATROL_BOARD, radius: 3.4, label: () => (G.quests.done('ch0') ? 'Read the Aurora Patrol board' : null), action: () => G.screens.journal('patrol') });
  },

  // The title screen flies over a fully restored sky.
  titleWorld() { for (const r of [...SUBJECTS, 'crown']) G.world.sky.setRestored(r, true, true); },

  syncWorld(d, ctx) {
    G.world.sky.setRestored('crown', !!d.finale, true);
    ctx.islandBarrier.setUp(!d.crystals.lake);
    const spireOpen = d.finale || (G.quests.started('ch6') && G.quests.st('ch6').step >= 1);
    ctx.spire.setOpen(!!spireOpen);
    ctx.spire.setFinale(!!d.finale);
    if (d.flags.floeBridge) buildFloeBridge(d.flags.floeBridge);
  },

  // Gloom Ridge's purple tint lifts once its crystal is restored.
  gloomCleared: (d) => !!d.crystals.ridge,

  anchor(key, ctx) {
    switch (key) {
      case 'professor': case 'purl': case 'king': return G.npcs.get(key).pos;
      case 'fishSpot': return V(ctx.dock.waterEnd.x - 1.2, 0, ctx.dock.waterEnd.z);
      case 'jetty': return V(ctx.launch.waterEnd.x, 0, ctx.launch.waterEnd.z + 1.2);
      case 'counter': return V(LOC.counter.x + 2.2, 0, LOC.counter.z);
      case 'pad': return V(ctx.buildPad.x, 0, ctx.buildPad.z);
      case 'arena': return V(LOC.arena.x, 0, LOC.arena.z);
      case 'cauldron': return V(CAULDRON.x, 0, CAULDRON.z);
      case 'slalomTop': return V(SLALOM.top.x, 0, SLALOM.top.z);
      case 'easel': return V(LOC.easel.x, 0, LOC.easel.z);
      case 'spireTop': return V(SPIRE_TOP.x, 0, SPIRE_TOP.z);
      case 'festival': return V(FESTIVAL_SPOT.x, 0, FESTIVAL_SPOT.z);
      case 'board': return V(PATROL_BOARD.x, 0, PATROL_BOARD.z);
      default: return null;
    }
  },

  intro: startIntro,

  onRestore(region, ctx) {
    if (region === 'lake') ctx.islandBarrier.setUp(false);
  },

  // The Glimmer King only exists after the finale battle.
  update(q) {
    const here = q.done('ch6') || (q.active('ch6') && q.st('ch6').step >= 2);
    const king = G.npcs.get('king');
    if (king && king.visible !== here) G.npcs.setVisible('king', here);
  },

  prologueFriends: ['professor', 'mo', 'lulu', 'sunny'],
  prologueLine: "Oh, hello there! Have you seen Professor Waddlesworth? He's been looking for you by the big igloo.",
  shop: { npc: 'mittens', after: 'ch3', line: 'Want to try on something cozy? My Wardrobe is open!' },
  nursery: 'nestle',
  // The lost little ones of the side quest.
  young: {
    kind: 'chick', names: ['Peep', 'Tuffy', 'Bean', 'Dot', 'Waddle', 'Squeak', 'Pudding', 'Button'],
    make: (scene) => new Penguin(scene, { name: 'chick', scale: 0.4, body: 0x7d869f, belly: 0xe6e9f2, scarf: null, lowPoly: true }),
    home: 'Nana Nestle at the Heart Huts', homeShort: 'Nana Nestle', keeper: 'nestle',
    firstHome: 'My sweet chick! Thank you, dear. Seven more are still out there.', moreHome: (n) => `That makes ${n}! Thank you, dear.`,
  },
  helpers: { lake: 'Captain Flipper at the fishing dock', grove: 'Fern in the grove', huts: 'Mama Mittens at the huts', cave: 'Pebble outside the cave', ridge: 'Scout Skipper below the ridge' },
  places: PLACES,
};
