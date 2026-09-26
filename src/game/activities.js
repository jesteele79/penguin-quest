import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../core/state.js';
import { checkAnswer } from '../math/check.js';

// ---------------------------------------------------------------- Explore
export class ExploreActivity {
  enter() {
    G.hud.setVisible(true);
    G.audio.setMood(G.save.data.finale ? 'finale' : 'explore');
  }

  onUncover() {
    G.hud.setVisible(true);
    G.audio.setMood(G.save.data.finale ? 'finale' : 'explore');
  }

  update(dt, isTop) {
    G.player.frozen = !isTop;
    if (!isTop) { G.hud.setPrompt(null); return; }
    const p = G.player.pos;
    const near = G.interactions.nearest(p.x, p.z, G.player.yaw);
    G.hud.setPrompt(near ? near.label : null);
    const inp = G.input;
    if (near && inp.pressed('KeyE', 'Enter', 'NumpadEnter')) {
      inp.consume('KeyE', 'Enter', 'NumpadEnter');
      G.audio.play('click');
      near.item.action();
      return;
    }
    if (inp.pressed('KeyM')) { G.screens.map(); return; }
    if (inp.pressed('KeyJ')) { G.screens.journal(); return; }
    if (inp.pressed('Escape', 'KeyP')) { G.screens.pause(); return; }
    if (inp.pressed('KeyG')) {
      const s = G.save.data.settings;
      s.showTrail = !s.showTrail;
      G.toasts.toast(s.showTrail ? 'Golden guide trail on' : 'Golden guide trail off');
    }
    if (inp.pressed('KeyC')) G.hud.showControls(G.hud.controls.classList.contains('hidden'));
  }
}

// ---------------------------------------------------------------- Dialog
// lines: [{ who, text, portrait, pitch, accent }] ; npc: NPC record from NPCManager to face/animate.
export class DialogActivity {
  constructor(lines, { onDone, npc = null, shot = true } = {}) {
    this.lines = lines;
    this.onDone = onDone;
    this.npc = npc;
    this.useShot = shot && npc;
    this.i = 0;
  }

  enter() {
    G.player.frozen = true;
    G.hud.setPrompt(null);
    if (this.npc) this.npc.talking = true;
    if (this.useShot) {
      const pp = G.player.pos.clone(), np = this.npc.pos.clone();
      const dir = np.clone().sub(pp).setY(0).normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x);
      const scale = this.npc.def.look.scale ?? 1;
      const pos = pp.clone().addScaledVector(dir, -5.5).addScaledVector(side, 2.6).add(new THREE.Vector3(0, 3.4, 0));
      const look = np.clone().add(new THREE.Vector3(0, 2.0 * scale, 0));
      const ground = G.terrain.heightAt(pos.x, pos.z) + 1.5;
      if (pos.y < ground) pos.y = ground;
      G.cam.setShot({ pos, look, fov: 50 }, 0.8);
      G.player.yaw = Math.atan2(dir.x, dir.z);
    }
    this.showLine();
  }

  showLine() {
    const l = this.lines[this.i];
    G.dialog.show(typeof l === 'string' ? { who: '', text: l, portrait: false } : l);
    if (this.npc) this.npc.talking = true;
  }

  update(dt) { G.dialog.update(dt); }

  advance() {
    if (!G.dialog.done) { G.dialog.finish(); return; }
    this.i += 1;
    if (this.i < this.lines.length) { G.audio.play('click'); this.showLine(); return; }
    popActivity(this);
    this.onDone?.();
  }

  onKey(e) {
    if (e.repeat) return;
    if (['Enter', 'Space', 'KeyE', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); this.advance(); }
  }

  exit() {
    G.dialog.hide();
    if (this.npc) this.npc.talking = false;
    if (this.useShot) G.cam.release(0.8);
  }
}

G.dialogClick = () => { if (G.top instanceof DialogActivity) G.top.advance(); };

export function say(lines, opts) {
  return new Promise((resolve) => {
    pushActivity(new DialogActivity(lines, { ...opts, onDone: () => { opts?.onDone?.(); resolve(); } }));
  });
}

// ---------------------------------------------------------------- Quiz session
// opts: {
//   title, subtitle, color, layout, count, done, closable,
//   domain | pick(i) -> { domain, skills?, format? }, format,
//   onCorrect(problem, doneCount), onFinish(), onClose(doneCount), onProblem(problem), onWrong(problem, attempts),
//   shot: { pos, look } for the camera, music
// }
export class QuizActivity {
  constructor(opts) {
    this.o = { layout: 'side', closable: true, format: 'any', done: 0, music: 'quiz', ...opts };
    this.done = this.o.done;
    this.streak = 0;
  }

  enter() {
    const o = this.o;
    G.player.frozen = true;
    G.hud.setPrompt(null);
    G.hud.setVisible(o.layout === 'top');
    G.audio.setMood(o.music);
    G.audio.play('open');
    if (o.shot) G.cam.setShot(o.shot, 1.0);
    const panel = G.quiz;
    panel.open({ title: o.title, subtitle: o.subtitle, color: o.color, layout: o.layout, closable: o.closable, readAloud: G.save.data.settings.readAloud });
    panel.handlers = {
      onSubmit: (r) => this.submit(r),
      onHint: () => this.hint(),
      onContinue: () => this.continue(),
      onClose: () => this.close(),
    };
    panel.setProgress(this.done, o.count);
    this.nextProblem();
  }

  nextProblem() {
    const o = this.o;
    const spec = o.pick ? o.pick(this.done) : { domain: o.domain };
    const p = spec.problem ?? G.tutor.next(spec.domain, { format: spec.format ?? o.format, skills: spec.skills, minChoices: 3, minTier: spec.minTier, maxTier: spec.maxTier });
    this.problem = p;
    this.attempts = 0;
    this.hintUsed = false;
    this.firstGiven = null;
    this.t0 = performance.now();
    G.quiz.showProblem(p, { format: spec.format === 'choice' ? 'choice' : p.format });
    o.onProblem?.(p, this.done);
  }

  submit(resp) {
    const p = this.problem;
    const r = checkAnswer(p, resp);
    if (r.correct) { this.resolve(true, r); return; }
    if (r.formOnly || r.invalid) { G.audio.play('hint'); G.quiz.showForm(r.message || 'Try typing just a number.'); return; }
    this.attempts += 1;
    if (this.firstGiven === null) this.firstGiven = r.given;
    G.audio.play('wrong');
    this.streak = 0;
    this.o.onWrong?.(p, this.attempts);
    if (this.attempts === 1) {
      G.quiz.showWrong({ why: r.why, choiceIndex: resp.choice });
      G.quiz.showHint(p);
    } else {
      G.tutor.record(p, { solved: false, firstTry: false, hintUsed: this.hintUsed, firstGiven: this.firstGiven, given: r.given });
      G.quiz.showReveal(p);
      G.saveSoon();
    }
  }

  resolve(correct) {
    const p = this.problem;
    const firstTry = this.attempts === 0;
    G.tutor.record(p, { solved: true, firstTry, hintUsed: this.hintUsed, firstGiven: this.firstGiven });
    this.done += 1;
    this.streak = firstTry ? this.streak + 1 : 0;
    const coins = firstTry ? (this.hintUsed ? 3 : 4) : 2;
    G.addCoins(coins, false);
    G.audio.play('correct');
    let extra = `<span class="coin-pop">+${coins}</span>`;
    if (this.streak > 0 && this.streak % 5 === 0) {
      G.addCoins(5, false);
      extra += ` <span class="streak">${this.streak} in a row! +5</span>`;
      G.audio.play('chime');
    }
    G.quiz.showCorrect(extra);
    G.quiz.setProgress(Math.min(this.done, this.o.count), this.o.count);
    this.o.onCorrect?.(p, this.done);
    G.saveSoon();
    clearTimeout(this.advanceT);
    this.advanceT = setTimeout(() => this.continue(), 1250);
  }

  hint() {
    if (G.quiz.state !== 'answering') return;
    if (this.attempts === 0) this.hintUsed = true;
    G.audio.play('hint');
    G.quiz.showHint(this.problem);
  }

  continue() {
    clearTimeout(this.advanceT);
    if (G.top !== this) return;
    if (G.quiz.state === 'correct' || G.quiz.state === 'reveal') {
      if (this.done >= this.o.count) { this.finish(); return; }
      this.nextProblem();
    }
  }

  finish() {
    popActivity(this);
    this.o.onFinish?.(this.done);
  }

  close() {
    if (!this.o.closable) return;
    clearTimeout(this.advanceT);
    popActivity(this);
    this.o.onClose?.(this.done);
  }

  onKey(e, inField) { G.quiz.handleKey(e, inField); }

  exit() {
    clearTimeout(this.advanceT);
    G.quiz.close();
    G.audio.play('close');
    if (this.o.shot) G.cam.release(0.9);
    G.hud.setVisible(true);
  }
}

// ---------------------------------------------------------------- Cutscene
// steps: [{ shot, blend, wait } | { call } | { say: lines, npc } | { wait }]
export class Cutscene {
  constructor(steps, onDone) {
    this.steps = steps;
    this.onDone = onDone;
    this.i = -1;
    this.t = 0;
  }

  enter() {
    G.player.frozen = true;
    G.hud.setVisible(false);
    G.hud.setPrompt(null);
    this.next();
  }

  onUncover() { this.next(); }

  next() {
    this.i += 1;
    if (this.i >= this.steps.length) {
      popActivity(this);
      this.onDone?.();
      return;
    }
    const s = this.steps[this.i];
    this.t = s.wait ?? 0;
    if (s.shot) G.cam.setShot(s.shot, s.blend ?? 1.5);
    if (s.call) s.call();
    if (s.say) { pushActivity(new DialogActivity(s.say, { npc: s.npc, shot: false })); this.waitingDialog = true; return; }
    this.waitingDialog = false;
  }

  update(dt, isTop) {
    if (!isTop || this.waitingDialog) return;
    this.t -= dt;
    if (this.t <= 0) this.next();
  }

  onKey(e) {
    // Let players skip the waiting part of a shot.
    if (e.code === 'Escape' && this.steps[this.i]?.skippable) this.t = 0;
  }

  exit() {
    G.cam.release(1.2);
    G.hud.setVisible(true);
  }
}
