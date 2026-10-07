import { G } from './state.js';

const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab',
]);

const DEAD = 0.18;
const deadzone = (v) => (Math.abs(v) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD));

// Controller family from the vendor code in the gamepad id, for button glyphs on screen.
function padFamily(id = '') {
  if (/054c/i.test(id) || /playstation|dualsense|dualshock/i.test(id)) return 'ps';
  if (/057e/i.test(id) || /nintendo|switch/i.test(id)) return 'nin';
  return 'xbox';
}

// Keyboard, mouse or trackpad, touch, and game controllers all drive the same actions. The device used
// last sets `mode`, which decides which prompts and on-screen controls are shown.
export class Input {
  constructor() {
    this.held = new Set();
    this.pressedSet = new Set();
    this.mouse = { dragging: false, dx: 0, dy: 0, wheel: 0, lastMove: 0 };
    this.enabled = true;
    this.mode = 'keys';
    this.onMode = null;
    this.padAxis = { forward: 0, turn: 0 };
    this.touchAxis = { forward: 0, turn: 0 };
    this.touchSlide = false;
    this.padButtons = [];
    this.padKeys = new Map();
    this.family = 'xbox';
  }

  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.onMode?.(mode);
  }

  attach(canvas) {
    window.addEventListener('keydown', (e) => this.onKeyDown(e), { capture: true });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    window.addEventListener('blur', () => this.held.clear());
    document.addEventListener('visibilitychange', () => this.held.clear());
    window.addEventListener('pointerdown', (e) => this.setMode(e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'keys'), { capture: true });

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
    if (!e.fromPad) this.setMode('keys');
    const inField = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    // Activities get the raw event first (answer typing, menus).
    const top = G.top;
    if (top && top.onKey) top.onKey(e, inField);
    // A key that closed a dialog or menu must not also count as a fresh press for whatever is
    // underneath, or closing a chat with E would start the chat again.
    const consumed = G.top !== top;
    if (!inField && GAME_KEYS.has(e.code)) e.preventDefault();
    if (!e.repeat) {
      this.held.add(e.code);
      if (!consumed) this.pressedSet.add(e.code);
    }
  }

  down(...codes) { return codes.some((c) => this.held.has(c)); }
  pressed(...codes) { return codes.some((c) => this.pressedSet.has(c)); }
  consume(...codes) { codes.forEach((c) => this.pressedSet.delete(c)); }

  get forward() {
    const k = (this.down('KeyW', 'ArrowUp') ? 1 : 0) - (this.down('KeyS', 'ArrowDown') ? 1 : 0);
    return k || this.padAxis.forward || this.touchAxis.forward;
  }

  get turn() {
    const k = (this.down('KeyA', 'ArrowLeft') ? 1 : 0) - (this.down('KeyD', 'ArrowRight') ? 1 : 0);
    return k || this.padAxis.turn || this.touchAxis.turn;
  }

  get slide() { return this.down('ShiftLeft', 'ShiftRight') || this.touchSlide; }

  takeMouse() {
    const m = { dx: this.mouse.dx, dy: this.mouse.dy, wheel: this.mouse.wheel };
    this.mouse.dx = 0; this.mouse.dy = 0; this.mouse.wheel = 0;
    return m;
  }

  // A key press or release that comes from a controller or an on-screen button.
  key(code, down, key = code) {
    const target = document.activeElement && document.activeElement !== document.body ? document.activeElement : window;
    const ev = new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key, bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'fromPad', { value: true });
    target.dispatchEvent(ev);
    if (!down) this.held.delete(code);
  }

  // Press the focused button (synthetic Enter does not click buttons), or send Enter.
  activate() {
    const a = document.activeElement;
    if (a && a.tagName === 'BUTTON' && !a.disabled) { a.click(); return; }
    this.key('Enter', true, 'Enter');
    this.key('Enter', false, 'Enter');
  }

  // Controller buttons by position (standard mapping): 0 bottom, 1 right, 2 left, 3 top.
  pollPad() {
    const pads = navigator.getGamepads?.() ?? [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) {
      this.padAxis.forward = this.padAxis.turn = 0;
      for (const code of this.padKeys.values()) if (code) this.key(code, false);
      this.padKeys.clear();
      this.padButtons = [];
      return;
    }
    this.gamepad = gp;
    this.family = padFamily(gp.id);
    const f = -deadzone(gp.axes[1] ?? 0), t = -deadzone(gp.axes[0] ?? 0);
    const rx = deadzone(gp.axes[2] ?? 0), ry = deadzone(gp.axes[3] ?? 0);
    const pressedNow = gp.buttons.map((b) => b.pressed || b.value > 0.5);
    if (f || t || rx || ry || pressedNow.some(Boolean)) this.setMode('pad');
    this.padAxis.forward = f;
    this.padAxis.turn = t;
    this.mouse.dx += rx * 9;
    this.mouse.dy += ry * 6;

    // Free to move (exploring, floe hopping): A jumps, X uses. Otherwise A confirms and B goes back.
    const explore = G.inGame && G.player && !G.player.frozen;
    const quiz = !!G.top?.isQuiz || G.quiz?.isOpen;
    pressedNow.forEach((on, i) => {
      const was = this.padButtons[i];
      if (on && !was) {
        let code = null;
        switch (i) {
          case 0: if (explore) code = 'Space'; else this.activate(); break;
          case 1: code = explore ? 'ShiftLeft' : 'Escape'; break;
          case 2: code = explore ? 'KeyE' : quiz ? 'KeyH' : null; if (!code) this.activate(); break;
          case 3: code = explore ? 'KeyJ' : null; break;
          case 4: case 5: case 6: case 7: code = explore ? 'ShiftLeft' : null; break;
          case 8: code = explore ? 'KeyM' : null; break;
          case 9: code = 'Escape'; break;
          case 12: code = 'ArrowUp'; break;
          case 13: code = 'ArrowDown'; break;
          case 14: code = 'ArrowLeft'; break;
          case 15: code = 'ArrowRight'; break;
          default: break;
        }
        if (code) this.key(code, true, code.startsWith('Key') ? code.slice(3).toLowerCase() : code === 'Space' ? ' ' : code.startsWith('Shift') ? 'Shift' : code);
        this.padKeys.set(i, code);
      } else if (!on && was) {
        const code = this.padKeys.get(i);
        if (code) this.key(code, false);
        this.padKeys.delete(i);
      }
    });
    this.padButtons = pressedNow;
  }

  // A short buzz in the controller, felt rather than heard (off with reduced motion).
  rumble(strong = 0.3, weak = 0.5, ms = 90) {
    if (this.mode !== 'pad' || document.documentElement.classList.contains('reduce-motion')) return;
    this.gamepad?.vibrationActuator?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch?.(() => {});
  }

  endFrame() { this.pressedSet.clear(); }
}
