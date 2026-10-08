// The builder (Book 1's Ice Architect in the cave, Book 2's temple rebuild): answers turn into real 3D builds on
// the build pad (area tiles, fence posts, cube stacks, joined boxes). Contest mode builds sculptures.
import * as THREE from 'three';
import { G, pushActivity } from '../../core/state.js';
import { QuizActivity } from '../activities.js';
import { V, awardMedal } from './common.js';
import { BOOK } from '../../books/current.js';

const A = BOOK.architect;
const MAX = 400;

class ArchitectActivity extends QuizActivity {
  constructor(params, onDone) {
    const sculpture = !!params.sculpture;
    const count = params.count ?? 5;
    const pad = G.world.ctx.buildPad;
    const fwd = V(Math.sin(pad.yaw), 0, Math.cos(pad.yaw));
    // Stay inside the dome: the entrance arch starts about 11 units from the cave center.
    const camPos = V(pad.x, pad.y, pad.z).addScaledVector(fwd, 6.2).add(V(0, 8.2, 0));
    const side = V(-fwd.z, 0, fwd.x);
    super({
      title: sculpture ? A.contestTitle : A.title, subtitle: sculpture ? 'The judges love exact measurements!' : A.subtitle(count),
      color: A.color, count,
      pick: () => ({ domain: 'cave', skills: sculpture ? A.sculptSkills : A.skills }),
      shot: { pos: camPos.addScaledVector(side, -2.5), look: V(pad.x, pad.y + 0.6, pad.z).addScaledVector(side, -3.4), fov: 58 },
      onProblem: (p) => this.prepare(p),
      onCorrect: (p) => this.build(p),
      onFinish: () => this.wrapUp(),
    });
    this.sculpture = sculpture;
    this.onDoneGame = onDone;
    this.pad = pad;
    this.firstTries = 0;
    this.queue = [];
    this.buildT = 0;
    this.statues = [];
  }

  enter() {
    const pad = this.pad;
    const fwd = V(Math.sin(pad.yaw), 0, Math.cos(pad.yaw));
    const stand = V(pad.x, 0, pad.z).addScaledVector(fwd, 4.6);
    G.player.teleport(stand.x, stand.z, pad.yaw + Math.PI);
    this.cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(A.cube), MAX);
    this.cubes.count = 0;
    this.cubes.castShadow = true;
    this.cubes.frustumCulled = false;
    G.scene.add(this.cubes);
    this.ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: A.ghost, transparent: true, opacity: 0.8 }));
    this.ghost.visible = false;
    G.scene.add(this.ghost);
    this.dimLabels = [];
    super.enter();
  }

  // Local pad coordinates -> world matrix
  place(m, lx, ly, lz, sx, sy, sz) {
    const pad = this.pad;
    const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), pad.yaw);
    const p = V(lx, ly, lz).applyQuaternion(q).add(V(pad.x, pad.y, pad.z));
    m.compose(p, q, V(sx, sy, sz));
    return p;
  }

  clearBuild() {
    this.cubes.count = 0;
    this.cubes.instanceMatrix.needsUpdate = true;
    this.queue = [];
    this.ghost.visible = false;
    for (const l of this.dimLabels) l.remove();
    this.dimLabels = [];
  }

  prepare(p) {
    this.clearBuild();
    const v = p.visual;
    const dims = this.dimsOf(p);
    if (!dims) return;
    const { w, d, h, s } = dims;
    const m = new THREE.Matrix4();
    this.place(m, 0, (h * s) / 2 + 0.02, 0, w * s, h * s, d * s);
    this.ghost.matrix.copy(m);
    this.ghost.matrixAutoUpdate = false;
    this.ghost.visible = true;
    const unit = v?.unit ?? '';
    const lab = (txt, lx, ly, lz) => {
      const pos = this.place(new THREE.Matrix4(), lx, ly, lz, 1, 1, 1);
      this.dimLabels.push(G.labels.add(`<span>${txt}</span>`, { cls: 'dim-label', pos, offsetY: 0, maxDist: 40 }));
    };
    if (v?.kind === 'rect') {
      lab(`${v.w} ${unit}`, 0, 0.3, (d * s) / 2 + 0.6);
      lab(`${v.h} ${typeof v.h === 'number' ? unit : ''}`, (w * s) / 2 + 0.8, 0.3, 0);
    } else if (v?.kind === 'box3d') {
      lab(`${v.l} ${unit}`, 0, 0.3, (d * s) / 2 + 0.6);
      lab(`${v.w} ${unit}`, (w * s) / 2 + 0.8, 0.3, 0);
      lab(`${v.h} ${typeof v.h === 'number' ? unit : ''}`, (w * s) / 2 + 0.6, h * s, (d * s) / 2);
    } else if (v?.kind === 'boxes') {
      lab(`${v.a.l} ${unit}`, (-w / 2 + v.a.l / 2) * s, 0.3, (d * s) / 2 + 0.6);
      lab(`${v.b.l} ${unit}`, (-w / 2 + v.a.l + v.b.l / 2) * s, 0.3, (d * s) / 2 + 0.6);
      lab(`${v.w} ${unit}`, (w * s) / 2 + 0.8, 0.3, 0);
    }
  }

  dimsOf(p) {
    const v = p.visual;
    if (!v) return null;
    if (v.kind === 'rect') {
      const w = v.w, d = typeof v.h === 'number' ? v.h : p.answer.value.value;
      const s = Math.min(5.8 / w, 5.8 / d);
      return { w, d, h: 1, s: Math.min(s, 1.2), flat: true, perimeter: p.skill === 'perimeter' };
    }
    if (v.kind === 'lshape') {
      const s = Math.min(5.8 / v.W, 5.8 / v.H);
      return { w: v.W, d: v.H, h: 1, s, flat: true, cut: { w: v.cw, d: v.ch } };
    }
    if (v.kind === 'box3d') {
      const w = v.l, d = v.w, h = typeof v.h === 'number' ? v.h : p.answer.value.value;
      const s = Math.min(5.8 / w, 5.8 / d, 6 / h, 1.1);
      return { w, d, h, s };
    }
    if (v.kind === 'boxes') {
      // Two boxes side by side; when box B's height is the question, the answer is that height.
      const hb = v.b.label ? p.answer.value.value : v.b.h;
      const w = v.a.l + v.b.l, d = v.w, h = Math.max(v.a.h, hb);
      const s = Math.min(5.8 / w, 5.8 / d, 6 / h, 1.1);
      return { w, d, h, s, steps: [{ x0: 0, l: v.a.l, h: v.a.h }, { x0: v.a.l, l: v.b.l, h: hb }] };
    }
    return null;
  }

  build(p) {
    if (this.attempts === 0) this.firstTries += 1;
    const dims = this.dimsOf(p);
    this.ghost.visible = false;
    if (!dims) { this.sculpt(); return; }
    const { w, d, h, s, flat, perimeter, cut, steps } = dims;
    const cells = [];
    if (steps) {
      for (const st of steps) for (let k = 0; k < st.h; k++) for (let j = 0; j < d; j++) for (let i = st.x0; i < st.x0 + st.l; i++) cells.push([i, j, k, 0.94, 0.94]);
    } else if (perimeter) {
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
        if (i === 0 || j === 0 || i === w - 1 || j === d - 1) cells.push([i, j, 0, 0.35, 2.2]);
      }
    } else if (flat) {
      for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
        if (cut && i >= w - cut.w && j < cut.d) continue;
        cells.push([i, j, 0, 0.94, 0.28]);
      }
    } else {
      for (let k = 0; k < h; k++) for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) cells.push([i, j, k, 0.94, 0.94]);
    }
    this.queue = cells.slice(0, MAX).map(([i, j, k, sxz, sy]) => ({ lx: (i + 0.5 - w / 2) * s, lz: (j + 0.5 - d / 2) * s, ly: k * s + (sy * s) / 2, sxz: sxz * s, sy: sy * s }));
    this.cubes.count = 0;
    this.buildRate = Math.max(12, this.queue.length / 0.9);
  }

  sculpt() {
    const pad = this.pad;
    const m = A.sculpt(Math.floor(Math.random() * 1000));
    m.position.set(pad.x + (Math.random() - 0.5) * 2, pad.y, pad.z + (Math.random() - 0.5) * 2);
    m.scale.setScalar(0.01);
    m.userData.grow = 0;
    G.scene.add(m);
    this.statues.push(m);
    G.audio.play('build');
  }

  wrapUp() {
    if (this.sculpture) {
      const n = this.o.count;
      const medal = this.firstTries >= n ? 'gold' : this.firstTries >= n - 1 ? 'silver' : 'bronze';
      const res = awardMedal('architect:sculpt', medal, -this.firstTries);
      G.toasts.showBanner('The judges have decided!', `${medal[0].toUpperCase() + medal.slice(1)} ribbon: ${this.firstTries} of ${n} perfect builds${res.first ? ` · +${res.coins}` : ''}`, A.color, 4200);
    }
    this.onDoneGame?.();
  }

  update(dt) {
    if (this.queue.length) {
      this.buildT += dt * this.buildRate;
      const m = new THREE.Matrix4();
      while (this.buildT >= 1 && this.queue.length) {
        this.buildT -= 1;
        const c = this.queue.shift();
        this.place(m, c.lx, c.ly, c.lz, c.sxz, c.sy, c.sxz);
        this.cubes.setMatrixAt(this.cubes.count, m);
        this.cubes.count += 1;
        if (this.cubes.count % 3 === 0) G.audio.play('build');
      }
      this.cubes.instanceMatrix.needsUpdate = true;
    }
    for (const st of this.statues) {
      if (st.userData.grow < 1) {
        st.userData.grow = Math.min(1, st.userData.grow + dt * 1.5);
        st.scale.setScalar(0.01 + st.userData.grow * 0.9);
      }
      st.rotation.y += dt * 0.4;
    }
  }

  exit() {
    super.exit();
    this.clearBuild();
    G.scene.remove(this.cubes, this.ghost);
    for (const st of this.statues) G.scene.remove(st);
  }
}

export function startArchitect(params, onDone) {
  pushActivity(new ArchitectActivity(params, onDone));
}
