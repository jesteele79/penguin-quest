// Playtest helpers for dev builds only (window.T). Drives the game through G.dev without rAF.
import { G } from '../core/state.js';

const yieldT = () => new Promise((r) => setTimeout(r, 0));
const strip = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 120);

export function installHarness() {
  const T = {
    async adv(max = 150) {
      const log = [];
      for (let i = 0; i < max; i++) {
        await yieldT();
        const top = G.top;
        const n = top?.constructor.name;
        if (n === 'DialogActivity') {
          const l = top.lines[top.i];
          log.push((l.who ? `${l.who}: ` : '') + strip(l.text ?? l));
          if (!G.dialog.done) G.dialog.finish();
          top.advance();
          G.dev.step(0.05);
        } else if (n === 'Cutscene') G.dev.step(0.5);
        else if (n === 'LessonActivity') log.push(`lesson ${await T.lesson()}`);
        else break;
      }
      return log;
    },

    // Works through a lesson the way a child would: try the model, read on, answer "Your turn".
    async lesson() {
      const top = G.top;
      if (top?.constructor.name !== 'LessonActivity') return null;
      const id = top.skillId;
      for (let i = 0; i < 40 && G.top === top; i++) {
        if (top.stage === 0 && top.model && !top.model.done) top.showMe();
        else if (top.stage === 3 && !top.solved) { top.input.value = G.dev.typed(top.practice.answer); top.check(); }
        else top.next();
        G.dev.step(0.05);
        await yieldT();
      }
      return id;
    },

    // Answers standard quiz panels, taking any lesson that comes up on the way. wrongEvery = n answers every nth problem wrong first.
    async solve(max = 60, wrongEvery = 0) {
      const log = [];
      let k = 0;
      for (let i = 0; i < max; i++) {
        await yieldT();
        if (G.top?.constructor.name === 'LessonActivity') { log.push(`lesson ${await T.lesson()}`); continue; }
        const top = G.top;
        if (!top || !top.problem || !G.quiz.isOpen) break;
        const p = top.problem;
        if (G.quiz.state === 'answering') {
          k += 1;
          const wrong = wrongEvery && k % wrongEvery === 0;
          log.push(`${p.skill}${wrong ? ' [WRONG]' : ''}: ${strip(p.text)} => ${strip(p.answerText)}`);
          if (G.quiz.format === 'choice') {
            if (wrong) { G.quiz.pick(p.choices.findIndex((c) => !c.correct)); await yieldT(); }
            G.quiz.pick(p.choices.findIndex((c) => c.correct));
          } else {
            if (wrong) { G.quiz.input.value = '99999'; G.quiz.submitInput(); await yieldT(); }
            G.quiz.input.value = G.dev.typed(p.answer);
            G.quiz.submitInput();
          }
        }
        await yieldT();
        if (G.quiz.state === 'correct' || G.quiz.state === 'reveal') top.continue();
        G.dev.step(0.05);
      }
      return log;
    },

    async walkTo(x, z, { maxT = 40, near = 2.2, slide = false } = {}) {
      const P = G.player;
      for (let t = 0; t < maxT; t += 0.2) {
        const dx = x - P.pos.x, dz = z - P.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < near) return { ok: true, d: +d.toFixed(2), t: +t.toFixed(1) };
        P.yaw = Math.atan2(dx, dz);
        G.dev.step(0.2, { keys: slide ? ['KeyW', 'ShiftLeft'] : ['KeyW'] });
        await yieldT();
        if (!(G.top?.constructor.name === 'ExploreActivity')) return { ok: false, interrupted: G.top?.constructor.name, d };
      }
      return { ok: false, d: +Math.hypot(x - P.pos.x, z - P.pos.z).toFixed(2), pos: P.pos.toArray().map((v) => +v.toFixed(1)) };
    },

    tp(x, z, yaw = 0) { G.dev.tp(x, z, yaw); },

    async use() {
      G.dev.key('KeyE');
      await yieldT();
      G.dev.step(0.3);
      await yieldT();
      return { top: G.top?.constructor.name, prompt: G.hud.prompt.textContent };
    },

    async talkTo(id) {
      const n = G.npcs.get(id);
      const w = await T.walkTo(n.pos.x, n.pos.z, { near: 3 });
      const u = await T.use();
      const log = await T.adv();
      await yieldT();
      return { w, u, log };
    },

    async key(code, secs = 0.2) {
      G.dev.key(code);
      await yieldT();
      G.dev.step(secs);
      await yieldT();
    },

    async settle(secs = 1) {
      for (let i = 0; i < Math.ceil(secs / 0.25); i++) { G.dev.step(0.25); await yieldT(); }
    },

    state() {
      const d = G.save.data;
      return {
        top: G.top?.constructor.name,
        acts: G.activities.map((a) => a.constructor.name).join('>'),
        obj: G.hud.objText.textContent,
        coins: d.coins,
        pos: G.player.pos.toArray().map((v) => +v.toFixed(1)),
        q: Object.fromEntries(Object.entries(d.q).map(([k, v]) => [k, v.done ? 'done' : v.step])),
      };
    },

    errors: [],
  };
  window.addEventListener('error', (e) => T.errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => T.errors.push(String(e.reason?.stack ?? e.reason)));
  window.T = T;
}
