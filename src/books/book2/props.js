// Small Ember Isles props built on demand: sandcastles for the contest.
import * as THREE from 'three';
import { mergeColored, mat } from '../../core/geo.js';
import { lambert } from '../../core/materials.js';
import { Rng } from '../../core/rng.js';

const SAND = 0xe6cf94, SAND_D = 0xd2b77a;

export function sandcastle(seed) {
  const rng = new Rng(seed);
  const parts = [{ geo: new THREE.CylinderGeometry(1.5, 1.7, 0.9, 10), color: SAND_D, matrix: mat(0, 0.45, 0) }];
  const towers = rng.int(3, 5);
  for (let i = 0; i < towers; i++) {
    const a = (i / towers) * Math.PI * 2 + rng.float(0, 0.4);
    const h = rng.float(1.2, 2.1), r = rng.float(0.32, 0.45);
    const x = Math.cos(a) * 1.15, z = Math.sin(a) * 1.15;
    parts.push({ geo: new THREE.CylinderGeometry(r, r * 1.1, h, 9), color: SAND, matrix: mat(x, 0.9 + h / 2, z) });
    parts.push({ geo: new THREE.ConeGeometry(r * 1.15, 0.6, 9), color: SAND_D, matrix: mat(x, 0.9 + h + 0.3, z) });
  }
  const keep = rng.float(1.6, 2.4);
  parts.push({ geo: new THREE.CylinderGeometry(0.6, 0.7, keep, 10), color: SAND, matrix: mat(0, 0.9 + keep / 2, 0) });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    parts.push({ geo: new THREE.BoxGeometry(0.22, 0.25, 0.22), color: SAND, matrix: mat(Math.cos(a) * 0.55, 0.9 + keep + 0.12, Math.sin(a) * 0.55) });
  }
  parts.push({ geo: new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), color: 0x6b4428, matrix: mat(0, 0.9 + keep + 0.45, 0) });
  parts.push({ geo: new THREE.BoxGeometry(0.5, 0.3, 0.02), color: [0xff5c8a, 0x2ec4b6, 0xffd23d][seed % 3], matrix: mat(0.25, 0.9 + keep + 0.75, 0) });
  for (let k = 0; k < 5; k++) {
    const a = rng.float(0, Math.PI * 2);
    parts.push({ geo: new THREE.IcosahedronGeometry(0.1, 0), color: [0xf2a0a8, 0xfff1d6, 0x9ad0e8][k % 3], matrix: mat(Math.cos(a) * 1.55, 0.85, Math.sin(a) * 1.55) });
  }
  const m = new THREE.Mesh(mergeColored(parts), lambert({ vertexColors: true, flatShading: true }, { color: 0xffd6b8, strength: 0.15 }));
  m.castShadow = true;
  return m;
}
