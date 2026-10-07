import * as THREE from 'three';
import { G } from '../../core/state.js';
import { checkAnswer } from '../../math/check.js';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// One problem's life cycle outside the standard quiz panel flow: attempts, hint, reveal, recording.
export class Round {
  constructor(problem) {
    this.p = problem;
    this.attempts = 0;
    this.hintUsed = false;
    this.firstGiven = null;
    this.over = false;
  }

  // Returns { correct, outcome: 'correct' | 'hint' | 'reveal' | 'form', why, message, coins }
  submit(response) {
    if (this.over) return { outcome: 'over' };
    const r = checkAnswer(this.p, response);
    if (r.formOnly || r.invalid) return { outcome: 'form', message: r.message || 'Try typing just a number.' };
    if (r.correct) {
      this.over = true;
      const firstTry = this.attempts === 0;
      G.tutor.record(this.p, { solved: true, firstTry, hintUsed: this.hintUsed, firstGiven: this.firstGiven });
      const coins = firstTry ? (this.hintUsed ? 3 : 4) : 2;
      G.addCoins(coins, false);
      return { correct: true, outcome: 'correct', coins, firstTry };
    }
    this.attempts += 1;
    if (this.firstGiven === null) this.firstGiven = r.given;
    if (this.attempts >= 2) {
      this.over = true;
      G.tutor.record(this.p, { solved: false, firstTry: false, hintUsed: this.hintUsed, firstGiven: this.firstGiven, given: r.given });
      return { outcome: 'reveal', why: r.why };
    }
    return { outcome: 'hint', why: r.why };
  }

  hint() { if (this.attempts === 0) this.hintUsed = true; }

  // A one-shot miss (for example a slalom gate passed with the wrong answer).
  fail(given = '') {
    if (this.over) return;
    this.over = true;
    G.tutor.record(this.p, { solved: false, firstTry: false, hintUsed: this.hintUsed, firstGiven: given, given });
  }
}

// First-time medal rewards and bests. better(a, b) says whether score a beats score b.
export function awardMedal(key, medal, score, better = (a, b) => a < b) {
  const s = G.save.data;
  const prev = s.medals[key] ?? {};
  const rank = { bronze: 1, silver: 2, gold: 3 };
  const got = { ...(prev.got ?? {}) };
  const first = !got[medal];
  got[medal] = true;
  const improved = !prev.medal || rank[medal] > rank[prev.medal];
  const best = prev.best === undefined || better(score, prev.best) ? score : prev.best;
  s.medals[key] = { medal: improved ? medal : prev.medal, best, got };
  const coins = first ? { bronze: 20, silver: 40, gold: 80 }[medal] : { bronze: 5, silver: 10, gold: 20 }[medal];
  G.addCoins(coins);
  if (first && medal === 'gold') G.addStars(1);
  G.saveSoon();
  return { improved, first, coins, best };
}

export function lookShot(fromPos, targetPos, { back = 6, up = 3, side = 0, lookUp = 1.2, fov = 55 } = {}) {
  const dir = targetPos.clone().sub(fromPos).setY(0);
  if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
  dir.normalize();
  const s = V(-dir.z, 0, dir.x);
  const pos = fromPos.clone().addScaledVector(dir, -back).addScaledVector(s, side).add(V(0, up, 0));
  pos.y = Math.max(pos.y, G.terrain.heightAt(pos.x, pos.z) + 1.3);
  return { pos, look: targetPos.clone().add(V(0, lookUp, 0)), fov };
}

// Side-on shot of two subjects (usually the player and a friend or object), pushed into the
// left half of the screen because the quiz panel covers the right half. Tries both sides and a
// few distances so the camera does not end up inside a hill or an igloo.
export function twoShot(a, b, { dist = 8, up = 2.6, lookUp = 1.4, shift = 2.3, fov = 50, turn = 0.55 } = {}) {
  const d = b.clone().sub(a).setY(0);
  if (d.lengthSq() < 0.001) d.set(0, 0, 1);
  d.normalize();
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const baseY = Math.max(a.y, b.y);
  const col = G.world.ctx.collision;
  let best = null;
  for (const k of [1, -1]) {
    // Swung from pure side-on toward the player's back, so the friend's face (not their flank) is on screen.
    const s = V(-d.z * k, 0, d.x * k).multiplyScalar(Math.cos(turn)).addScaledVector(d, -Math.sin(turn));
    for (const f of [1, 0.8, 0.6]) {
      const pos = mid.clone().addScaledVector(s, dist * f);
      const ground = G.terrain.heightAt(pos.x, pos.z);
      const blocked = col.nearby(pos.x, pos.z, 4).some((c) => c.r !== undefined && Math.hypot(pos.x - c.x, pos.z - c.z) < c.r + 0.9);
      const score = (blocked ? 10 : 0) + Math.max(0, ground + 1.3 - (baseY + up)) * 2 + (1 - f);
      if (!best || score < best.score) best = { score, pos, ground };
    }
  }
  const pos = best.pos.setY(Math.max(baseY + up, best.ground + 1.3));
  const fwd = mid.clone().sub(pos).setY(0).normalize();
  const right = V(-fwd.z, 0, fwd.x);
  const look = mid.clone().setY(baseY + lookUp).addScaledVector(right, shift);
  return { pos, look, fov };
}

// A clear view of a subject from a ring around it: samples angles and avoids ones where a tree,
// post or hill sits between the camera and the subject. prefer: angle (radians) to lean toward.
// shift > 0 moves the subject into the left half of the screen (for quiz panels on the right).
export function orbitShot(center, { radius = 9, height = 3, lookUp = 2, fov = 55, prefer = null, shift = 0 } = {}) {
  const col = G.world.ctx.collision;
  let best = null;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    const pos = V(center.x + Math.cos(a) * radius, 0, center.z + Math.sin(a) * radius);
    const ground = G.terrain.heightAt(pos.x, pos.z);
    pos.y = Math.max(center.y + height, ground + 1.5, 1.5);
    let score = Math.max(0, ground + 1.5 - (center.y + height)) * 2;
    for (let s = 0.1; s < 0.9; s += 0.1) {
      const x = pos.x + (center.x - pos.x) * s, z = pos.z + (center.z - pos.z) * s;
      const hit = col.nearby(x, z, 3).some((c) => c.r !== undefined && Math.hypot(c.x - center.x, c.z - center.z) > 1.2 && Math.hypot(x - c.x, z - c.z) < c.r + 0.5);
      if (hit) score += 3;
      if (G.terrain.heightAt(x, z) > pos.y + (center.y + lookUp - pos.y) * s) score += 4;
    }
    if (prefer !== null) score += (1 - Math.cos(a - prefer)) * 0.6;
    if (!best || score < best.score) best = { score, pos };
  }
  const look = center.clone().add(V(0, lookUp, 0));
  if (shift) {
    const f = center.clone().sub(best.pos).setY(0).normalize();
    look.add(V(-f.z * shift, 0, f.x * shift));
  }
  return { pos: best.pos, look, fov };
}

// Angle (for orbitShot's prefer) from a subject toward the player.
export const angleToPlayer = (center) => Math.atan2(G.player.pos.z - center.z, G.player.pos.x - center.x);

export const MEDAL_ICON = {
  gold: '<span class="medal gold">Gold</span>',
  silver: '<span class="medal silver">Silver</span>',
  bronze: '<span class="medal bronze">Bronze</span>',
};
