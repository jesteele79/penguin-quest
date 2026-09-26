import * as THREE from 'three';
import { ROADS, WATER_Y } from './layout.js';

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
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 0.9 * uScale / max(-mv.z, 0.1);
}`;

const trailFrag = /* glsl */ `
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 4.0) * vAlpha;
  gl_FragColor = vec4(vec3(1.0, 0.86, 0.45) * a * 1.6, 1.0);
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
      blending: THREE.AdditiveBlending,
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
    for (const road of ROADS) {
      for (let k = 0; k < road.length - 1; k++) {
        const a = find(road[k][0], road[k][1]), b = find(road[k + 1][0], road[k + 1][1]);
        const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
        nodes[a].edges.push({ to: b, d });
        nodes[b].edges.push({ to: a, d });
      }
    }
    this.nodes = nodes;
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

  straightIsWalkable(ax, az, bx, bz) {
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.ceil(len / 3);
    let prevH = this.terrain.heightAt(ax, az);
    for (let i = 1; i <= steps; i++) {
      const x = ax + ((bx - ax) * i) / steps, z = az + ((bz - az) * i) / steps;
      const h = this.terrain.heightAt(x, z);
      if (h - prevH > 3 * 1.0) return false;
      if (this.terrain.slopeAt(x, z) > 1.1) return false;
      prevH = h;
    }
    return true;
  }

  // Polyline of [x, z] from a to b, preferring roads when the direct line is blocked or much longer.
  computeRoute(ax, az, bx, bz) {
    const direct = Math.hypot(bx - ax, bz - az);
    if (direct < 26 || (direct < 80 && this.straightIsWalkable(ax, az, bx, bz))) return [[ax, az], [bx, bz]];
    let tgt = 0, best = Infinity;
    this.nodes.forEach((n, i) => { const d = Math.hypot(n.x - bx, n.z - bz); if (d < best) { best = d; tgt = i; } });
    const { dist, prev } = this.dijkstra(tgt);
    let entry = 0, bestCost = Infinity;
    this.nodes.forEach((n, i) => {
      const c = Math.hypot(n.x - ax, n.z - az) + dist[i];
      if (c < bestCost) { bestCost = c; entry = i; }
    });
    if (this.straightIsWalkable(ax, az, bx, bz) && direct < bestCost * 0.85) return [[ax, az], [bx, bz]];
    const path = [[ax, az]];
    for (let i = entry; i >= 0; i = prev[i]) {
      path.push([this.nodes[i].x, this.nodes[i].z]);
      if (i === tgt) break;
    }
    path.push([bx, bz]);
    return path;
  }

  setTarget(target) { this.target = target; this.routeTimer = 0; }

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
      const y = Math.max(this.terrain.heightAt(x, z), WATER_Y) + 0.55 + Math.sin(time * 3 + k * 0.7) * 0.12;
      this.trailPos[k * 3] = x; this.trailPos[k * 3 + 1] = y; this.trailPos[k * 3 + 2] = z;
      this.trailAlpha[k] = a;
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.aAlpha.needsUpdate = true;
  }
}
