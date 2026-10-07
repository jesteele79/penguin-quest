// Story scenes: the spire shield falling, fireworks, and the Great Aurora Festival.
import * as THREE from 'three';
import { G, pushActivity } from '../../core/state.js';
import { Cutscene } from '../activities.js';
import { V } from './common.js';
import { REGION_COLORS } from '../../core/materials.js';
import { FESTIVAL, LOC } from '../../world/layout.js';
import { NPCS } from '../content.js';

const COLORS = ['lake', 'grove', 'huts', 'cave', 'ridge', 'crown'].map((k) => REGION_COLORS[k].a);

export function fireworks(center, count = 6, spread = 30) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const p = center.clone().add(V((Math.random() - 0.5) * spread, Math.random() * 18, (Math.random() - 0.5) * spread));
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      G.world.effects.burst(p, { count: 70, color: [c, 0xffffff], speed: 16, up: 0, life: 2.2, gravity: 2.5, size: 1.4, drag: 1.6, spread: 0.2 });
      G.audio.play('chime');
      G.audio.noise({ dur: 0.5, vol: 0.12, type: 'lowpass', f: 300, q: 0.5 });
    }, i * 420 + Math.random() * 200);
  }
}

// New-game opening: the aurora shines, fades, and the camera lands on the Professor.
export function startIntro(onDone) {
  const sky = G.world.sky;
  const ribbons = ['lake', 'grove', 'huts', 'cave', 'ridge', 'crown'];
  const name = G.save.data.profile.name;
  const prof = G.npcs.get('professor').pos;
  const toPlayer = V(G.player.pos.x - prof.x, 0, G.player.pos.z - prof.z).normalize();
  const side = V(-toPlayer.z, 0, toPlayer.x);
  const profShot = {
    pos: prof.clone().addScaledVector(toPlayer, 7).addScaledVector(side, 3).add(V(0, 3.2, 0)),
    look: prof.clone().add(V(0, 1.8, 0)),
    fov: 50,
  };
  pushActivity(new Cutscene([
    {
      call: () => { ribbons.forEach((r) => sky.setRestored(r, true, true)); G.audio.setMood('title'); },
      shot: { pos: V(10, 38, 125), look: V(0, 42, -120), fov: 60 }, blend: 0, wait: 1.2,
    },
    { say: ['Far away, at the bottom of the world, there is an island of snow and ice called Glacier Bay.', 'Every night the Aurora danced across the sky, and its light kept every penguin warm and happy.'] },
    {
      shot: { pos: V(-20, 46, 95), look: V(-35, 30, -140), fov: 60 }, blend: 4, wait: 3.5,
      call: () => { ribbons.forEach((r) => sky.setRestored(r, false)); G.audio.play('fade'); },
    },
    { say: ['But one night, grumpy shadow critters called Glooms crept down from Gloom Ridge...', '...and pulled the light right out of the sky!'] },
    { shot: profShot, blend: 3.5, wait: 0.4 },
    { say: ['Now the bay grows colder every night. Only one penguin can bring the Aurora back.', `That penguin is you, ${name}!`] },
  ], () => onDone?.()));
}

export function startSpireOpen(params, onDone) {
  const sp = G.world.ctx.spire;
  pushActivity(new Cutscene([
    { shot: { pos: sp.base.clone().add(V(-40, 12, 45)), look: sp.top.clone(), fov: 50 }, blend: 2.2, wait: 1.5 },
    { call: () => { sp.setOpen(true); G.audio.play('restore'); G.toasts.screenFlash('#b483ff', 0.4); }, wait: 2.4 },
  ], () => onDone?.()));
}

// Sky lanterns drifting up from the beach.
function skyLanterns(center, n = 40) {
  const geo = new THREE.OctahedronGeometry(0.35, 0);
  const list = [];
  for (let i = 0; i < n; i++) {
    const c = COLORS[i % COLORS.length];
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c }));
    m.position.copy(center).add(V((Math.random() - 0.5) * 16, 1 + Math.random() * 2, (Math.random() - 0.5) * 16));
    m.userData = { v: 1.2 + Math.random() * 1.4, delay: Math.random() * 5, glow: G.world.glow.add(m.position.x, m.position.y, m.position.z, c, 3, 0.9) };
    m.visible = false;
    G.scene.add(m);
    list.push(m);
  }
  let t = 0;
  G.world.animated.push((dt) => {
    t += dt;
    for (const m of list) {
      if (t < m.userData.delay) continue;
      m.visible = true;
      m.position.y += m.userData.v * dt;
      m.position.x += Math.sin(t * 0.5 + m.userData.v) * dt * 0.6;
      m.rotation.y += dt;
      G.world.glow.set(m.userData.glow, { x: m.position.x, y: m.position.y, z: m.position.z, intensity: m.position.y > 160 ? 0 : 0.9 });
    }
  });
}

export function startFestival(params, onDone) {
  const c = V(FESTIVAL.x, G.terrain.heightAt(FESTIVAL.x, FESTIVAL.z), FESTIVAL.z);
  const guests = ['professor', 'captain', 'fern', 'mittens', 'pebble', 'skipper', 'purl', 'nestle', 'mo', 'lulu', 'sunny', 'king'];
  const name = G.save.data.profile.name;
  const line = (id, text) => ({ who: NPCS[id].name, text: text.replaceAll('{name}', name), portrait: NPCS[id].portrait, pitch: NPCS[id].pitch, accent: NPCS[id].accent });
  pushActivity(new Cutscene([
    {
      call: () => {
        guests.forEach((id, i) => {
          const a = (i / guests.length) * Math.PI * 2;
          const r = id === 'king' ? 0 : 7.5;
          G.npcs.setVisible(id, true);
          G.npcs.place(id, c.x + Math.cos(a) * r, c.z + Math.sin(a) * r - (id === 'king' ? 3 : 0), c.x, c.z);
        });
        G.player.teleport(c.x, c.z + 5, Math.PI);
        G.audio.setMood('finale');
      },
      shot: { pos: c.clone().add(V(-14, 9, 18)), look: c.clone().add(V(0, 2, 0)), fov: 55 }, blend: 1.5, wait: 2,
    },
    {
      say: [
        line('king', 'Welcome, everyone, to the first Great Aurora Festival!'),
        line('king', 'None of this would be possible without one very brave, very clever penguin...'),
        line('professor', '{name}! Our very own Aurora Legend!'),
      ],
    },
    {
      shot: { pos: c.clone().add(V(0, 6, 26)), look: c.clone().add(V(0, 40, -60)), fov: 70 }, blend: 2.4, wait: 7,
      call: () => {
        skyLanterns(c);
        fireworks(V(0, 55, -10), 14, 60);
        for (const r of ['lake', 'grove', 'huts', 'cave', 'ridge', 'crown']) G.world.sky.pulse(r, 3);
        G.toasts.showBanner('The Great Aurora Festival', `${name}, Aurora Legend of Glacier Bay`, '#ffd86b', 6500, { replace: true });
        G.audio.play('fanfare');
      },
    },
    {
      say: [
        line('mittens', 'Cocoa for everyone! Extra marshmallows for our hero!'),
        line('captain', 'Three cheers for {name}! Hip hip, HOORAY!'),
        line('professor', 'The Aurora Patrol board will have new tasks every day, {name}. The bay will always need a Legend. Thank you.'),
        line('king', 'One more thing, {name}. The oldest Glimmers say the Aurora was only one piece of a great Star Map.'),
        line('king', 'Somewhere far to the north, the other pieces are waiting. I wonder who will find them?'),
        line('professor', 'A Star Map... Hmm. That rings a bell. A very, very old bell.'),
      ],
    },
    { shot: { pos: c.clone().add(V(20, 16, 20)), look: c.clone().add(V(0, 2, 0)), fov: 55 }, blend: 3, wait: 3, call: () => fireworks(V(10, 50, 0), 10, 50) },
  ], () => {
    G.save.data.festival = true;
    G.save.data.flags.legend = true;
    G.npcs.resetAll();
    onDone?.();
  }));
}

export { LOC };
