import { el } from './dom.js';
import { ICON } from './icons.js';
import { toHTML, toSpeech } from '../math/fmt.js';
import { renderVisual } from '../math/visuals.js';
import { parseAnswer } from '../math/frac.js';

// On-screen keypad for touch and controllers: digits, decimal point, fraction bar, minus, a space
// (for mixed numbers like 2 1/4), R for remainders, backspace and check.
const KEYPAD = ['7', '8', '9', '/', '4', '5', '6', '.', '1', '2', '3', '−', '0', '␣', 'R', '⌫'];

const PRAISE = ['Brilliant!', 'You got it!', 'Fin-tastic!', 'Ice work!', 'Cool thinking!', 'Aurora-some!', 'Spot on!', 'Waddle-ful!', 'Snow problem!', 'Perfect!'];
const NUDGE = ['Not quite. Try again!', 'Close! Have another look.', 'Hmm, not yet. You can do it!', 'Almost there. Try once more!'];
const ALLOWED = /^[0-9.,/\- rR$%]$/;

// Read-aloud prefers a voice installed on the device, so it also works offline.
let voice;
let voiceVolume = 1;
export function setSpeechVolume(v) { voiceVolume = v; }
function pickVoice() {
  const all = window.speechSynthesis.getVoices();
  const en = all.filter((v) => /^en/i.test(v.lang));
  voice = en.find((v) => v.localService && /en-US/i.test(v.lang)) ?? en.find((v) => v.localService) ?? en[0] ?? null;
}

export function speak(markup, enabled = true) {
  if (!enabled || !('speechSynthesis' in window)) return;
  try {
    if (voice === undefined) { pickVoice(); window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(toSpeech(markup));
    if (voice) u.voice = voice;
    u.rate = 0.95; u.pitch = 1.05; u.volume = voiceVolume;
    window.speechSynthesis.speak(u);
  } catch { /* speech not available */ }
}

export class QuizPanel {
  constructor(root) {
    this.title = el('div', { class: 'quiz-title' });
    this.sub = el('div', { class: 'quiz-sub' });
    this.pips = el('div', { class: 'quiz-pips' });
    this.skill = el('div', { class: 'quiz-skill' });
    this.q = el('div', { class: 'quiz-q' });
    this.visual = el('div', { class: 'quiz-visual' });
    this.input = el('input', {
      class: 'quiz-input', id: 'quiz-answer', type: 'text', autocomplete: 'off', spellcheck: 'false',
      inputmode: 'text', 'aria-label': 'Your answer', placeholder: 'Type your answer',
    });
    this.submitBtn = el('button', { class: 'btn primary quiz-submit', type: 'button', html: 'Check <kbd>Enter</kbd>', onclick: () => this.submitInput() });
    this.inputRow = el('div', { class: 'quiz-input-row' }, this.input, this.submitBtn);
    // A live picture of what was typed, so "2 1/4" shows as a stacked mixed number before checking.
    this.preview = el('div', { class: 'quiz-preview', 'aria-hidden': 'true' });
    this.keypad = el('div', { class: 'quiz-keypad hidden' });
    for (const k of KEYPAD) {
      const b = el('button', { class: 'key', type: 'button', text: k === '␣' ? 'space' : k, 'aria-label': { '/': 'fraction bar', '.': 'point', '−': 'minus', '␣': 'space', '⌫': 'delete', R: 'remainder' }[k] ?? k });
      b.addEventListener('click', () => this.keyIn(k));
      this.keypad.append(b);
    }
    this.choices = el('div', { class: 'quiz-choices' });
    this.feedback = el('div', { class: 'quiz-feedback', 'aria-live': 'assertive' });
    this.hintBox = el('div', { class: 'quiz-hint' });
    this.steps = el('div', { class: 'quiz-steps' });
    this.contBtn = el('button', { class: 'btn primary quiz-cont', type: 'button', html: 'Got it! <kbd>Enter</kbd>', onclick: () => this.handlers.onContinue?.() });
    this.hintBtn = el('button', { class: 'btn ghost', type: 'button', html: `${ICON.bulb}<span>Hint <kbd>H</kbd></span>`, onclick: () => this.handlers.onHint?.() });
    this.readBtn = el('button', { class: 'btn ghost', type: 'button', html: `${ICON.speaker}<span>Read to me</span>`, onclick: () => this.readAloud() });
    this.closeBtn = el('button', { class: 'btn ghost quiz-close', type: 'button', html: '<span>Leave</span> <kbd>Esc</kbd>', onclick: () => this.handlers.onClose?.() });
    this.panel = el('section', { class: 'quiz panel', role: 'dialog', 'aria-label': 'Math challenge' },
      el('header', { class: 'quiz-head' }, el('div', {}, this.title, this.sub), this.pips),
      el('div', { class: 'quiz-body' },
        this.skill, this.q, this.visual,
        el('div', { class: 'quiz-answer' }, this.inputRow, this.preview, this.keypad, this.choices),
        this.feedback, this.hintBox, this.steps, this.contBtn),
      el('footer', { class: 'quiz-foot' }, this.hintBtn, this.readBtn, this.closeBtn));
    root.append(this.panel);
    this.uiRoot = root;
    this.handlers = {};
    this.problem = null;
    this.locked = false;

    this.input.addEventListener('input', () => this.updatePreview());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); this.handlers.onHint?.(); return; }
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (this.state === 'reveal') this.handlers.onContinue?.(); else this.submitInput(); return; }
      if (e.key === 'Escape') return;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !ALLOWED.test(e.key)) e.preventDefault();
    });
  }

  open({ title, subtitle = '', color = '#4dffa0', layout = 'side', closable = true, readAloud = false } = {}) {
    this.title.textContent = title;
    this.sub.textContent = subtitle;
    this.panel.style.setProperty('--accent', color);
    this.panel.className = `quiz panel layout-${layout}`;
    this.closeBtn.classList.toggle('hidden', !closable);
    this.autoRead = readAloud;
    this.panel.classList.add('show');
  }

  close() {
    this.panel.classList.remove('show');
    this.input.blur();
    if ('speechSynthesis' in window) try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }

  get isOpen() { return this.panel.classList.contains('show'); }

  // 'keys' (keyboard), 'touch' or 'pad': the keypad appears for touch and controllers.
  setDevice(mode) {
    this.device = mode;
    const pad = mode !== 'keys';
    this.input.setAttribute('inputmode', mode === 'touch' ? 'none' : 'text');
    this.keypad.classList.toggle('hidden', !pad || this.format !== 'input');
  }

  keyIn(k) {
    if (this.format !== 'input' || this.state !== 'answering' || this.input.disabled) return;
    const v = this.input.value;
    if (k === '⌫') this.input.value = v.slice(0, -1);
    else if (k === '␣') this.input.value = v.endsWith(' ') || !v ? v : `${v} `;
    else this.input.value = v + (k === '−' ? '-' : k);
    this.updatePreview();
  }

  updatePreview() {
    const v = this.input.value.trim();
    const p = v ? parseAnswer(v) : null;
    let html = '';
    if (p?.kind === 'fraction') html = toHTML(`{${p.value.n < 0 ? '-' : ''}${p.num}/${p.den}}`);
    else if (p?.kind === 'mixed') html = toHTML(`{${p.whole} ${p.num}/${p.den}}`);
    else if (p?.kind === 'remainder') html = `${p.q} <small>remainder</small> ${p.r}`;
    this.preview.innerHTML = html ? `<span class="pv-label">You wrote</span> ${html}` : '';
  }

  setProgress(done, total) {
    if (!total) { this.pips.innerHTML = ''; return; }
    this.pips.innerHTML = Array.from({ length: total }, (_, i) => `<span class="pip ${i < done ? 'on' : ''}"></span>`).join('');
    this.pips.setAttribute('aria-label', `${done} of ${total} done`);
  }

  // format: 'input' | 'choice' | 'none' (answers happen in the 3D world)
  showProblem(problem, { format = problem.format, showSkill = true } = {}) {
    this.problem = problem;
    this.format = format;
    this.state = 'answering';
    this.locked = false;
    this.panel.classList.remove('is-correct', 'is-reveal');
    this.skill.textContent = showSkill ? problem.skillName || '' : '';
    this.q.innerHTML = toHTML(problem.text);
    const vis = renderVisual(problem.visual);
    this.visual.innerHTML = vis;
    this.visual.classList.toggle('hidden', !vis);
    this.feedback.innerHTML = '';
    this.feedback.className = 'quiz-feedback';
    this.hintBox.innerHTML = '';
    this.hintBox.classList.add('hidden');
    this.steps.innerHTML = '';
    this.steps.classList.add('hidden');
    this.contBtn.classList.add('hidden');
    this.hintBtn.disabled = false;
    this.inputRow.classList.toggle('hidden', format !== 'input');
    this.choices.classList.toggle('hidden', format !== 'choice');
    this.keypad.classList.toggle('hidden', format !== 'input' || !this.device || this.device === 'keys');
    this.preview.innerHTML = '';
    if (format === 'input') {
      this.input.value = '';
      this.input.disabled = false;
      this.submitBtn.disabled = false;
      setTimeout(() => this.input.focus(), 30);
    } else if (format === 'choice') {
      this.choices.innerHTML = '';
      this.choices.classList.toggle('two', problem.choices.length <= 2);
      problem.choices.forEach((c, i) => {
        const b = el('button', { class: 'choice', type: 'button', 'data-idx': i, html: `<span class="key">${i + 1}</span><span class="label">${toHTML(c.label)}</span>` });
        b.addEventListener('click', () => this.pick(i));
        this.choices.append(b);
      });
    }
    this.panel.querySelector('.quiz-body').scrollTop = 0;
    if (this.autoRead) this.readAloud();
  }

  readAloud() { if (this.problem) speak(this.problem.text); }

  submitInput() {
    if (this.locked || this.format !== 'input' || this.state !== 'answering') return;
    const v = this.input.value.trim();
    if (!v) { this.input.focus(); return; }
    this.handlers.onSubmit?.({ text: v });
  }

  pick(i) {
    if (this.locked || this.format !== 'choice' || this.state !== 'answering') return;
    const b = this.choices.children[i];
    if (!b || b.disabled) return;
    this.handlers.onSubmit?.({ choice: i });
  }

  // A burst of sparkles from the right answer (transform and opacity only, cheap on any GPU).
  burst() {
    if (document.documentElement.classList.contains('reduce-motion')) return;
    const anchor = this.format === 'choice' ? this.choices.querySelector('.choice.right') : this.format === 'input' ? this.inputRow : this.feedback;
    const r = (anchor ?? this.panel).getBoundingClientRect();
    const layer = el('div', { class: 'burst', style: `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px` });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.4, d = 90 + Math.random() * 90;
      layer.append(el('i', { style: `--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d * 0.7).toFixed(0)}px;--d:${(Math.random() * 0.15).toFixed(2)}s`, class: `c${i % 4}` }));
    }
    this.uiRoot.append(layer);
    setTimeout(() => layer.remove(), 900);
  }

  showCorrect(extra = '') {
    this.state = 'correct';
    this.locked = true;
    this.panel.classList.remove('pop');
    void this.panel.offsetWidth;
    this.panel.classList.add('is-correct', 'pop');
    const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    this.feedback.className = 'quiz-feedback good';
    this.feedback.innerHTML = `<span class="fb-ico" aria-hidden="true">✓</span><b>${msg}</b> ${extra}`;
    if (this.format === 'choice') {
      [...this.choices.children].forEach((b) => { b.disabled = true; });
      const idx = this.problem.choices.findIndex((c) => c.correct);
      this.choices.children[idx]?.classList.add('right');
    } else if (this.format === 'input') {
      this.input.disabled = true;
      this.submitBtn.disabled = true;
    }
    this.burst();
  }

  showWrong({ why, message, choiceIndex } = {}) {
    this.state = 'answering';
    this.feedback.className = 'quiz-feedback bad';
    const nudge = message || NUDGE[Math.floor(Math.random() * NUDGE.length)];
    this.feedback.innerHTML = `<span class="fb-ico" aria-hidden="true">↺</span><b>${nudge}</b>${why ? `<div class="why">${toHTML(why)}</div>` : ''}`;
    this.panel.classList.remove('shake');
    void this.panel.offsetWidth;
    this.panel.classList.add('shake');
    if (this.format === 'choice' && choiceIndex !== undefined) {
      const b = this.choices.children[choiceIndex];
      if (b) { b.disabled = true; b.classList.add('wrong'); }
    }
    if (this.format === 'input') {
      this.input.select();
      this.input.focus();
    }
  }

  showForm(message) {
    this.state = 'answering';
    this.feedback.className = 'quiz-feedback info';
    this.feedback.innerHTML = `<b>${message}</b>`;
    if (this.format === 'input') { this.input.focus(); this.input.select(); }
  }

  showHint(problem = this.problem) {
    this.hintBox.classList.remove('hidden');
    const vis = renderVisual(problem.hintVisual);
    this.hintBox.innerHTML = `<div class="hint-label">${ICON.bulb} Hint</div><div>${toHTML(problem.hint)}</div>${vis ? `<div class="quiz-visual small">${vis}</div>` : ''}`;
    this.hintBtn.disabled = true;
    if (this.format === 'input') this.input.focus();
  }

  showReveal(problem = this.problem, lead = "Let's work through it together:") {
    this.state = 'reveal';
    this.locked = false;
    this.panel.classList.add('is-reveal');
    this.feedback.className = 'quiz-feedback info';
    this.feedback.innerHTML = `<b>${lead}</b>`;
    // The worked solution replaces the hint (it repeats the hint's model), so the question, the steps
    // and the answer all fit on screen together; the question stays pinned while the steps are read.
    const vis = renderVisual(problem.hintVisual);
    this.hintBox.classList.add('hidden');
    if (vis) this.visual.classList.add('hidden');
    this.steps.innerHTML = `${vis ? `<div class="quiz-visual small">${vis}</div>` : ''}<ol>${problem.steps.map((s) => `<li>${toHTML(s)}</li>`).join('')}</ol><div class="answer-line">Answer: <b>${toHTML(problem.answerText)}</b></div>`;
    this.steps.classList.remove('hidden');
    this.contBtn.classList.remove('hidden');
    this.hintBtn.disabled = true;
    if (this.format === 'choice') {
      [...this.choices.children].forEach((b) => { b.disabled = true; });
      const idx = problem.choices.findIndex((c) => c.correct);
      this.choices.children[idx]?.classList.add('right');
    } else if (this.format === 'input') {
      this.input.disabled = true;
      this.submitBtn.disabled = true;
    }
    setTimeout(() => this.contBtn.focus(), 40);
  }

  // Keyboard handling while the panel is active. Returns true if it used the key.
  handleKey(e, inField) {
    if (!this.isOpen) return false;
    if (e.key === 'Escape') { this.handlers.onClose?.(); return true; }
    if (inField) return false;
    if (this.state === 'reveal' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.handlers.onContinue?.(); return true; }
    if (this.state === 'correct' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.handlers.onContinue?.(); return true; }
    if (e.key === 'h' || e.key === 'H') { this.handlers.onHint?.(); return true; }
    if (this.format === 'choice' && /^[1-9]$/.test(e.key)) { this.pick(Number(e.key) - 1); return true; }
    // Arrow keys (and a controller's D-pad) move between answer buttons.
    if (/^Arrow/.test(e.key) && this.state === 'answering') {
      const items = [...this.panel.querySelectorAll(this.format === 'choice' ? '.choice:not([disabled])' : '.quiz-keypad .key, .quiz-submit')];
      if (items.length) {
        const cols = this.format === 'choice' ? 2 : 4;
        let i = items.indexOf(document.activeElement);
        if (i < 0) i = 0;
        else i += { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key];
        items[Math.max(0, Math.min(items.length - 1, i))].focus();
        e.preventDefault();
        return true;
      }
    }
    if (this.format === 'input' && this.state === 'answering' && e.key.length === 1 && ALLOWED.test(e.key)) {
      this.input.focus();
      return false;
    }
    return false;
  }
}
