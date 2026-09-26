// Treasure chests: one puzzle each, then coins.
import * as THREE from 'three';
import { G, pushActivity } from '../core/state.js';
import { QuizActivity } from './activities.js';
import { mergeColored, mat } from '../core/geo.js';
import { lambert } from '../core/materials.js';
import { CHESTS } from '../world/layout.js';
import { damp } from '../core/mathutil.js';
import { twoShot } from './minigames/common.js';

export function chestModel() {
  const base = mergeColored([
    { geo: new THREE.BoxGeometry(1.6, 0.9, 1.1), color: 0x9a6236, matrix: mat(0, 0.45, 0) },
    { geo: new THREE.BoxGeometry(1.66, 0.14, 1.16), color: 0xffcc4d, matrix: mat(0, 0.2, 0) },
    { geo: new THREE.BoxGeometry(0.2, 0.3, 0.1), color: 0xffcc4d, matrix: mat(0, 0.75, 0.58) },
  ]);
  const lidGeo = mergeColored([
    { geo: new THREE.CylinderGeometry(0.55, 0.55, 1.6, 12, 1, false, 0, Math.PI), color: 0x8a5230, matrix: mat(0, 0, 0.55, 0, 0, Math.PI / 2) },
    { geo: new THREE.BoxGeometry(0.16, 0.12, 1.14), color: 0xffcc4d, matrix: mat(-0.6, 0.5, 0.55) },
    { geo: new THREE.BoxGeometry(0.16, 0.12, 1.14), color: 0xffcc4d, matrix: mat(0.6, 0.5, 0.55) },
  ]);
  const group = new THREE.Group();
  const m = lambert({ vertexColors: true }, { strength: 0.3 });
  const b = new THREE.Mesh(base, m);
  b.castShadow = true;
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.9, -0.55);
  const lid = new THREE.Mesh(lidGeo, m);
  lid.castShadow = true;
  lidPivot.add(lid);
  group.add(b, lidPivot);
  return { group, lidPivot };
}

export class Chests {
  constructor(ctx, interactions) {
    this.ctx = ctx;
    this.list = CHESTS.map(([x, z], i) => {
      const y = ctx.terrain.heightAt(x, z);
      const { group, lidPivot } = chestModel();
      group.position.set(x, y - 0.05, z);
      group.rotation.y = i * 2.1;
      ctx.scene.add(group);
      const c = ctx.collision.addCircle(x, z, 1.0, 'chest');
      c.top = y + 1.2;
      const glow = ctx.glow.add(x, y + 1.2, z, 0xffd166, 4.5, 0.8);
      const item = { i, x, z, y, group, lidPivot, glow, open: 0 };
      interactions.add({
        id: `chest-${i}`, pos: { x, z }, radius: 3.2,
        label: () => (this.opened(i) ? null : 'Open the treasure chest'),
        action: () => this.use(item),
      });
      return item;
    });
  }

  opened(i) { return G.save.data.chests.includes(i); }

  refresh() {
    for (const c of this.list) {
      const o = this.opened(c.i);
      c.open = o ? 1 : 0;
      c.lidPivot.rotation.x = -c.open * 1.9;
      this.ctx.glow.set(c.glow, { color: 0xffd166, intensity: o ? 0 : 0.8 });
    }
  }

  use(c) {
    const domain = G.tutor.weakestDomain(G.unlockedDomains());
    pushActivity(new QuizActivity({
      title: 'Treasure Chest', subtitle: 'Solve the riddle lock to open it', color: '#ffd166', count: 1, domain,
      shot: twoShot(G.player.pos, new THREE.Vector3(c.x, c.y, c.z), { dist: 5.5, lookUp: 0.9 }),
      onFinish: () => {
        G.save.data.chests.push(c.i);
        G.save.data.counters.chests += 1;
        const coins = 25;
        G.addCoins(coins);
        G.audio.play('chest');
        G.world.effects.burst(new THREE.Vector3(c.x, c.y + 1.2, c.z), { count: 40, color: [0xffd166, 0xfff3c0], speed: 6, up: 7, life: 1.4, gravity: 9, size: 0.6 });
        G.toasts.toast(`Treasure! <b>+${coins}</b> fish coins (${G.save.data.chests.length}/12 chests)`, { kind: 'gold' });
        G.patrol?.event('chest');
        G.saveSoon();
      },
    }));
  }

  markers() {
    const p = G.player.pos;
    return this.list.filter((c) => !this.opened(c.i) && Math.hypot(c.x - p.x, c.z - p.z) < 90).map((c) => ({ x: c.x, z: c.z, kind: 'chest', edge: false }));
  }

  update(dt) {
    for (const c of this.list) {
      const target = this.opened(c.i) ? 1 : 0;
      if (Math.abs(c.open - target) > 0.001) {
        c.open = damp(c.open, target, 5, dt);
        c.lidPivot.rotation.x = -c.open * 1.9;
      }
    }
  }
}
