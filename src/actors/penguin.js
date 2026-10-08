import * as THREE from 'three';
import { PAL, lambert, plush, CHARACTER_RIM } from '../core/materials.js';
import { solid, buildHat, HEAD_R, FACE, HAT_LIFT } from './accessories.js';
import { clamp, damp, lerp } from '../core/mathutil.js';
import { glowTexture, scarfTexture } from '../core/textures.js';
import { mergeColored, mat } from '../core/geo.js';

const SPHERE = new THREE.SphereGeometry(1, 24, 16);
// Body and head carry the painted belly and face; finer facets keep those edges round instead of zigzag.
const SPHERE_HI = new THREE.SphereGeometry(1, 44, 30);
const SPHERE_LO = new THREE.SphereGeometry(1, 14, 10);
const BEAK = new THREE.ConeGeometry(0.17, 0.46, 14);
BEAK.rotateX(Math.PI / 2);
const TORUS = new THREE.TorusGeometry(0.8, 0.21, 12, 32);
TORUS.rotateX(Math.PI / 2);
const TUFT = new THREE.ConeGeometry(0.09, 0.4, 6);

// A slightly bottom-heavy (pear) body: cuter, and it sits more solidly on the ground.
function pear(src) {
  const g = src.clone();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 1 - p.getY(i) * 0.07;
    p.setXYZ(i, p.getX(i) * k, p.getY(i), p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}
const PEAR = pear(SPHERE);
const PEAR_HI = pear(SPHERE_HI);

// Penguin parts share plush (wrap-lit, warm-rimmed) materials, cached per colour.
const plushCache = new Map();
function plushSolid(color) {
  if (!plushCache.has(color)) plushCache.set(color, plush(lambert({ color }, CHARACTER_RIM)));
  return plushCache.get(color);
}

let shadowMat = null;
function blobShadowMaterial() {
  if (!shadowMat) {
    shadowMat = new THREE.MeshBasicMaterial({
      map: glowTexture(), color: 0x000010, transparent: true, opacity: 0.42, depthWrite: false,
    });
  }
  return shadowMat;
}

function part(geo, material, x, y, z, sx, sy = sx, sz = sx, cast = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = cast;
  return m;
}

// Parts that never move relative to each other are merged into one vertex-colored mesh per
// color scheme: a penguin costs about a dozen draw calls instead of thirty, which matters on
// Chromebook GPUs with a dozen friends on screen.
const GEO_CACHE = new Map();
let vcMat = null, eyeMat = null;
const vertexColorMat = () => (vcMat ??= markedMaterial());
const eyeMaterial = () => (eyeMat ??= new THREE.MeshBasicMaterial({ vertexColors: true }));

function cachedGeo(key, build) {
  if (!GEO_CACHE.has(key)) GEO_CACHE.set(key, build());
  return GEO_CACHE.get(key);
}

// The white belly and face are painted per pixel inside one or two ellipsoids (two make the face a
// heart). Intersecting a second white mesh gave a jagged, flickering edge; this gives a clean, soft one.
// Per-vertex attributes carry the mark colour and ellipsoids, so every penguin shares one material.
function markedMaterial() {
  const m = plush(lambert({ vertexColors: true }, CHARACTER_RIM));
  const rimCompile = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    rimCompile?.(shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
attribute vec3 aMarkColor;
attribute vec4 aMarkC;
attribute vec3 aMarkS;
attribute vec4 aMarkC2;
attribute vec3 aMarkS2;
varying vec3 vMarkColor;
varying vec3 vMarkQ;
varying vec3 vMarkQ2;
varying vec2 vMarkOn;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vMarkColor = aMarkColor;
vMarkQ = (position - aMarkC.xyz) / aMarkS;
vMarkQ2 = (position - aMarkC2.xyz) / aMarkS2;
vMarkOn = vec2(aMarkC.w, aMarkC2.w);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vMarkColor;
varying vec3 vMarkQ;
varying vec3 vMarkQ2;
varying vec2 vMarkOn;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  float r = vMarkOn.y > 0.5 ? min(length(vMarkQ), length(vMarkQ2)) : length(vMarkQ);
  float w = max(fwidth(r) * 1.2, 0.012);
  float mark = (1.0 - smoothstep(1.0 - w, 1.0 + w, r)) * vMarkOn.x;
  diffuseColor.rgb = mix(diffuseColor.rgb, vMarkColor, mark);
}`);
  };
  m.customProgramCacheKey = () => 'penguin-mark';
  return m;
}

// Adds the mark attributes to a merged geometry.
// parts[i].mark = { color, c: [x,y,z], s: [x,y,z], c2?, s2? } (centres and radii in the merged space).
function withMarks(geo, parts) {
  const n = geo.attributes.position.count;
  const color = new Float32Array(n * 3);
  const c = new Float32Array(n * 4), s = new Float32Array(n * 3).fill(1);
  const c2 = new Float32Array(n * 4), s2 = new Float32Array(n * 3).fill(1);
  const col = new THREE.Color();
  let o = 0;
  for (const p of parts) {
    const count = (p.geo.index ? p.geo.index.count : p.geo.attributes.position.count);
    const mk = p.mark;
    if (mk) {
      col.set(mk.color);
      for (let i = o; i < o + count; i++) {
        color.set([col.r, col.g, col.b], i * 3);
        c.set([...mk.c, 1], i * 4);
        s.set(mk.s, i * 3);
        if (mk.c2) { c2.set([...mk.c2, 1], i * 4); s2.set(mk.s2, i * 3); }
      }
    }
    o += count;
  }
  geo.setAttribute('aMarkColor', new THREE.BufferAttribute(color, 3));
  geo.setAttribute('aMarkC', new THREE.BufferAttribute(c, 4));
  geo.setAttribute('aMarkS', new THREE.BufferAttribute(s, 3));
  geo.setAttribute('aMarkC2', new THREE.BufferAttribute(c2, 4));
  geo.setAttribute('aMarkS2', new THREE.BufferAttribute(s2, 3));
  return geo;
}

function marked(parts) { return withMarks(mergeColored(parts), parts); }

// Proportions follow the "baby schema" that reads as cute at a glance: a head nearly as big as the
// body, big low-set eyes, a small beak, round cheeks and short limbs.
const BODY = { y: 1.0, r: [1.0, 1.02, 0.95] };
const HEAD = { r: [HEAD_R.x, HEAD_R.y, HEAD_R.z] };

function bodyGeometry(dark, white, sphere = PEAR) {
  return cachedGeo(`body${dark}/${white}/${sphere.uuid}`, () => marked([
    { geo: sphere, color: dark, matrix: mat(0, BODY.y, 0, 0, 0, 0, ...BODY.r), mark: { color: white, c: [0, 0.9, 0.4], s: [0.76, 0.85, 0.6] } },
  ]));
}

// A point on the head's surface and its outward normal, so face parts sit on the curve, not inside it.
function onHead(x, y, lift = 0) {
  const [a, b, c] = HEAD.r;
  const z = c * Math.sqrt(Math.max(0.02, 1 - (x / a) ** 2 - (y / b) ** 2));
  const nrm = new THREE.Vector3(x / (a * a), y / (b * b), z / (c * c)).normalize();
  return { p: new THREE.Vector3(x, y, z).addScaledVector(nrm, lift), ry: Math.atan2(nrm.x, nrm.z), rx: -Math.asin(nrm.y) };
}

function onHeadMat(x, y, lift, sx, sy, sz) {
  const h = onHead(x, y, lift);
  return mat(h.p.x, h.p.y, h.p.z, h.rx, h.ry, 0, sx, sy, sz);
}

function headGeometry(dark, white, sphere = SPHERE) {
  return cachedGeo(`head${dark}/${white}/${sphere.uuid}`, () => marked([
    {
      geo: sphere, color: dark, matrix: mat(0, 0, 0, 0, 0, 0, ...HEAD.r),
      // Two overlapping lobes make a heart-shaped face with a dark peak between the eyes.
      mark: { color: white, c: [-0.24, -0.06, 0.42], s: [0.4, 0.62, 0.52], c2: [0.24, -0.06, 0.42], s2: [0.4, 0.62, 0.52] },
    },
    { geo: BEAK, color: PAL.beak, matrix: (() => { const h = onHead(0, FACE.beakY, 0.02); return mat(h.p.x, h.p.y, h.p.z + 0.07, 0.18, 0, 0, 0.78, 0.62, 0.6); })() },
    ...[-1, 1].map((sx) => ({ geo: SPHERE_LO, color: 0xff8fb2, matrix: onHeadMat(sx * 0.47, FACE.eyeY - 0.17, -0.005, 0.12, 0.075, 0.035) })),
  ]));
}

// The head tuft is its own mesh so it can wobble a beat behind the head (secondary motion).
function tuftGeometry(dark) {
  return cachedGeo(`tuft${dark}`, () => mergeColored(
    [[-0.1, 0.5], [0, 0], [0.1, -0.5]].map(([x, rz]) => ({ geo: TUFT, color: dark, matrix: mat(x, 0.14, 0, 0, 0, rz) })),
  ));
}

// Closed, smiling "^ ^" eyes for delight, swapped in for the open eyes.
const HAPPY_ARC = new THREE.TorusGeometry(0.11, 0.03, 6, 16, Math.PI);
function happyEyeGeometry() {
  return cachedGeo('happyEyes', () => mergeColored([-1, 1].map((sx) => {
    const m = onHeadMat(sx * FACE.eyeX, FACE.eyeY - 0.02, 0.02, 1, 1, 1);
    m.elements[13] -= FACE.eyeY;
    return { geo: HAPPY_ARC, color: 0x10142a, matrix: m };
  })));
}

function eyeGeometry(iris) {
  return cachedGeo(`eyes${iris}`, () => mergeColored([-1, 1].flatMap((sx) => {
    const x = sx * FACE.eyeX;
    // Built around the eye centre's height (the eyes group sits there), so blinking squashes in place.
    const layer = (lift, dx, dy, w, h, d, color) => {
      const m = onHeadMat(x + dx, FACE.eyeY + dy, lift, w, h, d);
      m.elements[13] -= FACE.eyeY;
      return { geo: SPHERE_LO, color, matrix: m };
    };
    // Nested layers, each poking a little further out: dark eye, coloured iris, pupil, two catchlights.
    return [
      layer(-0.04, 0, 0, 0.165, 0.205, 0.09, 0x10142a),
      layer(-0.03, 0, -0.02, 0.125, 0.15, 0.088, iris),
      layer(-0.025, 0, -0.02, 0.06, 0.072, 0.09, 0x05060c),
      layer(0, sx * -0.035 + 0.04, 0.075, 0.058, 0.058, 0.075, 0xffffff),
      layer(0, sx * 0.04 - 0.035, -0.085, 0.028, 0.028, 0.072, 0xffffff),
    ];
  })));
}

const SEG = 7;
const SEG_LEN = 0.2;

// Verlet ribbon for a scarf tail, simulated in world space.
class ScarfTail {
  constructor(scene, color, texKind, width = 0.3, len = SEG_LEN) {
    this.pts = [];
    this.len = len;
    for (let i = 0; i < SEG; i++) this.pts.push({ p: new THREE.Vector3(), o: new THREE.Vector3() });
    const n = SEG * 2;
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    const uv = new Float32Array(n * 2);
    const idx = [];
    for (let i = 0; i < SEG; i++) {
      uv.set([i / (SEG - 1), 0, i / (SEG - 1), 1], i * 4);
      if (i < SEG - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    this.width = width;
    this.material = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
    if (texKind) this.material.map = scarfTexture(texKind);
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    this.initialized = false;
  }

  setLook(color, texKind) {
    this.material.color.set(color);
    this.material.map = texKind ? scarfTexture(texKind) : null;
    this.material.needsUpdate = true;
  }

  reset(anchor) {
    for (const q of this.pts) { q.p.copy(anchor); q.o.copy(anchor); }
    this.initialized = true;
  }

  step(dt, anchor, side, back, bodyCenter, bodyR, wind) {
    if (!this.initialized) this.reset(anchor);
    const g = -9 * dt * dt;
    this.pts[0].p.copy(anchor);
    this.pts[0].o.copy(anchor);
    for (let i = 1; i < SEG; i++) {
      const q = this.pts[i];
      const vx = (q.p.x - q.o.x) * 0.9, vy = (q.p.y - q.o.y) * 0.9, vz = (q.p.z - q.o.z) * 0.9;
      q.o.copy(q.p);
      q.p.x += vx + (wind.x + back.x * 0.6) * dt * dt;
      q.p.y += vy + g;
      q.p.z += vz + (wind.z + back.z * 0.6) * dt * dt;
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 1; i < SEG; i++) {
        const a = this.pts[i - 1].p, b = this.pts[i].p;
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const d = Math.hypot(dx, dy, dz) || 1e-4;
        const k = (d - this.len) / d;
        if (i === 1) { b.x -= dx * k; b.y -= dy * k; b.z -= dz * k; }
        else {
          a.x += dx * k * 0.5; a.y += dy * k * 0.5; a.z += dz * k * 0.5;
          b.x -= dx * k * 0.5; b.y -= dy * k * 0.5; b.z -= dz * k * 0.5;
        }
      }
      for (let i = 1; i < SEG; i++) {
        const p = this.pts[i].p;
        const dx = p.x - bodyCenter.x, dy = p.y - bodyCenter.y, dz = p.z - bodyCenter.z;
        const d = Math.hypot(dx, dy, dz);
        if (d < bodyR && d > 1e-4) { const s = bodyR / d; p.x = bodyCenter.x + dx * s; p.y = bodyCenter.y + dy * s; p.z = bodyCenter.z + dz * s; }
      }
    }
    const arr = this.posAttr.array;
    for (let i = 0; i < SEG; i++) {
      const p = this.pts[i].p;
      const w = this.width * (i === SEG - 1 ? 1.15 : 1) * 0.5;
      arr[i * 6] = p.x - side.x * w; arr[i * 6 + 1] = p.y - side.y * w; arr[i * 6 + 2] = p.z - side.z * w;
      arr[i * 6 + 3] = p.x + side.x * w; arr[i * 6 + 4] = p.y + side.y * w; arr[i * 6 + 5] = p.z + side.z * w;
    }
    this.posAttr.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  dispose(scene) { scene.remove(this.mesh); this.mesh.geometry.dispose(); this.material.dispose(); }
}

const TUFT_HIDDEN = new Set(['beanie', 'helmetLamp', 'viking', 'pirate', 'tophat', 'wizard', 'sailor', 'scholar', 'party', 'chef', 'souwester', 'sunhat', 'aviator', 'starhood', 'propeller']);

const _v = new THREE.Vector3();
const _side = new THREE.Vector3();
const _back = new THREE.Vector3();
const _center = new THREE.Vector3();
const _wind = new THREE.Vector3(1.2, 0, 0.6);

export class Penguin {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.opts = opts;
    const s = opts.scale ?? 1;
    this.root = new THREE.Group();
    this.root.name = opts.name || 'penguin';
    this.root.scale.setScalar(s);
    this.tilt = new THREE.Group();
    this.tilt.position.y = 1.05;
    this.root.add(this.tilt);
    const body = this.body = new THREE.Group();
    body.position.y = -1.05;
    this.tilt.add(body);

    const darkColor = opts.body ?? PAL.penguin;
    const whiteColor = opts.belly ?? PAL.belly;
    const dark = plushSolid(darkColor);

    // Tiny penguins (chicks) never fill the screen, so they get cheaper spheres.
    const sphere = opts.lowPoly ? SPHERE_LO : SPHERE;
    const skin = opts.lowPoly ? SPHERE : SPHERE_HI;
    this.bodyMesh = part(bodyGeometry(darkColor, whiteColor, opts.lowPoly ? PEAR : PEAR_HI), vertexColorMat(), 0, 0, 0, 1);
    body.add(this.bodyMesh);
    // Where the scarf physics treats the body as a ball.
    this.bodyCenter = new THREE.Object3D();
    this.bodyCenter.position.set(0, BODY.y, 0);
    body.add(this.bodyCenter);

    // Head (face, tuft, beak and cheeks are one mesh; the eyes stay separate so they can blink).
    // Little ones get an even bigger head for their size.
    const headScale = opts.headScale ?? (s < 0.7 ? 1.32 : 1.22);
    const head = this.head = new THREE.Group();
    this.headY = 1.45 + HEAD.r[1] * headScale;
    head.position.set(0, this.headY, 0.1);
    head.scale.setScalar(headScale);
    body.add(head);
    head.add(part(headGeometry(darkColor, whiteColor, skin), vertexColorMat(), 0, 0, 0, 1));
    this.tuft = new THREE.Group();
    this.tuft.position.set(0, 0.72, 0);
    this.tuft.add(part(tuftGeometry(darkColor), vertexColorMat(), 0, 0, 0, 1));
    head.add(this.tuft);

    this.eyes = new THREE.Group();
    this.eyes.position.set(0, FACE.eyeY, 0);
    head.add(this.eyes);
    this.eyes.add(part(eyeGeometry(opts.iris ?? 0x2a5cc8), eyeMaterial(), 0, 0, 0, 1, 1, 1, false));
    this.closedEyes = new THREE.Group();
    this.closedEyes.position.set(0, FACE.eyeY, 0);
    this.closedEyes.add(part(happyEyeGeometry(), eyeMaterial(), 0, 0, 0, 1, 1, 1, false));
    this.closedEyes.visible = false;
    head.add(this.closedEyes);
    this.hatSlot = new THREE.Group();
    this.hatSlot.position.y = HAT_LIFT;
    head.add(this.hatSlot);

    // Short, rounded flippers pivot at the shoulders.
    this.flippers = [];
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * 0.86, 1.5, 0);
      const f = part(sphere, dark, sx * 0.08, -0.5, 0, 0.16, 0.56, 0.38);
      pivot.add(f);
      body.add(pivot);
      this.flippers.push({ pivot, side: sx });
    }

    // Feet
    this.feet = [];
    for (const sx of [-1, 1]) {
      const f = part(SPHERE_LO, plushSolid(PAL.feet), sx * 0.38, 0.07, 0.42, 0.3, 0.13, 0.42);
      this.root.add(f);
      this.feet.push({ mesh: f, side: sx });
    }

    // Scarf ring + knot + two tails, snug in the "neck" where the big head meets the body.
    this.scarfMat = plush(lambert({ color: opts.scarf ?? PAL.scarf }, CHARACTER_RIM));
    this.scarfRing = part(TORUS, this.scarfMat, 0, 1.68, 0.03, 1, 0.9, 1);
    body.add(this.scarfRing);
    // Knot on the back-right shoulder so the tails stream behind, visible from the follow camera.
    this.knot = part(SPHERE_LO, this.scarfMat, 0.6, 1.66, -0.38, 0.2, 0.2, 0.2);
    body.add(this.knot);
    this.tails = [];
    if (opts.scarf !== null) {
      this.tails.push(new ScarfTail(scene, opts.scarf ?? PAL.scarf, opts.scarfTex, 0.3, SEG_LEN * s));
      this.tails.push(new ScarfTail(scene, opts.scarf ?? PAL.scarf, opts.scarfTex, 0.26, SEG_LEN * 0.8 * s));
    } else {
      this.scarfRing.visible = false;
      this.knot.visible = false;
    }
    if (opts.scarfTex) this.setScarf(opts.scarf ?? PAL.scarf, opts.scarfTex);

    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20), blobShadowMaterial());
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 2;
    scene.add(this.shadow);

    if (opts.hat) this.setHat(opts.hat, opts.hatColor);
    if (opts.extras) opts.extras(this);

    scene.add(this.root);

    this.walkPhase = 0;
    this.blinkT = 2 + Math.random() * 3;
    this.blink = 0;
    this.slideAmt = 0;
    this.swimAmt = 0;
    this.airAmt = 0;
    this.stretch = 1;
    this.celebrate = 0;
    this.lookYaw = 0;
    this.time = Math.random() * 10;
    this.groundY = 0;
    this.visibleTails = true;
    // Springs and moods for the cute details (see animate).
    this.sq = 0; this.sqV = 0; this.bob = 0; this.bobV = 0;
    this.tuftA = 0; this.tuftV = 0; this.prevHeadY = null;
    this.spinT = 0;
    this.eyeLead = 0; this.dartT = 1; this.dartX = 0; this.dartY = 0; this.lastDouble = false;
    this.preenAmt = 0; this.yawnAmt = 0; this.sitAmt = 0; this.napAmt = 0;
  }

  setHat(id, color) {
    this.hatSlot.clear();
    // The tuft pokes up through open hats (bow, flowers, crown) but hides under full ones.
    this.tuft.visible = !TUFT_HIDDEN.has(id);
    if (!id) return;
    const h = buildHat(id, color);
    if (h) this.hatSlot.add(h);
  }

  // A cosmetic sled that appears under the belly while sliding.
  setSled(kind, color = 0x9a6a44) {
    if (this.sled) { this.root.remove(this.sled); this.sled = null; }
    if (!kind) return;
    const g = new THREE.Group();
    const sledMat = solid(color);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 2.5), sledMat);
    board.position.y = 0.2;
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 6, 12, Math.PI), sledMat);
    curl.position.set(0, 0.55, 1.25);
    curl.rotation.y = Math.PI / 2;
    g.add(board, curl);
    for (const s of [-1, 1]) {
      const runner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.6), solid(kind === 'comet' ? 0xffffff : 0x3a3a48));
      runner.position.set(s * 0.55, 0.06, 0.05);
      g.add(runner);
    }
    if (kind === 'comet') {
      const glow = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 10), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(0, 0.3, -2.3);
      g.add(glow);
    }
    g.visible = false;
    this.sled = g;
    this.root.add(g);
  }

  setScarf(color, texKind) {
    this.scarfMat.color.set(texKind ? 0xffffff : color);
    this.scarfMat.map = texKind ? scarfTexture(texKind) : null;
    this.scarfMat.needsUpdate = true;
    for (const t of this.tails) t.setLook(texKind ? 0xffffff : color, texKind);
  }

  // Story visibility (setVisible) and distance culling (setCulled) are tracked separately.
  setVisible(v) { this.shown = v; this.applyVisibility(); }

  setCulled(c) { if (this.culled !== c) { this.culled = c; this.applyVisibility(); } }

  applyVisibility() {
    const v = this.shown !== false && !this.culled;
    this.root.visible = v;
    this.shadow.visible = v;
    for (const t of this.tails) t.mesh.visible = v;
  }

  get position() { return this.root.position; }

  // A landing squashes the body; the spring overshoots once and the head bobbles a beat late.
  land(impact = 8) { this.sqV -= clamp(impact, 4, 22) * 0.05; }

  hop() { this.sqV += 0.9; }

  // A happy spin-hop (correct answers, rewards).
  spin() { this.spinT = 0.65; }

  // state: { speed, grounded, sliding, swimming, vy, talking, celebrate, happy, lookYaw, idleTime }
  animate(dt, st = {}) {
    this.time += dt;
    const t = this.time;
    const speed = st.speed ?? 0;
    this.lastSpeed = speed;
    const k = clamp(Math.abs(speed) / 5, 0, 1);
    this.walkPhase += dt * (2.2 + Math.abs(speed) * 1.25) * (k > 0.05 ? 1 : 0);

    this.slideAmt = damp(this.slideAmt, st.sliding ? 1 : 0, 10, dt);
    this.swimAmt = damp(this.swimAmt, st.swimming ? 1 : 0, 6, dt);
    this.airAmt = damp(this.airAmt, st.grounded === false && !st.swimming ? 1 : 0, 12, dt);
    this.celebrate = damp(this.celebrate, st.celebrate ? 1 : 0, 6, dt);
    const lying = Math.max(this.slideAmt, this.swimAmt);

    // Idle routine (the player passes idleTime): look around, preen, yawn, sit down, nap.
    const idleT = st.idleTime ?? 0;
    this.preenAmt = damp(this.preenAmt, idleT > 9 && idleT < 11.5 ? 1 : 0, 5, dt);
    this.yawnAmt = damp(this.yawnAmt, idleT > 17 && idleT < 18.8 ? 1 : 0, 5, dt);
    this.sitAmt = damp(this.sitAmt, idleT > 24 ? 1 : 0, 3, dt);
    this.napAmt = damp(this.napAmt, idleT > 38 ? 1 : 0, 1.5, dt);

    // A toddler waddle: about ten degrees of roll per step.
    const waddle = Math.sin(this.walkPhase) * 0.17 * k * (1 - lying) * (1 - this.airAmt);
    const bounce = Math.abs(Math.sin(this.walkPhase)) * 0.1 * k * (1 - lying) * (1 - this.airAmt);
    const breathe = 1 + Math.sin(t * (2.1 - this.napAmt * 1.2)) * (0.012 + this.napAmt * 0.018);
    const vy = st.vy ?? 0;
    const targetStretch = 1 + clamp(vy * 0.018, -0.1, 0.14) * this.airAmt;
    this.stretch = damp(this.stretch, targetStretch, 14, dt);

    // Squash spring (landings and hops) and a head bobble that follows it a beat late.
    const h = Math.min(dt, 1 / 30);
    this.sqV += (-170 * this.sq - 11 * this.sqV) * h;
    this.sq += this.sqV * h;
    this.bobV += (-90 * (this.bob - this.sq) - 8 * this.bobV) * h;
    this.bob += this.bobV * h;
    const sq = clamp(this.sq, -0.3, 0.3);

    let spinA = 0;
    if (this.spinT > 0) {
      this.spinT = Math.max(0, this.spinT - dt);
      const u = 1 - this.spinT / 0.65;
      spinA = (1 - (1 - u) ** 3) * Math.PI * 2;
    }

    if (this.sled) this.sled.visible = this.slideAmt > 0.35;
    this.tilt.rotation.y = spinA;
    this.tilt.rotation.z = waddle + Math.sin(t * 11) * 0.03 * this.swimAmt;
    this.tilt.rotation.x = lerp(0, 1.38, this.slideAmt) + lerp(0, 1.2, this.swimAmt * (1 - this.slideAmt)) + Math.sin(t * 3) * 0.05 * this.swimAmt - this.sitAmt * 0.16;
    this.tilt.position.y = 1.05 + bounce - lying * 0.2 + Math.sin(t * 3.4) * 0.06 * this.swimAmt - this.sitAmt * 0.3;
    const wide = (1 - sq * 0.6) / Math.sqrt(this.stretch);
    this.tilt.scale.set(wide, (1 + sq) * this.stretch * breathe, wide);

    // Head: the eyes lead and the head follows; look around when idle, nod when talking.
    const idle = (1 - k) * (1 - lying);
    const glance = (Math.sin(t * 0.4) * 0.35 + Math.sin(t * 0.13) * 0.25) * (1 - this.napAmt);
    const wantYaw = lerp(st.lookYaw ?? glance * idle, 0.85, this.preenAmt);
    this.eyeLead = damp(this.eyeLead, clamp((wantYaw - this.head.rotation.y) * 0.1, -0.045, 0.045), 14, dt);
    this.head.rotation.y = damp(this.head.rotation.y, wantYaw, 3.2, dt);
    this.head.rotation.x = (st.talking ? Math.sin(t * 9) * 0.07 : 0) - lying * 0.9 + this.celebrate * -0.25
      + this.preenAmt * 0.45 - this.yawnAmt * 0.5 + this.napAmt * 0.32 + this.bob * 0.3;
    this.head.rotation.z = st.talking ? Math.sin(t * 4.5) * 0.08
      : (Math.sin(t * 0.55) * 0.1 + Math.sin(t * 0.21) * 0.06) * idle * (1 - this.napAmt) + this.preenAmt * Math.sin(t * 18) * 0.06;
    this.head.position.y = this.headY + this.bob * 0.35;

    // Tiny eye darts while idle.
    this.dartT -= dt;
    if (this.dartT <= 0) {
      this.dartT = 0.7 + Math.random() * 2.2;
      const still = Math.random() < 0.4;
      this.dartX = still ? 0 : (Math.random() - 0.5) * 0.03;
      this.dartY = still ? 0 : (Math.random() - 0.5) * 0.016;
    }
    this.eyes.position.x = damp(this.eyes.position.x, this.eyeLead + this.dartX * idle, 22, dt);
    this.eyes.position.y = damp(this.eyes.position.y, FACE.eyeY + this.dartY * idle, 22, dt);

    // Blinks, sometimes doubled; "^ ^" when happy, "u u" when yawning or asleep.
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blink = 0.14;
      const dbl = !this.lastDouble && Math.random() < 0.22;
      this.lastDouble = dbl;
      this.blinkT = dbl ? 0.28 : 2.2 + Math.random() * 3.5;
    }
    if (this.blink > 0) this.blink -= dt;
    const happy = st.happy || this.celebrate > 0.5;
    const sleepy = this.yawnAmt > 0.5 || this.napAmt > 0.5;
    this.closedEyes.visible = happy || sleepy;
    this.closedEyes.rotation.z = sleepy && !happy ? Math.PI : 0;
    this.eyes.visible = !this.closedEyes.visible;
    this.eyes.scale.y = this.blink > 0 ? 0.12 : 1;

    // The tuft wobbles behind the head's up-and-down motion and sways with the waddle.
    const hy = this.tilt.position.y + this.bob * 0.35;
    const vel = this.prevHeadY === null ? 0 : (hy - this.prevHeadY) / Math.max(dt, 1e-3);
    this.prevHeadY = hy;
    this.tuftV += (-110 * this.tuftA - 6 * this.tuftV - vel * 2.2) * h;
    this.tuftA += this.tuftV * h;
    this.tuft.rotation.x = clamp(this.tuftA, -0.6, 0.6);
    this.tuft.rotation.z = -waddle * 0.9 + Math.sin(t * 1.3) * 0.05;

    // Flippers
    for (const f of this.flippers) {
      let rz = 0.22 + Math.sin(this.walkPhase + (f.side > 0 ? Math.PI : 0)) * 0.22 * k;
      let rx = Math.sin(this.walkPhase) * 0.2 * k * f.side;
      if (this.airAmt > 0.01) rz = lerp(rz, 1.1 + Math.sin(t * 22) * 0.5, this.airAmt);
      if (st.talking) rz += Math.max(0, Math.sin(t * 3 + f.side)) * 0.5 * (f.side > 0 ? 1 : 0.3);
      rz = lerp(rz, 2.5 + Math.sin(t * 14 + f.side) * 0.25, this.celebrate);
      if (f.side > 0) rz = lerp(rz, 1.4 + Math.sin(t * 16) * 0.15, this.preenAmt);
      rz = lerp(rz, 1.0, this.yawnAmt);
      rz = lerp(rz, 0.08, this.sitAmt * (1 - this.yawnAmt));
      rz = lerp(rz, 0.15, this.slideAmt);
      rx = lerp(rx, -1.1, this.slideAmt);
      rx = lerp(rx, Math.sin(t * 7 + (f.side > 0 ? 0 : Math.PI)) * 1.1, this.swimAmt * (1 - this.slideAmt));
      rz = lerp(rz, 0.6, this.swimAmt * (1 - this.slideAmt));
      f.pivot.rotation.z = rz * f.side;
      f.pivot.rotation.x = rx;
    }

    // Feet: a little pigeon-toed; step when walking, stick out when sitting, tuck back when sliding.
    for (const f of this.feet) {
      const ph = this.walkPhase + (f.side > 0 ? Math.PI : 0);
      const lift = Math.max(0, Math.sin(ph)) * 0.18 * k * (1 - this.airAmt);
      f.mesh.position.set(f.side * 0.38, 0.07 + lift + lying * 0.35 + this.sitAmt * 0.1, 0.42 + Math.cos(ph) * 0.22 * k * (1 - lying) - lying * 1.9 + this.sitAmt * 0.32);
      f.mesh.rotation.x = lying * 1.3 - this.sitAmt * 0.45;
      f.mesh.rotation.y = -f.side * 0.22;
      f.mesh.visible = this.swimAmt < 0.9 || this.slideAmt > 0.1;
    }
  }

  // Must run after the root's world matrix is current.
  updateAttachments(dt, groundY, near = true) {
    const s = this.root.scale.x;
    this.shadow.position.set(this.root.position.x, groundY + 0.06, this.root.position.z);
    const hgt = Math.max(0, this.root.position.y - groundY);
    this.shadow.scale.setScalar(s * Math.max(0.45, 1 - hgt * 0.12) * (1 + this.slideAmt * 0.3));
    this.shadow.material.opacity = 0.42;
    if (!near || !this.tails.length) {
      for (const t of this.tails) t.mesh.visible = false;
      return;
    }
    this.root.updateMatrixWorld(true);
    this.knot.getWorldPosition(_v);
    _side.set(1, 0, 0).applyQuaternion(this.root.quaternion);
    _back.set(0, 0, -1).applyQuaternion(this.root.quaternion).multiplyScalar(this.lastSpeed || 0);
    this.bodyCenter.getWorldPosition(_center);
    const t = this.time;
    _wind.set(1.4 + Math.sin(t * 0.7) * 0.8, 0, 0.8 + Math.cos(t * 0.9) * 0.6);
    this.tails.forEach((tail, i) => {
      tail.mesh.visible = this.root.visible;
      _v.y -= i * 0.05 * s;
      tail.step(Math.min(dt, 1 / 30), _v, _side, _back, _center, 0.95 * s, _wind);
    });
  }

  dispose() {
    this.scene.remove(this.root);
    this.scene.remove(this.shadow);
    for (const t of this.tails) t.dispose(this.scene);
  }
}
