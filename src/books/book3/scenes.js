// Book 3's story scenes: flying up to Skyreach in Cinder's airship, the Hush drawing back from the
// Starwell, the Star Map coming together, and the Night of a Thousand Stars.
import * as THREE from 'three';
import { G, pushActivity } from '../../core/state.js';
import { Cutscene } from '../../game/activities.js';
import { fireworks } from '../../game/minigames/scenes.js';
import { NPCS } from './cast.js';
import { LOC, FESTIVAL, ISLANDS } from './layout.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const STARLIGHT = [0xffe9a8, 0xc8b8ff, 0x9fd8ff, 0xffb8d8];
const line = (id, text) => ({
  who: NPCS[id].name, text: text.replaceAll('{name}', G.save.data.profile.name),
  portrait: NPCS[id].portrait, pitch: NPCS[id].pitch, accent: NPCS[id].accent,
});

function starBurst(center, n = 6, spread = 24) {
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const p = center.clone().add(V((Math.random() - 0.5) * spread, Math.random() * 12, (Math.random() - 0.5) * spread));
      G.world.effects.burst(p, { count: 60, color: [STARLIGHT[i % STARLIGHT.length], 0xffffff], speed: 12, up: 4, life: 2.2, gravity: 1.5, size: 1.1, drag: 1.4, spread: 0.3 });
      G.audio.play('chime');
    }, i * 380 + Math.random() * 150);
  }
}

// New game: the airship rises through the clouds, the islands come into view, then the Professor.
export function startSkyArrival(onDone) {
  const name = G.save.data.profile.name;
  const prof = G.npcs.get('professor').pos;
  const toPlayer = V(G.player.pos.x - prof.x, 0, G.player.pos.z - prof.z).normalize();
  const side = V(-toPlayer.z, 0, toPlayer.x);
  const profShot = { pos: prof.clone().addScaledVector(toPlayer, 7).addScaledVector(side, 3).add(V(0, 3.2, 0)), look: prof.clone().add(V(0, 1.8, 0)), fov: 50 };
  const W = ISLANDS.well;
  pushActivity(new Cutscene([
    {
      call: () => { G.audio.setMood('title'); },
      shot: { pos: V(30, 3, 220), look: V(0, 30, 60), fov: 58 }, blend: 0, wait: 1.2,
    },
    { say: ['High above the bottom of the world, above even the clouds, float the islands of Skyreach.', 'At their heart stands the Starwell, where the stars are kept in their places.'] },
    {
      shot: { pos: V(-60, 60, 30), look: V(W.x, W.h + 6, W.z), fov: 52 }, blend: 4, wait: 3,
      call: () => G.audio.play('fade'),
    },
    { say: ['But a great shy cloud called the Hush has wrapped itself around the Starwell, and the stars have started going quiet.', "Cinder's airship carried you and the Professor up to help."] },
    { shot: { pos: V(24, 20, 130), look: V(0, 14, 96), fov: 55 }, blend: 3.5, wait: 1.4 },
    { shot: profShot, blend: 2.5, wait: 0.4 },
    { say: [`Welcome to Skyreach, ${name}!`] },
  ], () => onDone?.()));
}

// Chapter 6 opens: every anchor shines, the constellations brighten and the Hush slowly draws back.
export function startWellOpen(params, onDone) {
  const W = ISLANDS.well;
  const top = V(W.x, W.h + 8, W.z);
  pushActivity(new Cutscene([
    { shot: { pos: top.clone().add(V(50, 12, 60)), look: top, fov: 52 }, blend: 2.2, wait: 1.4 },
    {
      call: () => {
        G.world.ctx.spire.setOpen(true);
        G.audio.play('restore');
        G.toasts.screenFlash('#c8b8ff', 0.35);
        for (const a of Object.values(G.world.ctx.crystals)) a.flash();
        for (const id of ['lake', 'grove', 'huts', 'cave', 'ridge']) G.world.sky.pulse(id, 2);
      },
      wait: 3,
    },
  ], () => onDone?.()));
}

// Chapter 6: the Hush is calm and the Star Map joins up across the whole sky.
export function startStarMap(params, onDone) {
  const S = LOC.spire;
  const pool = V(S.x, G.terrain.heightAt(S.x, S.z) + 1, S.z);
  pushActivity(new Cutscene([
    { shot: { pos: pool.clone().add(V(14, 10, 20)), look: pool, fov: 55 }, blend: 1.8, wait: 1.0 },
    {
      call: () => {
        G.world.ctx.spire.setFinale(true);
        G.audio.play('restore');
        G.toasts.screenFlash('#fff1c8', 0.6);
        starBurst(pool.clone().add(V(0, 8, 0)), 8, 18);
      },
      wait: 2.2,
    },
    {
      shot: { pos: pool.clone().add(V(0, 6, 0)), look: pool.clone().add(V(-40, 120, -80)), fov: 70 }, blend: 3, wait: 3.6,
      call: () => {
        G.world.sky.setRestored('crown', true);
        G.world.sky.pulse('crown', 3);
        G.toasts.showBanner('The Star Map is whole!', 'The stars over Glacier Bay shine again', '#c8b8ff', 4600, { replace: true });
        G.audio.play('fanfare');
      },
    },
  ], () => {
    G.save.data.finale = true;
    onDone?.();
  }));
}

// Lantern kites rise from the square and drift up among the stars.
function lanternKites(center, n = 24) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshBasicMaterial({ color: STARLIGHT[i % STARLIGHT.length] }));
    body.scale.set(0.8, 1.2, 0.2);
    g.add(body);
    g.position.set(center.x + (Math.random() - 0.5) * 16, center.y + 2, center.z + (Math.random() - 0.5) * 16);
    g.userData = { vx: (Math.random() - 0.5) * 0.8, vy: 1.6 + Math.random() * 1.2, delay: Math.random() * 6, phase: Math.random() * 6, glow: G.world.glow.add(g.position.x, g.position.y, g.position.z, STARLIGHT[i % STARLIGHT.length], 3, 0) };
    g.visible = false;
    G.scene.add(g);
    list.push(g);
  }
  let t = 0;
  G.world.animated.push((dt) => {
    t += dt;
    for (const g of list) {
      if (t < g.userData.delay) continue;
      g.visible = true;
      g.position.x += g.userData.vx * dt + Math.sin(t + g.userData.phase) * 0.02;
      g.position.y += g.userData.vy * dt;
      g.rotation.y += dt;
      G.world.glow.set(g.userData.glow, { x: g.position.x, y: g.position.y, z: g.position.z, intensity: g.position.y > 160 ? 0 : 0.9 });
    }
  });
}

export function startSkyFestival(params, onDone) {
  const c = V(FESTIVAL.x, G.terrain.heightAt(FESTIVAL.x, FESTIVAL.z), FESTIVAL.z);
  const guests = ['professor', 'vela', 'swoop', 'astra', 'tock', 'rocco', 'nimbus', 'wren', 'zephyr', 'comet', 'skye', 'cinder'];
  const name = G.save.data.profile.name;
  pushActivity(new Cutscene([
    {
      call: () => {
        guests.forEach((id, i) => {
          const a = (i / guests.length) * Math.PI * 2;
          G.npcs.setVisible(id, true);
          G.npcs.place(id, c.x + Math.cos(a) * 8, c.z + Math.sin(a) * 8, c.x, c.z);
        });
        G.player.teleport(c.x, c.z + 4, Math.PI);
        G.audio.setMood('finale');
      },
      shot: { pos: c.clone().add(V(-14, 9, 18)), look: c.clone().add(V(0, 2, 0)), fov: 55 }, blend: 1.5, wait: 2,
    },
    {
      say: [
        line('astra', 'Welcome, everyone, to the Night of a Thousand Stars!'),
        line('vela', 'Every year we fly a lantern kite for every star. Tonight, for the first time in a hundred years, every star is there to see them.'),
        line('professor', 'And tonight we thank a Wayfinder. {name}!'),
      ],
    },
    {
      shot: { pos: c.clone().add(V(0, 5, 12)), look: c.clone().add(V(0, 40, -40)), fov: 64 }, blend: 2.4, wait: 7,
      call: () => {
        lanternKites(c);
        starBurst(c.clone().add(V(0, 60, -60)), 12, 70);
        G.world.sky.pulse('crown', 3);
        G.toasts.showBanner('The Night of a Thousand Stars', `${name}, Wayfinder of Skyreach`, '#c8b8ff', 6500, { replace: true });
        G.audio.play('fanfare');
      },
    },
    {
      say: [
        line('tock', 'Tick! Tock! I have never been so happy! I may need winding.'),
        line('swoop', 'Forty-three loops tonight, {name}. A new record. That one was for you.'),
        line('cinder', 'From the bottom of the world to the top of the sky. You really did it.'),
        line('astra', 'The Star Map shows every island, every sea and every friend. Wherever you go next, {name}, you will always find your way home.'),
        line('professor', 'The Sky Patrol board will have new tasks every day. And Cinder can fly you anywhere you like. What an adventure it has been.'),
      ],
    },
    { shot: { pos: c.clone().add(V(20, 16, 20)), look: c.clone().add(V(0, 2, 0)), fov: 55 }, blend: 3, wait: 3, call: () => fireworks(V(10, 60, 20), 10, 60) },
  ], () => {
    G.save.data.festival = true;
    G.save.data.flags.legend = true;
    G.npcs.resetAll();
    onDone?.();
  }));
}
