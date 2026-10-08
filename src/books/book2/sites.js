// Ember Isles quest sites: Cinder's brass siphon valves, tired coral beds, Shelldon's cargo scales, tide
// pools and the cliff signal lamps. Legend Lanterns come from the shared site kit.
import * as THREE from 'three';
import { G } from '../../core/state.js';
import { lambert } from '../../core/materials.js';
import { mergeColored, mat } from '../../core/geo.js';
import { damp } from '../../core/mathutil.js';
import { Site, Lantern } from '../../game/sitekit.js';
import { coralGeometry } from './nature.js';
import { WATER_Y } from './layout.js';

const V = (x, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const BRASS = 0xc89a3a;

// A brass pipe out of the ground with a big red valve wheel. Open, it leaks steam; closed, it rests.
class Valve extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('valves', i, V(x, y, z));
    const pipe = new THREE.Mesh(mergeColored([
      { geo: new THREE.CylinderGeometry(0.42, 0.42, 3.2, 12), color: BRASS, matrix: mat(0, 0.9, 0, 0, 0, Math.PI / 2) },
      { geo: new THREE.CylinderGeometry(0.42, 0.42, 1.4, 12), color: BRASS, matrix: mat(-1.6, 0.25, 0) },
      { geo: new THREE.TorusGeometry(0.5, 0.1, 6, 14), color: 0x8a6420, matrix: mat(0.9, 0.9, 0, 0, Math.PI / 2, 0) },
      { geo: new THREE.TorusGeometry(0.5, 0.1, 6, 14), color: 0x8a6420, matrix: mat(-0.9, 0.9, 0, 0, Math.PI / 2, 0) },
      { geo: new THREE.CylinderGeometry(0.16, 0.16, 0.9, 8), color: 0x6a5a40, matrix: mat(0, 1.5, 0) },
    ]), lambert({ vertexColors: true }, { color: 0xffd6b8, strength: 0.2 }));
    pipe.castShadow = true;
    this.wheel = new THREE.Group();
    this.wheel.position.set(0, 2.05, 0);
    const red = lambert({ color: 0xd8333f });
    this.wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 8, 24), red));
    for (let k = 0; k < 4; k++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.08), red);
      spoke.rotation.z = (k * Math.PI) / 4;
      this.wheel.add(spoke);
    }
    this.wheel.rotation.x = Math.PI / 2;
    this.group.add(pipe, this.wheel);
    this.group.rotation.y = i * 1.1;
    ctx.scene.add(this.group);
    ctx.collision.addCircle(x, z, 1.6, 'valve');
    this.ctx = ctx;
    this.steamT = Math.random();
    this.spin = 0;
  }

  update(dt, t) {
    this.spin = damp(this.spin, this.done ? 1 : 0, 2, dt);
    this.wheel.rotation.z = this.spin * Math.PI * 3;
    if (this.done) return;
    this.steamT -= dt;
    if (this.steamT <= 0) {
      this.steamT = 0.25 + Math.random() * 0.3;
      G.world?.effects.burst(this.pos.clone().add(V((Math.random() - 0.5) * 0.6, 1.2, (Math.random() - 0.5) * 0.6)), { count: 2, color: [0xf0e8e4, 0xc8bcc0], speed: 0.6, up: 2.8, life: 1.4, gravity: -0.6, size: 0.9 });
    }
  }
}

// A coral bed in the lagoon: pale and tired until it gets its share of warmth, then bright again.
class CoralBed extends Site {
  constructor(ctx, i, x, z) {
    const floor = ctx.terrain.heightAt(x, z);
    super('corals', i, V(x, WATER_Y, z));
    const colors = [0xff6fa5, 0xff8a3d, 0xb97aff, 0xffd23d, 0x4fe0c4];
    this.color = new THREE.Color(colors[i % colors.length]);
    this.pale = new THREE.Color(0xe8e4dc);
    this.mats = [];
    for (let k = 0; k < 5; k++) {
      const m = new THREE.MeshLambertMaterial({ color: this.pale.clone(), emissive: 0x000000 });
      this.mats.push(m);
      const c = new THREE.Mesh(coralGeometry(i * 5 + k + 1, 0xffffff), m);
      const a = (k / 5) * Math.PI * 2;
      c.position.set(Math.cos(a) * 1.4, floor - WATER_Y - 0.1, Math.sin(a) * 1.4);
      c.scale.setScalar(0.9 + (k % 3) * 0.25);
      this.group.add(c);
    }
    const marker = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.08, 6, 30), new THREE.MeshBasicMaterial({ color: 0xbff8ee, transparent: true, opacity: 0.5 }));
    marker.rotation.x = Math.PI / 2;
    marker.position.y = 0.05;
    this.marker = marker;
    this.group.add(marker);
    ctx.scene.add(this.group);
    this.glow = ctx.glow.add(x, WATER_Y + 0.3, z, this.color, 6, 0);
    this.ctx = ctx;
  }

  update(dt, t) {
    this.level = damp(this.level, this.done ? 1 : 0, 1.5, dt);
    for (const m of this.mats) { m.color.copy(this.pale).lerp(this.color, this.level); m.emissive.copy(this.color).multiplyScalar(this.level * 0.25); }
    this.marker.material.opacity = (1 - this.level) * (0.35 + 0.2 * Math.sin(t * 2 + this.index));
    this.ctx.glow.set(this.glow, { color: this.color, intensity: this.level * 0.7 });
  }
}

// A cargo crate on a platform scale. Weighed, it gets a green tag.
class CargoCrate extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('crates', i, V(x, y, z));
    const body = new THREE.Mesh(mergeColored([
      { geo: new THREE.BoxGeometry(2.2, 0.3, 2.2), color: 0x5a5a64, matrix: mat(0, 0.15, 0) },
      { geo: new THREE.BoxGeometry(1.5, 1.4, 1.5), color: 0x9a6a40, matrix: mat(0, 1.0, 0) },
      { geo: new THREE.BoxGeometry(1.56, 0.14, 1.56), color: 0x5e3a22, matrix: mat(0, 1.65, 0) },
      { geo: new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6), color: 0x5a5a64, matrix: mat(1.2, 0.95, 0) },
      { geo: new THREE.CylinderGeometry(0.45, 0.45, 0.12, 16), color: 0xf4f0e6, matrix: mat(1.2, 1.8, 0, Math.PI / 2, 0, 0) },
    ]), lambert({ vertexColors: true }, { color: 0xffd6b8, strength: 0.15 }));
    body.castShadow = true;
    this.needle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.02), new THREE.MeshBasicMaterial({ color: 0xd8333f }));
    this.needle.position.set(1.2, 1.8, 0.08);
    this.needle.geometry.translate(0, 0.15, 0);
    this.tagMat = new THREE.MeshLambertMaterial({ color: 0x8a8a96 });
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.04), this.tagMat);
    tag.position.set(0, 1.05, 0.78);
    this.group.add(body, this.needle, tag);
    this.group.rotation.y = i * 0.9 + 0.4;
    ctx.scene.add(this.group);
    const c = ctx.collision.addCircle(x, z, 1.3, 'crate');
    c.top = y + 1.75;
  }

  setDone(v) { this.done = v; this.tagMat.color.set(v ? 0x4ddb7a : 0x8a8a96); }

  update(dt, t) { this.needle.rotation.z = this.done ? -0.6 : Math.sin(t * 2.5 + this.index) * 0.9; }
}

// A tide pool ringed with rocks. Measured, a little yardstick stands in it.
class TidePool extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('tides', i, V(x, y, z));
    const parts = [];
    for (let k = 0; k < 11; k++) {
      const a = (k / 11) * Math.PI * 2;
      parts.push({ geo: new THREE.DodecahedronGeometry(0.42, 0), color: k % 2 ? 0x6a6060 : 0x8a7e76, matrix: mat(Math.cos(a) * 1.9, 0.12, Math.sin(a) * 1.9, a, a, 0, 1, 0.7, 1) });
    }
    const rocks = new THREE.Mesh(mergeColored(parts), lambert({ vertexColors: true, flatShading: true }));
    rocks.castShadow = true;
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.75, 20), new THREE.MeshLambertMaterial({ color: 0x52d8c8, emissive: 0x0c3a40, transparent: true, opacity: 0.85 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.12;
    this.stick = new THREE.Mesh(mergeColored([
      { geo: new THREE.BoxGeometry(0.12, 1.6, 0.06), color: 0xf8e8c0, matrix: mat(0, 0.8, 0) },
      ...[0.3, 0.6, 0.9, 1.2].map((h) => ({ geo: new THREE.BoxGeometry(0.16, 0.03, 0.07), color: 0xd8333f, matrix: mat(0, h, 0) })),
    ]), lambert({ vertexColors: true }));
    this.stick.position.set(0.4, 0, 0.2);
    this.stick.scale.setScalar(0.001);
    this.group.add(rocks, water, this.stick);
    ctx.scene.add(this.group);
  }

  update(dt) {
    this.level = damp(this.level, this.done ? 1 : 0, 3, dt);
    this.stick.scale.setScalar(Math.max(0.001, this.level));
  }
}

// A signal lamp on the cliffs: it blinks its code once lit.
class SignalLamp extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('lamps', i, V(x, y, z));
    const post = new THREE.Mesh(mergeColored([
      { geo: new THREE.CylinderGeometry(0.16, 0.22, 3.2, 8), color: 0x3a3a44, matrix: mat(0, 1.6, 0) },
      { geo: new THREE.BoxGeometry(0.9, 0.12, 0.9), color: 0x3a3a44, matrix: mat(0, 3.25, 0) },
      { geo: new THREE.ConeGeometry(0.62, 0.5, 4), color: 0xd8333f, matrix: mat(0, 4.25, 0, 0, Math.PI / 4, 0) },
      { geo: new THREE.CylinderGeometry(0.4, 0.5, 0.5, 8), color: 0x5a5a64, matrix: mat(0, 0.25, 0) },
    ]), lambert({ vertexColors: true }));
    post.castShadow = true;
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0x4a4a58 });
    this.lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.62, 12), this.lampMat);
    this.lamp.position.y = 3.65;
    this.group.add(post, this.lamp);
    ctx.scene.add(this.group);
    ctx.collision.addCircle(x, z, 0.6, 'lamp');
    this.glow = ctx.glow.add(x, y + 3.7, z, 0xffe0a0, 8, 0);
    this.light = { x, y: y + 3.8, z, intensity: 0 };
    ctx.lanterns.push(this.light);
    this.ctx = ctx;
    this.code = [[1, 0, 1, 1], [1, 1, 0, 1], [1, 0, 0, 1], [1, 1, 1, 0]][i % 4];
  }

  update(dt, t) {
    const on = this.done && this.code[Math.floor(t * 2.5) % this.code.length] === 1;
    this.lampMat.color.set(on ? 0xffe9a8 : this.done ? 0x8a7a50 : 0x4a4a58);
    this.ctx.glow.set(this.glow, { color: 0xffe0a0, intensity: on ? 1.1 : 0 });
    this.light.intensity = on ? 40 : 0;
  }
}

const KINDS = { valve: Valve, coral: CoralBed, crate: CargoCrate, pool: TidePool, lamp: SignalLamp };

export function buildEmberSites(ctx, SITE_SETS) {
  const sets = {};
  for (const [name, def] of Object.entries(SITE_SETS)) {
    if (def.kind === 'npc') continue;
    if (def.kind === 'lantern') {
      sets[name] = def.points.map(([x, z], i) => new Lantern(ctx, i, x, z, def.domains[i]));
      continue;
    }
    const Kind = KINDS[def.kind];
    if (Kind) sets[name] = def.points.map(([x, z], i) => new Kind(ctx, i, x, z));
  }
  return sets;
}
