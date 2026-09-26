// Sledding Hill Slalom: the penguin slides down on its own. Pick the lane with the right answer before each gate.
import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../../core/state.js';
import { Round, V, awardMedal } from './common.js';
import { toHTML } from '../../math/fmt.js';
import { SLALOM } from '../../world/layout.js';
import { damp } from '../../core/mathutil.js';

const GATES = [9, 18, 27, 36, 45, 54];
const FINISH = 61;
const LANES = [-3.2, 0, 3.2];
const FACT_SKILLS = ['mul_facts', 'div_facts', 'exponents', 'integers', 'rounding', 'pow10'];
const MEDALS = { gold: 12, silver: 20 };

class SlalomActivity {
  constructor(onDone) {
    this.onDone = onDone;
    this.objects = [];
    this.gates = [];
    this.along = 0;
    this.lat = 0;
    this.lane = 1;
    this.speed = 0;
    this.time = 0;
    this.penalty = 0;
    this.state = 'countdown';
    this.count = 3.2;
    this.nextGate = 0;
  }

  enter() {
    const top = V(SLALOM.top.x, 0, SLALOM.top.z);
    const to = V(SLALOM.toward.x, 0, SLALOM.toward.z);
    this.dir = to.sub(top).normalize();
    this.side = V(-this.dir.z, 0, this.dir.x);
    this.top = top;
    this.yaw = Math.atan2(this.dir.x, this.dir.z);
    const pl = G.player;
    pl.rail = true;
    pl.teleport(top.x, top.z, this.yaw);
    G.hud.setVisible(false);
    G.audio.setMood('battle');
    this.buildCourse();
    const panel = G.quiz;
    panel.open({ title: 'Slalom', subtitle: 'Press 1, 2 or 3 (or ← ↑ →) to pick a lane', color: '#ffd166', layout: 'top', readAloud: false });
    panel.handlers = { onClose: () => this.quit(), onHint: () => {}, onContinue: () => {} };
    panel.setProgress(0, GATES.length);
    this.prepareGate(0);
  }

  point(along, lat, lift = 0) {
    const p = this.top.clone().addScaledVector(this.dir, along).addScaledVector(this.side, lat);
    p.y = G.terrain.heightAt(p.x, p.z) + lift;
    return p;
  }

  buildCourse() {
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.6, 6);
    const flagGeo = new THREE.PlaneGeometry(0.8, 0.5);
    GATES.forEach((d, gi) => {
      const col = gi % 2 ? 0x3aa0ff : 0xe8434b;
      const flagMat = new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide, emissive: col, emissiveIntensity: 0.25 });
      for (const off of [-4.8, -1.6, 1.6, 4.8]) {
        const p = this.point(d, off);
        const pole = new THREE.Mesh(poleGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }));
        pole.position.copy(p).add(V(0, 1.3, 0));
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.copy(p).add(V(0, 2.3, 0)).addScaledVector(this.side, 0.4);
        flag.rotation.y = this.yaw + Math.PI / 2;
        G.scene.add(pole, flag);
        this.objects.push(pole, flag);
      }
      this.gates.push({ d, labels: [], round: null, passed: false, choiceIdx: [] });
    });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.25, 8, 24, Math.PI), new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0x8a6000 }));
    const f = this.point(FINISH, 0);
    arch.position.copy(f);
    arch.rotation.y = this.yaw;
    G.scene.add(arch);
    this.objects.push(arch);
  }

  prepareGate(i) {
    const g = this.gates[i];
    if (!g) return;
    const p = G.tutor.next(null, { skills: FACT_SKILLS, format: 'choice', minChoices: 3, maxTier: 2 });
    const correct = p.choices.findIndex((c) => c.correct);
    let idx = p.choices.map((_, k) => k).filter((k) => k !== correct).slice(0, 2);
    idx.push(correct);
    idx = idx.sort(() => Math.random() - 0.5);
    g.round = new Round(p);
    g.choiceIdx = idx;
    idx.forEach((ci, lane) => {
      const pos = this.point(g.d, LANES[lane], 3.2);
      g.labels.push(G.labels.add(`<b class="k">${lane + 1}</b><span>${toHTML(p.choices[ci].label)}</span>`, { cls: 'fish-label', pos, offsetY: 0, maxDist: 80 }));
    });
    this.answered = null;
    G.quiz.showProblem(p, { format: 'none', showSkill: false });
  }

  choose(lane) {
    if (this.state !== 'run' && this.state !== 'countdown') return;
    const g = this.gates[this.nextGate];
    if (!g) return;
    this.lane = lane;
    this.answered = lane;
    g.labels.forEach((l, k) => l.setClass('sel', k === lane));
    G.audio.play('click');
  }

  passGate(g) {
    g.passed = true;
    const lane = this.answered;
    const ci = lane === null ? -1 : g.choiceIdx[lane];
    const good = ci >= 0 && g.round.p.choices[ci].correct;
    const at = this.point(g.d, LANES[this.lane] ?? 0, 1.2);
    if (good) {
      g.round.submit({ choice: ci });
      this.speed = Math.min(10.5, this.speed + 1.3);
      this.penalty -= 0.5;
      G.audio.play('correct');
      G.world.effects.sparkle(at, 0xffd166, 30);
      G.quiz.showCorrect('<span class="streak">Speed boost!</span>');
    } else {
      if (lane === null) g.round.fail('(no answer)'); else g.round.fail(g.round.p.choices[ci].label);
      this.speed = Math.max(4, this.speed - 1.6);
      this.penalty += 2;
      G.audio.play('wrong');
      G.world.effects.snowSpray(at, 0, 0, 5);
      G.quiz.showWrong({ message: `It was ${g.round.p.answerText.replace(/[{}]/g, '')}. +2 seconds` });
    }
    g.labels.forEach((l) => l.remove());
    this.nextGate += 1;
    G.quiz.setProgress(this.nextGate, GATES.length);
    this.prepT = 0.25;
  }

  finish() {
    this.state = 'done';
    const total = Math.max(0, this.time + this.penalty);
    const medal = total <= MEDALS.gold ? 'gold' : total <= MEDALS.silver ? 'silver' : 'bronze';
    const res = awardMedal('slalom', medal, Math.round(total * 10) / 10, (a, b) => a < b);
    G.patrol.event('slalom');
    G.audio.play('fanfare');
    G.toasts.showBanner(`${total.toFixed(1)} seconds!`, `${medal[0].toUpperCase() + medal.slice(1)} medal${res.best === Math.round(total * 10) / 10 ? ' · new best!' : ` · best ${res.best}s`}${res.first ? ` · +${res.coins}` : ''}`, '#ffd166', 4200);
    setTimeout(() => { popActivity(this); this.onDone?.({ time: total, medal }); }, 1800);
  }

  quit() { popActivity(this); }

  onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); this.quit(); return; }
    const map = { 1: 0, 2: 1, 3: 2, ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, a: 0, w: 1, d: 2 };
    if (e.key in map) { e.preventDefault(); this.choose(map[e.key]); }
  }

  update(dt) {
    const pl = G.player;
    if (this.state === 'countdown') {
      const before = Math.ceil(this.count);
      this.count -= dt;
      const now = Math.ceil(this.count);
      if (now !== before && now > 0) { G.toasts.showBanner(String(now), '', '#ffd166', 700, { replace: true }); G.audio.play('click'); }
      if (this.count <= 0) { this.state = 'run'; this.speed = 5; G.toasts.showBanner('GO!', '', '#4dffa0', 700, { replace: true }); G.audio.play('whoosh'); }
    } else if (this.state === 'run') {
      const g = this.gates[this.nextGate];
      // Game time, not a timer: a slow frame must never reach a gate before its question exists.
      if (g && !g.round) {
        this.prepT = (this.prepT ?? 0) - dt;
        if (this.prepT <= 0 || g.d - this.along < 7) this.prepareGate(this.nextGate);
      }
      let v = this.speed;
      // Near slow motion before an unanswered gate: thinking costs time, never a wrong gate.
      if (g && this.answered === null && g.d - this.along < 7 && g.d - this.along > 0) v *= 0.15;
      this.along += v * dt;
      this.time += dt;
      G.quiz.title.textContent = `Slalom · ${(this.time + this.penalty).toFixed(1)} s`;
      if (g && this.along >= g.d) this.passGate(g);
      if (this.along >= FINISH) this.finish();
    }
    const targetLat = this.answered === null ? 0 : LANES[this.lane];
    this.lat = damp(this.lat, targetLat, 3.5, dt);
    const p = this.point(this.along, this.lat);
    pl.pos.copy(p);
    pl.groundY = p.y;
    pl.yaw = this.yaw + (targetLat - this.lat) * -0.08;
    pl.speed = this.state === 'run' ? this.speed : 0;
    if (this.state === 'run' && Math.random() < dt * 30) G.world.effects.snowSpray(p, this.dir.x * this.speed, this.dir.z * this.speed, 0.6);
    const behind = p.clone().addScaledVector(this.dir, -8).add(V(0, 4.2, 0));
    behind.y = Math.max(behind.y, G.terrain.heightAt(behind.x, behind.z) + 2);
    G.cam.setShot({ pos: behind, look: p.clone().addScaledVector(this.dir, 7).add(V(0, 0.8, 0)), fov: 64 }, 0.001);
  }

  exit() {
    G.quiz.close();
    G.player.rail = false;
    G.cam.release(0.8);
    G.hud.setVisible(true);
    for (const o of this.objects) G.scene.remove(o);
    for (const g of this.gates) g.labels.forEach((l) => l.remove());
  }
}

export function startSlalom(params, onDone) {
  pushActivity(new SlalomActivity(onDone));
}
