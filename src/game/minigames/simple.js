// Quiz-style games that live at a location: warm-up, Glow Potions, knitting, star charts.
import * as THREE from 'three';
import { G, pushActivity } from '../../core/state.js';
import { QuizActivity } from '../activities.js';
import { twoShot, V } from './common.js';
import { CAULDRON, LOC } from '../../world/layout.js';
import { lambert } from '../../core/materials.js';
import { todayStr } from '../questengine.js';

export function startWarmup(params, onDone) {
  const order = ['lake', 'grove', 'huts', 'cave', 'ridge', 'lake'];
  const prof = G.npcs.get('professor').pos;
  pushActivity(new QuizActivity({
    title: 'Warm-up', subtitle: 'One puzzle from every corner of the bay', color: '#ffd166', count: 6,
    pick: (i) => ({ domain: order[i % order.length] }),
    onWrong: (p) => G.tutor.calibrate(p.domain, false),
    shot: twoShot(G.player.pos, prof),
    onFinish: () => onDone(),
  }));
}

const POTION_COLORS = [0x38f0d2, 0xff78d2, 0xffd166];

export function startPotions(params, onDone) {
  const pot = G.world.ctx.cauldron;
  const target = V(CAULDRON.x, pot.y, CAULDRON.z);
  let potion = 0;
  pushActivity(new QuizActivity({
    title: 'Glow Potions', subtitle: '3 potions · 2 fraction puzzles each', color: '#38f0d2', count: 6,
    pick: () => ({ domain: 'grove', skills: ['frac_add_like', 'frac_equiv', 'frac_simplify', 'frac_add_unlike', 'frac_times_whole', 'frac_mult', 'frac_mixed', 'frac_fill'] }),
    shot: twoShot(G.player.pos, target, { dist: 7, up: 4.4, lookUp: 0.8 }),
    onCorrect: (p, n) => {
      pot.stir(POTION_COLORS[Math.min(2, Math.floor((n - 1) / 2))]);
      if (n % 2 === 0) {
        potion += 1;
        G.toasts.toast(`Potion ${potion} of 3 is bubbling!`, { kind: 'teal' });
        G.world.effects.burst(target.clone().add(V(0, 1.2, 0)), { count: 40, color: [POTION_COLORS[potion - 1], 0xffffff], speed: 4, up: 6, life: 1.4, gravity: 3, size: 0.6 });
      }
    },
    onFinish: () => onDone(),
  }));
}

export function startKnitting(params, onDone) {
  const purl = G.npcs.get('purl').pos;
  pushActivity(new QuizActivity({
    title: "Granny Purl's Patterns", subtitle: 'Ratios, rates, money and more', color: '#e8434b', count: 6,
    pick: () => ({ domain: 'huts', skills: ['ratio', 'unit_rate', 'percent', 'money', 'dec_compare', 'dec_addsub', 'mul_word'] }),
    shot: twoShot(G.player.pos, purl),
    onCorrect: () => G.world.effects.sparkle(purl.clone().add(V(0, 2, 0)), 0xe8434b, 16),
    onFinish: () => onDone(),
  }));
}

export function startStarCharts() {
  const s = G.save.data;
  const today = todayStr();
  const fresh = !s.counters.chartDays.includes(today);
  const easel = V(LOC.easel.x, G.terrain.heightAt(LOC.easel.x, LOC.easel.z), LOC.easel.z);
  pushActivity(new QuizActivity({
    title: fresh ? "Today's Star Chart" : 'Star Chart Practice', subtitle: fresh ? '5 data puzzles from last night\'s sky' : "You finished today's chart. Practice for fun!",
    color: '#9fe8ff', count: 5, domain: 'stars',
    shot: twoShot(G.player.pos, easel, { lookUp: 1.8 }),
    onFinish: () => {
      if (fresh) {
        s.counters.chartDays.push(today);
        G.addCoins(25);
        G.toasts.toast('Star chart complete! <b>+25</b>', { kind: 'gold' });
        G.patrol.event('chart');
      }
      G.saveSoon();
    },
  }));
}

// Fern's cauldron: a pot with bubbling, color-shifting brew.
export function buildCauldron(ctx) {
  const x = CAULDRON.x, z = CAULDRON.z;
  const y = ctx.terrain.heightAt(x, z);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const potMat = lambert({ color: 0x40425e });
  const pot = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), potMat);
  pot.position.y = 1.0;
  pot.castShadow = true;
  const brewMat = new THREE.MeshBasicMaterial({ color: 0x5a557a });
  const brew = new THREE.Mesh(new THREE.CircleGeometry(1.02, 24), brewMat);
  brew.rotation.x = -Math.PI / 2;
  brew.position.y = 1.55;
  g.add(pot, brew);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), new THREE.MeshLambertMaterial({ color: 0x6a70a0 }));
    st.position.set(Math.cos(a) * 1.3, 0.15, Math.sin(a) * 1.3);
    g.add(st);
  }
  ctx.scene.add(g);
  ctx.collision.addCircle(x, z, 1.4, 'cauldron');
  const glow = ctx.glow.add(x, y + 1.8, z, 0x5a557a, 5, 0.4);
  const color = new THREE.Color(0x5a557a);
  const target = new THREE.Color(0x5a557a);
  const state = {
    y,
    stir(c) { target.set(c); this.bubbles = 1.5; },
    bubbles: 0,
  };
  ctx.animated.push((dt, t) => {
    color.lerp(target, 1 - Math.exp(-dt * 2));
    brewMat.color.copy(color);
    ctx.glow.set(glow, { color, intensity: 0.5 + Math.sin(t * 3) * 0.15 });
    state.bubbles = Math.max(0, state.bubbles - dt);
    if (Math.random() < dt * (2 + state.bubbles * 12)) {
      G.world?.effects.burst(new THREE.Vector3(x + (Math.random() - 0.5) * 1.4, y + 1.6, z + (Math.random() - 0.5) * 1.4), { count: 1, color: [color.getHex()], speed: 0.4, up: 1.4, life: 0.9, gravity: -0.5, size: 0.4 });
    }
  });
  ctx.cauldron = state;
  return state;
}
