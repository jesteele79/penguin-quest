import { el } from './dom.js';
import { ICON, portraitSVG } from './icons.js';
import { REGION_COLORS } from '../core/materials.js';

const CRYSTAL_ORDER = ['lake', 'grove', 'huts', 'cave', 'ridge'];
const CRYSTAL_NAMES = { lake: 'Glimmer Lake', grove: 'Crystal Grove', huts: 'Heart Huts', cave: 'Glacier Cave', ridge: 'Gloom Ridge' };

export class HUD {
  constructor(root) {
    this.root = el('div', { class: 'hud', 'aria-live': 'polite' });
    root.append(this.root);

    this.portrait = el('div', { class: 'hud-portrait', html: portraitSVG() });
    this.nameEl = el('div', { class: 'hud-name' });
    this.heartsEl = el('div', { class: 'hud-hearts' });
    this.coinsEl = el('span', { class: 'hud-num' });
    this.flakesEl = el('span', { class: 'hud-num' });
    this.starsEl = el('span', { class: 'hud-num' });
    this.plate = el('div', { class: 'hud-plate' },
      this.portrait,
      el('div', { class: 'hud-plate-body' },
        this.nameEl,
        el('div', { class: 'hud-row' }, this.heartsEl,
          el('span', { class: 'hud-chip', title: 'Fish coins', html: ICON.fish }, this.coinsEl),
          el('span', { class: 'hud-chip', title: 'Aurora Stars', html: ICON.star }, this.starsEl),
          el('span', { class: 'hud-chip', title: 'Golden snowflakes', html: ICON.flake }, this.flakesEl))));
    this.root.append(this.plate);

    this.objText = el('div', { class: 'hud-obj-text' });
    this.objDist = el('div', { class: 'hud-obj-dist' });
    this.objective = el('div', { class: 'hud-objective' }, el('div', { class: 'hud-obj-label', text: 'Next' }), this.objText, this.objDist);
    this.root.append(this.objective);

    this.mini = el('canvas', { class: 'hud-minimap', width: 300, height: 300, 'aria-label': 'Minimap' });
    this.crystalRow = el('div', { class: 'hud-crystals' });
    this.root.append(el('div', { class: 'hud-right' }, el('div', { class: 'hud-mini-wrap' }, this.mini), this.crystalRow));

    this.prompt = el('div', { class: 'hud-prompt' });
    this.root.append(this.prompt);

    this.controls = el('div', { class: 'hud-controls', html: `
      <div><kbd>W</kbd><kbd>↑</kbd> walk</div>
      <div><kbd>A</kbd><kbd>D</kbd> turn</div>
      <div><kbd>Space</kbd> jump</div>
      <div><kbd>Shift</kbd> belly-slide</div>
      <div><kbd>E</kbd> talk / use</div>
      <div><kbd>J</kbd> journal · <kbd>M</kbd> map</div>
      <div><kbd>Esc</kbd> menu · <kbd>C</kbd> hide this</div>` });
    this.root.append(this.controls);

    this.miniCtx = this.mini.getContext('2d');
    this.last = {};
  }

  setVisible(v) { this.root.classList.toggle('hidden', !v); }

  setPlayer({ name, hearts, maxHearts, coins, stars, flakes, flakesTotal, scarfColor, hat }) {
    if (name !== this.last.name) { this.nameEl.textContent = name; this.last.name = name; }
    if (scarfColor !== this.last.scarf || hat !== this.last.hat) {
      this.portrait.innerHTML = portraitSVG({ accent: scarfColor, hat: hat === 'beanie' ? 'beanie' : hat === 'crown' ? 'crown' : null });
      this.last.scarf = scarfColor; this.last.hat = hat;
    }
    const hk = maxHearts ? `${hearts}/${maxHearts}` : '';
    if (hk !== this.last.hearts) {
      this.heartsEl.innerHTML = maxHearts ? Array.from({ length: maxHearts }, (_, i) => (i < hearts ? ICON.heart : ICON.heartEmpty)).join('') : '';
      this.heartsEl.classList.toggle('hidden', !maxHearts);
      if (maxHearts) this.heartsEl.setAttribute('aria-label', `${hearts} of ${maxHearts} warmth hearts`);
      if (this.last.hearts) this.bump(this.heartsEl);
      this.last.hearts = hk;
    }
    if (stars !== this.last.stars) {
      this.starsEl.textContent = stars;
      if (this.last.stars !== undefined) this.bump(this.starsEl.parentElement);
      this.last.stars = stars;
    }
    if (coins !== this.last.coins) {
      this.coinsEl.textContent = coins;
      if (this.last.coins !== undefined) this.bump(this.coinsEl.parentElement);
      this.last.coins = coins;
    }
    const fk = `${flakes}/${flakesTotal}`;
    if (fk !== this.last.flakes) {
      this.flakesEl.textContent = fk;
      if (this.last.flakes !== undefined) this.bump(this.flakesEl.parentElement);
      this.last.flakes = fk;
    }
  }

  bump(node) {
    node.classList.remove('bump');
    void node.offsetWidth;
    node.classList.add('bump');
  }

  setObjective(text, dist) {
    if (text !== this.last.obj) {
      this.objText.textContent = text || '';
      this.objective.classList.toggle('hidden', !text);
      if (text && this.last.obj) this.bump(this.objective);
      this.last.obj = text;
    }
    const d = dist == null || dist < 6 ? '' : `${Math.round(dist)} m`;
    if (d !== this.last.dist) { this.objDist.textContent = d; this.last.dist = d; }
  }

  setPrompt(text) {
    if (text === this.last.prompt) return;
    this.last.prompt = text;
    if (!text) { this.prompt.classList.remove('show'); return; }
    this.prompt.innerHTML = `<kbd>E</kbd> ${text}`;
    this.prompt.classList.add('show');
  }

  setCrystals(crystals) {
    const key = CRYSTAL_ORDER.map((k) => (crystals[k] ? 1 : 0)).join('');
    if (key === this.last.crystals) return;
    this.crystalRow.innerHTML = CRYSTAL_ORDER.map((k) => `<span class="hud-crystal" title="${CRYSTAL_NAMES[k]}${crystals[k] ? ' — restored' : ''}">${ICON.crystal(REGION_COLORS[k].css, !!crystals[k])}</span>`).join('');
    if (this.last.crystals) this.bump(this.crystalRow);
    this.last.crystals = key;
  }

  showControls(v) { this.controls.classList.toggle('hidden', !v); }

  // mapImage: canvas of the whole world; world spans [-half, half] on both axes.
  drawMinimap(mapImage, half, px, pz, yaw, markers) {
    const c = this.miniCtx, W = this.mini.width, R = W / 2;
    const span = 70; // world units from center to edge
    const s = R / span;
    c.clearRect(0, 0, W, W);
    c.save();
    c.beginPath(); c.arc(R, R, R - 3, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#0b1033'; c.fillRect(0, 0, W, W);
    c.translate(R, R);
    c.rotate(Math.PI + yaw);
    const pxPerUnit = mapImage.width / (half * 2);
    c.drawImage(mapImage, (px + half) * pxPerUnit - span * 1.5 * pxPerUnit, (pz + half) * pxPerUnit - span * 1.5 * pxPerUnit, span * 3 * pxPerUnit, span * 3 * pxPerUnit, -span * 1.5 * s, -span * 1.5 * s, span * 3 * s, span * 3 * s);
    for (const m of markers) {
      let dx = (m.x - px) * s, dz = (m.z - pz) * s;
      const d = Math.hypot(dx, dz);
      const edge = R - 14;
      const clamped = d > edge;
      if (clamped && !m.edge) continue;
      if (clamped) { dx *= edge / d; dz *= edge / d; }
      c.save();
      c.translate(dx, dz);
      c.rotate(-(Math.PI + yaw));
      drawMarker(c, m.kind, clamped, m.color);
      c.restore();
    }
    // North tag on the rim, in world orientation.
    c.save();
    c.translate(0, -(R - 20));
    c.rotate(-(Math.PI + yaw));
    c.fillStyle = 'rgba(11,16,51,0.85)';
    c.beginPath(); c.arc(0, 0, 13, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd166';
    c.font = '700 17px Fredoka, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('N', 0, 1);
    c.restore();
    c.restore();
    // player arrow (always pointing up)
    c.save();
    c.translate(R, R);
    c.fillStyle = '#ff5a4e'; c.strokeStyle = '#fff'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, -14); c.lineTo(10, 10); c.lineTo(0, 5); c.lineTo(-10, 10); c.closePath();
    c.fill(); c.stroke();
    c.restore();
    c.strokeStyle = 'rgba(190,210,255,0.8)'; c.lineWidth = 5;
    c.beginPath(); c.arc(R, R, R - 3, 0, Math.PI * 2); c.stroke();
  }
}

export function drawMarker(c, kind, faded = false, color) {
  c.globalAlpha = faded ? 0.85 : 1;
  switch (kind) {
    case 'objective': {
      c.fillStyle = '#ffd166'; c.strokeStyle = '#3a2a00'; c.lineWidth = 2.5;
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 6 : 14, a = (i * Math.PI) / 5 - Math.PI / 2;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath(); c.fill(); c.stroke();
      break;
    }
    case 'npc':
      c.fillStyle = '#ffffff'; c.strokeStyle = '#1e2746'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, 7, 0, Math.PI * 2); c.fill(); c.stroke();
      break;
    case 'newquest':
      c.fillStyle = '#4db8ff'; c.strokeStyle = '#ffffff'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#ffffff'; c.font = '800 13px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('!', 0, 1);
      break;
    case 'site':
      c.fillStyle = 'rgba(255, 209, 102, 0.9)'; c.strokeStyle = '#3a2a00'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill(); c.stroke();
      break;
    case 'crystal':
      c.fillStyle = color || '#8a80c0'; c.strokeStyle = '#fff'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, -11); c.lineTo(7, 0); c.lineTo(0, 11); c.lineTo(-7, 0); c.closePath(); c.fill(); c.stroke();
      break;
    case 'chest':
      c.fillStyle = '#c98a3c'; c.strokeStyle = '#ffd166'; c.lineWidth = 2;
      c.fillRect(-7, -5, 14, 10); c.strokeRect(-7, -5, 14, 10);
      break;
    case 'gloom':
      c.fillStyle = '#6a4ab8'; c.strokeStyle = '#ffe27a'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill(); c.stroke();
      break;
    default:
      c.fillStyle = '#9fb3ff';
      c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}
