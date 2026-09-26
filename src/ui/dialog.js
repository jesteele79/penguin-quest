import { el, escapeHTML } from './dom.js';
import { portraitSVG } from './icons.js';

// Storybook dialog box with typewriter text.
export class DialogBox {
  constructor(root, audio) {
    this.audio = audio;
    this.portrait = el('div', { class: 'dlg-portrait' });
    this.name = el('div', { class: 'dlg-name' });
    this.text = el('div', { class: 'dlg-text' });
    this.more = el('div', { class: 'dlg-more', html: '<kbd>Enter</kbd> next' });
    this.box = el('div', { class: 'dlg panel', role: 'dialog', 'aria-live': 'polite' },
      this.portrait, el('div', { class: 'dlg-body' }, this.name, this.text), this.more);
    this.box.addEventListener('click', () => this.onClick && this.onClick());
    root.append(this.box);
    this.full = '';
    this.shown = 0;
    this.speed = 48;
  }

  show(line) {
    this.box.classList.add('show');
    this.name.textContent = line.who || '';
    this.name.style.setProperty('--accent', line.accent || '#ff5a4e');
    this.portrait.innerHTML = portraitSVG(line.portrait || {});
    this.portrait.classList.toggle('hidden', line.portrait === false);
    this.full = line.text;
    this.shown = 0;
    this.pitch = line.pitch || 520;
    this.text.innerHTML = '';
    this.more.classList.remove('ready');
    this.done = false;
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
