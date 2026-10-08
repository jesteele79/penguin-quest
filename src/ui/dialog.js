import { el, escapeHTML, readable } from './dom.js';
import { portraitSVG, ICON } from './icons.js';
import { speak } from './quizpanel.js';

const SPEEDS = { slow: 28, normal: 48, fast: 85, instant: Infinity };

// Storybook dialog box with typewriter text.
export class DialogBox {
  constructor(root, audio) {
    this.audio = audio;
    this.portrait = el('div', { class: 'dlg-portrait' });
    this.name = el('div', { class: 'dlg-name' });
    this.text = el('div', { class: 'dlg-text' });
    this.more = el('div', { class: 'dlg-more', html: '<kbd>Enter</kbd> next <span class="dlg-arrow">▼</span>' });
    this.speakBtn = el('button', { class: 'btn ghost dlg-speak', type: 'button', 'aria-label': 'Read this aloud', html: ICON.speaker });
    this.speakBtn.addEventListener('click', (e) => { e.stopPropagation(); speak(this.full); });
    this.box = el('div', { class: 'dlg panel', role: 'dialog', 'aria-live': 'polite' },
      this.portrait, el('div', { class: 'dlg-body' }, this.name, this.text), this.speakBtn, this.more);
    this.box.addEventListener('click', () => this.onClick && this.onClick());
    root.append(this.box);
    this.full = '';
    this.shown = 0;
    this.speed = 48;
    this.autoRead = false;
    // Recent lines, newest first, for the journal's Chats page.
    this.log = [];
  }

  setSpeed(name) { this.speed = SPEEDS[name] ?? SPEEDS.normal; }

  show(line) {
    this.box.classList.add('show');
    this.name.textContent = line.who || '';
    this.name.style.setProperty('--accent', readable(line.accent || '#ff5a4e'));
    this.portrait.innerHTML = portraitSVG(line.portrait || {});
    this.portrait.classList.toggle('hidden', line.portrait === false);
    this.full = line.text;
    this.shown = 0;
    this.pitch = line.pitch || 520;
    this.text.innerHTML = '';
    this.more.classList.remove('ready');
    this.done = false;
    this.log.unshift({ who: line.who || '', text: line.text, accent: line.accent });
    if (this.log.length > 80) this.log.pop();
    if (this.autoRead) speak(line.text);
    if (this.speed === Infinity) this.finish();
  }

  hide() { this.box.classList.remove('show'); }

  // Returns true when the whole line is visible.
  update(dt) {
    if (this.done) return true;
    const before = Math.floor(this.shown);
    this.shown = Math.min(this.full.length, this.shown + dt * this.speed);
    const now = Math.floor(this.shown);
    if (now !== before) {
      this.text.innerHTML = escapeHTML(this.full.slice(0, now)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      if (now % 3 === 0 && /\w/.test(this.full[now - 1] || '')) this.audio?.play('blip', { pitch: this.pitch });
    }
    if (now >= this.full.length) {
      this.done = true;
      this.text.innerHTML = escapeHTML(this.full).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      this.more.classList.add('ready');
    }
    return this.done;
  }

  finish() { this.shown = this.full.length; this.update(0); }
}
