import * as THREE from 'three';
import { Penguin } from './penguin.js';
import { approach, clamp, damp, wrapAngle } from '../core/mathutil.js';
import { WATER_Y, WORLD_RADIUS } from '../world/layout.js';

const WALK = 8.5;
const BACK = 3.8;
const SLIDE_MIN = 11;
const SLIDE_MAX = 22;
const SWIM = 7.5;
const SWIM_BOOST = 12;
const GRAVITY = 30;
const JUMP_V = 11.5;
const MAX_SLOPE = 1.05;
const SWIM_DEPTH = 0.95;
// Glider wings (Book 3): holding jump while falling turns the fall into a slow glide that keeps moving forward.
const GLIDE_SINK = 2.5;
const GLIDE_SPEED = 11;

// A little hang-glider sail that opens over the penguin's back while it glides.
function buildSail() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.4); shape.lineTo(-2.4, -0.6); shape.lineTo(0, -0.2); shape.lineTo(2.4, -0.6); shape.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshLambertMaterial({ color: 0xffb000, side: THREE.DoubleSide }));
  sail.rotation.x = Math.PI / 2;
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.5), new THREE.MeshLambertMaterial({ color: 0xff5c6a, side: THREE.DoubleSide }));
  stripe.rotation.x = Math.PI / 2;
  stripe.position.set(0, 0.01, 0.5);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 5), new THREE.MeshLambertMaterial({ color: 0x5a5a64 }));
  bar.position.set(0, -0.7, 0);
  g.add(sail, stripe, bar);
  g.position.set(0, 2.6, 0);
  g.scale.setScalar(0.001);
  return g;
}

export class Player {
  constructor(scene, world, look = {}) {
    this.world = world;
    this.model = new Penguin(scene, { name: 'player', scarf: look.scarf, scarfTex: look.scarfTex, hat: look.hat, hatColor: look.hatColor });
    this.pos = this.model.root.position;
    this.yaw = 0;
    this.turnVel = 0;
    this.speed = 0;
    this.vy = 0;
    this.grounded = true;
    this.sliding = false;
    this.swimming = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.frozen = false;
    this.radius = 0.9;
    this.events = [];
    this.lastSafe = new THREE.Vector3();
    this.safeTimer = 0;
    this.stepAcc = 0;
    this.airAssist = null;
    this.canGlide = false;
    this.gliding = false;
    this.sail = null;
    this.sailOpen = 0;
    this.platform = null;
    this.groundY = 0;
    this.celebrateT = 0;
    this.talking = false;
    this.lookYaw = undefined;
    this.inWaterBarrier = false;
    this.idleTime = 0;
    // Where the current goal is; after a moment of standing still the penguin glances toward it.
    this.objective = null;
  }

  teleport(x, z, yaw = this.yaw, y = null) {
    const g = this.world.groundAt(x, z, 1e9);
    this.pos.set(x, y ?? g.y, z);
    this.yaw = yaw;
    this.speed = 0;
    this.vy = 0;
    this.grounded = true;
    this.sliding = false;
    this.swimming = false;
    this.lastSafe.copy(this.pos);
    this.model.tails.forEach((t) => { t.initialized = false; });
  }

  get forward() { return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }

  celebrate(seconds = 1.6) {
    this.celebrateT = seconds;
    this.model.spin();
    if (this.grounded) { this.vy = 7; this.grounded = false; }
  }

  update(dt, input) {
    const world = this.world;
    if (this.rail) {
      // An activity (the slalom) drives position and speed directly.
      this.grounded = true;
      this.swimming = false;
      this.sliding = true;
      this.model.root.rotation.y = this.yaw;
      this.model.animate(dt, { speed: this.speed, grounded: true, sliding: true });
      this.model.updateAttachments(dt, this.groundY, true);
      return;
    }
    const fwdIn = this.frozen ? 0 : input.forward;
    const turnIn = this.frozen ? 0 : input.turn;
    const slideKey = !this.frozen && input.slide;
    if (!this.frozen && input.pressed('Space')) this.jumpBuffer = 0.14;
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    this.celebrateT = Math.max(0, this.celebrateT - dt);

    // Turning with a little acceleration so taps are precise and holds are quick.
    const maxTurn = this.sliding ? 1.8 : this.swimming ? 2.4 : 2.8;
    this.turnVel = approach(this.turnVel, turnIn * maxTurn, (turnIn ? 14 : 20) * dt);
    this.yaw = wrapAngle(this.yaw + this.turnVel * dt);

    // Target speed
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    if (this.swimming) {
      const target = fwdIn > 0 ? (slideKey ? SWIM_BOOST : SWIM) : fwdIn < 0 ? -3 : 0;
      this.speed = approach(this.speed, target, 14 * dt);
      this.sliding = false;
    } else if (this.sliding) {
      if (!slideKey || Math.abs(this.speed) < 3) this.sliding = false;
      const g = world.terrain.gradient(this.pos.x, this.pos.z);
      const downhill = -(g.x * fx + g.z * fz);
      this.speed += downhill * 18 * dt;
      if (fwdIn > 0 && this.speed < SLIDE_MIN) this.speed = approach(this.speed, SLIDE_MIN, 10 * dt);
      else this.speed = approach(this.speed, 0, (fwdIn < 0 ? 16 : 2.2) * dt);
      this.speed = clamp(this.speed, -2, SLIDE_MAX);
    } else {
      const target = this.gliding ? GLIDE_SPEED : fwdIn > 0 ? WALK : fwdIn < 0 ? -BACK : 0;
      const accel = this.gliding ? 6 : this.grounded ? (target === 0 ? 34 : 26) : 9;
      this.speed = approach(this.speed, target, accel * dt);
      if (slideKey && this.grounded && this.speed > 2.5) {
        this.sliding = true;
        this.speed = Math.max(this.speed, 13);
        this.events.push({ type: 'slide' });
      }
    }

    // Horizontal move with slope blocking and colliders
    let dx = fx * this.speed * dt, dz = fz * this.speed * dt;
    const stepLen = Math.hypot(dx, dz);
    if (stepLen > 1e-5 && !this.swimming) {
      const nx = this.pos.x + dx, nz = this.pos.z + dz;
      const hNew = world.groundAt(nx, nz, this.pos.y).y;
      const rise = hNew - this.pos.y;
      if (this.grounded && rise > 0.2 && rise / stepLen > MAX_SLOPE) {
        // Slide along the slope's contour instead of climbing it.
        const g = world.terrain.gradient(nx, nz);
        const gl = Math.hypot(g.x, g.z) || 1;
        const cx = -g.z / gl, cz = g.x / gl;
        const along = dx * cx + dz * cz;
        dx = cx * along * 0.8;
        dz = cz * along * 0.8;
        if (this.sliding) this.speed *= 0.9;
      }
    }
    this.pos.x += dx;
    this.pos.z += dz;
    if (world.collision.resolve(this.pos, this.radius, this.swimming)) {
      if (this.sliding) this.speed *= 0.85;
    }
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > WORLD_RADIUS) { this.pos.x *= WORLD_RADIUS / r; this.pos.z *= WORLD_RADIUS / r; }

    // Vertical
    const ground = world.groundAt(this.pos.x, this.pos.z, this.pos.y);
    this.platform = ground.platform;
    this.groundY = ground.y;
    const deepWater = !ground.platform && ground.terrain < WATER_Y - SWIM_DEPTH;

    if (deepWater && this.pos.y <= WATER_Y - 0.2 + (this.swimming ? 0.5 : 0)) {
      if (!this.swimming) this.events.push({ type: 'splash', speed: Math.abs(this.vy) + Math.abs(this.speed) * 0.3 });
      this.swimming = true;
      this.grounded = false;
      this.sliding = false;
      this.vy = 0;
      this.pos.y = damp(this.pos.y, WATER_Y - 0.55, 8, dt);
      if (this.jumpBuffer > 0) {
        this.jumpBuffer = 0;
        this.vy = 10.5;
        this.pos.y = WATER_Y - 0.1;
        this.swimming = false;
        this.events.push({ type: 'jump', fromWater: true });
      }
    } else {
      if (this.swimming && !deepWater) this.swimming = false;
      if (this.swimming && deepWater && this.pos.y > WATER_Y + 0.4) this.swimming = false;
      if ((this.grounded || this.coyote > 0) && this.jumpBuffer > 0 && !this.swimming) {
        this.vy = JUMP_V + (this.sliding ? 1.5 : 0);
        // Pressing jump and forward together should clear a gap even from a standstill.
        if (fwdIn > 0) this.speed = Math.max(this.speed, WALK * 0.85);
        this.grounded = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        this.events.push({ type: 'jump' });
      }
      if (!this.swimming) {
        this.vy -= GRAVITY * dt;
        this.gliding = this.canGlide && !this.grounded && this.vy < 0 && !this.frozen && input.down('Space');
        if (this.gliding) this.vy = Math.max(this.vy, -GLIDE_SINK);
        this.pos.y += this.vy * dt;
        if (this.airAssist && !this.grounded && this.vy < 2) {
          const t = this.airAssist(this.pos.x, this.pos.z, fx * this.speed, fz * this.speed);
          if (t) {
            this.pos.x = damp(this.pos.x, t.x, 3.2, dt);
            this.pos.z = damp(this.pos.z, t.z, 3.2, dt);
          }
        }
        const g2 = world.groundAt(this.pos.x, this.pos.z, this.pos.y - this.vy * dt);
        if (this.pos.y <= g2.y) {
          if (!this.grounded && this.vy < -4) this.events.push({ type: 'land', speed: -this.vy, platform: g2.platform });
          this.pos.y = g2.y;
          this.vy = 0;
          this.grounded = true;
          this.platform = g2.platform;
        } else if (this.grounded && this.vy <= 0 && this.pos.y - g2.y < 0.9) {
          this.pos.y = g2.y;
          this.vy = 0;
          this.platform = g2.platform;
        } else if (this.grounded) {
          this.grounded = false;
          this.coyote = 0.12;
        }
      }
    }

    // Safe position for respawns: solid ground only.
    this.safeTimer -= dt;
    if (this.grounded && !this.platform && !this.swimming && this.safeTimer <= 0) {
      this.lastSafe.copy(this.pos);
      this.safeTimer = 0.4;
    }

    // Footsteps
    if (this.grounded && !this.sliding && Math.abs(this.speed) > 1) {
      this.stepAcc += Math.abs(this.speed) * dt;
      if (this.stepAcc > 1.7) { this.stepAcc = 0; this.events.push({ type: 'step', platform: this.platform }); }
    } else if (this.swimming && Math.abs(this.speed) > 1) {
      this.stepAcc += Math.abs(this.speed) * dt;
      if (this.stepAcc > 3) { this.stepAcc = 0; this.events.push({ type: 'stroke' }); }
    }

    const busy = this.frozen || fwdIn || turnIn || slideKey || !this.grounded || this.swimming || this.talking;
    this.idleTime = busy ? 0 : this.idleTime + dt;
    let look = this.lookYaw;
    if (look === undefined && this.objective && this.idleTime > 2.5 && this.idleTime < 24) {
      const want = Math.atan2(this.objective.x - this.pos.x, this.objective.z - this.pos.z);
      look = clamp(wrapAngle(want - this.yaw), -1.1, 1.1);
    }

    if (this.grounded || this.swimming) this.gliding = false;
    if (this.canGlide || this.sail) {
      if (!this.sail) { this.sail = buildSail(); this.model.root.add(this.sail); }
      this.sailOpen = damp(this.sailOpen, this.gliding ? 1 : 0, 10, dt);
      this.sail.scale.setScalar(Math.max(0.001, this.sailOpen));
      this.sail.visible = this.sailOpen > 0.01;
    }

    this.model.root.rotation.y = this.yaw;
    this.model.animate(dt, {
      idleTime: this.idleTime,
      speed: this.speed,
      grounded: this.grounded,
      sliding: this.sliding || this.gliding,
      swimming: this.swimming,
      vy: this.vy,
      celebrate: this.celebrateT > 0,
      talking: this.talking,
      lookYaw: look,
      happy: this.celebrateT > 0,
    });
    this.model.updateAttachments(dt, this.swimming ? WATER_Y - 0.4 : this.groundY, true);
    this.model.shadow.visible = !this.swimming && this.model.root.visible;
  }

  takeEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }
}
