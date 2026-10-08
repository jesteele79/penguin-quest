// 3D quest sites: buoys, garden beds, survey flags, cave mirrors, beacons, legend lanterns, fraction pillars.
import * as THREE from 'three';
import { G } from '../core/state.js';
import { SITE_SETS } from './questdata.js';
import { lambert, crystalMaterial, REGION_COLORS } from '../core/materials.js';
import { mergeColored, mat } from '../core/geo.js';
import { clusterGeometry } from '../world/nature.js';
import { WATER_Y, CRYSTALS } from '../world/layout.js';
import { isBook2 } from '../books/active.js';
import { buildEmberSites } from '../books/book2/sites.js';
import { Site, Lantern } from './sitekit.js';
import { damp } from '../core/mathutil.js';
import { twoShot } from './minigames/common.js';

const V = (x, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function beamMesh(color = 0xfff3c0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 10, 1, true), new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  m.renderOrder = 7;
  m.visible = false;
  return m;
}

function stretchBetween(mesh, a, b) {
  const d = b.clone().sub(a);
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.scale.set(1, d.length(), 1);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
}

class Buoy extends Site {
  constructor(ctx, i, x, z) {
    super('buoys', i, V(x, WATER_Y, z));
    const geo = mergeColored([
      { geo: new THREE.CylinderGeometry(0.75, 0.95, 1.2, 14), color: 0xe8434b, matrix: mat(0, 0.1, 0) },
      { geo: new THREE.CylinderGeometry(0.62, 0.75, 0.6, 14), color: 0xf4f6ff, matrix: mat(0, 1.0, 0) },
      { geo: new THREE.ConeGeometry(0.62, 0.9, 14), color: 0xe8434b, matrix: mat(0, 1.75, 0) },
      { geo: new THREE.CylinderGeometry(0.05, 0.05, 1.2, 5), color: 0x3a3a48, matrix: mat(0, 2.6, 0) },
    ]);
    this.body = new THREE.Mesh(geo, lambert({ vertexColors: true }));
    this.body.castShadow = true;
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0x3a4060 });
    this.lamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), this.lampMat);
    this.lamp.position.y = 3.3;
    this.group.add(this.body, this.lamp);
    ctx.scene.add(this.group);
    this.glow = ctx.glow.add(x, WATER_Y + 3.3, z, 0xfff0a0, 5, 0);
    this.ctx = ctx;
    this.phase = i * 1.7;
  }
  setDone(v) { this.done = v; this.lampMat.color.set(v ? 0xfff0a0 : 0x3a4060); }
  update(dt, t) {
    this.group.position.y = WATER_Y - 0.1 + Math.sin(t * 1.4 + this.phase) * 0.12;
    this.group.rotation.z = Math.sin(t * 1.1 + this.phase) * 0.06;
    const blink = this.done ? 0.75 + 0.25 * Math.sin(t * 3 + this.phase) : 0;
    this.ctx.glow.set(this.glow, { x: this.pos.x, y: this.group.position.y + 3.3, z: this.pos.z, color: 0xfff0a0, intensity: blink });
  }
}

class Bed extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('beds', i, V(x, y, z));
    const parts = [];
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      parts.push({ geo: new THREE.DodecahedronGeometry(0.3, 0), color: 0x7880bb, matrix: mat(Math.cos(a) * 1.6, 0.12, Math.sin(a) * 1.6, a, a, 0, 1, 0.7, 1) });
    }
    parts.push({ geo: new THREE.SphereGeometry(1.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), color: 0xd7e6ff, matrix: mat(0, -0.3, 0, 0, 0, 0, 1, 0.35, 1) });
    const base = new THREE.Mesh(mergeColored(parts), lambert({ vertexColors: true }));
    base.receiveShadow = true;
    this.sprout = new THREE.Mesh(clusterGeometry(40 + i), crystalMaterial(0x38f0d2, 0.8));
    this.sprout.scale.setScalar(0.001);
    this.group.add(base, this.sprout);
    ctx.scene.add(this.group);
    this.glow = ctx.glow.add(x, y + 1.2, z, 0x38f0d2, 5, 0);
    this.ctx = ctx;
  }
  update(dt, t) {
    this.level = damp(this.level, this.done ? 1 : 0, 2, dt);
    this.sprout.scale.setScalar(Math.max(0.001, this.level * 0.75));
    this.sprout.rotation.y = t * 0.3;
    this.ctx.glow.set(this.glow, { color: 0x38f0d2, intensity: this.level * 0.9 });
  }
}

class SurveyFlag extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('survey', i, V(x, y, z));
    const ice = new THREE.Mesh(clusterGeometry(90 + i, true), crystalMaterial(0xbfe6ff, 0.25));
    ice.scale.set(1.6, 1.9, 1.6);
    ice.position.set(1.6, -0.2, 0);
    ice.castShadow = true;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6), lambert({ color: 0x5e3a22 }));
    pole.position.set(-1.4, 1.6, 0.6);
    this.flagMat = lambert({ color: 0x8a90b0, side: THREE.DoubleSide }, { strength: 0.2 });
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), this.flagMat);
    flag.position.set(-0.83, 2.8, 0.6);
    this.flag = flag;
    this.group.add(ice, pole, flag);
    this.group.rotation.y = i * 1.3;
    ctx.scene.add(this.group);
    ctx.collision.addCircle(x, z, 2.2, 'survey');
    this.glow = ctx.glow.add(x, y + 3, z, 0xffd166, 5, 0);
    this.ctx = ctx;
  }
  setDone(v) { this.done = v; this.flagMat.color.set(v ? 0xffd166 : 0x8a90b0); }
  update(dt, t) {
    this.flag.rotation.y = Math.sin(t * 3 + this.index) * 0.25;
    this.ctx.glow.set(this.glow, { color: 0xffd166, intensity: this.done ? 0.6 : 0 });
  }
}

class Beacon extends Site {
  constructor(ctx, i, x, z) {
    const y = ctx.terrain.heightAt(x, z);
    super('beacons', i, V(x, y, z));
    const stone = mergeColored([
      { geo: new THREE.CylinderGeometry(0.9, 1.2, 2.4, 8), color: 0x5c6399, matrix: mat(0, 1.2, 0) },
      { geo: new THREE.CylinderGeometry(1.5, 0.8, 0.8, 10), color: 0x3a3a48, matrix: mat(0, 2.8, 0) },
      { geo: new THREE.DodecahedronGeometry(0.35, 0), color: 0x2a2020, matrix: mat(0.3, 3.2, 0.1) },
      { geo: new THREE.DodecahedronGeometry(0.3, 0), color: 0x2a2020, matrix: mat(-0.3, 3.2, -0.2) },
    ]);
    const m = new THREE.Mesh(stone, lambert({ vertexColors: true, flatShading: true }));
    m.castShadow = true;
    this.fire = [];
    const fm = [0xff9a3a, 0xffd166, 0xff6a3a].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.55 - k * 0.12, 1.8 - k * 0.3, 7), fm[k]);
      f.position.set((k - 1) * 0.2, 4.1, 0);
      f.visible = false;
      this.fire.push(f);
      this.group.add(f);
    }
    this.group.add(m);
    ctx.scene.add(this.group);
    ctx.collision.addCircle(x, z, 1.3, 'beacon');
    this.glow = ctx.glow.add(x, y + 4.2, z, 0xff9a3a, 12, 0);
    this.light = { x, y: y + 4.5, z, intensity: 0 };
    ctx.lanterns.push(this.light);
    this.ctx = ctx;
  }
  setDone(v) { this.done = v; this.fire.forEach((f) => { f.visible = v; }); this.light.intensity = v ? 60 : 0; }
  update(dt, t) {
    if (!this.done) return;
    this.fire.forEach((f, k) => {
      const s = 1 + Math.sin(t * (8 + k * 3) + k) * 0.2;
      f.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
      f.rotation.y = t * (1 + k);
    });
    this.ctx.glow.set(this.glow, { color: 0xff9a3a, intensity: 1 + Math.sin(t * 7) * 0.12 });
  }
}

class Mirror extends Site {
  constructor(ctx, i, pos, faceStart, faceEnd) {
    super('mirrors', i, pos);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, 1.6, 8), lambert({ color: 0x8fb8f0 }));
    stand.position.y = 0.8;
    this.pivot = new THREE.Group();
    this.pivot.position.y = 2.0;
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.09, 8, 24), lambert({ color: 0xdff0ff, emissive: 0x223366 }));
    this.faceMat = new THREE.MeshLambertMaterial({ color: 0xcfe8ff, emissive: 0x3a5aa0, emissiveIntensity: 0.4, side: THREE.DoubleSide });
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.76, 24), this.faceMat);
    this.pivot.add(frame, face);
    this.group.add(stand, this.pivot);
    ctx.scene.add(this.group);
    ctx.collision.addCircle(pos.x, pos.z, 0.7, 'mirror');
    this.startYaw = faceStart;
    this.endYaw = faceEnd;
    this.pivot.rotation.y = faceStart;
    this.yaw = faceStart;
  }
  setDone(v) { this.done = v; this.faceMat.emissiveIntensity = v ? 1.2 : 0.4; }
  update(dt) {
    this.yaw = damp(this.yaw, this.done ? this.endYaw : this.startYaw, 3, dt);
    this.pivot.rotation.y = this.yaw;
  }
}

class PillarSite extends Site {
  constructor(pillar, i) {
    super('pillars', i, pillar.pos);
    this.pillar = pillar;
  }
  setDone(v) { this.done = v; if (v) this.pillar.complete(); }
}

export class SiteManager {
  constructor(ctx) {
    this.ctx = ctx;
    this.sets = {};
    if (isBook2) { this.sets = buildEmberSites(ctx, SITE_SETS); return; }
    this.sets.buoys = SITE_SETS.buoys.points.map(([x, z], i) => new Buoy(ctx, i, x, z));
    this.sets.beds = SITE_SETS.beds.points.map(([x, z], i) => new Bed(ctx, i, x, z));
    this.sets.survey = SITE_SETS.survey.points.map(([x, z], i) => new SurveyFlag(ctx, i, x, z));
    this.sets.beacons = SITE_SETS.beacons.points.map(([x, z], i) => new Beacon(ctx, i, x, z));
    this.sets.legends = SITE_SETS.legends.points.map(([x, z], i) => new Lantern(ctx, i, x, z, SITE_SETS.legends.domains[i]));
    this.sets.pillars = ctx.pillars.map((p, i) => new PillarSite(p, i));
    this.buildMirrors(ctx);
  }

  buildMirrors(ctx) {
    const cave = ctx.cave;
    const C = cave.center, dir = V(cave.dir.x, 0, cave.dir.y), perp = V(-dir.z, 0, dir.x);
    const fy = cave.floorY;
    const pts = [
      C.clone().addScaledVector(perp, 8).addScaledVector(dir, 1),
      C.clone().addScaledVector(perp, -8).addScaledVector(dir, 1),
      C.clone().addScaledVector(dir, -7).addScaledVector(perp, -3),
    ].map((p) => V(p.x, fy, p.z));
    const crystal = V(CRYSTALS.cave.x, fy + 3.6, CRYSTALS.cave.z);
    const source = C.clone().addScaledVector(dir, 12).add(V(0, fy + 8.5, 0));
    const aim = [pts[1], pts[2], crystal];
    const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
    this.sets.mirrors = pts.map((p, i) => {
      const prev = i === 0 ? source : pts[i - 1];
      const inYaw = yawTo(p, prev), outYaw = yawTo(p, aim[i]);
      const bisect = inYaw + ((((outYaw - inYaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI) / 2);
      return new Mirror(ctx, i, p, bisect + 1.1, bisect);
    });
    this.beamPoints = [source, ...pts.map((p) => p.clone().add(V(0, 2, 0))), crystal];
    this.beams = [];
    for (let k = 0; k < this.beamPoints.length - 1; k++) {
      const b = beamMesh();
      stretchBetween(b, this.beamPoints[k], this.beamPoints[k + 1]);
      ctx.scene.add(b);
      this.beams.push(b);
    }
  }

  list(set) { return this.sets[set] ?? []; }
  count(set) { return SITE_SETS[set].kind === 'npc' ? SITE_SETS[set].npcs.length : this.list(set).length; }

  undonePositions(set, done = []) { return this.list(set).filter((s) => !done.includes(s.index)).map((s) => s.pos); }

  nearestUndone(set, done = [], p) {
    let best = null, bd = Infinity;
    for (const s of this.list(set)) {
      if (done.includes(s.index)) continue;
      const d = s.pos.distanceTo(p);
      if (d < bd) { bd = d; best = s.pos; }
    }
    return best;
  }

  markDone(set, index) {
    const s = this.list(set)[index];
    if (s) {
      s.setDone(true);
      G.world.effects.sparkle(s.pos.clone().add(V(0, 2.5, 0)), 0xffd166, 40);
    }
    this.refreshBeams();
  }

  refresh() {
    for (const set of Object.keys(this.sets)) {
      const st = G.quests.siteState(set);
      // The Legend lanterns only rise out of the snow once the festival chapter begins.
      const shown = set !== 'legends' || G.quests.started('ch7');
      for (const s of this.sets[set]) {
        const d = st.done === 'all' || st.done.includes(s.index);
        if (d !== s.done) s.setDone(d);
        s.group.visible = shown;
        if (s.col) s.col.active = shown;
      }
    }
    this.refreshBeams();
  }

  refreshBeams() {
    if (!this.beams) return;
    const st = G.quests.siteState('mirrors');
    const active = st.active || st.done === 'all';
    const lit = st.done === 'all' ? 3 : st.done.length;
    this.beams.forEach((b, k) => { b.visible = active && k <= lit; });
  }

  hooks(set, index) {
    const s = this.list(set)[index];
    const shotAt = (pos, height = 2.4) => () => {
      const shot = twoShot(G.player.pos, pos, { dist: 8 + height, up: 1.6 + height * 0.6, lookUp: height * 0.8 });
      shot.pos.y = Math.max(shot.pos.y, WATER_Y + 1.5);
      return shot;
    };
    if (SITE_SETS[set].kind === 'npc') {
      const npcId = SITE_SETS[set].npcs[index];
      return { shot: () => twoShot(G.player.pos, G.npcs.get(npcId).pos) };
    }
    if (set === 'pillars') {
      const pil = s.pillar;
      return {
        shot: shotAt(pil.pos, 3),
        onProblem: (p, n) => {
          if (n === 0 && p.visual?.kind === 'bar') { pil.setMarks(p.visual.parts); pil.setFill(p.visual.shaded / p.visual.parts); }
        },
        onCorrect: (p) => { if (p.skill === 'frac_fill') { pil.setFill(1); G.world.effects.sparkle(pil.pos.clone().add(V(0, 3, 0)), 0x38f0d2, 30); } },
        onDone: () => {},
      };
    }
    return {
      shot: shotAt(s.pos, set === 'buoys' ? 1.5 : 2.4),
      onCorrect: () => G.world.effects.sparkle(s.pos.clone().add(V(0, 2.5, 0)), 0xfff3c0, 14),
    };
  }

  registerInteractions(interactions) {
    for (const [set, sites] of Object.entries(this.sets)) {
      const def = SITE_SETS[set];
      for (const s of sites) {
        interactions.add({
          id: `${set}-${s.index}`, pos: s.pos, radius: def.radius ?? 3.8,
          label: () => {
            const id = G.quests.siteQuest(set);
            if (!id) return null;
            return G.quests.st(id).data.done?.includes(s.index) ? null : def.label;
          },
          action: () => G.quests.useSite(set, s.index),
        });
      }
    }
  }

  update(dt, t) {
    for (const sites of Object.values(this.sets)) for (const s of sites) s.update(dt, t);
    if (this.beams) this.beams.forEach((b, k) => { if (b.visible) b.material.opacity = 0.65 + Math.sin(t * 4 + k) * 0.2; });
  }
}
