// A small school of bright reef fish. It can trail behind a swimmer or circle a spot, and fish can join it one
// at a time. One instanced mesh with a colour per fish, so a full school costs a single draw call.
import * as THREE from 'three';
import { mergeColored, mat } from '../core/geo.js';
import { lambert } from '../core/materials.js';
import { WATER_Y } from '../world/layout.js';

const COLORS = [0xff8a3d, 0xffd23d, 0x4fb3ff, 0xff6fa5, 0x7fe0d0, 0xb97aff];
let geo = null;
function fishGeometry() {
  if (!geo) {
    geo = mergeColored([
      { geo: new THREE.SphereGeometry(0.5, 10, 6), color: 0xffffff, matrix: mat(0, 0, 0, 0, 0, 0, 1, 0.5, 0.24) },
      { geo: new THREE.ConeGeometry(0.3, 0.5, 4), color: 0xe8e8e8, matrix: mat(-0.62, 0, 0, 0, 0, Math.PI / 2, 1, 1, 0.3) },
      // a pale stripe behind the head
      { geo: new THREE.CylinderGeometry(0.27, 0.27, 0.1, 10), color: 0xffffff, matrix: mat(0.12, 0, 0, 0, 0, Math.PI / 2, 1, 1, 0.5) },
    ]);
  }
  return geo;
}

const TMP = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), s: new THREE.Vector3(), c: new THREE.Color() };

export class FishSchool {
  constructor(scene, max = 24) {
    this.scene = scene;
    this.max = max;
    this.fish = [];
    this.mesh = new THREE.InstancedMesh(fishGeometry(), lambert({ vertexColors: true, emissive: 0x1a1008 }, false), max);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.mode = 'follow';
    this.target = null;
    this.center = null;
  }

  // New fish burst out from `at` and swim to their places.
  add(at, n = 3) {
    for (let k = 0; k < n && this.fish.length < this.max; k++) {
      const i = this.fish.length;
      this.fish.push({
        p: new THREE.Vector3(at.x + (Math.random() - 0.5) * 1.5, WATER_Y - 0.8, at.z + (Math.random() - 0.5) * 1.5),
        heading: Math.random() * Math.PI * 2,
        back: 1.6 + i * 0.32, side: (Math.random() - 0.5) * 2.6, depth: -0.6 - Math.random() * 0.8,
        orbit: 3 + Math.random() * 4, speed: 0.5 + Math.random() * 0.5, phase: Math.random() * 10, s: 0.75 + Math.random() * 0.35,
      });
      this.mesh.setColorAt(i, TMP.c.set(COLORS[i % COLORS.length]));
    }
    this.mesh.count = this.fish.length;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  // follow: target is { pos, yaw } of a swimmer. circle: centre is a point to swirl around.
  follow(target) { this.mode = 'follow'; this.target = target; }
  circle(center) { this.mode = 'circle'; this.center = center; }

  update(dt, t) {
    const { m, q, e, s } = TMP;
    this.fish.forEach((f, i) => {
      let tx, tz;
      const ty = WATER_Y + f.depth + Math.sin(t * 1.3 + f.phase) * 0.15;
      if (this.mode === 'follow' && this.target) {
        const { pos, yaw } = this.target;
        const fx = Math.sin(yaw), fz = Math.cos(yaw);
        const wob = Math.sin(t * 1.7 + f.phase) * 0.5;
        tx = pos.x - fx * f.back + fz * (f.side + wob);
        tz = pos.z - fz * f.back - fx * (f.side + wob);
      } else if (this.center) {
        const a = t * f.speed + f.phase;
        tx = this.center.x + Math.cos(a) * f.orbit;
        tz = this.center.z + Math.sin(a) * f.orbit;
      } else return;
      const dx = tx - f.p.x, dz = tz - f.p.z;
      const k = 1 - Math.exp(-2.6 * dt);
      f.p.x += dx * k;
      f.p.z += dz * k;
      f.p.y += (ty - f.p.y) * k;
      if (dx * dx + dz * dz > 0.01) {
        const want = Math.atan2(dz, dx);
        let d = want - f.heading;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        f.heading += d * Math.min(1, dt * 6);
      }
      e.set(0, -f.heading + Math.sin(t * 9 + f.phase) * 0.18, 0);
      q.setFromEuler(e);
      s.setScalar(f.s);
      m.compose(f.p, q, s);
      this.mesh.setMatrixAt(i, m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.dispose();
    this.mesh.material.dispose();
  }
}
