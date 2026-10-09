// Rope bridges between the sky islands, and the updrafts that lift a penguin into a glide. A bridge is a run
// of plank ramps (walkable platforms that follow the rope's sag) with rope rails a penguin cannot fall
// through; a glider passing above the rails is not stopped.
import * as THREE from 'three';
import { lambert } from '../../core/materials.js';
import { mat } from '../../core/geo.js';
import { woodTexture } from '../../core/textures.js';
import { BRIDGES, UPDRAFTS } from './layout.js';

const W = 2.6;

export function buildBridges(ctx) {
  const { scene, terrain, collision, batch } = ctx;
  const plankMat = lambert({ map: woodTexture(), color: 0xe8cfb0 }, { strength: 0.2 });
  const ropeMat = lambert({ color: 0xc8a878 }, { strength: 0.15 });
  const plankGeo = new THREE.BoxGeometry(W, 0.14, 0.42);
  const planks = [];
  ctx.bridges = [];
  for (const B of BRIDGES) {
    // Start and end a few steps in from each rim, past the steep lip at the island's edge, so the deck carries a
    // penguin over the lip and onto gentle ground.
    const dx = B.to[0] - B.from[0], dz = B.to[1] - B.from[1];
    const len0 = Math.hypot(dx, dz), ux = dx / len0, uz = dz / len0;
    const inset = (px, pz, sx, sz) => {
      let k = 4;
      while (k < 10 && terrain.slopeAt(px + sx * k, pz + sz * k) > 0.25) k += 0.5;
      return k + 1;
    };
    const ka = inset(B.from[0], B.from[1], -ux, -uz), kb = inset(B.to[0], B.to[1], ux, uz);
    const ax = B.from[0] - ux * ka, az = B.from[1] - uz * ka, bx = B.to[0] + ux * kb, bz = B.to[1] + uz * kb;
    const ha = terrain.heightAt(ax, az) + 0.15, hb = terrain.heightAt(bx, bz) + 0.15;
    const len = Math.hypot(bx - ax, bz - az);
    const yaw = Math.atan2(ux, uz);
    // Gentle bridges sag in the middle; steep ones run straight so every step can be climbed. Near the ends the
    // deck rests on the ground wherever the ground is higher than the sag, so there is never a lip to climb.
    const sag = Math.abs(hb - ha) / len > 0.25 ? 0 : Math.min(2.2, len * 0.035);
    const h = (t) => ha + (hb - ha) * t - sag * 4 * t * (1 - t);
    const at = (t) => {
      const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      return { x, z, y: Math.max(h(t), terrain.heightAt(x, z) + 0.12) };
    };
    const segs = Math.ceil(len / 2.5);
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs, t1 = (i + 1) / segs;
      const p0 = at(t0), p1 = at(t1);
      collision.addPlatform({ kind: 'box', x: (p0.x + p1.x) / 2, z: (p0.z + p1.z) / 2, hw: W / 2, hd: len / segs / 2 + 0.02, rot: yaw, top: p0.y, top1: p1.y });
    }
    // Planks, a little gap between each.
    const n = Math.floor(len / 0.55);
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = at(t);
      const pitch = -Math.atan((at(Math.min(1, t + 0.01)).y - at(Math.max(0, t - 0.01)).y) / (len * 0.02));
      planks.push(new THREE.Matrix4().compose(new THREE.Vector3(p.x, p.y - 0.09, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)));
    }
    // Rope rails on posts, and the colliders that keep walkers on the planks.
    for (const s of [-1, 1]) {
      const ox = Math.cos(yaw) * s * (W / 2 + 0.15), oz = -Math.sin(yaw) * s * (W / 2 + 0.15);
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const p = at(i / 24);
        pts.push(new THREE.Vector3(p.x + ox, p.y + 1.05 - Math.sin((i / 24) * Math.PI) * 0.25, p.z + oz));
      }
      const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.06, 5), ropeMat);
      scene.add(rope);
      for (const t of [0, 1]) {
        const p = at(t);
        batch.add(new THREE.CylinderGeometry(0.14, 0.18, 1.8, 6), 0x7a5232, mat(p.x + ox, p.y + 0.6, p.z + oz));
      }
      const posts = Math.ceil(len / 5);
      for (let i = 1; i < posts; i++) {
        const p = at(i / posts);
        batch.add(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 4), 0xc8a878, mat(p.x + ox, p.y + 0.5, p.z + oz));
      }
      const rails = Math.ceil(len / 0.9);
      for (let i = 3; i <= rails - 3; i++) {
        const p = at(i / rails);
        collision.addCircle(p.x + ox * 1.15, p.z + oz * 1.15, 0.32, 'rail').top = p.y + 1.1;
      }
    }
    ctx.bridges.push({ ax, az, bx, bz, ha, hb, len, yaw, at });
  }
  const mesh = new THREE.InstancedMesh(plankGeo, plankMat, planks.length);
  planks.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

// Updrafts: a glowing ring on the ground and streaks of wind spiralling up. The lift itself happens in the
// book's per-frame hook, which reads the same list.
export function buildUpdrafts(ctx) {
  const { scene, terrain, glow } = ctx;
  const streakGeo = new THREE.PlaneGeometry(0.1, 1.4);
  const streakMat = new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true });
  const per = 14;
  const streaks = new THREE.InstancedMesh(streakGeo, streakMat, UPDRAFTS.length * per);
  streaks.frustumCulled = false;
  scene.add(streaks);
  const items = [];
  UPDRAFTS.forEach((U, k) => {
    const y = terrain.heightAt(U.x, U.z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.12, 6, 36), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.7 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(U.x, y + 0.2, U.z);
    scene.add(ring);
    glow.add(U.x, y + 1, U.z, 0xbfe8ff, 8, 0.4);
    for (let i = 0; i < per; i++) items.push({ k, U, y, phase: i / per, a: (i / per) * Math.PI * 2 });
    U.ring = ring;
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  ctx.animated.push((dt, t) => {
    items.forEach((it, i) => {
      const f = (t * 0.25 + it.phase) % 1;
      const a = it.a + t * 1.6;
      p.set(it.U.x + Math.cos(a) * 2.4, it.y + f * (it.U.top - it.y), it.U.z + Math.sin(a) * 2.4);
      e.set(0, -a, 0.3);
      q.setFromEuler(e);
      s.set(1, 0.6 + Math.sin(f * Math.PI) * 0.8, 1);
      m4.compose(p, q, s);
      streaks.setMatrixAt(i, m4);
    });
    streaks.instanceMatrix.needsUpdate = true;
    for (const U of UPDRAFTS) U.ring.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
  });
}
