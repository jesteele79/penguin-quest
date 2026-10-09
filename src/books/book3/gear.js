// A brass gear as a single mesh: a disc lying flat in the xz plane, square teeth round the rim and an
// optional darker hub. One draw call however many teeth it has.
import * as THREE from 'three';
import { mergeColored, mat } from '../../core/geo.js';

export const BRASS = 0xc89a3a;

export function gearGeometry(r, { teeth = Math.round(r * 5), thick = 0.3, tooth = [0.3, 0.3, 0.4], toothR = r + 0.12, hub = null, hubR = r * 0.3, hubThick = thick + 0.2 } = {}) {
  const parts = [{ geo: new THREE.CylinderGeometry(r, r, thick, Math.max(16, teeth * 2)), color: BRASS }];
  for (let k = 0; k < teeth; k++) {
    const a = (k / teeth) * Math.PI * 2;
    parts.push({ geo: new THREE.BoxGeometry(...tooth), color: BRASS, matrix: mat(Math.cos(a) * toothR, 0, Math.sin(a) * toothR, 0, -a, 0) });
  }
  if (hub !== null) parts.push({ geo: new THREE.CylinderGeometry(hubR, hubR, hubThick, 12), color: hub });
  return mergeColored(parts);
}
