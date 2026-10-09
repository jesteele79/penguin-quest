import * as THREE from 'three';
import { ROADS, LINKS, WATER_Y } from './layout.js';

const roadVert = /* glsl */ `
attribute float aDist;
varying vec2 vUv;
varying float vDist;
#include <fog_pars_vertex>
void main() {
  vUv = uv;
  vDist = aDist;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const roadFrag = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vDist;
#include <fog_pars_fragment>
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float across = abs(vUv.x - 0.5) * 2.0;
  float core = 1.0 - smoothstep(0.0, 0.55, across);
  float edge = 1.0 - smoothstep(0.55, 1.0, across);
  vec2 cell = vec2(floor(vUv.x * 6.0), floor(vDist * 1.4 - uTime * 1.8));
  float h = hash(cell);
  vec2 f = vec2(fract(vUv.x * 6.0), fract(vDist * 1.4 - uTime * 1.8)) - 0.5;
  float spark = step(0.86, h) * smoothstep(0.35, 0.0, length(f)) * (0.6 + 0.4 * sin(uTime * 5.0 + h * 40.0));
  float flow = 0.75 + 0.25 * sin(vDist * 0.35 - uTime * 2.2);
  vec3 gold = vec3(1.0, 0.72, 0.28);
  vec3 col = gold * (0.55 * core * flow + 0.25 * edge) + vec3(1.0, 0.95, 0.8) * spark * 1.4;
  float alpha = clamp(edge * 0.55 + core * 0.35 + spark, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const trailVert = /* glsl */ `
attribute float aAlpha;
uniform float uScale;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // Small sparkles, capped in size and faded right in front of the camera so they never become blobs.
  vAlpha = aAlpha * smoothstep(5.0, 10.0, -mv.z);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(0.6 * uScale / max(-mv.z, 0.1), 26.0);
}`;

// Normal (not additive) blending: additive gold vanishes against white snow.
const trailFrag = /* glsl */ `
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.55, 1.0, d)) * vAlpha;
  vec3 col = mix(vec3(1.0, 0.93, 0.55), vec3(1.0, 0.55, 0.08), smoothstep(0.15, 0.8, d));
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

const TRAIL_N = 40;

export class Roads {
  constructor(scene, terrain) {
    this.terrain = terrain;
    this.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: roadVert,
      fragmentShader: roadFrag,
      transparent: true,
      depthWrite: false,
      fog: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
    });
    this.list = ROADS;
    for (const road of ROADS) {
      if (road.length < 2) continue;
      const mesh = new THREE.Mesh(this.ribbon(road, 2.4), mat);
      mesh.renderOrder = 3;
      scene.add(mesh);
    }
    this.buildGraph();

    const g = new THREE.BufferGeometry();
    this.trailPos = new Float32Array(TRAIL_N * 3);
    this.trailAlpha = new Float32Array(TRAIL_N);
    g.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.trailAlpha, 1));
    this.trailUniforms = { uScale: { value: 500 } };
    this.trail = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: this.trailUniforms,
      vertexShader: trailVert,
      fragmentShader: trailFrag,
      transparent: true,
      depthWrite: false,
    }));
    this.trail.frustumCulled = false;
    this.trail.renderOrder = 6;
    scene.add(this.trail);
    this.route = null;
    this.routeTimer = 0;
    this.flow = 0;
    this.trailVisible = 0;
  }

  ribbon(points, width) {
    const t = this.terrain;
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
    const len = curve.getLength();
    const n = Math.max(2, Math.ceil(len / 0.9));
    const pts = curve.getSpacedPoints(n);
    const pos = [], uv = [], dist = [], idx = [];
    let acc = 0;
    for (let i = 0; i <= n; i++) {
      const p = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
      const dx = b.x - a.x, dz = b.z - a.z;
      const l = Math.hypot(dx, dz) || 1;
      const sx = -dz / l, sz = dx / l;
      if (i > 0) acc += pts[i].distanceTo(pts[i - 1]);
      for (const side of [-1, 1]) {
        const x = p.x + sx * side * width * 0.5, z = p.z + sz * side * width * 0.5;
        pos.push(x, Math.max(t.heightAt(x, z), WATER_Y) + 0.07, z);
        uv.push(side < 0 ? 0 : 1, acc / width);
        dist.push(acc);
      }
      if (i < n) {
        const k = i * 2;
        idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }

  buildGraph() {
    const nodes = [];
    const find = (x, z) => {
      let i = nodes.findIndex((n) => n.x === x && n.z === z);
      if (i < 0) { i = nodes.length; nodes.push({ x, z, edges: [] }); }
      return i;
    };
    const segs = [];
    const join = (p, q, link = false) => {
      const a = find(p[0], p[1]), b = find(q[0], q[1]);
      const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
      nodes[a].edges.push({ to: b, d });
      nodes[b].edges.push({ to: a, d });
      segs.push({ a, b, link });
    };
    for (const road of ROADS) for (let k = 0; k < road.length - 1; k++) join(road[k], road[k + 1]);
    for (const [p, q] of LINKS) join(p, q, true);
    this.nodes = nodes;
    this.segs = segs;
    this.join = join;
  }

  // Shortest distances from node `src` to every node.
  dijkstra(src) {
    const n = this.nodes.length;
    const dist = new Array(n).fill(Infinity);
    const prev = new Array(n).fill(-1);
    const done = new Array(n).fill(false);
    dist[src] = 0;
    for (let it = 0; it < n; it++) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] === Infinity) break;
      done[u] = true;
      for (const e of this.nodes[u].edges) {
        if (dist[u] + e.d < dist[e.to]) { dist[e.to] = dist[u] + e.d; prev[e.to] = u; }
      }
    }
    return { dist, prev };
  }

  // A straight walk is clear when the ground allows it and nothing big and solid (a wall, a hut) stands in the
  // way. Whatever stands at either end (the friend or crystal being walked to) does not count.
  straightIsClear(ax, az, bx, bz) {
    if (!this.straightIsWalkable(ax, az, bx, bz)) return false;
    if (!this.solidAt) return true;
    const len = Math.hypot(bx - ax, bz - az);
    const atEnd = (c) => Math.hypot(ax - c.x, az - c.z) < c.r + 2.5 || Math.hypot(bx - c.x, bz - c.z) < c.r + 2.5;
    for (let d = 1; d < len - 1; d += 1) {
      const c = this.solidAt(ax + ((bx - ax) * d) / len, az + ((bz - az) * d) / len, 0.6);
      if (c && !atEnd(c)) return false;
    }
    return true;
  }

  // Walkable means no climb steeper than a penguin can walk up, no drop off a cliff and no hazard (lava, open
  // sky), checked every metre and a half. Water is measured at its surface, where a penguin swims.
  straightIsWalkable(ax, az, bx, bz) {
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(1, Math.ceil(len / 1.5)), step = len / steps;
    let prevH = Math.max(this.terrain.heightAt(ax, az), WATER_Y);
    for (let i = 1; i <= steps; i++) {
      const x = ax + ((bx - ax) * i) / steps, z = az + ((bz - az) * i) / steps;
      const h = Math.max(this.terrain.heightAt(x, z), WATER_Y);
      if (h - prevH > step * 0.95 || prevH - h > step * 1.6) return false;
      if (this.hazardAt?.(x, z)) return false;
      // The very end may sit on a rim (a bridge starts there), so its slope does not count.
      if (i < steps && this.terrain.slopeAt(x, z) > 1.1) return false;
      prevH = h;
    }
    return true;
  }

  // Polyline of [x, z] from a to b: straight when that walk is short and clear, otherwise along the paths.
  computeRoute(ax, az, bx, bz) {
    if (Math.hypot(bx - ax, bz - az) < 80 && this.straightIsClear(ax, az, bx, bz)) return [[ax, az], [bx, bz]];
    // Leave the paths at the junction nearest the goal that has a clear walk to it.
    const byGoal = this.nodes.map((n, i) => ({ i, d: Math.hypot(n.x - bx, n.z - bz) })).sort((p, q) => p.d - q.d);
    const tgt = (byGoal.slice(0, 8).find(({ i, d }) => d < 4 || this.straightIsClear(this.nodes[i].x, this.nodes[i].z, bx, bz)) ?? byGoal[0]).i;
    const { dist, prev } = this.dijkstra(tgt);
    // Ways onto the paths: straight to a junction the penguin can walk to (not across a gap between islands or
    // up a cliff), or onto the closest point of a path close by and along it to either end, so a penguin
    // partway along a path never doubles back. A bridge is only joined from its own deck. Walking off the
    // paths counts extra, so the trail keeps to them rather than cutting across camps and gardens.
    const OFF = 1.6;
    const order = this.nodes.map((n, i) => ({ i, via: null, c: Math.hypot(n.x - ax, n.z - az) * OFF + dist[i] })).filter((o) => o.c < Infinity);
    for (const { a, b, link } of this.segs) {
      const A = this.nodes[a], B = this.nodes[b];
      const dx = B.x - A.x, dz = B.z - A.z, l2 = dx * dx + dz * dz || 1e-9;
      const t = Math.max(0, Math.min(1, ((ax - A.x) * dx + (az - A.z) * dz) / l2));
      const qx = A.x + dx * t, qz = A.z + dz * t, d = Math.hypot(ax - qx, az - qz);
      if (d > (link ? 1.6 : 6)) continue;
      for (const k of [a, b]) if (dist[k] < Infinity) order.push({ i: k, via: [qx, qz], c: d * OFF + Math.hypot(this.nodes[k].x - qx, this.nodes[k].z - qz) + dist[k] });
    }
    order.sort((p, q) => p.c - q.c);
    // Only junctions within a short walk are tried, cheapest first, so far-off ones are never joined across country.
    const near = order.filter(({ i, via }) => via || Math.hypot(this.nodes[i].x - ax, this.nodes[i].z - az) < 45);
    const reach = near.slice(0, 12).find(({ i, via }) => via || Math.hypot(this.nodes[i].x - ax, this.nodes[i].z - az) < 4 || this.straightIsClear(ax, az, this.nodes[i].x, this.nodes[i].z)) ?? near[0] ?? order[0];
    const entry = reach?.i ?? 0;
    const path = [[ax, az]];
    if (reach?.via && Math.hypot(reach.via[0] - ax, reach.via[1] - az) > 0.3) path.push(reach.via);
    for (let i = entry; i >= 0; i = prev[i]) {
      path.push([this.nodes[i].x, this.nodes[i].z]);
      if (i === tgt) break;
    }
    path.push([bx, bz]);
    return path;
  }

  setTarget(target) { this.target = target; this.routeTimer = 0; }

  // A way across that a game leaves behind (a causeway, a floe bridge): the trail can follow it point by
  // point. Its first point is joined to the nearest path junction, if one is close.
  addPath(points) {
    const [x0, z0] = points[0];
    let near = null, best = 20;
    for (const n of this.nodes) { const d = Math.hypot(n.x - x0, n.z - z0); if (d < best) { best = d; near = n; } }
    if (near) this.join([near.x, near.z], points[0]);
    for (let k = 1; k < points.length; k++) this.join(points[k - 1], points[k], true);
    this.route = null;
  }

  update(time, dt = 1 / 60, player = null, show = true, viewportScale = 500) {
    this.uniforms.uTime.value = time;
    this.trailUniforms.uScale.value = viewportScale;
    this.trailVisible += ((show && this.target && player ? 1 : 0) - this.trailVisible) * Math.min(1, dt * 3);
    this.trail.visible = this.trailVisible > 0.02;
    // While fading out after the goal disappears, the sparkles simply stay where they were.
    if (!this.trail.visible || !player || !this.target) return;
    this.routeTimer -= dt;
    if (this.routeTimer <= 0 || !this.route) {
      this.route = this.computeRoute(player.x, player.z, this.target.x, this.target.z);
      this.routeTimer = 0.6;
    } else {
      this.route[0] = [player.x, player.z];
    }
    // Arc-length parametrize the route.
    const segs = [];
    let total = 0;
    for (let i = 0; i < this.route.length - 1; i++) {
      const [ax, az] = this.route[i], [bx, bz] = this.route[i + 1];
      const l = Math.hypot(bx - ax, bz - az);
      segs.push({ ax, az, bx, bz, l, s: total });
      total += l;
    }
    this.flow = (this.flow + dt * 5) % 1.6;
    const maxShow = Math.min(total, 42);
    // Sparkles sit on whatever a penguin would walk on there: a bridge deck, a pier, or the ground.
    let hint = player.y ?? this.terrain.heightAt(player.x, player.z);
    for (let k = 0; k < TRAIL_N; k++) {
      const s = 2.2 + k * 1.6 + this.flow;
      let a = 0;
      let x = player.x, z = player.z;
      if (s < maxShow) {
        const seg = segs.find((q) => s >= q.s && s <= q.s + q.l) || segs[segs.length - 1];
        const u = seg.l > 0 ? (s - seg.s) / seg.l : 0;
        x = seg.ax + (seg.bx - seg.ax) * u;
        z = seg.az + (seg.bz - seg.az) * u;
        a = Math.min(1, (s - 2.2) / 3) * Math.min(1, (maxShow - s) / 8) * this.trailVisible;
      }
      const ground = Math.max(this.groundAt ? this.groundAt(x, z, hint + 1.5) : this.terrain.heightAt(x, z), WATER_Y);
      hint = ground;
      const y = ground + 0.55 + Math.sin(time * 3 + k * 0.7) * 0.12;
      this.trailPos[k * 3] = x; this.trailPos[k * 3 + 1] = y; this.trailPos[k * 3 + 2] = z;
      this.trailAlpha[k] = a;
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.aAlpha.needsUpdate = true;
  }
}
