import * as THREE from 'three';

// The forests and rock fields are single instanced meshes spanning the whole island, so the shadow pass
// would draw every tree. Instead those meshes cast no shadow, and a proxy per mesh casts shadows for just
// the instances near the player. The proxies write no colour or depth, so they are invisible in the main
// pass (where they cost a few thousand vertices at most).
const RADIUS = 46;
const REFRESH = 6;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();

export class ShadowCasters {
  constructor(scene) {
    this.scene = scene;
    this.sources = [];
    this.material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    this.last = null;
  }

  add(mesh) {
    mesh.castShadow = false;
    const n = mesh.count;
    const xz = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      mesh.getMatrixAt(i, _m);
      _p.setFromMatrixPosition(_m);
      xz[i * 2] = _p.x;
      xz[i * 2 + 1] = _p.z;
    }
    const proxy = new THREE.InstancedMesh(mesh.geometry, this.material, n);
    proxy.castShadow = true;
    proxy.frustumCulled = false;
    proxy.count = 0;
    proxy.renderOrder = -200;
    this.scene.add(proxy);
    this.sources.push({ mesh, xz, proxy });
    this.last = null;
  }

  update(focus) {
    if (this.last && Math.hypot(focus.x - this.last.x, focus.z - this.last.z) < REFRESH) return;
    this.last = { x: focus.x, z: focus.z };
    const r2 = RADIUS * RADIUS;
    for (const { mesh, xz, proxy } of this.sources) {
      let k = 0;
      for (let i = 0; i < mesh.count; i++) {
        const dx = xz[i * 2] - focus.x, dz = xz[i * 2 + 1] - focus.z;
        if (dx * dx + dz * dz > r2) continue;
        mesh.getMatrixAt(i, _m);
        proxy.setMatrixAt(k++, _m);
      }
      proxy.count = k;
      proxy.instanceMatrix.needsUpdate = true;
    }
  }
}
