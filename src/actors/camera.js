import * as THREE from 'three';
import { clamp, damp, dampAngle, easeInOut } from '../core/mathutil.js';

const _desired = new THREE.Vector3();
const _look = new THREE.Vector3();

export class FollowCam {
  constructor(camera, terrain) {
    this.camera = camera;
    this.terrain = terrain;
    this.yaw = 0;
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.pitch = 0.3;
    this.dist = 11;
    this.targetDist = 11;
    this.pos = new THREE.Vector3(0, 20, 20);
    this.look = new THREE.Vector3();
    this.shot = null;
    this.blend = 0;
    this.shake = 0;
    this.fovBase = 60;
  }

  snap(player) {
    this.yaw = player.yaw;
    this.orbitYaw = 0;
    this.computeFollow(player, _desired, _look);
    this.pos.copy(_desired);
    this.look.copy(_look);
  }

  computeFollow(player, outPos, outLook) {
    const yaw = this.yaw + this.orbitYaw;
    const extraPitch = player.swimming ? -0.05 : player.sliding ? 0.04 : 0;
    const pitch = clamp(this.pitch + this.orbitPitch + extraPitch, -0.1, 1.1);
    const d = this.dist;
    const p = player.pos;
    outPos.set(
      p.x - Math.sin(yaw) * Math.cos(pitch) * d,
      p.y + 2.2 + Math.sin(pitch) * d,
      p.z - Math.cos(yaw) * Math.cos(pitch) * d,
    );
    const minY = this.terrain.heightAt(outPos.x, outPos.z) + 1.4;
    if (outPos.y < minY) outPos.y = minY;
    outLook.set(p.x + Math.sin(player.yaw) * 1.5, p.y + 1.9, p.z + Math.cos(player.yaw) * 1.5);
  }

  // shot: { pos: Vector3, look: Vector3, fov? } ; blend seconds
  setShot(shot, blend = 1.2) {
    this.shotFrom = { pos: this.camera.position.clone(), look: this.look.clone(), fov: this.camera.fov };
    this.shot = shot;
    this.blendDur = blend;
    this.blend = 0;
  }

  release(blend = 1.0) {
    if (!this.shot) return;
    this.releaseFrom = { pos: this.camera.position.clone(), look: this.look.clone(), fov: this.camera.fov };
    this.shot = null;
    this.releaseDur = blend;
    this.releaseT = 0;
  }

  addShake(amount) { this.shake = Math.min(1.2, this.shake + amount); }

  update(dt, player, input) {
    const m = input.takeMouse();
    if (!this.shot) {
      this.orbitYaw -= m.dx * 0.006;
      this.orbitPitch = clamp(this.orbitPitch + m.dy * 0.004, -0.35, 0.7);
      this.targetDist = clamp(this.targetDist + m.wheel * 1.3, 5.5, 22);
      const idleMouse = performance.now() - input.mouse.lastMove > 1400 && !input.mouse.dragging;
      if (idleMouse && Math.abs(player.speed) > 0.5) {
        this.orbitYaw = damp(this.orbitYaw, 0, 1.6, dt);
        this.orbitPitch = damp(this.orbitPitch, 0, 1.2, dt);
      }
      const follow = player.speed < -0.2 ? 0.4 : player.sliding ? 2.2 : 3.0;
      this.yaw = dampAngle(this.yaw, player.yaw, follow, dt);
      const speedPull = player.sliding ? 2.5 : player.swimming ? 1 : 0;
      this.dist = damp(this.dist, this.targetDist + speedPull, 3, dt);
      this.computeFollow(player, _desired, _look);
      if (this.releaseFrom) {
        this.releaseT += dt;
        const t = easeInOut(Math.min(1, this.releaseT / this.releaseDur));
        _desired.lerpVectors(this.releaseFrom.pos, _desired, t);
        _look.lerpVectors(this.releaseFrom.look, _look, t);
        this.camera.fov = THREE.MathUtils.lerp(this.releaseFrom.fov, this.fovBase, t);
        if (t >= 1) this.releaseFrom = null;
        this.pos.copy(_desired);
        this.look.copy(_look);
      } else {
        this.pos.x = damp(this.pos.x, _desired.x, 9, dt);
        this.pos.y = damp(this.pos.y, _desired.y, 7, dt);
        this.pos.z = damp(this.pos.z, _desired.z, 9, dt);
        this.look.x = damp(this.look.x, _look.x, 14, dt);
        this.look.y = damp(this.look.y, _look.y, 10, dt);
        this.look.z = damp(this.look.z, _look.z, 14, dt);
        this.camera.fov = damp(this.camera.fov, this.fovBase + (player.sliding ? 8 : 0), 4, dt);
      }
    } else {
      this.blend = Math.min(1, this.blend + dt / this.blendDur);
      const t = easeInOut(this.blend);
      const target = typeof this.shot.pos === 'function' ? this.shot.pos() : this.shot.pos;
      const look = typeof this.shot.look === 'function' ? this.shot.look() : this.shot.look;
      this.pos.lerpVectors(this.shotFrom.pos, target, t);
      this.look.lerpVectors(this.shotFrom.look, look, t);
      this.camera.fov = THREE.MathUtils.lerp(this.shotFrom.fov, this.shot.fov ?? this.fovBase, t);
    }
    this.camera.position.copy(this.pos);
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.5);
      const s = this.shake * this.shake * 0.35;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
    }
    this.camera.lookAt(this.look);
    this.camera.updateProjectionMatrix();
  }
}
