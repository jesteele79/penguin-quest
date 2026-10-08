// Floe Hop: rows of floating ice rise from the lake. Jump onto the floe with the right answer.
import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../../core/state.js';
import { Round, V } from './common.js';
import { toHTML } from '../../math/fmt.js';
import { LOC, WATER_Y } from '../../world/layout.js';
import { mergeColored, mat } from '../../core/geo.js';
import { lambert } from '../../core/materials.js';
import { damp } from '../../core/mathutil.js';

const R = 2.3;
let floeGeo = null;
function floeGeometry() {
  if (!floeGeo) {
    floeGeo = mergeColored([
      { geo: new THREE.CylinderGeometry(R, R * 1.06, 0.7, 7), color: 0xa9d4f2 },
      { geo: new THREE.CylinderGeometry(R * 0.97, R, 0.1, 7), color: 0xf4faff, matrix: mat(0, 0.38, 0) },
    ]);
  }
  return floeGeo;
}

function makeFloe(x, z, y = WATER_Y + 0.05) {
  const m = new THREE.Mesh(floeGeometry(), lambert({ vertexColors: true, emissive: 0x000000 }));
  m.position.set(x, y, z);
  m.receiveShadow = true;
  m.castShadow = true;
  G.scene.add(m);
  const platform = G.world.collision.addPlatform({ kind: 'circle', x, z, r: R, top: y + 0.43 });
  return { mesh: m, platform };
}

// The finished path stays as a bridge.
export function buildFloeBridge(xs) {
  if (!xs?.length || buildFloeBridge.done) return;
  buildFloeBridge.done = true;
  LOC.floeRows.forEach((z, i) => {
    const f = makeFloe(xs[i] ?? 0, z);
    G.world.animated.push((dt, t) => {
      f.mesh.position.y = WATER_Y + 0.05 + Math.sin(t * 1.3 + i) * 0.05;
      f.platform.top = f.mesh.position.y + 0.43;
    });
  });
}

class FloeHopActivity {
  constructor(onDone) {
    this.onDone = onDone;
    this.row = 0;
    this.floes = [];
    this.kept = [];
    this.pathX = 0;
    this.t = 0;
    this.respawnT = 0;
    this.xs = [];
  }

  enter() {
    const j = G.world.ctx.launch;
    this.safe = V(j.waterEnd.x, j.top, j.waterEnd.z + 1.2);
    G.player.teleport(this.safe.x, this.safe.z, Math.PI, j.top);
    G.cam.snap(G.player);
    G.audio.setMood('quiz');
    G.hud.setVisible(true);
    const panel = G.quiz;
    panel.open({ title: 'Floe Hop', subtitle: 'Jump onto the floe with the right answer. Space to jump!', color: '#4dffa0', layout: 'top', readAloud: G.save.data.settings.readAloud });
    panel.handlers = {
      onHint: () => { if (this.round && !this.round.over) { this.round.hint(); G.audio.play('hint'); panel.showHint(this.round.p); } },
      onContinue: () => { panel.feedback.innerHTML = ''; panel.steps.classList.add('hidden'); panel.contBtn.classList.add('hidden'); },
      onClose: () => this.quit(),
    };
    panel.setProgress(0, LOC.floeRows.length);
    // Steer toward the floe the player is heading for (judged from where the jump would land),
    // not simply the closest one, which is often a neighbour on the way.
    G.player.airAssist = (x, z, vx = 0, vz = 0) => {
      if (this.row >= LOC.floeRows.length) {
        const I = LOC.island;
        const shore = { x: I.x + (x - I.x) * 0.3, z: I.z + I.r * 0.6 };
        return Math.hypot(shore.x - x, shore.z - z) < 9 ? shore : null;
      }
      const px = x + vx * 0.35, pz = z + vz * 0.35;
      let best = null, bd = 4.2;
      for (const f of this.floes) {
        if (f.sinking || f.row !== this.row) continue;
        const d = Math.hypot(f.x - px, f.z - pz);
        if (d < bd) { bd = d; best = f; }
      }
      return best ? { x: best.x, z: best.z } : null;
    };
    this.spawnRow();
  }

  spawnRow() {
    const p = G.tutor.next('lake', { format: 'choice', minChoices: 3 });
    const correct = p.choices.findIndex((c) => c.correct);
    let idx = p.choices.map((_, i) => i).filter((i) => i !== correct).slice(0, 2);
    idx.push(correct);
    idx = idx.sort(() => Math.random() - 0.5);
    this.round = new Round(p);
    const limit = [4, 3.5, 3, 2, 1][this.row] ?? 1;
    const cx = Math.max(-limit, Math.min(limit, this.pathX));
    const z = LOC.floeRows[this.row];
    idx.forEach((ci, k) => {
      // Wider than a floe (2R) so neighbours never touch and a landing is never ambiguous.
      const x = cx + (k - 1) * 5.2;
      const f = makeFloe(x, z, WATER_Y - 1.4);
      f.platform.active = false;
      const label = G.labels.add(`<span>${toHTML(p.choices[ci].label)}</span>`, { cls: 'floe-label', pos: V(x, WATER_Y, z), offsetY: 1.6, maxDist: 70, clear: true });
      this.floes.push({ ...f, x, z, ci, correct: p.choices[ci].correct, label, rise: 0, crack: 0, sinking: false, row: this.row });
    });
    G.audio.play('splash');
    for (const f of this.floes) G.world.effects.splash(V(f.x, 0, f.z), 0.6);
    G.quiz.showProblem(p, { format: 'none' });
  }

  landedOn(f) {
    if (f.correct) {
      const r = this.round.over ? { outcome: 'after' } : this.round.submit({ choice: f.ci });
      if (r.outcome === 'correct') {
        G.audio.play('correct');
        G.quiz.showCorrect(`<span class="coin-pop">+${r.coins}</span>`);
      } else {
        G.audio.play('chime');
      }
      f.mesh.material.emissive.set(0x1a7a4a);
      f.label.remove();
      this.safe = V(f.x, f.platform.top, f.z);
      this.pathX = f.x;
      this.xs[this.row] = f.x;
      for (const o of this.floes) if (o !== f && o.row === this.row) this.sink(o, 0.4);
      this.kept.push(f);
      // The others stay in the list until they finish sinking, or they would hang in the air with no collision.
      this.floes = this.floes.filter((o) => o !== f);
      this.row += 1;
      G.quiz.setProgress(this.row, LOC.floeRows.length);
      if (this.row < LOC.floeRows.length) setTimeout(() => { if (G.top === this) this.spawnRow(); }, 700);
      else {
        G.quiz.q.innerHTML = 'Jump onto Shimmer Isle!';
        G.quiz.visual.classList.add('hidden');
      }
    } else if (!f.cracking) {
      f.cracking = true;
      const r = this.round.over ? { outcome: 'after' } : this.round.submit({ choice: f.ci });
      G.audio.play('crack');
      G.audio.play('wrong');
      if (r.outcome === 'hint') {
        G.quiz.showWrong({ why: r.why, message: 'Crack! That floe was the wrong answer.' });
        G.quiz.showHint(this.round.p);
      } else if (r.outcome === 'reveal') {
        G.quiz.showReveal(this.round.p, 'Here is how to solve it. Then jump onto the right floe!');
        for (const o of this.floes) if (o.correct && o.row === this.row) o.label.setClass('right', true);
      }
      setTimeout(() => this.sink(f, 0), 450);
    }
  }

  sink(f, delay) {
    setTimeout(() => {
      f.sinking = true;
      f.platform.active = false;
      f.label?.remove();
    }, delay * 1000);
  }

  finish() {
    G.save.data.flags.floeBridge = this.xs.map((x) => Math.round(x * 10) / 10);
    for (const f of this.kept) { G.scene.remove(f.mesh); G.world.collision.removePlatform(f.platform); }
    this.kept = [];
    buildFloeBridge(G.save.data.flags.floeBridge);
    popActivity(this);
    this.onDone?.();
  }

  quit() {
    for (const f of [...this.floes, ...this.kept]) { G.scene.remove(f.mesh); G.world.collision.removePlatform(f.platform); f.label?.remove(); }
    this.floes = []; this.kept = [];
    const j = G.world.ctx.launch;
    popActivity(this);
    G.player.teleport(j.waterEnd.x, j.waterEnd.z + 2, Math.PI, j.top);
    G.cam.snap(G.player);
  }

  onKey(e, inField) {
    if (e.key === 'Escape') { e.preventDefault(); this.quit(); return; }
    if (e.key === 'h' || e.key === 'H') G.quiz.handlers.onHint();
    if (G.quiz.state === 'reveal' && e.key === 'Enter') G.quiz.handlers.onContinue();
  }

  update(dt, isTop) {
    this.t += dt;
    G.player.frozen = !isTop;
    for (const f of [...this.floes, ...this.kept]) {
      if (f.sinking) {
        f.mesh.position.y -= dt * 2.2;
        f.mesh.rotation.z += dt * 0.4;
        if (f.mesh.position.y < -4) { G.scene.remove(f.mesh); G.world.collision.removePlatform(f.platform); f.gone = true; }
        continue;
      }
      if (f.rise < 1) {
        f.rise = Math.min(1, f.rise + dt * 1.5);
        f.mesh.position.y = WATER_Y - 1.4 + (1.45 * (1 - Math.pow(1 - f.rise, 3)));
        if (f.rise >= 1) f.platform.active = true;
      } else {
        f.mesh.position.y = WATER_Y + 0.05 + Math.sin(this.t * 1.5 + f.x) * 0.05;
      }
      if (f.cracking) f.mesh.position.x = f.x + Math.sin(this.t * 60) * 0.06;
      f.platform.top = f.mesh.position.y + 0.43;
      f.label?.setPos(V(f.x, f.mesh.position.y, f.z));
    }
    this.floes = this.floes.filter((f) => !f.gone);
    if (!isTop) return;
    const pl = G.player;
    if (this.respawnT > 0) {
      this.respawnT -= dt;
      if (this.respawnT <= 0) {
        pl.teleport(this.safe.x, this.safe.z, Math.PI, this.safe.y);
        G.cam.snap(pl);
      }
      return;
    }
    if (pl.swimming) { G.world.effects.splash(pl.pos, 1); G.audio.play('splash'); this.respawnT = 0.9; return; }
    if (pl.grounded && pl.platform) {
      const f = this.floes.find((o) => o.platform === pl.platform && o.row === this.row && !o.sinking);
      if (f) this.landedOn(f);
    }
    if (this.row >= LOC.floeRows.length && pl.grounded && !pl.platform) {
      const I = LOC.island;
      if (Math.hypot(pl.pos.x - I.x, pl.pos.z - I.z) < 10 && pl.pos.y > 0.1) this.finish();
    }
  }

  exit() {
    G.quiz.close();
    G.player.airAssist = null;
    for (const f of this.floes) f.label?.remove();
  }
}

export function startFloeHop(params, onDone) {
  pushActivity(new FloeHopActivity(onDone));
}
