// Skyreach quest sites: the Glider Guild's wind pinwheels, the cloud gauges in the valleys, Tock's clock
// gears, the workshop's crystal prisms and the Star Guild telescopes. Legend Lanterns come from the shared kit.
import * as THREE from 'three';
import { lambert } from '../../core/materials.js';
import { mergeColored, mat } from '../../core/geo.js';
import { damp } from '../../core/mathutil.js';
import { Site, Lantern } from '../../game/sitekit.js';

const V = (x, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const BRASS = 0xc89a3a;

// A tall pinwheel of red and blue blades. Unbalanced it wobbles and stalls; balanced it spins smoothly.
class Pinwheel extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('pinwheels', i, V(x, y, z));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.2, 6), lambert({ color: 0xf0f0ff }));
    pole.position.y = 2.1;
    this.head = new THREE.Group();
    this.head.position.set(0, 4.2, 0.2);
    const red = lambert({ color: 0xff5c6a }), blue = lambert({ color: 0x5aa9e6 });
    for (let k = 0; k < 6; k++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.04), k % 2 ? blue : red);
      blade.position.y = 0.75;
      blade.rotation.y = 0.5;
      const p = new THREE.Group();
      p.rotation.z = (k / 6) * Math.PI * 2;
      p.add(blade);
      this.head.add(p);
    }
    this.head.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), lambert({ color: 0xffd166 })));
    this.group.add(pole, this.head);
    this.group.rotation.y = i * 1.3;
    ctx.scene.add(this.group);
    ctx.collision.addCircle(x, z, 0.5, 'pinwheel');
    this.spin = 0;
  }

  update(dt, t) {
    this.spin = damp(this.spin, this.done ? 6 : 0.8, 1.5, dt);
    this.head.rotation.z += dt * this.spin;
    this.head.rotation.x = this.done ? 0 : Math.sin(t * 3 + this.index) * 0.25;
  }
}

// A cloud gauge: a striped post marked above and below the cloud line, with a sliding float.
class Gauge extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('gauges', i, V(x, y, z));
    const parts = [{ geo: new THREE.CylinderGeometry(0.22, 0.26, 3.6, 8), color: 0xf0f0ff, matrix: mat(0, 1.8, 0) }];
    for (let k = 0; k < 7; k++) parts.push({ geo: new THREE.CylinderGeometry(0.27, 0.27, 0.08, 8), color: k === 3 ? 0xffd166 : k < 3 ? 0xf0a0c0 : 0x6a8ad8, matrix: mat(0, 0.6 + k * 0.45, 0) });
    const post = new THREE.Mesh(mergeColored(parts), lambert({ vertexColors: true }));
    post.castShadow = true;
    this.float = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 6, 16), lambert({ color: 0xff8a3d }));
    this.float.rotation.x = Math.PI / 2;
    this.group.add(post, this.float);
    ctx.scene.add(this.group);
    ctx.collision.addCircle(x, z, 0.5, 'gauge');
  }

  update(dt, t) {
    this.level = damp(this.level, this.done ? 1 : 0, 2, dt);
    this.float.position.y = this.done ? 1.95 + Math.sin(t * 1.4 + this.index) * 0.05 : 1.95 + Math.sin(t * 0.9 + this.index) * 1.2;
  }
}

// A clock gear on a brass stand. Set, it turns with the others.
class ClockGear extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('gears', i, V(x, y, z));
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), lambert({ color: 0x7a5a32 }));
    stand.position.y = 1.1;
    this.gear = new THREE.Group();
    const gm = lambert({ color: BRASS }, { color: 0xffe0a0, strength: 0.25 });
    this.gear.add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.3, 20), gm));
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), gm);
      tooth.position.set(Math.cos(a) * 1.12, 0, Math.sin(a) * 1.12);
      tooth.rotation.y = -a;
      this.gear.add(tooth);
    }
    this.gear.rotation.x = Math.PI / 2;
    this.gear.position.y = 2.6;
    this.group.add(stand, this.gear);
    this.group.rotation.y = i * 0.8;
    ctx.scene.add(this.group);
    ctx.collision.addCircle(x, z, 0.8, 'gear-stand');
  }

  update(dt) { if (this.done) this.gear.rotation.y += dt * (this.index % 2 ? -1 : 1) * 0.9; }
}

// A crystal prism on a little stand: dull until it is shaped, then it throws a rainbow.
class Prism extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('prisms', i, V(x, y, z));
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.0, 8), lambert({ color: 0xc8c0e0 }));
    stand.position.y = 0.5;
    this.mat = new THREE.MeshLambertMaterial({ color: 0x8a8aa0, emissive: 0x000000, transparent: true, opacity: 0.85, flatShading: true });
    this.prism = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 3), this.mat);
    this.prism.position.y = 2.0;
    this.prism.rotation.z = Math.PI / 2;
    const rb = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true }));
    const cols = [];
    const rgb = [[1, 0.3, 0.3], [1, 0.8, 0.2], [0.3, 1, 0.5], [0.3, 0.6, 1], [0.8, 0.4, 1]];
    const posAttr = rb.geometry.attributes.position;
    for (let k = 0; k < posAttr.count; k++) { const c = rgb[Math.round(((posAttr.getX(k) + 1.6) / 3.2) * 4)]; cols.push(...c); }
    rb.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    rb.position.set(1.8, 1.6, 0);
    rb.rotation.set(-0.4, 0, -0.5);
    this.rainbow = rb;
    this.group.add(stand, this.prism, rb);
    this.group.rotation.y = i * 1.4;
    ctx.scene.add(this.group);
    ctx.collision.addCircle(x, z, 0.8, 'prism');
  }

  update(dt, t) {
    this.level = damp(this.level, this.done ? 1 : 0, 2, dt);
    this.mat.color.setRGB(0.54 + this.level * 0.4, 0.54 + this.level * 0.42, 0.63 + this.level * 0.37);
    this.mat.emissive.setRGB(this.level * 0.25, this.level * 0.2, this.level * 0.35);
    this.prism.rotation.y = t * 0.3 * this.level;
    this.rainbow.material.opacity = this.level * (0.55 + Math.sin(t * 2 + this.index) * 0.1);
  }
}

// A brass telescope on a tripod. Aimed, it tilts up at the sky and a star twinkles above it.
class Telescope extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('scopes', i, V(x, y, z));
    const parts = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      parts.push({ geo: new THREE.CylinderGeometry(0.05, 0.06, 2.0, 5), color: 0x5e3a22, matrix: mat(Math.cos(a) * 0.45, 0.95, Math.sin(a) * 0.45, Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25) });
    }
    const legs = new THREE.Mesh(mergeColored(parts), lambert({ vertexColors: true }));
    this.tube = new THREE.Group();
    this.tube.position.y = 2.0;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.9, 10), lambert({ color: BRASS }, { color: 0xffe0a0, strength: 0.3 }));
    t.rotation.x = Math.PI / 2;
    this.tube.add(t);
    this.tube.rotation.x = 0.3;
    this.star = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
    this.star.position.y = 4.4;
    this.star.visible = false;
    this.group.add(legs, this.tube, this.star);
    this.group.rotation.y = i * 1.7;
    ctx.scene.add(this.group);
    ctx.collision.addCircle(x, z, 0.7, 'telescope');
  }

  update(dt, t) {
    this.level = damp(this.level, this.done ? 1 : 0, 2, dt);
    this.tube.rotation.x = 0.3 - this.level * 0.9;
    this.star.visible = this.done;
    this.star.rotation.y = t * 2;
    this.star.scale.setScalar(1 + Math.sin(t * 4 + this.index) * 0.2);
  }
}

const KINDS = { pinwheel: Pinwheel, gauge: Gauge, gear: ClockGear, prism: Prism, scope: Telescope };

export function buildSkySites(ctx, SITE_SETS) {
  const sets = {};
  for (const [name, def] of Object.entries(SITE_SETS)) {
    if (def.kind === 'npc') continue;
    if (def.kind === 'lantern') {
      sets[name] = def.points.map(([x, z], i) => new Lantern(ctx, i, x, z, (def.regions ?? def.domains)[i]));
      continue;
    }
    const Kind = KINDS[def.kind];
    if (Kind) sets[name] = def.points.map(([x, z], i) => new Kind(ctx, i, x, z));
  }
  return sets;
}
