// Wandering Glooms: one puzzle each to cheer them up. They come back after a while for more practice.
import * as THREE from 'three';
import { G, pushActivity } from '../core/state.js';
import { QuizActivity } from './activities.js';
import { twoShot } from './minigames/common.js';
import { Gloom } from '../actors/gloom.js';
import { GLOOM_SPOTS } from '../world/layout.js';

const RESPAWN_SECONDS = 8 * 60;

export class Wanderers {
  constructor(ctx, interactions, labels) {
    this.ctx = ctx;
    this.list = GLOOM_SPOTS.map((spot, i) => {
      const item = { i, spot, gloom: null, t: Math.random() * 10, home: new THREE.Vector3(spot.x, ctx.terrain.heightAt(spot.x, spot.z), spot.z) };
      interactions.add({
        id: `gloom-${i}`, pos: () => item.gloom?.state === 'grumpy' ? item.gloom.position : null, radius: 4,
        label: () => (item.gloom?.state === 'grumpy' && G.quests.done('ch0') ? 'Cheer up the Gloom' : null),
        action: () => this.use(item),
      });
      return item;
    });
  }

  available(item) {
    const until = G.save.data.gloomRespawn[item.i] ?? 0;
    return G.save.data.stats.playSeconds >= until;
  }

  spawn(item) {
    const g = new Gloom(this.ctx.scene, { scale: 0.9 });
    g.position.copy(item.home);
    item.gloom = g;
  }

  use(item) {
    const g = item.gloom;
    if (!g || g.state !== 'grumpy') return;
    const domain = item.spot.domain && G.unlockedDomains().includes(item.spot.domain) ? item.spot.domain : G.tutor.weakestDomain(G.unlockedDomains());
    pushActivity(new QuizActivity({
      title: 'Grumpy Gloom', subtitle: 'Solve its puzzle to send it some aurora light', color: '#b483ff', count: 1, domain,
      shot: twoShot(G.player.pos, g.position, { lookUp: 1.3 }),
      onFinish: () => this.cheer(item),
    }));
  }

  cheer(item) {
    const g = item.gloom;
    const s = G.save.data;
    g.cheerUp();
    G.audio.play('cheer');
    G.world.effects.sparkle(g.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xff78d2, 50);
    setTimeout(() => g.ascend(), 1600);
    s.counters.glooms += 1;
    if (!s.counters.gloomSpots.includes(item.i)) s.counters.gloomSpots.push(item.i);
    s.gloomRespawn[item.i] = s.stats.playSeconds + RESPAWN_SECONDS;
    G.addCoins(8);
    G.toasts.toast('The Gloom is a happy Glimmer now! <b>+8</b>', { kind: 'violet' });
    G.patrol?.event('gloom');
    G.saveSoon();
  }

  nearest(p) {
    let best = null, bd = Infinity;
    for (const it of this.list) {
      if (!it.gloom || it.gloom.state !== 'grumpy') continue;
      const d = Math.hypot(it.home.x - p.x, it.home.z - p.z);
      if (d < bd) { bd = d; best = it.home; }
    }
    return best;
  }

  markers() {
    return this.list.filter((it) => it.gloom?.state === 'grumpy').map((it) => ({ x: it.home.x, z: it.home.z, kind: 'gloom', edge: false }));
  }

  update(dt, player) {
    if (!G.quests.done('ch0')) return;
    for (const it of this.list) {
      if (!it.gloom && this.available(it)) this.spawn(it);
      const g = it.gloom;
      if (!g) continue;
      if (g.gone) { g.dispose(); it.gloom = null; continue; }
      if (g.state === 'grumpy') {
        it.t += dt;
        const r = 2.5;
        g.position.x = it.home.x + Math.cos(it.t * 0.4) * r;
        g.position.z = it.home.z + Math.sin(it.t * 0.55) * r;
        g.position.y = this.ctx.terrain.heightAt(g.position.x, g.position.z);
      }
      const near = player.pos.distanceTo(g.position) < 16;
      g.update(dt, near ? player.pos : null);
    }
  }
}
