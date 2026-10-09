// Adaptive practice: tracks mastery per skill and chooses the next problem.
import { Rng } from '../core/rng.js';
import { DOMAINS, SKILLS, DOMAIN_ORDER } from './skills.js';
import { toSpeech } from './fmt.js';

export const MASTERED = 0.8;
const RATE = 0.3;

export function emptyTutorState() {
  return { skills: {}, retry: [], qn: 0, mistakes: [], days: {}, totals: { problems: 0, firstTry: 0, hints: 0 } };
}

const plain = (markup) => toSpeech(markup).replace(/ what\?/g, '?');

export class Tutor {
  // grade: the child's school grade (what counts as review, and what needs a lesson).
  // book: { grade, has(skill) } from the book being played; without one every skill is in play.
  constructor(state, grade = 4, seed, book = null) {
    this.state = state;
    this.grade = grade;
    this.book = book;
    this.rng = new Rng(seed);
    // Saves from before review skills could be confirmed: one taken as known and only ever answered cleanly
    // since (nothing else reaches mastery in under four answers) counts as mastered again.
    for (const e of Object.values(state.skills)) {
      if (e.confirmed === undefined && e.n > 0 && e.n < 4 && e.c === e.n && e.m >= MASTERED) e.confirmed = true;
    }
  }

  inBook(skill) { return !this.book || this.book.has(skill); }

  setGrade(grade) {
    this.grade = grade;
    // Re-seed skills nobody has practiced yet so the new grade takes effect.
    for (const [id, e] of Object.entries(this.state.skills)) {
      if (e.n === 0) delete this.state.skills[id];
    }
  }

  entry(id) {
    let e = this.state.skills[id];
    if (!e) {
      const s = SKILLS[id];
      const assumed = s.grade < this.grade;
      e = this.state.skills[id] = { m: assumed ? 0.85 : 0, n: 0, c: 0, s: 0, t: 0, assumed };
    }
    return e;
  }

  isMastered(id) {
    const e = this.entry(id);
    return e.m >= MASTERED && (e.n >= 4 || e.assumed || e.confirmed);
  }

  // A book's own grade is open from the start. Skills above it (and above the child's grade) open once
  // everything easier in the domain that the book teaches is mastered.
  isUnlocked(skill) {
    if (!this.inBook(skill)) return false;
    if (skill.grade <= Math.max(this.grade, this.book?.grade ?? 0)) return true;
    return DOMAINS[skill.domain].skills.every((s) => !this.inBook(s) || s.grade >= skill.grade || this.isMastered(s.id));
  }

  tierFor(id) {
    const e = this.entry(id);
    if (e.assumed && e.n === 0) return 2;
    return e.m < 0.4 ? 1 : e.m < 0.75 ? 2 : 3;
  }

  domainSkills(domain, filter) {
    return DOMAINS[domain].skills.filter((s) => this.isUnlocked(s) && (!filter || filter(s)));
  }

  pickSkill(domain, opts = {}) {
    const { skills, exclude } = opts;
    let pool;
    if (skills) {
      const all = skills.map((id) => SKILLS[id]).filter((s) => s && (!exclude || !exclude.includes(s.id)));
      const open = all.filter((s) => this.isUnlocked(s));
      pool = open.length ? open : all.sort((a, b) => a.grade - b.grade).slice(0, 1);
    } else {
      pool = this.domainSkills(domain, (s) => !exclude || !exclude.includes(s.id));
    }
    // A brand-new idea waits for a calm puzzle (where its lesson can run) instead of an action game.
    if (!opts.lessons && this.lessonGate) {
      const ok = pool.filter((s) => !this.lessonGate(s.id));
      if (ok.length) pool = ok;
    }
    if (!pool.length) return null;
    const qn = this.state.qn;
    const due = this.state.retry.find((r) => r.due <= qn && pool.some((s) => s.id === r.skill));
    if (due) {
      this.state.retry.splice(this.state.retry.indexOf(due), 1);
      return SKILLS[due.skill];
    }
    // A skill missed twice in a row rests for a few problems (the retry queue still brings it back),
    // so a struggling player gets variety instead of the same wall again and again.
    const open = pool.filter((s) => !this.isMastered(s.id));
    const fresh = open.filter((s) => !(this.entry(s.id).rest > qn));
    const frontier = fresh.length ? fresh : open;
    const mastered = pool.filter((s) => this.isMastered(s.id));
    if (frontier.length && (this.rng.next() < 0.78 || !mastered.length)) {
      return frontier.length > 1 && this.rng.next() < 0.3 ? frontier[1] : frontier[0];
    }
    if (mastered.length) {
      // Review: prefer skills that are older or shakier.
      const now = Date.now();
      const w = mastered.map((s) => {
        const e = this.entry(s.id);
        return 0.2 + (1 - e.m) * 2 + Math.min(1, (now - (e.t || 0)) / (3 * 86400000));
      });
      let r = this.rng.next() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < mastered.length; i++) { r -= w[i]; if (r <= 0) return mastered[i]; }
      return mastered[mastered.length - 1];
    }
    return pool[0];
  }

  // opts: { format: 'choice'|'input'|'any', minChoices, skills: [ids], maxTier, exclude }
  next(domain, opts = {}) {
    const format = opts.format ?? 'any';
    // A skill that keeps making the wrong kind of problem (all choices when typing is wanted) steps aside, so the
    // next pick in the domain gets its turn.
    const exclude = [...(opts.exclude ?? [])], misses = {};
    const miss = (id) => { misses[id] = (misses[id] ?? 0) + 1; if (misses[id] >= 3) exclude.push(id); };
    let problem = null;
    for (let attempt = 0; attempt < 40 && !problem; attempt++) {
      const skill = this.pickSkill(domain, { ...opts, exclude });
      if (!skill) break;
      let tier = this.tierFor(skill.id);
      if (opts.maxTier) tier = Math.min(tier, opts.maxTier);
      if (opts.minTier) tier = Math.max(tier, opts.minTier);
      const p = skill.gen(this.rng, tier);
      if (format === 'input' && p.format !== 'input') { miss(skill.id); continue; }
      if (format === 'choice' && (!p.choices || p.choices.length < (opts.minChoices ?? 3))) { miss(skill.id); continue; }
      if (format === 'choice') p.format = 'choice';
      p.domain = skill.domain;
      p.skillName = skill.name;
      problem = p;
    }
    return problem;
  }

  // The domain that most needs practice among those the player has seen.
  weakestDomain(domains = DOMAIN_ORDER) {
    let best = domains[0], score = Infinity;
    for (const d of domains) {
      const skills = this.domainSkills(d);
      if (!skills.length) continue;
      const avg = skills.reduce((a, s) => a + this.entry(s.id).m, 0) / Math.max(1, skills.length);
      const v = avg + this.rng.next() * 0.25;
      if (v < score) { score = v; best = d; }
    }
    return best;
  }

  // result: { solved, firstTry, hintUsed, attempts, given, ms }
  record(problem, result) {
    const e = this.entry(problem.skill);
    const wasMastered = this.isMastered(problem.skill);
    const score = result.firstTry ? (result.hintUsed ? 0.6 : 1) : result.solved ? 0.3 : 0;
    if (e.assumed && e.n === 0) {
      // A skill from an earlier grade, taken as known: a clean first answer confirms it, so it stays mastered and
      // comes back now and then for review, not four times in a row ahead of the book's own grade.
      e.confirmed = score >= 1 && e.m >= MASTERED;
      e.m = score >= 1 ? Math.max(e.m, 0.9) : score > 0.5 ? 0.8 : 0.5;
    } else {
      e.m += RATE * (score - e.m);
    }
    e.m = Math.max(0, Math.min(1, e.m));
    e.n += 1;
    e.c += result.firstTry && !result.hintUsed ? 1 : 0;
    e.s = result.firstTry ? e.s + 1 : 0;
    e.miss = result.firstTry ? 0 : (e.miss ?? 0) + 1;
    e.t = Date.now();
    e.assumed = false;
    const st = this.state;
    st.qn += 1;
    st.totals.problems += 1;
    if (result.firstTry && !result.hintUsed) st.totals.firstTry += 1;
    if (result.hintUsed) st.totals.hints += 1;
    // Local date, matching the chapter and patrol calendar (UTC would split an evening session across two days).
    const day = new Date().toLocaleDateString('en-CA');
    const d = (st.days[day] ||= { problems: 0, firstTry: 0 });
    d.problems += 1;
    if (result.firstTry && !result.hintUsed) d.firstTry += 1;
    if (!result.firstTry) {
      if (e.miss >= 2) e.rest = st.qn + 3;
      st.retry.push({ skill: problem.skill, due: st.qn + 2 + this.rng.int(0, 2) });
      if (st.retry.length > 12) st.retry.shift();
      st.mistakes.push({
        t: Date.now(), skill: problem.skill, text: plain(problem.text),
        given: result.firstGiven ?? result.given ?? '', correct: plain(problem.answerText),
      });
      if (st.mistakes.length > 40) st.mistakes.shift();
    }
    return { mastered: this.isMastered(problem.skill), newlyMastered: !wasMastered && this.isMastered(problem.skill), m: e.m };
  }

  // Warm-up placement: a miss at grade level means the easier skills in that domain need review.
  calibrate(domain, correct) {
    if (correct) return;
    for (const s of DOMAINS[domain].skills) {
      const e = this.entry(s.id);
      if (e.assumed && e.n === 0 && s.grade === this.grade - 1) e.m = 0.55;
    }
  }

  domainSummary(domain) {
    const skills = DOMAINS[domain].skills;
    const rows = skills.map((s) => {
      const e = this.entry(s.id);
      return {
        id: s.id, name: s.name, cc: s.cc, grade: s.grade, attempts: e.n, firstTry: e.c, m: e.m,
        mastered: this.isMastered(s.id), unlocked: this.isUnlocked(s), assumed: e.assumed && e.n === 0, inBook: this.inBook(s),
      };
    });
    const practiced = rows.filter((r) => r.unlocked);
    return {
      id: domain, ...DOMAINS[domain], rows,
      mastery: practiced.length ? practiced.filter((r) => r.mastered).length / practiced.length : 0,
    };
  }
}
