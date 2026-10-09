// Walk-into collectibles: the book's 30 treasures (golden snowflakes, or sea glass) and Book 1's crystal
// seeds (during the Chapter 2 seed hunt).
import * as THREE from 'three';
import { G } from '../core/state.js';
import { mergeColored, mat } from '../core/geo.js';
import { SNOWFLAKES, SEEDS } from '../world/layout.js';
import { crystalMaterial } from '../core/materials.js';
import { BOOK } from '../books/current.js';
import { T } from '../books/terms.js';

function flakeGeometry() {
  const parts = [];
  for (let i = 0; i < 3; i++) parts.push({ geo: new THREE.BoxGeometry(0.16, 1.9, 0.16), color: 0xffd166, matrix: mat(0, 0, 0, 0, 0, (i * Math.PI) / 3) });
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    for (const s of [-1, 1]) {
      parts.push({ geo: new THREE.BoxGeometry(0.1, 0.5, 0.1), color: 0xfff0b0, matrix: mat(Math.sin(a) * 0.62 + Math.cos(a) * s * 0.14, Math.cos(a) * 0.62 - Math.sin(a) * s * 0.14, 0, 0, 0, -a + s * 0.7) });
    }
  }
  parts.push({ geo: new THREE.OctahedronGeometry(0.26, 0), color: 0xffffff });
  return mergeColored(parts);
}

function seedGeometry() {
  return mergeColored([{ geo: new THREE.OctahedronGeometry(0.5, 0), color: 0xffffff, matrix: mat(0, 0, 0, 0, 0, 0, 1, 1.5, 1) }]);
}

// A book can bring its own collectible (see book2/hooks.js); Book 1's is the golden snowflake.
const LOOK = BOOK.collectible ?? { height: 1.3, glow: 0xffd166, glowSize: 4, glowAmount: 0.9 };

const SETS = {
  flakes: { points: SNOWFLAKES, key: 'snowflakes', always: true, height: LOOK.height, radius: 1.6, glow: LOOK.glow, glowSize: LOOK.glowSize, glowAmount: LOOK.glowAmount },
  seeds: { points: SEEDS ?? [], key: 'seeds', always: false, height: 0.9, radius: 1.6, glow: 0x38f0d2, glowSize: 4, glowAmount: 0.9 },
};

// Every collectible that shares a look is drawn by one instanced mesh. Each item keeps a plain stand-in object
// (it.mesh) for its position, spin and visibility, and the instances copy those after every change.
export class Pickups {
  constructor(ctx) {
    this.ctx = ctx;
    this.items = { flakes: [], seeds: [] };
    const flakeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffa020, emissiveIntensity: 0.7, vertexColors: true });
    const fg = flakeGeometry();
    const sg = seedGeometry();
    const seedMat = crystalMaterial(0x38f0d2, 0.9);
    const looks = new Map();
    for (const [set, def] of Object.entries(SETS)) {
      def.points.forEach(([x, z], i) => {
        const y = Math.max(ctx.terrain.heightAt(x, z), 0) + def.height;
        const model = set === 'flakes' && LOOK.make ? LOOK.make(i) : new THREE.Mesh(set === 'flakes' ? fg : sg, set === 'flakes' ? flakeMat : seedMat);
        const key = model.geometry.uuid + model.material.uuid;
        if (!looks.has(key)) looks.set(key, { geometry: model.geometry, material: model.material, items: [] });
        const mesh = new THREE.Object3D();
        mesh.position.set(x, y, z);
        const glow = ctx.glow.add(x, y, z, def.glow, def.glowSize, def.glowAmount);
        const it = { i, x, z, y, mesh, glow, phase: i * 0.7 };
        looks.get(key).items.push(it);
        this.items[set].push(it);
      });
    }
    this.looks = [...looks.values()].map((L) => {
      const im = new THREE.InstancedMesh(L.geometry, L.material, L.items.length);
      im.castShadow = true;
      im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      ctx.scene.add(im);
      L.items.forEach((it, k) => { it.look = im; it.slot = k; });
      return im;
    });
    for (const list of Object.values(this.items)) for (const it of list) this.place(it);
  }

  // Copy an item's stand-in into its instance; hidden ones shrink to nothing.
  place(it) {
    const m = it.mesh;
    m.scale.setScalar(m.visible ? 1 : 0);
    m.updateMatrix();
    it.look.setMatrixAt(it.slot, m.matrix);
    it.look.instanceMatrix.needsUpdate = true;
  }

  isCollected(set, i) { return G.save.data[SETS[set].key].includes(i); }
  total(set) { return this.items[set].length; }
  collectedCount(set) { return G.save.data[SETS[set].key].length; }

  // Seeds only exist while the seed hunt is on (or after, if not yet picked up they stay hidden).
  seedHuntActive() {
    for (const id of G.quests.activeIds()) {
      const st = G.quests.step(id);
      if (st?.type === 'collect' && st.set === 'seeds') return true;
    }
    return false;
  }

  refresh() {
    const hunt = this.seedHuntActive();
    for (const [set, list] of Object.entries(this.items)) {
      for (const it of list) {
        const show = !this.isCollected(set, it.i) && (SETS[set].always || hunt);
        it.mesh.visible = show;
        this.place(it);
        this.ctx.glow.set(it.glow, { color: SETS[set].glow, intensity: show ? SETS[set].glowAmount : 0 });
      }
    }
  }

  nearestFlake(p) { return this.nearestUncollected('flakes', p); }

  nearestUncollected(set, p) {
    let best = null, bd = Infinity;
    for (const it of this.items[set]) {
      if (!it.mesh.visible) continue;
      const d = Math.hypot(it.x - p.x, it.z - p.z);
      if (d < bd) { bd = d; best = new THREE.Vector3(it.x, 0, it.z); }
    }
    return best;
  }

  update(dt, t, player) {
    const p = player.pos;
    for (const [set, list] of Object.entries(this.items)) {
      const def = SETS[set];
      for (const it of list) {
        if (!it.mesh.visible) continue;
        it.mesh.rotation.y = t * 1.6 + it.phase;
        it.mesh.position.y = it.y + Math.sin(t * 2 + it.phase) * 0.2;
        this.place(it);
        const dx = p.x - it.x, dz = p.z - it.z;
        if (dx * dx + dz * dz < def.radius * def.radius * 2.2 && Math.abs(p.y + 1 - it.mesh.position.y) < 2.4) this.collect(set, it);
      }
    }
  }

  collect(set, it) {
    const s = G.save.data;
    const key = SETS[set].key;
    if (s[key].includes(it.i)) return;
    s[key].push(it.i);
    it.mesh.visible = false;
    this.place(it);
    this.ctx.glow.set(it.glow, { intensity: 0 });
    G.world.effects.sparkle(it.mesh.position, SETS[set].glow, 36);
    G.audio.play('chime');
    if (set === 'flakes') {
      G.toasts.toast(`${T.Flake}! <b>${s.snowflakes.length}/30</b>`, { kind: 'gold' });
      G.patrol?.event('flake');
    } else {
      G.toasts.toast(`Crystal seed! <b>${s.seeds.length}/${this.total('seeds')}</b>`, { kind: 'teal' });
    }
    G.saveSoon();
  }
}
