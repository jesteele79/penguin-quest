// Building blocks for quest sites, shared by every book: the Site base class and the Legend Lantern.
import * as THREE from 'three';
import { lambert, REGION_COLORS } from '../core/materials.js';
import { mergeColored, mat } from '../core/geo.js';

const V = (x, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export class Site {
  constructor(set, index, pos) {
    this.set = set; this.index = index; this.pos = pos;
    this.done = false; this.level = 0; this.group = new THREE.Group();
    this.group.position.copy(pos);
    this.glow = -1;
  }
  setDone(v) { this.done = v; }
  update() {}
}

export class Lantern extends Site {
  constructor(ctx, i, x, z, region) {
    const y = ctx.terrain.heightAt(x, z);
    super('legends', i, V(x, y, z));
    this.color = new THREE.Color(REGION_COLORS[region].a);
    const post = new THREE.Mesh(mergeColored([
      { geo: new THREE.CylinderGeometry(0.14, 0.2, 4.2, 8), color: 0x4a3a6a, matrix: mat(0, 2.1, 0) },
      { geo: new THREE.TorusGeometry(0.5, 0.06, 6, 16), color: 0xffd166, matrix: mat(0, 4.2, 0, Math.PI / 2) },
      { geo: new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8), color: 0x5c6399, matrix: mat(0, 0.15, 0) },
    ]), lambert({ vertexColors: true }));
    this.lampMat = new THREE.MeshLambertMaterial({ color: 0x4a4a6a, emissive: 0x000000, flatShading: true });
    this.lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), this.lampMat);
    this.lamp.position.y = 4.9;
    this.lamp.scale.y = 1.4;
    this.group.add(post, this.lamp);
    ctx.scene.add(this.group);
    this.col = ctx.collision.addCircle(x, z, 0.5, 'lantern');
    this.glow = ctx.glow.add(x, y + 4.9, z, this.color, 7, 0);
    this.ctx = ctx;
  }
  setDone(v) {
    this.done = v;
    this.lampMat.color.set(v ? this.color : 0x4a4a6a);
    this.lampMat.emissive.set(v ? this.color : 0x000000);
  }
  update(dt, t) {
    this.lamp.rotation.y = t * (this.done ? 1.2 : 0.2);
    this.lamp.position.y = 4.9 + (this.done ? Math.sin(t * 2 + this.index) * 0.15 : 0);
    this.ctx.glow.set(this.glow, { color: this.color, intensity: !this.group.visible ? 0 : this.done ? 1.1 : 0.05 });
  }
}
