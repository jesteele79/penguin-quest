// A little companion that follows the player: a rescued chick or turtle hatchling, or a friendly Glimmer or
// Sparkle floating alongside.
import * as THREE from 'three';
import { Penguin } from './penguin.js';
import { Gloom } from './gloom.js';
import { Turtle, Puffin } from './critters.js';
import { WATER_Y } from '../world/layout.js';

export class Buddy {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.kind = null;
    this.model = null;
    this.t = 0;
    this.yaw = 0;
  }

  set(kind, near) {
    if (kind === this.kind) return;
    this.clear();
    this.kind = kind;
    if (kind === 'chick') {
      this.model = new Penguin(this.scene, { name: 'buddy', scale: 0.42, body: 0x7d869f, belly: 0xe6e9f2, scarf: 0xff5a4e });
    } else if (kind === 'hatchling') {
      this.model = new Turtle(this.scene, { name: 'buddy', scale: 0.42, shell: 0x6f8f46, plate: 0x9ab866, skin: 0x9ad0b0 });
    } else if (kind === 'puffling') {
      this.model = new Puffin(this.scene, { name: 'buddy', scale: 0.45, baby: true });
    } else if (kind === 'glimmer' || kind === 'sparkle' || kind === 'cloudlet') {
      this.model = new Gloom(this.scene, { scale: 0.4, soot: kind === 'sparkle', hush: kind === 'cloudlet' });
      this.model.cheerUp();
      this.model.happy = 1;
    }
    if (this.model && near) this.root.position.copy(near).add(new THREE.Vector3(-2, 0, -2));
  }

  get root() { return this.model.root; }

  clear() {
    if (this.model) this.model.dispose();
    this.model = null;
    this.kind = null;
  }

  update(dt, player) {
    if (!this.model) return;
    this.t += dt;
    const root = this.root;
    const behind = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw)).multiplyScalar(-2.4);
    behind.add(new THREE.Vector3(Math.cos(player.yaw) * 1.4, 0, -Math.sin(player.yaw) * 1.4));
    const target = player.pos.clone().add(behind);
    const dx = target.x - root.position.x, dz = target.z - root.position.z;
    const d = Math.hypot(dx, dz);
    let speed = 0;
    if (d > 0.6) {
      speed = Math.min(24, d * 3.2);
      root.position.x += (dx / d) * speed * dt;
      root.position.z += (dz / d) * speed * dt;
      this.yaw = Math.atan2(dx, dz);
    }
    if (d > 40) root.position.copy(target);
    const ground = Math.max(this.terrain.heightAt(root.position.x, root.position.z), WATER_Y - 0.25);
    if (this.kind === 'glimmer' || this.kind === 'sparkle' || this.kind === 'cloudlet') {
      root.position.y = Math.max(ground, player.pos.y) + 1.6 + Math.sin(this.t * 2.4) * 0.3;
      this.model.update(dt, null);
    } else if (this.kind === 'hatchling' || this.kind === 'puffling') {
      root.position.y = ground;
      root.rotation.y = this.yaw;
      this.model.animate(dt, { talking: this.kind === 'hatchling' && speed > 1, speed });
      this.model.updateAttachments(dt, ground);
    } else {
      root.position.y = ground;
      root.rotation.y = this.yaw;
      this.model.animate(dt, { speed, grounded: true, sliding: player.sliding && speed > 8, swimming: ground <= WATER_Y - 0.2 && this.terrain.heightAt(root.position.x, root.position.z) < -0.9 });
      this.model.updateAttachments(dt, ground, false);
    }
  }
}
