// Things the player can use with E: NPCs, crystals, chests, the dock, the jetty...
export class Interactions {
  constructor() { this.list = []; }

  // spec: { id, pos: {x,z} | () => {x,z}, radius, label: () => string|null, action: () => void, priority? }
  add(spec) {
    const item = { radius: 3.4, priority: 0, ...spec };
    this.list.push(item);
    return item;
  }

  remove(item) {
    const i = this.list.indexOf(item);
    if (i >= 0) this.list.splice(i, 1);
  }

  nearest(px, pz, yaw) {
    let best = null, bestScore = Infinity;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    for (const it of this.list) {
      const p = typeof it.pos === 'function' ? it.pos() : it.pos;
      if (!p) continue;
      const dx = p.x - px, dz = p.z - pz;
      const d = Math.hypot(dx, dz);
      if (d > it.radius) continue;
      const label = it.label ? it.label() : 'Use';
      if (!label) continue;
      const facing = d > 0.01 ? (dx * fx + dz * fz) / d : 1;
      if (facing < -0.35 && d > 1.6) continue;
      const priority = typeof it.priority === 'function' ? it.priority() : it.priority;
      const score = d - facing * 1.2 - priority * 3;
      if (score < bestScore) { bestScore = score; best = { item: it, label }; }
    }
    return best;
  }
}
