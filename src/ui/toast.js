import { el } from './dom.js';

export class Toasts {
  constructor(root) {
    this.stack = el('div', { class: 'toasts', 'aria-live': 'polite' });
    this.banner = el('div', { class: 'banner' });
    this.flash = el('div', { class: 'flash' });
    this.fade = el('div', { class: 'fade' });
    root.append(this.stack, this.banner, this.flash, this.fade);
  }

  toast(html, { icon = '', ms = 2600, kind = '' } = {}) {
    const t = el('div', { class: `toast ${kind}`, html: `${icon}<span>${html}</span>` });
    this.stack.append(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, ms);
    while (this.stack.children.length > 4) this.stack.firstChild.remove();
  }

  // Big centered celebration: title + subtitle in a region color. Banners wait their turn so a
  // medal result is not wiped out by the "quest complete" banner that follows it; countdowns
  // pass replace to cut in immediately.
  showBanner(title, sub = '', color = '#ffd166', ms = 3200, { replace = false } = {}) {
    const item = { title, sub, color, ms };
    this.bannerQueue = this.bannerQueue ?? [];
    if (replace) this.bannerQueue.length = 0;
    else if (this.bannerBusy) {
      if (this.bannerQueue.length < 3) this.bannerQueue.push(item);
      return;
    }
    this.playBanner(item);
  }

  playBanner({ title, sub, color, ms }) {
    this.banner.innerHTML = `<div class="banner-title" style="--c:${color}">${title}</div>${sub ? `<div class="banner-sub">${sub}</div>` : ''}`;
    this.banner.classList.remove('show');
    void this.banner.offsetWidth;
    this.banner.classList.add('show');
    this.bannerBusy = true;
    clearTimeout(this.bannerT);
    this.bannerT = setTimeout(() => {
      this.banner.classList.remove('show');
      const next = this.bannerQueue.shift();
      if (next) this.bannerT = setTimeout(() => this.playBanner(next), 350);
      else this.bannerBusy = false;
    }, ms);
  }

  screenFlash(color = '#ffffff', strength = 0.5) {
    this.flash.style.background = color;
    this.flash.style.setProperty('--s', strength);
    this.flash.classList.remove('go');
    void this.flash.offsetWidth;
    this.flash.classList.add('go');
  }

  // Fade to the night color and back, running `mid` while hidden.
  fadeThrough(mid, ms = 450) {
    return new Promise((resolve) => {
      this.fade.classList.add('on');
      setTimeout(async () => {
        if (mid) await mid();
        this.fade.classList.remove('on');
        setTimeout(resolve, ms);
      }, ms);
    });
  }
}
