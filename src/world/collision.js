// Circle colliders on the XZ plane plus walkable platforms (docks, floes).
const CELL = 10;

export class Collision {
  constructor() {
    this.grid = new Map();
    this.dynamic = [];
    this.platforms = [];
  }

  key(i, j) { return i * 100003 + j; }

  addCircle(x, z, r, tag = null) {
    const c = { x, z, r, tag, active: true };
    const i0 = Math.floor((x - r) / CELL), i1 = Math.floor((x + r) / CELL);
    const j0 = Math.floor((z - r) / CELL), j1 = Math.floor((z + r) / CELL);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const k = this.key(i, j);
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k).push(c);
      }
    }
    return c;
  }

  // Ring of circles, leaving a gap centered on gapAngle (radians, 0 = +x, measured toward +z).
  addRing(cx, cz, radius, thickness, gapAngle = null, gapWidth = 0, tag = null) {
    const n = Math.ceil((Math.PI * 2 * radius) / (thickness * 1.2));
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      if (gapAngle !== null) {
        let d = Math.abs(((a - gapAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (d < gapWidth / 2) continue;
      }
      out.push(this.addCircle(cx + Math.cos(a) * radius, cz + Math.sin(a) * radius, thickness, tag));
    }
    return out;
  }

  addDynamic(obj) { this.dynamic.push(obj); return obj; }
  removeDynamic(obj) { const i = this.dynamic.indexOf(obj); if (i >= 0) this.dynamic.splice(i, 1); }

  nearby(x, z, r) {
    const out = [];
    const i0 = Math.floor((x - r) / CELL), i1 = Math.floor((x + r) / CELL);
    const j0 = Math.floor((z - r) / CELL), j1 = Math.floor((z + r) / CELL);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const cell = this.grid.get(this.key(i, j));
        if (cell) for (const c of cell) if (c.active && !out.includes(c)) out.push(c);
      }
    }
    for (const d of this.dynamic) if (d.active !== false) out.push(d);
    return out;
  }

  // Push a circle of radius pr out of every collider. Returns true if anything was hit.
  resolve(pos, pr, swimming = false) {
    let hit = false;
    for (let iter = 0; iter < 2; iter++) {
      for (const c of this.nearby(pos.x, pos.z, pr + 4)) {
        if (c.onlySwim && !swimming) continue;
        const dx = pos.x - c.x, dz = pos.z - c.z;
        const min = c.r + pr;
        const d2 = dx * dx + dz * dz;
        if (d2 >= min * min) continue;
        // Allow standing on top of low colliders (rocks, crates) when above them.
        if (c.top !== undefined && pos.y >= c.top - 0.3) continue;
        const d = Math.sqrt(d2) || 0.0001;
        const push = min - d;
        pos.x += (dx / d) * push;
        pos.z += (dz / d) * push;
        hit = true;
      }
    }
    return hit;
  }

  // platform: { kind: 'box'|'circle', x, z, hw, hd, r, top, active }. A box with top1 is a ramp: it rises
  // from top at its local -z end to top1 at its +z end (rope bridges between islands).
  addPlatform(p) { p.active = p.active !== false; this.platforms.push(p); return p; }
  removePlatform(p) { const i = this.platforms.indexOf(p); if (i >= 0) this.platforms.splice(i, 1); }

  platformTop(x, z, y, stepUp = 0.75) {
    let best = -Infinity, which = null;
    for (const p of this.platforms) {
      if (!p.active) continue;
      let inside, top = p.top;
      if (p.kind === 'circle') inside = (x - p.x) ** 2 + (z - p.z) ** 2 <= p.r * p.r;
      else {
        // Inverse of Object3D's Y rotation: local = R(-rot) * (world - center).
        const c = Math.cos(p.rot || 0), s = Math.sin(p.rot || 0);
        const lx = (x - p.x) * c - (z - p.z) * s, lz = (x - p.x) * s + (z - p.z) * c;
        inside = Math.abs(lx) <= p.hw && Math.abs(lz) <= p.hd;
        if (inside && p.top1 !== undefined) top = p.top + (p.top1 - p.top) * ((lz + p.hd) / (2 * p.hd));
      }
      if (inside && top <= y + stepUp && top > best) { best = top; which = p; }
    }
    return { top: best, platform: which };
  }
}
