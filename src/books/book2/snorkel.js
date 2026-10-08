// The Snorkel Trail: rows of ring buoys bob up along a loop through the coral lagoon, one row per fraction
// puzzle. Swim through the ring with the right answer and reef fish join you; the wrong ring pops and the
// current carries you back to try again. The school follows you to the vent on the reef and stays there.
import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../../core/state.js';
import { Round } from '../../game/minigames/common.js';
import { toHTML } from '../../math/fmt.js';
import { mergeColored, mat } from '../../core/geo.js';
import { lambert } from '../../core/materials.js';
import { FishSchool } from '../../actors/school.js';
import { LOC, CRYSTALS, WATER_Y } from './layout.js';

const RING = 1.45;
const LANE = 4.4;
const ROWS = [12, 26, 40, 54, 68, 82];
const UP = WATER_Y + 0.35;
const DOWN = WATER_Y - 2.4;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

let ringGeo = null;
function ringGeometry() {
  if (!ringGeo) {
    // A lifebuoy: eight arcs, red and white.
    const parts = [];
    for (let k = 0; k < 8; k++) parts.push({ geo: new THREE.TorusGeometry(RING, 0.22, 8, 6, Math.PI / 4), color: k % 2 ? 0xfff6ea : 0xff5a4e, matrix: mat(0, 0, 0, 0, 0, (k * Math.PI) / 4) });
    ringGeo = mergeColored(parts);
  }
  return ringGeo;
}

let curve = null;
function trail() {
  if (!curve) curve = new THREE.CatmullRomCurve3(LOC.snorkelTrail.map(([x, z]) => V(x, 0, z)), false, 'centripetal');
  return curve;
}
// Where along the trail a row sits: its centre, its forward direction and its sideways direction.
function frame(s) {
  const c = trail(), u = Math.min(1, s / c.getLength());
  const p = c.getPointAt(u), t = c.getTangentAt(u);
  const l = Math.hypot(t.x, t.z) || 1;
  return { x: p.x, z: p.z, tx: t.x / l, tz: t.z / l, nx: -t.z / l, nz: t.x / l };
}

export const TRAIL = { ROWS, LANE, RING, frame };

// After the trail, the fish that followed you circle the reef vent for good.
let reefSchool = null;
export function buildReefSchool() {
  if (reefSchool) return;
  const vent = CRYSTALS.grove;
  reefSchool = new FishSchool(G.scene, 18);
  reefSchool.add(V(vent.x, 0, vent.z - 6), 18);
  reefSchool.circle({ x: vent.x - 2, z: vent.z + 7 });
  G.world.animated.push((dt, t) => reefSchool.update(dt, t));
}

class SnorkelActivity {
  constructor(onDone) {
    this.onDone = onDone;
    this.row = 0;
    this.gates = [];
    this.t = 0;
    this.backT = 0;
    this.prevAlong = null;
  }

  enter() {
    const f = frame(0);
    this.safe = { x: f.x, z: f.z, yaw: Math.atan2(f.tx, f.tz) };
    G.player.teleport(f.x, f.z, this.safe.yaw);
    G.cam.snap(G.player);
    G.audio.setMood('quiz');
    G.hud.setVisible(true);
    this.school = new FishSchool(G.scene, ROWS.length * 3);
    this.school.follow(G.player);
    const panel = G.quiz;
    panel.open({ title: 'Snorkel Trail', subtitle: 'Swim through the right ring. Hold Shift to swim faster!', color: '#2ec4b6', layout: 'top', readAloud: G.save.data.settings.readAloud });
    panel.handlers = {
      onHint: () => { if (this.round && !this.round.over) { this.round.hint(); G.audio.play('hint'); panel.showHint(this.round.p); } },
      onContinue: () => { panel.feedback.innerHTML = ''; panel.steps.classList.add('hidden'); panel.contBtn.classList.add('hidden'); },
      onClose: () => this.quit(),
    };
    panel.setProgress(0, ROWS.length);
    this.spawnRow();
  }

  spawnRow() {
    const p = G.tutor.next('grove', { format: 'choice', minChoices: 3 });
    const correct = p.choices.findIndex((c) => c.correct);
    let idx = p.choices.map((_, i) => i).filter((i) => i !== correct).slice(0, 2);
    idx.push(correct);
    idx = idx.sort(() => Math.random() - 0.5);
    this.round = new Round(p);
    this.dir = frame(ROWS[this.row]);
    this.prevAlong = null;
    const F = this.dir;
    idx.forEach((ci, k) => {
      const off = (k - 1) * LANE;
      const x = F.x + F.nx * off, z = F.z + F.nz * off;
      const mesh = new THREE.Mesh(ringGeometry(), lambert({ vertexColors: true, emissive: 0x000000 }));
      mesh.position.set(x, DOWN, z);
      mesh.rotation.y = Math.atan2(F.tx, F.tz);
      mesh.castShadow = true;
      G.scene.add(mesh);
      const label = G.labels.add(`<span>${toHTML(p.choices[ci].label)}</span>`, { cls: 'floe-label ring-label', pos: V(x, UP + RING, z), offsetY: 0.9, maxDist: 80, clear: true });
      this.gates.push({ mesh, x, z, off, ci, correct: p.choices[ci].correct, label, rise: 0, row: this.row, spin: 0 });
      G.world.effects.splash(V(x, 0, z), 0.7);
    });
    G.audio.play('splash');
    G.quiz.showProblem(p, { format: 'none' });
    G.player.objective = V(F.x, 0, F.z);
  }

  // Which ring the swimmer passed through, judged where they crossed the row's line.
  crossed(lat) {
    let best = null;
    for (const g of this.gates) if (g.row === this.row && !g.popped && Math.abs(lat - g.off) < RING + 0.5) best = g;
    return best;
  }

  through(g) {
    if (g.correct) {
      const r = this.round.over ? { outcome: 'after' } : this.round.submit({ choice: g.ci });
      if (r.outcome === 'correct') {
        G.audio.play('correct');
        G.quiz.showCorrect(`<span class="coin-pop">+${r.coins}</span>`);
      } else {
        G.audio.play('chime');
      }
      g.mesh.material.emissive.set(0x1a6a5a);
      g.spin = 1;
      g.label.remove();
      g.label = null;
      G.world.effects.burst(V(g.x, UP, g.z), { count: 30, color: [0x7fe0d0, 0xffffff, 0xffd23d], speed: 4, up: 4, life: 1.1, gravity: 4, size: 0.45 });
      this.school.add(V(g.x, 0, g.z), 3);
      G.toasts.toast(this.row === 0 ? 'Reef fish are following you!' : `${this.school.fish.length} fish in your school!`, { kind: 'teal', ms: 1500 });
      const F = this.dir;
      this.safe = { x: F.x + F.tx * 3, z: F.z + F.tz * 3, yaw: Math.atan2(F.tx, F.tz) };
      for (const o of this.gates) if (o !== g && o.row === this.row) this.pop(o);
      this.row += 1;
      G.quiz.setProgress(this.row, ROWS.length);
      if (this.row < ROWS.length) setTimeout(() => { if (G.top === this) this.spawnRow(); }, 600);
      else {
        G.quiz.q.innerHTML = 'Lead your school to the vent on the reef!';
        G.quiz.visual.classList.add('hidden');
        G.player.objective = V(CRYSTALS.grove.x, 0, CRYSTALS.grove.z);
      }
    } else if (!g.popped) {
      const r = this.round.over ? { outcome: 'after' } : this.round.submit({ choice: g.ci });
      G.audio.play('bubble');
      G.audio.play('wrong');
      this.pop(g);
      if (r.outcome === 'hint') {
        G.quiz.showWrong({ why: r.why, message: 'Pop! Wrong ring. The current carries you back.' });
        G.quiz.showHint(this.round.p);
      } else if (r.outcome === 'reveal') {
        G.quiz.showReveal(this.round.p, 'Here is how to solve it. Then swim through the right ring!');
        for (const o of this.gates) if (o.correct && o.row === this.row) o.label?.setClass('right', true);
      }
      this.backT = 0.7;
    }
  }

  pop(g) {
    g.popped = true;
    g.label?.remove();
    g.label = null;
    G.world.effects.burst(V(g.x, UP, g.z), { count: 18, color: [0xdff8ff, 0xffffff], speed: 2.5, up: 3, life: 0.9, gravity: -1, size: 0.35, drag: 2 });
  }

  clearGates() {
    for (const g of this.gates) { G.scene.remove(g.mesh); g.mesh.material.dispose(); g.label?.remove(); }
    this.gates = [];
  }

  finish() {
    G.save.data.flags.reefFish = true;
    G.world.effects.sparkle(V(CRYSTALS.grove.x, 1, CRYSTALS.grove.z), 0x7fe0d0, 50);
    popActivity(this);
    buildReefSchool();
    this.onDone?.();
  }

  quit() {
    popActivity(this);
    G.player.teleport(LOC.snorkelStart.x, LOC.snorkelStart.z, -Math.PI / 2);
    G.cam.snap(G.player);
  }

  onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); this.quit(); return; }
    if (e.key === 'h' || e.key === 'H') G.quiz.handlers.onHint();
    if (G.quiz.state === 'reveal' && e.key === 'Enter') G.quiz.handlers.onContinue();
  }

  update(dt, isTop) {
    this.t += dt;
    G.player.frozen = !isTop;
    for (const g of this.gates) {
      if (g.popped) {
        g.mesh.scale.multiplyScalar(Math.max(0, 1 - dt * 5));
        g.mesh.visible = g.mesh.scale.x > 0.05;
        continue;
      }
      if (g.rise < 1) g.rise = Math.min(1, g.rise + dt * 1.6);
      const bob = Math.sin(this.t * 1.6 + g.x) * 0.06;
      g.mesh.position.y = DOWN + (UP - DOWN) * (1 - Math.pow(1 - g.rise, 3)) + bob;
      if (g.spin > 0) { g.spin = Math.max(0, g.spin - dt * 0.8); g.mesh.rotateZ(dt * 8 * g.spin); }
      g.label?.setPos(V(g.x, g.mesh.position.y + RING, g.z));
    }
    this.school.update(dt, this.t);
    if (!isTop) return;
    const pl = G.player;
    if (this.backT > 0) {
      this.backT -= dt;
      if (this.backT <= 0) {
        const F = this.dir;
        pl.teleport(F.x - F.tx * 4.5, F.z - F.tz * 4.5, Math.atan2(F.tx, F.tz), WATER_Y - 0.4);
        G.cam.snap(pl);
        this.prevAlong = null;
      }
      return;
    }
    if (this.row < ROWS.length) {
      const F = this.dir;
      const dx = pl.pos.x - F.x, dz = pl.pos.z - F.z;
      const along = dx * F.tx + dz * F.tz, lat = dx * F.nx + dz * F.nz;
      if (this.prevAlong !== null && this.prevAlong < 0 && along >= 0 && Math.abs(lat) < LANE + RING + 1) {
        const g = this.crossed(lat);
        if (g && g.rise >= 0.6) this.through(g);
      }
      this.prevAlong = along;
    } else {
      const v = CRYSTALS.grove;
      if (Math.hypot(pl.pos.x - v.x, pl.pos.z - v.z) < 7) this.finish();
    }
  }

  exit() {
    G.quiz.close();
    this.clearGates();
    this.school.dispose();
  }
}

export function startSnorkel(params, onDone) {
  pushActivity(new SnorkelActivity(onDone));
}
