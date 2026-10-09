// Cheer-Up Battle (Glooms on Gloom Ridge, Sootlings at the lighthouse): they waddle in with puzzles. Type the
// answer to send them light and warmth.
import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../../core/state.js';
import { Round, V } from './common.js';
import { Gloom } from '../../actors/gloom.js';
import { toHTML } from '../../math/fmt.js';
import { LOC } from '../../world/layout.js';
import { BOOK } from '../../books/current.js';
import { T } from '../../books/terms.js';

// Every zap is the same thin open tube, stretched from the penguin to its Gloom.
const BEAM = new THREE.CylinderGeometry(0.18, 0.18, 1, 10, 1, true);

const WAVES = [3, 4, 5];
const SPAWN_R = 13.5;

class BattleActivity {
  constructor(onDone) {
    this.onDone = onDone;
    this.wave = 0;
    this.glooms = [];
    this.beams = [];
    this.target = null;
    this.state = 'start';
    this.maxHearts = 3;
    this.hearts = 3;
  }

  enter() {
    const A = LOC.arena;
    this.center = V(A.x, G.terrain.heightAt(A.x, A.z), A.z);
    G.player.teleport(A.x, A.z, Math.PI);
    G.player.frozen = true;
    G.audio.setMood('battle');
    G.hearts = { now: this.hearts, max: this.maxHearts };
    G.cam.setShot({ pos: this.center.clone().add(V(0, 8, 12)), look: this.center.clone().add(V(0, 3.2, -10)), fov: 58 }, 1.2);
    const panel = G.quiz;
    panel.open({ title: 'Cheer-Up Battle', subtitle: `Type the answer for the glowing ${T.gloom}, then press Enter`, color: T.gloomColor, layout: 'top', readAloud: G.save.data.settings.readAloud });
    panel.handlers = {
      onSubmit: (r) => this.submit(r),
      onHint: () => { if (this.target && !this.target.round.over) { this.target.round.hint(); G.audio.play('hint'); panel.showHint(this.target.round.p); } },
      onContinue: () => this.afterReveal(),
      onClose: () => this.quit(),
    };
    this.startWave();
  }

  startWave() {
    const n = WAVES[this.wave];
    G.quiz.setProgress(this.wave, WAVES.length);
    G.toasts.showBanner(`Wave ${this.wave + 1} of ${WAVES.length}`, `${n} grumpy ${T.glooms} incoming!`, T.gloomColor, 2200, { replace: true });
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42;
      const x = this.center.x + Math.cos(a) * SPAWN_R, z = this.center.z + Math.sin(a) * SPAWN_R;
      const g = new Gloom(G.scene, { scale: 0.95, ...BOOK.gloomLook });
      g.position.set(x, G.terrain.heightAt(x, z), z);
      const p = G.tutor.next(Math.random() < 0.25 ? 'lake' : 'ridge', { format: 'input' });
      const label = G.labels.add('<span>?</span>', { cls: 'gloom-label', pos: g.position, offsetY: 3.1, maxDist: 60, clear: true });
      this.glooms.push({ g, round: new Round(p), label, html: `<span>${toHTML(p.text)}</span>`, delay: 1 + i * 2.2, done: false });
    }
    this.state = 'fight';
    this.pickTarget();
  }

  pickTarget() {
    const alive = this.glooms.filter((x) => !x.done);
    if (!alive.length) { this.target = null; return; }
    alive.sort((a, b) => a.g.position.distanceTo(this.center) - b.g.position.distanceTo(this.center));
    this.target = alive[0];
    // Only the Gloom being answered carries its question; the rest wait with a "?" so the labels never pile up.
    for (const x of this.glooms) {
      if (x.done) continue;
      x.label.setClass('target', x === this.target);
      x.label.set(x === this.target ? x.html : '<span>?</span>');
    }
    G.quiz.showProblem(this.target.round.p, { format: 'input', showSkill: false });
  }

  submit(resp) {
    const t = this.target;
    if (!t || this.state !== 'fight') return;
    const r = t.round.submit(resp);
    if (r.outcome === 'form') { G.audio.play('hint'); G.quiz.showForm(r.message); return; }
    if (r.outcome === 'correct') {
      G.audio.play('zap');
      G.audio.play('correct');
      this.zap(t, T.gloomHex);
      G.quiz.showCorrect(`<span class="coin-pop">+${r.coins}</span>`);
      setTimeout(() => this.cheer(t), 250);
      return;
    }
    G.audio.play('wrong');
    t.g.bump();
    if (r.outcome === 'hint') {
      G.quiz.showWrong({ why: r.why, message: `The ${T.gloom} grumbles. Try again!` });
      G.quiz.showHint(t.round.p);
    } else {
      this.state = 'reveal';
      G.quiz.showReveal(t.round.p, `Here's how to solve it. Then press Enter to cheer this ${T.gloom} up!`);
    }
  }

  afterReveal() {
    if (this.state !== 'reveal') return;
    this.state = 'fight';
    this.zap(this.target, 0x9fe8ff);
    G.audio.play('zap');
    this.cheer(this.target);
  }

  cheer(t) {
    if (t.done) return;
    t.done = true;
    t.g.cheerUp();
    t.label.remove();
    G.audio.play('cheer');
    G.world.effects.sparkle(t.g.position.clone().add(V(0, 1.2, 0)), 0xff78d2, 40);
    setTimeout(() => t.g.ascend(), 1200);
    if (this.glooms.every((x) => x.done)) {
      this.target = null;
      this.wave += 1;
      if (this.wave >= WAVES.length) {
        this.state = 'won';
        G.quiz.setProgress(WAVES.length, WAVES.length);
        setTimeout(() => this.finish(), 2200);
      } else {
        this.state = 'between';
        G.audio.play('fanfare');
        setTimeout(() => { if (G.top === this) { this.cleanupGlooms(); this.startWave(); } }, 2600);
      }
    } else {
      setTimeout(() => { if (G.top === this && this.state === 'fight') this.pickTarget(); }, 600);
    }
  }

  zap(t, color) {
    const from = G.player.pos.clone().add(V(0, 1.8, 0));
    const to = t.g.position.clone().add(V(0, 1.1, 0));
    const d = to.clone().sub(from);
    const m = new THREE.Mesh(BEAM, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.copy(from).addScaledVector(d, 0.5);
    m.scale.set(1, d.length(), 1);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    G.scene.add(m);
    this.beams.push({ m, life: 0.5 });
    G.player.celebrate(0.6);
  }

  hit(t) {
    // Two Glooms can arrive in the same frame; only the first may end the wave.
    if (this.state !== 'fight') return;
    this.hearts -= 1;
    G.hearts = { now: this.hearts, max: this.maxHearts };
    G.audio.play('hurt');
    G.cam.addShake(0.8);
    G.toasts.screenFlash(T.hurtFlash, 0.35);
    const back = t.g.position.clone().sub(this.center).setY(0).setLength(9);
    t.g.position.set(this.center.x + back.x, t.g.position.y, this.center.z + back.z);
    if (this.hearts <= 0) {
      this.state = 'between';
      G.toasts.showBanner('Brrr! Too chilly!', "Let's warm up and try this wave again", '#9fb3ff', 2600, { replace: true });
      setTimeout(() => {
        if (G.top !== this) return;
        this.cleanupGlooms();
        this.hearts = this.maxHearts;
        G.hearts = { now: this.hearts, max: this.maxHearts };
        this.startWave();
      }, 2600);
    }
  }

  cleanupGlooms() {
    for (const x of this.glooms) { x.label.remove(); x.g.dispose(); }
    this.glooms = [];
  }

  finish() {
    popActivity(this);
    this.onDone?.();
  }

  quit() { popActivity(this); }

  onKey(e, inField) { G.quiz.handleKey(e, inField); }

  update(dt) {
    const gentle = G.save.data.settings.gentle;
    const moving = this.state === 'fight';
    for (const x of this.glooms) {
      if (!x.done && moving) {
        x.delay -= dt;
        if (x.delay <= 0) {
          const to = this.center.clone().sub(x.g.position).setY(0);
          const dist = to.length();
          const stopAt = gentle ? 3.2 : 1.6;
          if (dist > stopAt) {
            const speed = 0.34 + this.wave * 0.04;
            x.g.position.addScaledVector(to.normalize(), speed * dt);
            x.g.position.y = G.terrain.heightAt(x.g.position.x, x.g.position.z);
          } else if (!gentle) {
            this.hit(x);
          }
        }
      }
      x.g.update(dt, G.player.pos);
      if (!x.done) x.label.setPos(x.g.position);
    }
    for (const b of this.beams) {
      b.life -= dt;
      b.m.material.opacity = Math.max(0, b.life * 1.8);
      if (b.life <= 0) this.dropBeam(b);
    }
    this.beams = this.beams.filter((b) => b.life > 0);
  }

  dropBeam(b) { G.scene.remove(b.m); b.m.material.dispose(); }

  exit() {
    G.quiz.close();
    G.cam.release(1.0);
    this.cleanupGlooms();
    // A beam still fading when the battle ends would otherwise hang in the air.
    this.beams.forEach((b) => this.dropBeam(b));
    this.beams = [];
    G.hearts = null;
  }
}

export function startBattle(params, onDone) {
  pushActivity(new BattleActivity(onDone));
}
