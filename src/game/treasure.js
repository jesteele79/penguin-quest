// The Captain's treasure map: read grid coordinates, find the spot, dig.
import * as THREE from 'three';
import { G } from '../core/state.js';
import { TREASURE_CLUES, gridToWorld } from '../world/layout.js';
import { chestModel } from './chests.js';
import { damp } from '../core/mathutil.js';

export class Treasure {
  constructor(ctx, interactions) {
    this.ctx = ctx;
    this.spots = TREASURE_CLUES.map((c, i) => {
      const w = gridToWorld(c.gx, c.gy);
      const y = ctx.terrain.heightAt(w.x, w.z);
      const { group, lidPivot } = chestModel();
      group.position.set(w.x, y - 1.6, w.z);
      group.visible = false;
      ctx.scene.add(group);
      const glow = ctx.glow.add(w.x, y + 0.6, w.z, 0xffd166, 3, 0);
      const spot = { i, ...c, x: w.x, z: w.z, y, group, lidPivot, glow, rise: 0 };
      interactions.add({
        id: `treasure-${i}`, pos: { x: w.x, z: w.z }, radius: 5,
        label: () => (this.current() === i && G.quests.active('sq_map') ? 'Dig here!' : null),
        action: () => this.dig(spot),
        priority: 1,
      });
      return spot;
    });
  }

  dug(i) { return G.save.data.treasures.includes(i); }
  current() { return this.spots.findIndex((s) => !this.dug(s.i)); }

  refresh() {
    for (const s of this.spots) {
      const d = this.dug(s.i);
      s.group.visible = d;
      s.rise = d ? 1 : 0;
      s.group.position.y = s.y - 1.6 + s.rise * 1.6;
      s.lidPivot.rotation.x = d ? -1.9 : 0;
    }
  }

  dig(spot) {
    if (this.dug(spot.i)) return;
    G.save.data.treasures.push(spot.i);
    spot.group.visible = true;
    G.audio.play('chest');
    G.world.effects.burst(new THREE.Vector3(spot.x, spot.y + 0.5, spot.z), { count: 50, color: [0xffffff, 0xdfeaff], speed: 6, up: 8, life: 1.2, gravity: 14, size: 0.7 });
    setTimeout(() => G.world.effects.sparkle(new THREE.Vector3(spot.x, spot.y + 1.2, spot.z), 0xffd166, 50), 500);
    G.addCoins(30);
    const left = this.spots.length - G.save.data.treasures.length;
    G.toasts.toast(`Treasure found at (${spot.gx}, ${spot.gy})! <b>+30</b>${left ? ` · ${left} to go` : ''}`, { kind: 'gold', ms: 4200 });
    G.saveSoon();
    if (!left) G.quests.advance('sq_map');
  }

  objective(step) {
    const i = this.current();
    if (i < 0) return { text: 'All treasures found!', target: null };
    return { text: `${step.text(i, this.spots[i].clue)} Open the map (M) to read the grid.`, target: null };
  }

  markers() {
    return this.spots.filter((s) => this.dug(s.i)).map((s) => ({ x: s.x, z: s.z, kind: 'chest', edge: false }));
  }

  update(dt, t, player) {
    const i = G.quests.active('sq_map') ? this.current() : -1;
    for (const s of this.spots) {
      const near = s.i === i && Math.hypot(player.pos.x - s.x, player.pos.z - s.z) < 14;
      this.ctx.glow.set(s.glow, { color: 0xffd166, intensity: near ? 0.8 + Math.sin(t * 6) * 0.3 : 0 });
      if (near && Math.random() < dt * 6) G.world.effects.burst(new THREE.Vector3(s.x + (Math.random() - 0.5) * 2, s.y + 0.2, s.z + (Math.random() - 0.5) * 2), { count: 2, color: [0xffd166, 0xffffff], speed: 1.5, up: 2.5, life: 0.8, gravity: 3, size: 0.35 });
      if (s.group.visible && s.rise < 1) {
        s.rise = damp(s.rise, 1, 4, dt);
        s.group.position.y = s.y - 1.6 + s.rise * 1.6;
        s.lidPivot.rotation.x = -Math.max(0, s.rise - 0.6) * 4.75;
      }
    }
  }
}
