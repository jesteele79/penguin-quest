// The daily patrol (Aurora Patrol, Island Patrol): three small tasks each day, streaks, and Aurora Stars.
import { G } from '../core/state.js';
import { Rng, hashString } from '../core/rng.js';
import { DOMAINS } from '../math/skills.js';
import { todayStr } from './questengine.js';
import { T } from '../books/terms.js';

const POOL = [
  { id: 'solve_dom', weight: 3, make: (rng) => { const d = rng.pick(G.unlockedDomains()); return { kind: 'solve', domain: d, need: 8, text: `Solve 8 ${DOMAINS[d].name} puzzles` }; } },
  { id: 'solve_any', weight: 2, make: () => ({ kind: 'solve', need: 15, text: 'Solve 15 puzzles anywhere' }) },
  { id: 'inarow', weight: 2, make: () => ({ kind: 'inarow', need: 5, text: 'Get 5 answers right in a row (no hints)' }) },
  { id: 'gloom', weight: 2, when: () => G.quests.done('ch0'), make: () => ({ kind: 'gloom', need: 2, text: `Cheer up 2 wandering ${T.glooms}` }) },
  { id: 'slide', weight: 1, make: () => ({ kind: 'slide', need: 250, text: 'Belly-slide 250 meters' }) },
  // Skyreach has no water to swim in, but once the glider sail is earned there is a lot of sky.
  { id: 'swim', weight: 1, when: () => G.quests.done('ch0') && !!T.swimPlace, make: () => ({ kind: 'swim', need: 150, text: `Swim 150 meters in ${T.swimPlace}` }) },
  { id: 'glide', weight: 1, when: () => !!G.player?.canGlide, make: () => ({ kind: 'glide', need: 120, text: 'Glide 120 meters' }) },
  { id: 'fish', weight: 1, when: () => G.quests.started('sq_tourney'), make: () => ({ kind: 'fish', need: 5, text: `Catch 5 fish at ${T.fishPlace}` }) },
  { id: 'serve', weight: 1, when: () => G.quests.done('ch3'), make: () => ({ kind: 'serve', need: 4, text: `Serve 4 customers at the ${T.stall}` }) },
  { id: 'slalom', weight: 1, when: () => G.quests.started('sq_slalom'), make: () => ({ kind: 'slalom', need: 1, text: `Finish a run in the ${T.slalom}` }) },
  { id: 'chart', weight: 1, when: () => G.quests.started('sq_stars'), make: () => ({ kind: 'chart', need: 1, text: `Finish today's ${T.chart} at ${T.chartPlace}` }) },
  { id: 'chest', weight: 1, when: () => G.save.data.chests.length < 12, make: () => ({ kind: 'chest', need: 1, text: 'Open a treasure chest' }) },
  { id: 'flake', weight: 1, when: () => G.save.data.snowflakes.length <= 28, make: () => ({ kind: 'flake', need: 2, text: `Find 2 ${T.flakes}` }) },
];

const STREAK_REWARDS = { 3: 2, 7: 5, 14: 10, 30: 20 };

export class Patrol {
  get p() { return G.save.data.patrol; }

  ensureToday() {
    const today = todayStr();
    const p = this.p;
    if (p.day === today) return false;
    p.day = today;
    p.allDone = false;
    // "In a row" tasks count today's answers only.
    G.save.data.counters.inARow = 0;
    const rng = new Rng(hashString(today + G.save.data.profile.name));
    const avail = POOL.filter((t) => !t.when || t.when());
    const tasks = [];
    const used = new Set();
    let guard = 0;
    while (tasks.length < 3 && guard++ < 50) {
      const total = avail.reduce((a, t) => a + (used.has(t.id) ? 0 : t.weight), 0);
      if (total <= 0) break;
      let r = rng.next() * total;
      const pick = avail.find((t) => { if (used.has(t.id)) return false; r -= t.weight; return r <= 0; });
      if (!pick) break;
      used.add(pick.id);
      tasks.push({ id: pick.id, ...pick.make(rng), progress: 0, done: false });
    }
    p.tasks = tasks;
    return true;
  }

  // Called from game events. kind: solve | inarow | gloom | slide | swim | glide | fish | serve | slalom | chart | chest | flake
  event(kind, payload = {}) {
    if (!G.quests?.done('ch0')) return;
    this.ensureToday();
    let changed = false;
    for (const t of this.p.tasks) {
      if (t.done || t.kind !== kind) continue;
      if (kind === 'solve' && t.domain && payload.domain !== t.domain) continue;
      if (kind === 'inarow') t.progress = Math.max(t.progress, payload.streak ?? 0);
      else t.progress += payload.amount ?? 1;
      if (t.progress >= t.need) this.finish(t);
      changed = true;
    }
    return changed;
  }

  finish(t) {
    t.done = true;
    t.progress = t.need;
    G.addCoins(10, false);
    G.addStars(1);
    G.audio.play('chime');
    G.toasts.toast(`Patrol task done: ${t.text}! <b>+10</b> and an ${T.star}`, { kind: 'gold', ms: 4200 });
    if (this.p.tasks.every((x) => x.done) && !this.p.allDone) {
      const p = this.p;
      p.allDone = true;
      const today = todayStr();
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yesterday = y.toLocaleDateString('en-CA');
      p.streak = p.lastDone === yesterday ? p.streak + 1 : p.lastDone === today ? p.streak : 1;
      p.lastDone = today;
      p.best = Math.max(p.best, p.streak);
      G.addCoins(20, false);
      const bonus = STREAK_REWARDS[p.streak];
      if (bonus) G.addStars(bonus);
      G.toasts.showBanner(`${T.patrol} complete!`, `Streak: ${p.streak} day${p.streak > 1 ? 's' : ''}${bonus ? ` · +${bonus} bonus stars` : ''}`, '#ffd166', 3600);
      G.audio.play('fanfare');
    }
    G.saveSoon();
  }

  onSolve(problem, result) {
    const c = G.save.data.counters;
    if (result.firstTry && !result.hintUsed) {
      c.inARow += 1;
      c.bestInARow = Math.max(c.bestInARow, c.inARow);
    } else {
      c.inARow = 0;
    }
    if (result.solved) this.event('solve', { domain: problem.domain });
    this.event('inarow', { streak: c.inARow });
  }
}
