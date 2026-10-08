// Book 2's puzzle games that live at a place: Rocco's glass orders, Chef Marlo's kelp recipe, Tortuga's
// sea-chart dive, Cinder's siphon machine and the islands' tide charts. Each frames the quiz panel on its
// spot and answers right answers with something you can see.
import * as THREE from 'three';
import { G, pushActivity } from '../../core/state.js';
import { QuizActivity } from '../../game/activities.js';
import { twoShot } from '../../game/minigames/common.js';
import { todayStr } from '../../game/questengine.js';
import { LOC } from './layout.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const at = (p, up = 0) => V(p.x, G.terrain.heightAt(p.x, p.z) + up, p.z);

export function startForgeOrders(params, onDone) {
  const fire = at(LOC.forge, 1.2);
  const shapes = ['bowl', 'float', 'vase', 'bead string', 'lamp', 'window'];
  pushActivity(new QuizActivity({
    title: "Rocco's Glass Orders", subtitle: '6 orders · multiply and divide', color: '#ff6b35', count: 6,
    pick: () => ({ domain: 'lake' }),
    shot: twoShot(G.player.pos, fire, { dist: 8, up: 3.5, lookUp: 0.6 }),
    onCorrect: (p, n) => {
      G.world.effects.burst(fire.clone().add(V(0, 1, 0)), { count: 36, color: [0xff8a3d, 0xffd166, 0xffffff], speed: 5, up: 5, life: 1.2, gravity: 4, size: 0.5 });
      G.toasts.toast(`A glass ${shapes[(n - 1) % shapes.length]}, done!`, { kind: 'gold', ms: 1800 });
    },
    onFinish: () => onDone(),
  }));
}

export function startKelpRecipe(params, onDone) {
  const station = at(LOC.station, 2.6);
  pushActivity(new QuizActivity({
    title: "Chef Marlo's Kelp Recipe", subtitle: 'Scale the recipe · fraction puzzles', color: '#2ec4b6', count: 6,
    pick: () => ({ domain: 'grove', skills: ['frac_of_whole', 'frac_mult', 'frac_scale', 'frac_as_div', 'frac_add_unlike', 'frac_word5', 'frac_times_whole', 'frac_add_like'] }),
    shot: twoShot(G.player.pos, station, { dist: 8, up: 3, lookUp: 0.4 }),
    onCorrect: () => G.world.effects.burst(station.clone().add(V(0, 0.5, 0)), { count: 26, color: [0x4fe0c4, 0xc8fff2, 0xffffff], speed: 3, up: 5, life: 1.4, gravity: 1, size: 0.45 }),
    onFinish: () => onDone(),
  }));
}

export function startChartDive(params, onDone) {
  const T = LOC.temple;
  const top = at(T, 5);
  let keys = 0;
  pushActivity(new QuizActivity({
    title: "Tortuga's Sea Chart", subtitle: 'Find the 3 temple keys · coordinates and shapes', color: '#2a9d8f', count: 6,
    pick: (i) => ({ domain: 'cave', skills: i % 2 === 0 ? ['coord'] : ['volume', 'volume_composite', 'shape_hierarchy', 'convert5'] }),
    shot: { pos: top.clone().add(V(-16, 10, 22)), look: top, fov: 55 },
    onCorrect: (p, n) => {
      if (n % 2 === 0) {
        keys += 1;
        const a = keys * 2.1;
        const spot = V(T.x + Math.cos(a) * 18, 0.4, T.z + Math.sin(a) * 18);
        G.world.effects.burst(spot, { count: 50, color: [0xffd166, 0x4fe0c4, 0xffffff], speed: 6, up: 9, life: 1.6, gravity: 5, size: 0.7 });
        G.toasts.toast(`Temple key ${keys} of 3 found!`, { kind: 'teal' });
      }
    },
    onFinish: () => onDone(),
  }));
}

// Chapter 6's big machine: every right answer turns one of Cinder's siphon gears back.
export function startSiphon(params, onDone) {
  const V0 = LOC.volcano;
  const rim = at({ x: V0.x, z: V0.z + V0.crater }, 1);
  const order = ['lake', 'grove', 'huts', 'cave', 'ridge'];
  pushActivity(new QuizActivity({
    title: 'The Siphon Machine', subtitle: 'Turn back all 8 gears · a puzzle from every subject', color: '#ff7f50', count: 8, closable: true,
    pick: (i) => ({ domain: order[i % order.length], minTier: 2 }),
    shot: { pos: rim.clone().add(V(10, 8, 16)), look: V(V0.x, rim.y - 2, V0.z), fov: 55 },
    onCorrect: (p, n) => {
      G.world.effects.burst(V(V0.x, rim.y + 2, V0.z), { count: 40, color: [0xc89a3a, 0xff8a3d, 0xffffff], speed: 7, up: 6, life: 1.3, gravity: 5, size: 0.6 });
      G.world.ctx.crater.setHeat(0.45 + (n / 8) * 0.25);
      G.input.rumble?.(0.2, 0.4, 60);
    },
    onFinish: () => onDone(),
  }));
}

// The Professor's tide charts at camp: data and patterns, a fresh set every day.
export function startTideCharts() {
  const s = G.save.data;
  const today = todayStr();
  const fresh = !s.counters.chartDays.includes(today);
  const table = at(LOC.easel, 1);
  pushActivity(new QuizActivity({
    title: fresh ? "Today's Tide Chart" : 'Tide Chart Practice', subtitle: fresh ? "5 data and pattern puzzles from today's tides" : "You finished today's chart. Practice for fun!",
    color: '#5aa9e6', count: 5,
    pick: (i) => ({ domain: i % 2 ? 'ridge' : 'stars' }),
    shot: twoShot(G.player.pos, table, { lookUp: 1.2 }),
    onFinish: () => {
      if (fresh) {
        s.counters.chartDays.push(today);
        G.addCoins(25);
        G.toasts.toast('Tide chart complete! <b>+25</b>', { kind: 'gold' });
        G.patrol.event('chart');
      }
      G.saveSoon();
    },
  }));
}

