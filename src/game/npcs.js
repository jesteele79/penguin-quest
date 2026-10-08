import * as THREE from 'three';
import { Penguin } from '../actors/penguin.js';
import { CRITTERS } from '../actors/critters.js';
import { NPCS } from './content.js';
import { dampAngle } from '../core/mathutil.js';
import { LOC } from '../world/layout.js';

export class NPCManager {
  constructor(scene, world, labels) {
    this.world = world;
    this.list = {};
    const dock = world.ctx.dock;
    for (const [id, def] of Object.entries(NPCS)) {
      let pos = def.pos;
      // Book 1's captain stands wherever his dock was built.
      if (!pos && id === 'captain') pos = { x: dock.landEnd.x - 1.5, z: dock.landEnd.z - 3.6 };
      const Model = def.model ? CRITTERS[def.model] : Penguin;
      const model = new Model(scene, { ...def.look, name: id });
      const y = world.terrain.heightAt(pos.x, pos.z);
      model.root.position.set(pos.x, y, pos.z);
      const home = def.faceTo ?? (id === 'captain' ? { x: dock.waterEnd.x, z: dock.waterEnd.z } : LOC.lake ?? LOC.home);
      const yaw = Math.atan2(home.x - pos.x, home.z - pos.z);
      model.root.rotation.y = yaw;
      const collider = world.collision.addDynamic({ x: pos.x, z: pos.z, r: 0.9 * (def.look.scale ?? 1), active: true });
      const mark = labels.add('<span>!</span>', { cls: 'quest-mark', pos: new THREE.Vector3(pos.x, y, pos.z), offsetY: 3.6 * (def.look.scale ?? 1), maxDist: 140 });
      mark.visible = false;
      this.list[id] = {
        id, def, model, pos: new THREE.Vector3(pos.x, y, pos.z), origin: { x: pos.x, z: pos.z, yaw },
        homeYaw: yaw, yaw, talking: false, collider, mark, hopT: Math.random() * 5, visible: true,
      };
    }
    this.setVisible('king', false);
  }

  resetAll() {
    for (const [id, n] of Object.entries(this.list)) {
      const o = n.origin;
      this.place(id, o.x, o.z, o.x + Math.sin(o.yaw), o.z + Math.cos(o.yaw));
    }
  }

  setMarkKind(id, kind) {
    const n = this.list[id];
    if (!n) return;
    n.mark.visible = !!kind && n.visible;
    n.mark.setClass('side', kind === 'side');
    n.mark.setClass('new', kind === 'new');
  }

  get(id) { return this.list[id]; }

  setMark(id, on) { const n = this.list[id]; if (n) n.mark.visible = on; }

  setVisible(id, v) {
    const n = this.list[id];
    if (!n) return;
    n.visible = v;
    n.model.setVisible(v);
    n.collider.active = v;
    if (!v) n.mark.visible = false;
  }

  // Move an NPC (used by cutscenes and the finale gathering).
  place(id, x, z, faceX, faceZ) {
    const n = this.list[id];
    if (!n) return;
    const y = this.world.terrain.heightAt(x, z);
    n.pos.set(x, y, z);
    n.model.root.position.copy(n.pos);
    n.collider.x = x; n.collider.z = z;
    n.homeYaw = n.yaw = Math.atan2(faceX - x, faceZ - z);
    n.mark.setPos(n.pos);
  }

  update(dt, playerPos, cameraPos) {
    for (const n of Object.values(this.list)) {
      if (!n.visible) continue;
      const d = n.pos.distanceTo(playerPos);
      const near = d < 10;
      const want = near ? Math.atan2(playerPos.x - n.pos.x, playerPos.z - n.pos.z) : n.homeYaw;
      n.yaw = dampAngle(n.yaw, want, near ? 5 : 1.5, dt);
      n.model.root.rotation.y = n.yaw;
      const isKid = (n.def.look.scale ?? 1) < 0.7;
      let celebrate = false;
      if (isKid && near) {
        n.hopT -= dt;
        if (n.hopT < 0) { n.hopT = 1.2 + Math.random() * 2; n.hopping = 0.5; }
      }
      if (n.hopping > 0) { n.hopping -= dt; celebrate = true; }
      const hop = celebrate ? Math.abs(Math.sin((0.5 - n.hopping) * Math.PI * 2)) * 0.6 : 0;
      n.model.root.position.y = n.pos.y + hop;
      const camD = cameraPos.distanceTo(n.pos);
      // Far friends are a few pixels tall and deep in the fog: skip drawing them.
      n.model.setCulled(camD > 125);
      if (camD < 125) {
        n.model.animate(dt, { speed: 0, grounded: true, talking: n.talking, celebrate });
        n.model.updateAttachments(dt, n.pos.y, camD < 60);
      }
    }
  }
}
