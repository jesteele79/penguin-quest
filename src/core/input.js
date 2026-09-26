import { G } from './state.js';

const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab',
]);

export class Input {
  constructor() {
    this.held = new Set();
    this.pressedSet = new Set();
    this.mouse = { dragging: false, dx: 0, dy: 0, wheel: 0, lastMove: 0 };
    this.enabled = true;
  }

  attach(canvas) {
    window.addEventListener('keydown', (e) => this.onKeyDown(e), { capture: true });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    window.addEventListener('blur', () => this.held.clear());
    document.addEventListener('visibilitychange', () => this.held.clear());

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.button !== 2) return;
      this.mouse.dragging = true;
      this.mouse.px = e.clientX; this.mouse.py = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.mouse.dragging) return;
      this.mouse.dx += e.clientX - this.mouse.px;
      this.mouse.dy += e.clientY - this.mouse.py;
      this.mouse.px = e.clientX; this.mouse.py = e.clientY;
      this.mouse.lastMove = performance.now();
    });
    const end = () => { this.mouse.dragging = false; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { this.mouse.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  }

  onKeyDown(e) {
    const inField = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    if (!inField && GAME_KEYS.has(e.code)) e.preventDefault();
    if (!e.repeat) {
      this.held.add(e.code);
      this.pressedSet.add(e.code);
    }
    // Activities get the raw event first (answer typing, menus).
    const top = G.top;
    if (top && top.onKey) top.onKey(e, inField);
  }

  down(...codes) { return codes.some((c) => this.held.has(c)); }
  pressed(...codes) { return codes.some((c) => this.pressedSet.has(c)); }
  consume(...codes) { codes.forEach((c) => this.pressedSet.delete(c)); }

  get forward() { return (this.down('KeyW', 'ArrowUp') ? 1 : 0) - (this.down('KeyS', 'ArrowDown') ? 1 : 0); }
  get turn() { return (this.down('KeyA', 'ArrowLeft') ? 1 : 0) - (this.down('KeyD', 'ArrowRight') ? 1 : 0); }
  get slide() { return this.down('ShiftLeft', 'ShiftRight'); }

  takeMouse() {
    const m = { dx: this.mouse.dx, dy: this.mouse.dy, wheel: this.mouse.wheel };
    this.mouse.dx = 0; this.mouse.dy = 0; this.mouse.wheel = 0;
    return m;
  }

  endFrame() { this.pressedSet.clear(); }
}
