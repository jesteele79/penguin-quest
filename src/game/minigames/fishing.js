// Fishing at the end of Captain Flipper's dock: each fish carries an answer. Press its number to cast.
import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../../core/state.js';
import { Round, V, awardMedal, MEDAL_ICON } from './common.js';
import { toHTML } from '../../math/fmt.js';
import { WATER_Y } from '../../world/layout.js';
import { mergeColored, mat } from '../../core/geo.js';
import { BOOK } from '../../books/current.js';
import { SIDE } from '../questdata.js';

const FISH_COLORS = [0xff9a3c, 0x4dd8ff, 0xff72c8, 0x7dff9a];
let fishGeo = null;
function bigFish() {
  if (!fishGeo) {
    fishGeo = mergeColored([
      { geo: new THREE.SphereGeometry(0.6, 14, 10), color: 0xffffff, matrix: mat(0, 0, 0, 0, 0, 0, 1, 0.5, 0.3) },
      { geo: new THREE.ConeGeometry(0.34, 0.6, 4), color: 0xdddddd, matrix: mat(-0.75, 0, 0, 0, 0, Math.PI / 2, 1, 1, 0.35) },
      { geo: new THREE.SphereGeometry(0.07, 6, 4), color: 0x111122, matrix: mat(0.38, 0.08, 0.15) },
      { geo: new THREE.SphereGeometry(0.07, 6, 4), color: 0x111122, matrix: mat(0.38, 0.08, -0.15) },
    ]);
  }
  return fishGeo;
}

class FishingActivity {
  constructor(params, onDone) {
    this.need = params.count ?? 6;
    this.tourney = !!params.tourney;
    this.onDone = onDone;
    this.caught = 0;
    this.misses = 0;
    this.fish = [];
    this.sel = 0;
    this.state = 'idle';
    this.t = 0;
  }

  enter() {
    const d = G.world.ctx.dock;
    this.base = V(d.waterEnd.x - 1.4, d.top, d.waterEnd.z);
    G.player.teleport(this.base.x, this.base.z, Math.PI / 2, d.top);
    // Where the fish swim: the water, or for a book without water at the pier, its own level.
    this.waterY = BOOK.fishWater?.(d) ?? WATER_Y;
    G.player.frozen = true;
    G.hud.setVisible(false);
    G.audio.setMood('quiz');
    this.center = V(this.base.x + 8.5, this.waterY, this.base.z);
    // High over the shoulder: the answers spread across open water below the question, and the penguin stays out of the way.
    G.cam.setShot({ pos: this.base.clone().add(V(-4.5, 7.5, 3.0)), look: this.center.clone().add(V(0, 0.4, 0)), fov: 58 }, 1.0);
    // Rod in the right flipper
    const rod = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 3.2, 6), new THREE.MeshLambertMaterial({ color: 0x6b4428 }));
    stick.position.set(0, 1.4, 0.4);
    stick.rotation.x = 0.9;
    rod.add(stick);
    G.player.model.flippers[1].pivot.add(rod);
    this.rod = rod;
    this.hook = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
    this.line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 4, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8eeff }));
    G.scene.add(this.hook, this.line);
    this.hook.visible = this.line.visible = false;
    const panel = G.quiz;
    panel.open({ title: this.tourney ? SIDE.find((q) => q.id === 'sq_tourney')?.title ?? 'Fishing Tournament' : 'Fishing', subtitle: 'Press the fish\'s number (or ←/→ then Enter) to cast', color: '#4dd8ff', layout: 'top', readAloud: G.save.data.settings.readAloud });
    panel.handlers = {
      onHint: () => { if (this.round && !this.round.over) { this.round.hint(); G.audio.play('hint'); panel.showHint(this.round.p); } },
      onContinue: () => this.next(),
      onClose: () => this.quit(),
    };
    panel.setProgress(0, this.need);
    this.next();
  }

  next() {
    if (G.top !== this) return;
    if (this.caught >= this.need) { this.finish(); return; }
    const p = G.tutor.next('lake', { format: 'choice', minChoices: 3, minTier: this.tourney ? 2 : undefined });
    this.round = new Round(p);
    this.clearFish();
    const n = p.choices.length;
    const spread = n === 4 ? [-6, -2, 2, 6] : n === 3 ? [-4.5, 0, 4.5] : [-3, 3];
    p.choices.forEach((c, i) => {
      const m = new THREE.Mesh(bigFish(), new THREE.MeshLambertMaterial({ color: FISH_COLORS[i % 4], emissive: FISH_COLORS[i % 4], emissiveIntensity: 0.35, vertexColors: true }));
      const lane = V(this.center.x, this.waterY - 0.55, this.center.z + spread[i]);
      m.position.copy(lane);
      m.scale.setScalar(1.6);
      G.scene.add(m);
      const label = G.labels.add(`<b class="k">${i + 1}</b><span>${toHTML(c.label)}</span>`, { cls: 'fish-label', pos: lane, offsetY: 1.9, maxDist: 60, clear: true });
      this.fish.push({ mesh: m, lane, label, phase: Math.random() * 6, alive: true, i, leave: 0 });
    });
    this.sel = Math.min(this.sel, n - 1);
    this.highlight();
    G.quiz.showProblem(p, { format: 'none' });
    this.state = 'aim';
  }

  highlight() { this.fish.forEach((f) => f.label.setClass('sel', f.i === this.sel && f.alive)); }

  clearFish() {
    for (const f of this.fish) { G.scene.remove(f.mesh); f.mesh.material.dispose(); f.label.remove(); }
    this.fish = [];
  }

  cast(i) {
    const f = this.fish[i];
    if (!f || !f.alive || this.state !== 'aim') return;
    this.state = 'casting';
    this.castT = 0;
    this.castTarget = f;
    G.audio.play('reel');
  }

  resolveCast() {
    const f = this.castTarget;
    const r = this.round.submit({ choice: f.i });
    if (r.outcome === 'correct') {
      this.caught += 1;
      G.save.data.counters.fish += 1;
      G.patrol.event('fish');
      G.audio.play('correct');
      G.audio.play('splash');
      G.world.effects.splash(f.mesh.position, 0.8);
      f.jump = 0;
      f.alive = false;
      f.label.remove();
      G.quiz.showCorrect(`<span class="coin-pop">+${r.coins}</span>`);
      G.quiz.setProgress(this.caught, this.need);
      this.state = 'caught';
      setTimeout(() => { if (this.state === 'caught') this.next(); }, 1300);
    } else {
      this.misses += 1;
      G.audio.play('wrong');
      G.world.effects.splash(f.mesh.position, 0.5);
      f.alive = false;
      f.leave = 1;
      f.label.remove();
      if (r.outcome === 'hint') {
        G.quiz.showWrong({ why: r.why, message: 'The fish wriggled away! Try another one.' });
        G.quiz.showHint(this.round.p);
        this.state = 'aim';
        const firstAlive = this.fish.find((x) => x.alive);
        if (firstAlive) this.sel = firstAlive.i;
        this.highlight();
      } else {
        G.quiz.showReveal(this.round.p);
        const good = this.fish.find((x) => this.round.p.choices[x.i].correct);
        if (good) { good.label.setClass('right', true); }
        this.state = 'reveal';
      }
    }
    this.hook.visible = this.line.visible = false;
  }

  finish() {
    this.clearFish();
    popActivity(this);
    if (this.tourney) {
      const medal = this.misses <= 1 ? 'gold' : this.misses <= 3 ? 'silver' : 'bronze';
      const res = awardMedal('fishing:tourney', medal, this.misses);
      G.toasts.showBanner('Tournament over!', `${this.need} fish, ${this.misses} miss${this.misses === 1 ? '' : 'es'}: ${medal} medal${res.first ? ` · +${res.coins}` : ''}`, '#4dd8ff', 4200);
    }
    this.onDone?.({ misses: this.misses });
  }

  quit() { this.clearFish(); popActivity(this); }

  onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); this.quit(); return; }
    if (this.state === 'aim') {
      if (/^[1-4]$/.test(e.key)) { this.cast(Number(e.key) - 1); return; }
      const alive = this.fish.filter((f) => f.alive).map((f) => f.i);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
        const k = alive.indexOf(this.sel);
        const dir = e.key === 'ArrowRight' || e.key === 'd' ? 1 : -1;
        this.sel = alive[(k + dir + alive.length) % alive.length];
        this.highlight();
        G.audio.play('click');
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.cast(this.sel); return; }
      if (e.key === 'h' || e.key === 'H') { G.quiz.handlers.onHint(); return; }
    }
    if ((this.state === 'reveal' || this.state === 'caught') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.state = 'next'; this.next(); }
  }

  update(dt) {
    this.t += dt;
    const t = this.t;
    for (const f of this.fish) {
      if (f.jump !== undefined) {
        f.jump += dt;
        const k = Math.min(1, f.jump / 0.9);
        f.mesh.position.set(f.lane.x + (this.base.x - f.lane.x) * k, this.waterY + Math.sin(k * Math.PI) * 5 + (this.base.y - this.waterY) * k, f.lane.z + (this.base.z - f.lane.z) * k);
        f.mesh.rotation.z = k * 6;
        if (k >= 1) f.mesh.visible = false;
        continue;
      }
      if (f.leave > 0) {
        f.leave += dt;
        f.mesh.position.x += dt * 6;
        f.mesh.position.y -= dt * 0.8;
        if (f.leave > 2) f.mesh.visible = false;
        continue;
      }
      const a = t * 0.9 + f.phase;
      f.mesh.position.set(f.lane.x + Math.cos(a) * 1.3, this.waterY - 0.55 + Math.sin(t * 2 + f.phase) * 0.08, f.lane.z + Math.sin(a) * 0.9);
      f.mesh.rotation.y = -a - Math.PI / 2 + Math.sin(t * 9 + f.phase) * 0.15;
      f.label.setPos(f.mesh.position);
    }
    const tip = new THREE.Vector3(0, 2.9, 1.6);
    this.rod?.localToWorld(tip);
    if (this.state === 'casting') {
      this.castT += dt;
      const k = Math.min(1, this.castT / 0.45);
      const target = this.castTarget.mesh.position;
      const pos = tip.clone().lerp(target, k);
      pos.y += Math.sin(k * Math.PI) * 2.2;
      this.hook.position.copy(pos);
      this.hook.visible = this.line.visible = true;
      if (k >= 1) this.resolveCast();
    }
    if (this.line.visible) {
      const d = this.hook.position.clone().sub(tip);
      this.line.position.copy(tip).addScaledVector(d, 0.5);
      this.line.scale.set(1, d.length(), 1);
      this.line.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    }
  }

  exit() {
    G.quiz.close();
    G.cam.release(1.0);
    G.hud.setVisible(true);
    this.rod?.parent?.remove(this.rod);
    G.scene.remove(this.hook, this.line);
    this.clearFish();
  }
}

export function startFishing(params, onDone) {
  pushActivity(new FishingActivity(params, onDone));
}

export { MEDAL_ICON };
