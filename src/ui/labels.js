import * as THREE from 'three';
import { el } from './dom.js';

const _v = new THREE.Vector3();

// HTML labels pinned to 3D positions (answers on floes and fish, names over characters).
export class WorldLabels {
  constructor(root) {
    this.layer = el('div', { class: 'labels' });
    root.append(this.layer);
    this.items = new Set();
  }

  add(html, { cls = '', pos = new THREE.Vector3(), offsetY = 0, maxDist = 90 } = {}) {
    const node = el('div', { class: `wlabel ${cls}`, html });
    this.layer.append(node);
    const item = {
      node, pos: pos.clone(), offsetY, maxDist, visible: true,
      set(html2) { node.innerHTML = html2; },
      setPos(p) { this.pos.copy(p); },
      setClass(c, on = true) { node.classList.toggle(c, on); },
      remove: () => { node.remove(); this.items.delete(item); },
    };
    this.items.add(item);
    return item;
  }

  clear() { for (const i of [...this.items]) i.remove(); }

  update(camera, width, height) {
    for (const it of this.items) {
      _v.copy(it.pos);
      _v.y += it.offsetY;
      const dist = _v.distanceTo(camera.position);
      _v.project(camera);
      const show = it.visible && _v.z < 1 && _v.z > -1 && dist < it.maxDist && Math.abs(_v.x) < 1.2 && Math.abs(_v.y) < 1.2;
      it.node.style.display = show ? '' : 'none';
      if (!show) continue;
      const x = (_v.x * 0.5 + 0.5) * width, y = (-_v.y * 0.5 + 0.5) * height;
      const scale = Math.max(0.6, Math.min(1.15, 26 / dist));
      it.node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${scale})`;
      it.node.style.zIndex = String(1000 - Math.round(dist));
    }
  }
}
