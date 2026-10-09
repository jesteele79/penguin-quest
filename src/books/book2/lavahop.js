// The Lava Hop: basalt stepping stones rise out of the lava pool by Rocco's forge, one row per puzzle. Only the
// stone with the right answer is cool enough to stand on; the others crack and sink. Lava never hurts: it pops
// the penguin back to the last safe spot. The finished path stays, knitted into a causeway out to the forge vent's
// island.
import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../../core/state.js';
import { Round } from '../../game/minigames/common.js';
import { toHTML } from '../../math/fmt.js';
import { mergeColored, mat } from '../../core/geo.js';
import { lambert } from '../../core/materials.js';
import { LOC, poolDist } from './layout.js';

const P = LOC.lavaPool;
const R = 1.75;
const DEPTH = 5;
const TOP = P.rim - 0.3;
const SUNK = P.lavaY - 0.6;
const LANE = 4.6;
// How far each row's middle stone may drift from the pool's centre line, following the path so far.
const DRIFT = [0, 2.5, 2, 1.5, 1];
const EAST = Math.PI / 2;
export const HOP = { R, LANE, DRIFT };
const COOL = 0x0e4a44;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

let stoneGeo = null;
function stoneGeometry() {
  if (!stoneGeo) {
    // A six-sided basalt column with a pale, cool top; the origin is the top face so y is the standing height.
    stoneGeo = mergeColored([
      { geo: new THREE.CylinderGeometry(R, R * 1.12, DEPTH, 6), color: 0x3a3236, matrix: mat(0, -DEPTH / 2, 0) },
      { geo: new THREE.CylinderGeometry(R * 0.88, R, 0.16, 6), color: 0x8d97a6, matrix: mat(0, 0.08, 0) },
    ]);
  }
  return stoneGeo;
}

function makeStone(x, z, top) {
  const m = new THREE.Mesh(stoneGeometry(), lambert({ vertexColors: true, flatShading: true, emissive: 0x000000 }, { color: 0xff7a2a, strength: 0.45 }));
  m.position.set(x, top, z);
  m.rotation.y = Math.random() * Math.PI;
  m.castShadow = true;
  m.receiveShadow = true;
  G.scene.add(m);
  const platform = G.world.collision.addPlatform({ kind: 'circle', x, z, r: R, top });
  return { mesh: m, platform };
}

function removeStone(s) {
  s.gone = true;
  G.scene.remove(s.mesh);
  s.mesh.material.dispose();
  G.world.collision.removePlatform(s.platform);
  s.label?.remove();
}

const onIsle = (p) => Math.hypot(p.x - P.isle.x, p.z - P.isle.z) < P.isle.r;
const inLava = (pl) => !pl.platform && pl.pos.y < P.lavaY + 0.12 && poolDist(pl.pos.x, pl.pos.z) < -0.3;

// Touching lava: a yelp of sparks and smoke, and the penguin springs straight back out.
function scorch(pl) {
  const at = V(pl.pos.x, P.lavaY + 0.3, pl.pos.z);
  G.audio.play('sizzle');
  G.world.effects.burst(at, { count: 22, color: [0xffb040, 0xff6a2a, 0xffe08a], speed: 4, up: 6, life: 0.8, gravity: 10, size: 0.45 });
  G.world.effects.burst(at, { count: 10, color: [0x8a8088, 0x6a6068], speed: 1.5, up: 3, life: 1.4, gravity: -1, size: 1.1, drag: 2 });
  pl.vy = 10;
  pl.grounded = false;
  pl.model.hop();
  G.input.rumble?.(0.3, 0.5, 120);
  G.toasts.toast('Hot hot hot! Back to a safe spot.', { kind: 'hot', ms: 1600 });
}

// The bridge left behind by a finished hop: the five cool stones, knitted together by smaller basalt columns into a
// causeway. The story sends the penguin back and forth to the vent's island, and that must not need a run of
// perfect jumps with no help steering them.
let bridge = null;
export function buildLavaBridge(zs, { rise = false } = {}) {
  if (!zs?.length || bridge) return;
  const stones = P.rows.map((x, i) => {
    const s = makeStone(x, zs[i] ?? P.z, TOP);
    s.mesh.material.emissive.set(COOL);
    return s;
  });
  const path = [[LOC.lavaStart.x, LOC.lavaStart.z], ...P.rows.map((x, i) => [x, zs[i] ?? P.z]), [P.isle.x - P.isle.r + 1.5, P.isle.z]];
  bridge = { stones, way: causeway(path, rise) };
  // The guide trail walks the causeway to the vent's island.
  G.world.roads.addPath(path);
}

// Smaller columns fill every gap along the path. Where the bank and the island stand higher than the stones, a
// taller column at the edge makes a step up onto them. A fresh causeway rises out of the lava.
function causeway(path, rise) {
  const geo = stoneGeometry(), parts = [], platforms = [];
  const add = ([x, z], r, top) => {
    parts.push({ geo, color: geo.attributes.color.array, matrix: mat(x, top, z, 0, Math.random() * Math.PI, 0, r / R, 1, r / R) });
    platforms.push(G.world.collision.addPlatform({ kind: 'circle', x, z, r, top, active: !rise }));
  };
  const last = path.length - 2;
  for (let k = 0; k <= last; k++) {
    const [ax, az] = path[k], [bx, bz] = path[k + 1];
    const len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
    const at = (s) => [ax + ux * s, az + uz * s];
    const high = (s) => G.terrain.heightAt(...at(s)) >= TOP + 0.05;
    let s0 = k === 0 ? 0 : R - 0.2, s1 = k === last ? len : len - R + 0.2;
    if (k === 0) {
      while (s0 < s1 && high(s0)) s0 += 0.1;
      add(at(s0 - 0.35), 1, TOP + 0.25);
      s0 += 0.3;
    }
    if (k === last) {
      while (s1 > s0 && high(s1)) s1 -= 0.1;
      add(at(s1 + 0.35), 1, TOP + 0.25);
      s1 -= 0.3;
    }
    const n = Math.ceil((s1 - s0) / 1.6);
    for (let i = 0; i < n; i++) add(at(s0 + ((i + 0.5) * (s1 - s0)) / n), 1.1 + Math.random() * 0.12, TOP - Math.random() * 0.08);
  }
  const mesh = new THREE.Mesh(mergeColored(parts), lambert({ vertexColors: true, flatShading: true, emissive: COOL }, { color: 0xff7a2a, strength: 0.45 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  G.scene.add(mesh);
  const out = { mesh, platforms, risen: !rise };
  if (rise) {
    let t = 0;
    mesh.position.y = SUNK - TOP;
    G.world.animated.push((dt) => {
      if (out.risen) return;
      t = Math.min(1, t + dt / 1.6);
      mesh.position.y = (SUNK - TOP) * Math.pow(1 - t, 3);
      if (t < 1) return;
      out.risen = true;
      for (const p of platforms) p.active = mesh.visible;
      G.audio.play('sizzle');
      for (const p of platforms) G.world.effects.burst(V(p.x, P.lavaY + 0.4, p.z), { count: 3, color: [0x8a8088, 0x6a6068], speed: 1, up: 2.5, life: 1.3, gravity: -1, size: 0.9, drag: 2 });
    });
  }
  return out;
}

function showBridge(on) {
  if (!bridge) return;
  for (const s of bridge.stones) { s.mesh.visible = on; s.platform.active = on; }
  const w = bridge.way;
  w.mesh.visible = on;
  for (const p of w.platforms) p.active = on && w.risen;
}

class LavaHopActivity {
  constructor(onDone) {
    this.onDone = onDone;
    this.lavaHop = true;
    this.row = 0;
    this.stones = [];
    this.kept = [];
    this.pathZ = P.z;
    this.zs = [];
    this.t = 0;
    this.hotT = 0;
  }

  enter() {
    showBridge(false);
    this.safe = V(LOC.lavaStart.x, G.terrain.heightAt(LOC.lavaStart.x, LOC.lavaStart.z), LOC.lavaStart.z);
    G.player.teleport(this.safe.x, this.safe.z, EAST);
    G.cam.snap(G.player);
    G.audio.setMood('quiz');
    G.hud.setVisible(true);
    const panel = G.quiz;
    panel.open({ title: 'Lava Hop', subtitle: 'Hop onto the cool stone with the right answer. Space to jump!', color: '#ff6b35', layout: 'top', readAloud: G.save.data.settings.readAloud });
    panel.handlers = {
      onHint: () => { if (this.round && !this.round.over) { this.round.hint(); G.audio.play('hint'); panel.showHint(this.round.p); } },
      onContinue: () => { panel.feedback.innerHTML = ''; panel.steps.classList.add('hidden'); panel.contBtn.classList.add('hidden'); },
      onClose: () => this.quit(),
    };
    panel.setProgress(0, P.rows.length);
    // Steer toward the stone the jump is heading for, judged from where it would land.
    G.player.airAssist = (x, z, vx = 0, vz = 0) => {
      if (this.row >= P.rows.length) {
        const I = P.isle;
        const shore = { x: I.x - I.r * 0.68, z: I.z + (z - I.z) * 0.3 };
        return Math.hypot(shore.x - x, shore.z - z) < 9 ? shore : null;
      }
      const px = x + vx * 0.35, pz = z + vz * 0.35;
      let best = null, bd = 3.6;
      for (const s of this.stones) {
        if (s.sinking || s.row !== this.row) continue;
        const d = Math.hypot(s.x - px, s.z - pz);
        if (d < bd) { bd = d; best = s; }
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
    // The path wanders a little but closes in on the island's middle row by row.
    const limit = DRIFT[this.row] ?? 1;
    const cz = P.z + Math.max(-limit, Math.min(limit, this.pathZ - P.z));
    const x = P.rows[this.row];
    idx.forEach((ci, k) => {
      const z = cz + (k - 1) * LANE;
      const s = makeStone(x, z, SUNK);
      s.platform.active = false;
      const label = G.labels.add(`<span>${toHTML(p.choices[ci].label)}</span>`, { cls: 'floe-label stone-label', pos: V(x, TOP, z), offsetY: 1.6, maxDist: 70, clear: true });
      this.stones.push({ ...s, x, z, ci, correct: p.choices[ci].correct, label, rise: 0, heat: 0, sinking: false, row: this.row });
      G.world.effects.burst(V(x, P.lavaY + 0.2, z), { count: 14, color: [0xffb040, 0xff6a2a, 0xffe08a], speed: 3, up: 5, life: 0.8, gravity: 10, size: 0.4 });
    });
    G.audio.play('bubble');
    G.quiz.showProblem(p, { format: 'none' });
  }

  landedOn(s) {
    if (s.correct) {
      const r = this.round.over ? { outcome: 'after' } : this.round.submit({ choice: s.ci });
      if (r.outcome === 'correct') {
        G.audio.play('correct');
        G.quiz.showCorrect(`<span class="coin-pop">+${r.coins}</span>`);
      } else {
        G.audio.play('chime');
      }
      s.mesh.material.emissive.set(COOL);
      s.label.remove();
      s.label = null;
      G.world.effects.burst(V(s.x, TOP + 0.2, s.z), { count: 16, color: [0x7fe0d0, 0xffffff], speed: 3, up: 3, life: 0.9, gravity: 3, size: 0.4 });
      this.safe = V(s.x, TOP, s.z);
      this.pathZ = s.z;
      this.zs[this.row] = s.z;
      for (const o of this.stones) if (o !== s && o.row === this.row) { o.cracking = true; this.sink(o, 0.4); }
      this.kept.push(s);
      // The others stay listed until they finish sinking, or they would hang in the air with no collision.
      this.stones = this.stones.filter((o) => o !== s);
      this.row += 1;
      G.quiz.setProgress(this.row, P.rows.length);
      if (this.row < P.rows.length) setTimeout(() => { if (G.top === this) this.spawnRow(); }, 700);
      else {
        G.quiz.q.innerHTML = 'Hop onto the vent island!';
        G.quiz.visual.classList.add('hidden');
      }
    } else if (!s.cracking) {
      s.cracking = true;
      const r = this.round.over ? { outcome: 'after' } : this.round.submit({ choice: s.ci });
      G.audio.play('crack');
      G.audio.play('wrong');
      if (r.outcome === 'hint') {
        G.quiz.showWrong({ why: r.why, message: 'Crack! That stone was too hot. Wrong answer.' });
        G.quiz.showHint(this.round.p);
      } else if (r.outcome === 'reveal') {
        G.quiz.showReveal(this.round.p, 'Here is how to solve it. Then hop onto the right stone!');
        for (const o of this.stones) if (o.correct && o.row === this.row) o.label.setClass('right', true);
      }
      this.sink(s, 0.45);
    }
  }

  sink(s, delay) {
    setTimeout(() => {
      if (s.gone) return;
      s.sinking = true;
      s.platform.active = false;
      s.label?.remove();
      s.label = null;
      G.audio.play('sizzle');
      G.world.effects.burst(V(s.x, P.lavaY + 0.4, s.z), { count: 8, color: [0x8a8088, 0x6a6068], speed: 1.2, up: 2.5, life: 1.3, gravity: -1, size: 1.0, drag: 2 });
    }, delay * 1000);
  }

  finish() {
    const flags = G.save.data.flags;
    if (!flags.lavaBridge) flags.lavaBridge = this.zs.map((z) => Math.round(z * 10) / 10);
    for (const s of [...this.stones, ...this.kept]) removeStone(s);
    this.stones = [];
    this.kept = [];
    buildLavaBridge(flags.lavaBridge, { rise: true });
    popActivity(this);
    this.onDone?.();
  }

  quit() {
    for (const s of [...this.stones, ...this.kept]) removeStone(s);
    this.stones = [];
    this.kept = [];
    popActivity(this);
    G.player.teleport(LOC.lavaStart.x, LOC.lavaStart.z, EAST);
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
    for (const s of [...this.stones, ...this.kept]) {
      if (s.sinking) {
        s.mesh.position.y -= dt * 1.6;
        s.mesh.rotation.z += dt * 0.25;
        if (s.mesh.position.y < P.lavaY - 0.4) removeStone(s);
        continue;
      }
      if (s.rise < 1) {
        s.rise = Math.min(1, s.rise + dt * 1.4);
        s.mesh.position.y = SUNK + (TOP - SUNK) * (1 - Math.pow(1 - s.rise, 3));
        if (s.rise >= 1) s.platform.active = true;
      }
      if (s.cracking) {
        s.heat = Math.min(1, s.heat + dt * 2.5);
        s.mesh.material.emissive.setRGB(s.heat * 0.9, s.heat * 0.28, s.heat * 0.05);
        s.mesh.position.x = s.x + Math.sin(this.t * 60) * 0.06;
      }
      s.platform.top = s.mesh.position.y;
      s.label?.setPos(V(s.x, s.mesh.position.y, s.z));
    }
    this.stones = this.stones.filter((s) => !s.gone);
    if (!isTop) return;
    const pl = G.player;
    if (this.hotT > 0) {
      this.hotT -= dt;
      if (this.hotT <= 0) {
        pl.teleport(this.safe.x, this.safe.z, EAST, this.safe.y);
        G.cam.snap(pl);
      }
      return;
    }
    if (inLava(pl)) { scorch(pl); this.hotT = 0.5; return; }
    if (pl.grounded && pl.platform) {
      const s = this.stones.find((o) => o.platform === pl.platform && o.row === this.row && !o.sinking);
      if (s) this.landedOn(s);
    }
    if (this.row >= P.rows.length && pl.grounded && !pl.platform && onIsle(pl.pos) && pl.pos.y > P.lavaY + 0.5) this.finish();
  }

  exit() {
    G.quiz.close();
    G.player.airAssist = null;
    for (const s of [...this.stones, ...this.kept]) removeStone(s);
    showBridge(true);
  }
}

export function startLavaHop(params, onDone) {
  pushActivity(new LavaHopActivity(onDone));
}

// Every frame outside the hop: lava pops a wandering penguin back to solid ground, and the pool spits the odd
// spark while someone is close enough to see it.
const safe = V(LOC.lavaStart.x, P.rim, LOC.lavaStart.z);
let hotT = 0, sparkT = 0;
export function lavaFrame(dt, pl) {
  if (G.activities.some((a) => a.lavaHop)) return;
  const d = poolDist(pl.pos.x, pl.pos.z);
  if (d < 30) {
    sparkT -= dt;
    if (sparkT <= 0) {
      sparkT = 0.25 + Math.random() * 0.5;
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.85;
      const x = P.x + Math.cos(a) * P.a * r, z = P.z + Math.sin(a) * P.b * r;
      if (!onIsle({ x, z })) G.world.effects.burst(V(x, P.lavaY + 0.1, z), { count: 4, color: [0xffb040, 0xff7a2a], speed: 1.5, up: 4.5, life: 0.9, gravity: 7, size: 0.32 });
    }
  }
  if (hotT > 0) {
    hotT -= dt;
    if (hotT <= 0) { pl.teleport(safe.x, safe.z, pl.yaw, safe.y); G.cam.snap(pl); }
    return;
  }
  if (pl.grounded && !pl.platform && !pl.swimming && (d > 1 || onIsle(pl.pos))) safe.copy(pl.pos);
  if (d < 0 && inLava(pl)) { scorch(pl); hotT = 0.5; }
}
