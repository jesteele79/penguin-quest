// The Glider Trials, and the wind of Skyreach. On each flight the penguin jumps from the launch tower and
// glides through the ring with the right answer; a gust carries it back up for the next question. Outside
// the trials, updrafts lift anyone who steps into them, and a penguin who drops into the clouds is carried
// back to the last safe ground.
import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../../core/state.js';
import { Round } from '../../game/minigames/common.js';
import { toHTML } from '../../math/fmt.js';
import { LOC, UPDRAFTS, WATER_Y } from './layout.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const RING = 1.9;
const LANE = 5;
const AHEAD = 18;
const FLIGHTS = 5;

let ringGeo = null;
function ringGeometry() {
  ringGeo ??= new THREE.TorusGeometry(RING, 0.22, 8, 32);
  return ringGeo;
}

class GliderTrials {
  constructor(onDone) {
    this.onDone = onDone;
    this.gliderTrials = true;
    this.n = 0;
    this.rings = [];
    this.t = 0;
    this.backT = 0;
    this.prevAlong = null;
  }

  enter() {
    const T = G.world.ctx.towerTop;
    this.deck = V(T.x, T.y, T.z);
    const d = V(LOC.meadow.x - T.x, 0, LOC.meadow.z - T.z).normalize();
    this.dir = d;
    this.side = V(-d.z, 0, d.x);
    this.yaw = Math.atan2(d.x, d.z);
    this.center = this.deck.clone().addScaledVector(d, AHEAD).add(V(0, -1.5, 0));
    G.player.canGlide = true;
    G.audio.setMood('quiz');
    G.hud.setVisible(true);
    const panel = G.quiz;
    panel.open({ title: 'Glider Trials', subtitle: 'Jump off the tower and hold Space to glide through the right ring!', color: '#ffb000', layout: 'top', readAloud: G.save.data.settings.readAloud });
    panel.handlers = {
      onHint: () => { if (this.round && !this.round.over) { this.round.hint(); G.audio.play('hint'); panel.showHint(this.round.p); } },
      onContinue: () => { panel.feedback.innerHTML = ''; panel.steps.classList.add('hidden'); panel.contBtn.classList.add('hidden'); },
      onClose: () => this.quit(),
    };
    panel.setProgress(0, FLIGHTS);
    this.toDeck();
    this.spawn();
  }

  toDeck() {
    const p = this.deck.clone().addScaledVector(this.dir, -2);
    G.player.teleport(p.x, p.z, this.yaw, this.deck.y);
    G.cam.snap(G.player);
    // Seen from above and behind the tower, the rings sit mid-screen, clear of the penguin and the quiz.
    G.cam.setShot({ pos: this.deck.clone().addScaledVector(this.dir, -10).add(V(0, 9, 0)), look: this.center.clone().add(V(0, 5.5, 0)), fov: 60 }, 0.5);
    this.prevAlong = null;
    this.flying = false;
  }

  spawn() {
    for (const r of this.rings) this.removeRing(r);
    this.rings = [];
    const p = G.tutor.next('ratios', { format: 'choice', minChoices: 3 });
    const correct = p.choices.findIndex((c) => c.correct);
    let idx = p.choices.map((_, i) => i).filter((i) => i !== correct).slice(0, 2);
    idx.push(correct);
    idx = idx.sort(() => Math.random() - 0.5);
    this.round = new Round(p);
    idx.forEach((ci, k) => {
      const off = (k - 1) * LANE;
      const c = this.center.clone().addScaledVector(this.side, off);
      const mesh = new THREE.Mesh(ringGeometry(), new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0x4a3000 }));
      mesh.position.copy(c);
      mesh.rotation.y = this.yaw;
      G.scene.add(mesh);
      const label = G.labels.add(`<span>${toHTML(p.choices[ci].label)}</span>`, { cls: 'floe-label ring-label', pos: c.clone().add(V(0, RING, 0)), offsetY: 0.8, maxDist: 80, clear: true });
      this.rings.push({ mesh, c, off, ci, correct: p.choices[ci].correct, label, popped: false, spin: 0 });
    });
    G.audio.play('whoosh');
    G.quiz.showProblem(p, { format: 'none' });
  }

  removeRing(r) {
    G.scene.remove(r.mesh);
    r.mesh.material.dispose();
    r.label?.remove();
  }

  through(r) {
    if (r.correct) {
      const res = this.round.over ? { outcome: 'after' } : this.round.submit({ choice: r.ci });
      if (res.outcome === 'correct') { G.audio.play('correct'); G.quiz.showCorrect(`<span class="coin-pop">+${res.coins}</span>`); } else G.audio.play('chime');
      r.mesh.material.emissive.set(0x1a6a5a);
      r.spin = 1;
      r.label?.remove();
      r.label = null;
      G.world.effects.burst(r.c, { count: 40, color: [0xffd166, 0xffffff, 0x9fe8ff], speed: 5, up: 3, life: 1.2, gravity: 2, size: 0.5 });
      this.n += 1;
      G.quiz.setProgress(this.n, FLIGHTS);
      this.next = this.n < FLIGHTS ? 'spawn' : 'finish';
    } else if (!r.popped) {
      const res = this.round.over ? { outcome: 'after' } : this.round.submit({ choice: r.ci });
      G.audio.play('bubble');
      G.audio.play('wrong');
      r.popped = true;
      r.label?.remove();
      r.label = null;
      G.world.effects.burst(r.c, { count: 18, color: [0xffffff, 0xdfe8ff], speed: 2.5, up: 2, life: 0.9, gravity: -0.5, size: 0.4 });
      if (res.outcome === 'hint') {
        G.quiz.showWrong({ why: res.why, message: 'Pop! Wrong ring. Try again from the tower.' });
        G.quiz.showHint(this.round.p);
      } else if (res.outcome === 'reveal') {
        G.quiz.showReveal(this.round.p, 'Here is how to solve it. Then fly through the right ring!');
        for (const o of this.rings) if (o.correct) o.label?.setClass('right', true);
      }
      this.next = 'retry';
    }
  }

  finish() {
    for (const r of this.rings) this.removeRing(r);
    this.rings = [];
    popActivity(this);
    this.onDone?.();
  }

  quit() {
    for (const r of this.rings) this.removeRing(r);
    this.rings = [];
    popActivity(this);
    const T = LOC.tower;
    G.player.teleport(T.x + 6, T.z + 8, this.yaw);
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
    for (const r of this.rings) {
      if (r.popped) { r.mesh.scale.multiplyScalar(Math.max(0, 1 - dt * 5)); r.mesh.visible = r.mesh.scale.x > 0.05; continue; }
      r.mesh.position.y = r.c.y + Math.sin(this.t * 1.5 + r.off) * 0.15;
      if (r.spin > 0) { r.spin = Math.max(0, r.spin - dt * 0.7); r.mesh.rotateZ(dt * 9 * r.spin); }
    }
    if (!isTop) return;
    const pl = G.player;
    if (this.backT > 0) {
      this.backT -= dt;
      if (this.backT <= 0) {
        this.toDeck();
        if (this.next === 'finish') { this.finish(); return; }
        if (this.next === 'spawn') this.spawn();
        this.next = null;
      }
      return;
    }
    const dx = pl.pos.x - this.center.x, dz = pl.pos.z - this.center.z;
    const along = dx * this.dir.x + dz * this.dir.z;
    if (this.prevAlong !== null && this.prevAlong < 0 && along >= 0) {
      const lat = dx * this.side.x + dz * this.side.z;
      const hit = this.rings.find((r) => !r.popped && Math.abs(lat - r.off) < RING + 0.4 && Math.abs(pl.pos.y + 0.6 - r.c.y) < RING + 0.6);
      if (hit) this.through(hit);
    }
    this.prevAlong = along;
    // Once the flight is over (landed below, or fell well past the rings) a gust lifts the penguin back up.
    const offDeck = Math.hypot(pl.pos.x - this.deck.x, pl.pos.z - this.deck.z) > 5;
    if ((pl.grounded && offDeck) || pl.pos.y < this.deck.y - 14) {
      if (!this.next) {
        G.toasts.toast(pl.gliding || along > 0 ? 'Missed! Aim for a ring.' : 'Hold Space while you fall to glide!', { ms: 1800 });
        this.next = 'retry';
      }
      G.audio.play('whoosh');
      G.world.effects.burst(pl.pos.clone().add(V(0, 1, 0)), { count: 20, color: [0xffffff, 0xdfe8ff], speed: 3, up: 5, life: 0.8, gravity: -1, size: 0.6 });
      this.backT = 0.7;
    }
  }

  exit() {
    G.quiz.close();
    G.cam.release(0.6);
    for (const r of this.rings) this.removeRing(r);
  }
}

export function startGliderTrials(params, onDone) {
  pushActivity(new GliderTrials(onDone));
}

// Every frame of play: updrafts lift, and the clouds hand fallen penguins back.
const safe = V(LOC.start.x, 12, LOC.start.z);
let hotT = 0;
export function skyFrame(dt, pl) {
  if (pl.riding) return;
  for (const U of UPDRAFTS) {
    if (Math.hypot(pl.pos.x - U.x, pl.pos.z - U.z) < 3.2 && pl.pos.y < U.top && !pl.frozen) {
      pl.vy = Math.max(pl.vy, 10);
      pl.grounded = false;
      if (Math.random() < dt * 20) G.world.effects.burst(pl.pos.clone().add(V(0, 0.5, 0)), { count: 2, color: [0xeaf6ff, 0xffffff], speed: 1, up: 6, life: 0.6, gravity: 0, size: 0.3 });
    }
  }
  if (G.activities.some((a) => a.gliderTrials)) return;
  if (hotT > 0) {
    hotT -= dt;
    if (hotT <= 0) { pl.teleport(safe.x, safe.z, pl.yaw, safe.y); G.cam.snap(pl); }
    return;
  }
  if (pl.grounded && !pl.platform && !pl.swimming && G.terrain.heightAt(pl.pos.x, pl.pos.z) > WATER_Y + 1) safe.copy(pl.pos);
  if (!pl.platform && pl.pos.y < WATER_Y + 1.2 && G.terrain.heightAt(pl.pos.x, pl.pos.z) < WATER_Y - 2) {
    G.audio.play('whoosh');
    G.toasts.toast('Whoosh! The wind carries you back up.', { kind: 'teal', ms: 1800 });
    hotT = 0.6;
  }
}
