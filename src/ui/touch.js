import { el } from './dom.js';

// On-screen controls for touchscreens (Chromebooks in tablet mode). Shown only while touch is the
// device in use and the penguin is free to move; the first key or controller press hides them.
//   Left side: a joystick that appears wherever the thumb lands (fixed pads drift under small thumbs).
//   Right side: drag to look around.  Buttons: jump, belly-slide (hold), menu.
const RADIUS = 56;

export class TouchControls {
  constructor(root, input, { onMenu, onJournal } = {}) {
    this.input = input;
    this.layer = el('div', { class: 'touch hidden' });
    this.zones = el('div', { class: 'touch hidden' });
    this.stickZone = el('div', { class: 'touch-zone left interactive' });
    this.lookZone = el('div', { class: 'touch-zone right interactive' });
    this.base = el('div', { class: 'touch-stick hidden' }, el('div', { class: 'touch-knob' }));
    this.knob = this.base.firstChild;
    this.jump = el('button', { class: 'touch-btn jump', type: 'button', 'aria-label': 'Jump', html: '<span>Jump</span>' });
    this.slide = el('button', { class: 'touch-btn slide', type: 'button', 'aria-label': 'Belly-slide', html: '<span>Slide</span>' });
    this.menu = el('button', { class: 'touch-btn menu', type: 'button', 'aria-label': 'Menu', html: '<span>☰</span>' });
    this.journal = el('button', { class: 'touch-btn journal', type: 'button', 'aria-label': 'Journal', html: '<span>📖</span>' });
    this.zones.append(this.stickZone, this.lookZone);
    this.layer.append(this.base, this.jump, this.slide, this.menu, this.journal);
    // The drag zones go beneath everything (world labels included) so a tap on a "Talk" bubble or a panel still lands; the buttons stay on top.
    root.prepend(this.zones);
    root.append(this.layer);

    // Joystick
    let stickId = null, ox = 0, oy = 0;
    this.stickZone.addEventListener('pointerdown', (e) => {
      if (stickId !== null) return;
      stickId = e.pointerId; ox = e.clientX; oy = e.clientY;
      this.stickZone.setPointerCapture?.(e.pointerId);
      this.base.style.transform = `translate(${ox}px, ${oy}px)`;
      this.base.classList.remove('hidden');
      this.knob.style.transform = 'translate(-50%, -50%)';
      e.preventDefault();
    });
    this.stickZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== stickId) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const d = Math.hypot(dx, dy);
      if (d > RADIUS) { dx *= RADIUS / d; dy *= RADIUS / d; }
      this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      const dead = 0.12;
      const nx = dx / RADIUS, ny = dy / RADIUS;
      const shape = (v) => (Math.abs(v) < dead ? 0 : (v - Math.sign(v) * dead) / (1 - dead));
      input.touchAxis.forward = -shape(ny);
      input.touchAxis.turn = -shape(nx) * 0.9;
    });
    const endStick = (e) => {
      if (e.pointerId !== stickId) return;
      stickId = null;
      input.touchAxis.forward = input.touchAxis.turn = 0;
      this.base.classList.add('hidden');
    };
    this.stickZone.addEventListener('pointerup', endStick);
    this.stickZone.addEventListener('pointercancel', endStick);

    // Look around
    let lookId = null, lx = 0, ly = 0;
    this.lookZone.addEventListener('pointerdown', (e) => { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; this.lookZone.setPointerCapture?.(e.pointerId); e.preventDefault(); });
    this.lookZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== lookId) return;
      input.mouse.dx += e.clientX - lx; input.mouse.dy += e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      input.mouse.lastMove = performance.now();
    });
    const endLook = (e) => { if (e.pointerId === lookId) lookId = null; };
    this.lookZone.addEventListener('pointerup', endLook);
    this.lookZone.addEventListener('pointercancel', endLook);

    // Buttons
    this.jump.addEventListener('pointerdown', (e) => { e.preventDefault(); input.key('Space', true, ' '); });
    this.jump.addEventListener('pointerup', () => input.key('Space', false, ' '));
    this.slide.addEventListener('pointerdown', (e) => { e.preventDefault(); input.touchSlide = true; });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) this.slide.addEventListener(ev, () => { input.touchSlide = false; });
    this.menu.addEventListener('click', () => onMenu?.());
    this.journal.addEventListener('click', () => onJournal?.());
  }

  // Shown when touch is the active device and the penguin can move.
  update(show) {
    if (show === this.shown) return;
    this.shown = show;
    this.layer.classList.toggle('hidden', !show);
    this.zones.classList.toggle('hidden', !show);
    if (!show) {
      this.input.touchAxis.forward = this.input.touchAxis.turn = 0;
      this.input.touchSlide = false;
      this.base.classList.add('hidden');
    }
  }
}
