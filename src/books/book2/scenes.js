// Book 2's story scenes: arriving at the Ember Isles, the soot lifting off Mount Ember, rekindling the
// Heart-Ember with Cinder, and the Festival of Currents.
import * as THREE from 'three';
import { G, pushActivity } from '../../core/state.js';
import { Cutscene } from '../../game/activities.js';
import { fireworks } from '../../game/minigames/scenes.js';
import { NPCS } from './cast.js';
import { LOC, FESTIVAL } from './layout.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const EMBERS = [0xff8a3d, 0xffd166, 0xff5a4e, 0xffe9a8];
const line = (id, text) => ({
  who: NPCS[id].name, text: text.replaceAll('{name}', G.save.data.profile.name),
  portrait: NPCS[id].portrait, pitch: NPCS[id].pitch, accent: NPCS[id].accent,
});

function emberBurst(center, n = 6, spread = 24) {
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const p = center.clone().add(V((Math.random() - 0.5) * spread, Math.random() * 12, (Math.random() - 0.5) * spread));
      G.world.effects.burst(p, { count: 60, color: [EMBERS[i % EMBERS.length], 0xffffff], speed: 12, up: 4, life: 2, gravity: 3, size: 1.2, drag: 1.4, spread: 0.3 });
      G.audio.play('chime');
    }, i * 380 + Math.random() * 150);
  }
}

// New game: the islands at golden hour, a word about the Heart-Ember, then the Professor at camp.
export function startArrival(onDone) {
  const name = G.save.data.profile.name;
  const crater = G.world.ctx.crater;
  const prof = G.npcs.get('professor').pos;
  const toPlayer = V(G.player.pos.x - prof.x, 0, G.player.pos.z - prof.z).normalize();
  const side = V(-toPlayer.z, 0, toPlayer.x);
  const profShot = { pos: prof.clone().addScaledVector(toPlayer, 7).addScaledVector(side, 3).add(V(0, 3.2, 0)), look: prof.clone().add(V(0, 1.8, 0)), fov: 50 };
  pushActivity(new Cutscene([
    {
      call: () => { crater.setHeat(1); G.audio.setMood('title'); },
      shot: { pos: V(40, 22, 205), look: V(0, 26, -96), fov: 55 }, blend: 0, wait: 1.2,
    },
    { say: ['Far from Glacier Bay, where the warm ocean currents begin, lie the Ember Isles.', 'Deep inside Mount Ember glows the Heart-Ember. Its warmth flows through the sea, all the way to the bottom of the world.'] },
    {
      shot: { pos: V(-36, 30, 40), look: V(0, 36, -96), fov: 52 }, blend: 4, wait: 3,
      call: () => { G.audio.play('fade'); setTimeout(() => crater.setHeat(0), 1200); },
    },
    { say: ['But lately the Heart has been growing dim, and the sea back home is turning cold.', 'Captain Flipper sailed you south to help the Professor find out why.'] },
    { shot: { pos: V(-24, 9, 140), look: V(0, 3, 104), fov: 55 }, blend: 3.5, wait: 1.4 },
    { shot: profShot, blend: 2.5, wait: 0.4 },
    { say: [`Welcome to the Ember Isles, ${name}!`] },
  ], () => onDone?.()));
}

// Chapter 6 opens: all five vents shine, the soot drifts off the crater and a balloon is moored at the rim.
export function startCraterOpen(params, onDone) {
  const V0 = LOC.volcano;
  const top = V(V0.x, G.terrain.heightAt(V0.x, V0.z) + 12, V0.z);
  pushActivity(new Cutscene([
    { shot: { pos: top.clone().add(V(-50, 8, 70)), look: top, fov: 50 }, blend: 2.2, wait: 1.5 },
    {
      call: () => {
        G.world.ctx.crater.setHeat(0.45);
        G.audio.play('restore');
        G.toasts.screenFlash('#ff9a5a', 0.35);
        for (const v of Object.values(G.world.ctx.crystals)) v.flash();
      },
      wait: 2.4,
    },
  ], () => onDone?.()));
}

// Chapter 6 ending: Cinder opens his last valve and the Heart-Ember flares back to life.
export function startRekindle(params, onDone) {
  const V0 = LOC.volcano;
  const floor = G.terrain.heightAt(V0.x, V0.z);
  const heart = V(V0.x, floor + 2, V0.z);
  const crater = G.world.ctx.crater;
  pushActivity(new Cutscene([
    { shot: { pos: heart.clone().add(V(14, 10, 18)), look: heart, fov: 55 }, blend: 1.8, wait: 1.0 },
    { say: [line('cinder', 'Ready? On three. One... two... THREE!')] },
    {
      call: () => {
        let h = 0.45;
        const t0 = performance.now();
        const ramp = () => { h = Math.min(1, 0.45 + (performance.now() - t0) / 2500); crater.setHeat(h); if (h < 1) requestAnimationFrame(ramp); };
        ramp();
        G.audio.play('restore');
        G.toasts.screenFlash('#ffb050', 0.6);
        emberBurst(heart.clone().add(V(0, 6, 0)), 8, 20);
        G.world.sky.setRestored('crown', true);
        G.world.sky.pulse('crown', 3);
      },
      wait: 3.2,
    },
    {
      shot: { pos: heart.clone().add(V(-30, 40, 60)), look: V(0, 0, 120), fov: 60 }, blend: 3, wait: 2.6,
      call: () => {
        G.toasts.showBanner('The Heart-Ember is warm again!', 'The warm current flows to Glacier Bay', '#ffb050', 4200, { replace: true });
        G.audio.hero();
      },
    },
  ], () => {
    G.save.data.finale = true;
    onDone?.();
  }));
}

// Little boats with lanterns drift out to sea from the beach.
function lanternBoats(center, n = 24) {
  const hull = new THREE.CylinderGeometry(0.45, 0.3, 1.3, 6, 1, false, 0, Math.PI);
  hull.rotateZ(Math.PI / 2);
  hull.rotateY(Math.PI / 2);
  const list = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(hull, new THREE.MeshLambertMaterial({ color: 0x9a6a44 })));
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: EMBERS[i % EMBERS.length] }));
    lamp.position.y = 0.55;
    g.add(lamp);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    g.position.set(center.x + (Math.random() - 0.5) * 18, 0.1, center.z + 30 + Math.random() * 6);
    g.userData = { vx: Math.sin(a) * 0.3, vz: 1.4 + Math.random() * 1.2, delay: Math.random() * 6, phase: Math.random() * 6, glow: G.world.glow.add(g.position.x, 0.7, g.position.z, EMBERS[i % EMBERS.length], 3, 0) };
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
      g.position.x += g.userData.vx * dt;
      g.position.z += g.userData.vz * dt;
      g.position.y = 0.1 + Math.sin(t * 2 + g.userData.phase) * 0.08;
      G.world.glow.set(g.userData.glow, { x: g.position.x, y: 0.7, z: g.position.z, intensity: g.position.z > 260 ? 0 : 0.9 });
    }
  });
}

export function startEmberFestival(params, onDone) {
  const c = V(FESTIVAL.x, G.terrain.heightAt(FESTIVAL.x, FESTIVAL.z), FESTIVAL.z);
  const guests = ['professor', 'captain', 'isa', 'rocco', 'marlo', 'shelldon', 'tortuga', 'lumi', 'nori', 'kai', 'lani', 'cinder'];
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
        line('professor', 'Welcome, everyone, to the Festival of Currents!'),
        line('tortuga', 'Every year we send little lantern boats out on the warm current. This year they will reach all the way to Glacier Bay.'),
        line('cinder', 'And this year we have a Legend to thank. {name}!'),
      ],
    },
    {
      shot: { pos: c.clone().add(V(0, 7, -10)), look: c.clone().add(V(0, 4, 80)), fov: 62 }, blend: 2.4, wait: 7,
      call: () => {
        lanternBoats(c);
        emberBurst(V(0, 40, 150), 12, 70);
        G.world.sky.pulse('crown', 3);
        G.toasts.showBanner('The Festival of Currents', `${name}, Ember Legend of the Isles`, '#ffb050', 6500, { replace: true });
        G.audio.hero();
      },
    },
    {
      say: [
        line('marlo', 'Mango tarts for everyone! The biggest one is for our hero.'),
        line('rocco', 'I let you win the hopping contest. ...Okay, I did not. You won fair and square.'),
        line('professor', '{name}, look what the Heart-Ember was keeping warm all this time. A piece of very old map, with stars on it.'),
        line('cinder', "That's a piece of the Star Map! The one from the stories! The rest must be up there... in Skyreach."),
        line('professor', 'Then that is where we shall go. Someday soon. The Island Patrol board will have tasks every day until then.'),
      ],
    },
    { shot: { pos: c.clone().add(V(20, 16, 20)), look: c.clone().add(V(0, 2, 0)), fov: 55 }, blend: 3, wait: 3, call: () => fireworks(V(10, 50, 60), 10, 50) },
  ], () => {
    G.save.data.festival = true;
    G.save.data.flags.legend = true;
    G.npcs.resetAll();
    onDone?.();
  }));
}
