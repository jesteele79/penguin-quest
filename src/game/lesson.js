// A lesson: a full-screen page over the paused world, led by a friend, that teaches one idea in four
// short stages (explore a model, see a picture, watch a worked example, finish one yourself).
import { G, popActivity } from '../core/state.js';
import { el, escapeHTML, readable } from '../ui/dom.js';
import { portraitSVG, ICON } from '../ui/icons.js';
import { toHTML } from '../math/fmt.js';
import { renderVisual } from '../math/visuals.js';
import { MODELS } from '../ui/manip.js';
import { LESSONS } from '../math/lessons.js';
import { checkAnswer } from '../math/check.js';
import { typedValue } from '../math/build.js';
import { speak } from '../ui/quizpanel.js';
import { SKILLS } from '../math/skills.js';
import { Rng } from '../core/rng.js';
import { NPCS, CAST } from './content.js';
import { BOOK } from '../books/current.js';
import { flavor } from '../math/theme.js';

const STAGES = ['Explore', 'See', 'Watch', 'Your turn'];
// Lessons were written once; their words follow the book being played, like its word problems do.
const themed = (v) => (v?.title ? { ...v, title: flavor(v.title) } : v);

export const lessonSeen = (id) => !!G.save.data.lessons?.[id];

// Lessons start by themselves for ideas above the child's grade the first time they come up, and after
// a first struggle (a worked solution) with any skill that has one. All of them can be replayed.
export function lessonDue(skillId, why) {
  if (!LESSONS[skillId] || lessonSeen(skillId)) return false;
  if (why === 'struggle') return true;
  return SKILLS[skillId].grade > G.tutor.grade;
}

export class LessonActivity {
  constructor(skillId, { onDone, replay = false } = {}) {
    this.skillId = skillId;
    this.lesson = LESSONS[skillId];
    this.onDone = onDone;
    this.replay = replay;
    this.stage = 0;
    this.watched = 0;
    this.tries = 0;
    this.freezesWorld = true;
    this.rng = new Rng();
  }

  enter() {
    G.player.frozen = true;
    G.hud.setPrompt(null);
    G.audio.play('open');
    const who = BOOK.mentors[this.lesson.mentor] ?? this.lesson.mentor;
    const mentor = NPCS[who] ?? CAST[who] ?? NPCS.professor;
    this.say = el('div', { class: 'lesson-say' });
    this.speakBtn = el('button', { class: 'btn ghost lesson-speak', type: 'button', 'aria-label': 'Read this aloud', html: ICON.speaker });
    this.speakBtn.addEventListener('click', () => speak(this.sayText));
    this.dots = el('div', { class: 'lesson-dots' });
    this.stageEl = el('div', { class: 'lesson-stage' });
    this.showBtn = el('button', { class: 'btn ghost', type: 'button', text: 'Show me' });
    this.showBtn.addEventListener('click', () => this.showMe());
    this.skipBtn = el('button', { class: 'btn ghost', type: 'button', html: 'Skip <kbd>Esc</kbd>' });
    this.skipBtn.addEventListener('click', () => this.finish(true));
    this.nextBtn = el('button', { class: 'btn primary', type: 'button', html: 'Next <kbd>Enter</kbd>' });
    this.nextBtn.addEventListener('click', () => this.next());
    this.panel = el('div', { class: 'panel lesson-panel', style: `--accent:${readable(mentor.accent)}` },
      el('header', { class: 'lesson-head' },
        el('div', {}, el('div', { class: 'lesson-kicker', text: this.replay ? 'Lesson' : 'New idea!' }), el('h1', { text: this.lesson.title })),
        this.dots),
      el('div', { class: 'lesson-talk' },
        el('div', { class: 'lesson-portrait', html: portraitSVG(mentor.portrait) }),
        el('div', { class: 'lesson-bubble' }, el('div', { class: 'lesson-name', text: mentor.name }), this.say),
        this.speakBtn),
      this.stageEl,
      el('footer', { class: 'lesson-foot' }, this.showBtn, this.skipBtn, el('span', { class: 'grow' }), this.nextBtn));
    this.root = el('div', { class: 'screen lesson-screen', role: 'dialog', 'aria-label': `Lesson: ${this.lesson.title}` }, this.panel);
    G.uiRoot.append(this.root);
    this.render();
    requestAnimationFrame(() => { this.root.classList.add('show'); this.nextBtn.focus(); });
  }

  exit() {
    this.model?.destroy();
    this.root.classList.remove('show');
    const r = this.root;
    setTimeout(() => r.remove(), 250);
  }

  talk(text) {
    text = flavor(text);
    this.sayText = text;
    this.say.innerHTML = toHTML(text);
    if (G.save.data.settings.readAloud) speak(text);
  }

  render() {
    this.dots.innerHTML = STAGES.map((s, i) => `<span class="${i < this.stage ? 'done' : i === this.stage ? 'cur' : ''}">${s}</span>`).join('');
    this.model?.destroy();
    this.model = null;
    this.stageEl.innerHTML = '';
    this.showBtn.classList.toggle('hidden', this.stage !== 0);
    const L = this.lesson;
    if (this.stage === 0) {
      this.talk(`${L.hook} ${L.explore.prompt}`);
      const Model = MODELS[L.explore.model];
      const cfg = { ...L.explore.cfg };
      // Rows are copied so a replay starts fresh.
      if (Array.isArray(cfg.rows)) cfg.rows = cfg.rows.map((r) => ({ ...r, name: flavor(r.name) }));
      if (L.explore.solve) cfg.solution = L.explore.solve;
      this.model = new Model(this.stageEl, cfg, () => this.explored());
      this.setNext(false);
      this.celebrated = false;
    } else if (this.stage === 1) {
      this.talk(L.see.text);
      const vis = renderVisual(themed(L.see.visual));
      if (vis) this.stageEl.append(el('div', { class: 'quiz-visual lesson-visual', html: vis }));
      this.setNext(true);
    } else if (this.stage === 2) {
      this.talk(L.watch.text);
      const vis = renderVisual(themed(L.watch.visual));
      if (vis) this.stageEl.append(el('div', { class: 'quiz-visual lesson-visual', html: vis }));
      this.stepsEl = el('ol', { class: 'lesson-steps' });
      this.stageEl.append(this.stepsEl);
      this.watched = 0;
      this.revealStep();
    } else if (this.stage === 3) {
      this.practice = L.practice(this.rng);
      this.talk('Your turn! The first steps are done. Finish the last one.');
      this.stageEl.append(el('ol', { class: 'lesson-steps all', html: this.practice.steps.map((s) => `<li>${toHTML(flavor(s))}</li>`).join('') }));
      this.input = el('input', { class: 'quiz-input lesson-input', type: 'text', autocomplete: 'off', inputmode: G.input.mode === 'touch' ? 'none' : 'text', 'aria-label': 'Your answer', placeholder: 'Type your answer' });
      const check = el('button', { class: 'btn primary', type: 'button', html: 'Check <kbd>Enter</kbd>' });
      check.addEventListener('click', () => this.check());
      this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (this.solved) this.next(); else this.check(); } });
      this.feedback = el('div', { class: 'quiz-feedback' });
      this.stageEl.append(el('div', { class: 'lesson-prompt', html: toHTML(flavor(this.practice.prompt)) }), el('div', { class: 'quiz-input-row' }, this.input, check), this.feedback);
      if (G.input.mode !== 'keys') this.stageEl.append(this.keypad());
      this.solved = false;
      this.tries = 0;
      this.setNext(false);
      setTimeout(() => this.input.focus(), 60);
    } else {
      this.dots.innerHTML = STAGES.map((s) => `<span class="done">${s}</span>`).join('');
      this.talk(`You learned **${L.title}**! ${this.replay ? 'Great review.' : 'Now try some on your own.'}`);
      this.stageEl.append(el('div', { class: 'lesson-done', html: `${ICON.star}<span>${escapeHTML(L.title)}</span>` }));
      this.nextBtn.innerHTML = 'Finish <kbd>Enter</kbd>';
      this.setNext(true);
    }
  }

  keypad() {
    const pad = el('div', { class: 'quiz-keypad' });
    for (const k of ['7', '8', '9', '/', '4', '5', '6', '.', '1', '2', '3', '−', '0', '⌫']) {
      const b = el('button', { class: 'key', type: 'button', text: k });
      b.addEventListener('click', () => {
        if (k === '⌫') this.input.value = this.input.value.slice(0, -1);
        else this.input.value += k === '−' ? '-' : k;
      });
      pad.append(b);
    }
    return pad;
  }

  setNext(on) {
    this.nextBtn.disabled = !on;
    if (on) this.nextBtn.focus();
  }

  explored() {
    if (!this.model?.done || this.celebrated) return;
    this.celebrated = true;
    G.audio.play('chime');
    this.talk(this.lesson.explore.success);
    this.setNext(true);
  }

  showMe() {
    if (this.stage !== 0 || !this.model) return;
    this.model.solve();
    this.explored();
  }

  revealStep() {
    const steps = this.lesson.watch.steps;
    if (this.watched < steps.length) {
      this.stepsEl.append(el('li', { class: 'fresh', html: toHTML(flavor(steps[this.watched])) }));
      this.watched += 1;
      G.audio.play('tab');
    }
    this.nextBtn.innerHTML = this.watched < steps.length ? 'Next step <kbd>Enter</kbd>' : 'Next <kbd>Enter</kbd>';
    this.setNext(true);
  }

  check() {
    if (this.solved) return;
    const v = this.input.value.trim();
    if (!v) return;
    const r = checkAnswer({ answer: this.practice.answer }, { text: v });
    if (r.correct) {
      this.solved = true;
      G.audio.play('correct');
      this.feedback.className = 'quiz-feedback good';
      this.feedback.innerHTML = '<span class="fb-ico">✓</span><b>Yes! You did it.</b>';
      this.setNext(true);
      return;
    }
    this.tries += 1;
    G.audio.play('wrong');
    this.feedback.className = 'quiz-feedback bad';
    if (this.tries < 2) {
      this.feedback.innerHTML = '<span class="fb-ico">↺</span><b>Not quite. Look at the steps again.</b>';
      this.input.select();
    } else {
      this.solved = true;
      this.feedback.innerHTML = `<b>The answer is ${escapeHTML(typedValue(this.practice.answer))}.</b> You will get lots more practice.`;
      this.setNext(true);
    }
  }

  next() {
    if (this.nextBtn.disabled) return;
    G.audio.play('click');
    if (this.stage === 2 && this.watched < this.lesson.watch.steps.length) { this.revealStep(); return; }
    if (this.stage >= 4) { this.finish(false); return; }
    this.stage += 1;
    this.nextBtn.innerHTML = 'Next <kbd>Enter</kbd>';
    this.render();
  }

  finish(skipped) {
    const lessons = (G.save.data.lessons ??= {});
    lessons[this.skillId] = { t: Date.now(), ...(skipped ? { skipped: true } : {}) };
    G.saveSoon();
    // The next problems practise the new idea while it is fresh.
    if (!this.replay && !skipped) G.tutor.state.retry.push({ skill: this.skillId, due: G.tutor.state.qn });
    popActivity(this);
    G.audio.play('close');
    this.onDone?.();
  }

  onKey(e, inField) {
    if (e.key === 'Escape') { e.preventDefault(); this.finish(true); return; }
    if (inField) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target?.tagName === 'BUTTON' && e.target !== this.nextBtn) return;
      e.preventDefault();
      this.next();
    }
  }
}
