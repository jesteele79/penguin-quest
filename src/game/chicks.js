// The lost little ones side quest (Book 1's chicks, Book 2's turtle hatchlings): find each one, answer its
// riddle, and it follows you home.
import * as THREE from 'three';
import { G, pushActivity } from '../core/state.js';
import { QuizActivity } from './activities.js';
import { twoShot } from './minigames/common.js';
import { CHICK_SPOTS, NURSERY, WATER_Y } from '../world/layout.js';
import { BOOK } from '../books/current.js';

const Y = BOOK.young;
const NAMES = Y.names;
const SPACING = 1.7;

export class Chicks {
  constructor(ctx, interactions) {
    this.ctx = ctx;
    this.list = CHICK_SPOTS.map(([x, z], i) => {
      const model = Y.make(ctx.scene);
      const y = ctx.terrain.heightAt(x, z);
      model.root.position.set(x, y, z);
      model.root.rotation.y = i * 1.3;
      const c = { i, name: NAMES[i], model, spot: new THREE.Vector3(x, y, z), state: 'lost', yaw: i * 1.3, speed: 0, t: Math.random() * 5 };
      interactions.add({
        id: `chick-${i}`, pos: () => (c.state === 'lost' ? c.model.root.position : null), radius: 3.4,
        label: () => (c.state === 'lost' && G.quests.active('sq_chicks') ? `Help ${c.name}, the lost ${Y.kind}` : null),
        action: () => this.help(c),
      });
      return c;
    });
    this.chirpT = 0;
  }

  get s() { return G.save.data.chicks; }

  refresh() {
    const active = G.quests.active('sq_chicks') || G.quests.done('sq_chicks');
    this.list.forEach((c, k) => {
      if (this.s.home.includes(c.i)) {
        c.state = 'home';
        const a = (k / 8) * Math.PI * 2;
        const hx = NURSERY.x + Math.cos(a) * 3.2, hz = NURSERY.z + Math.sin(a) * 3.2;
        c.model.root.position.set(hx, this.ctx.terrain.heightAt(hx, hz), hz);
      } else if (this.s.found.includes(c.i)) {
        if (c.state !== 'following') {
          c.state = 'following';
          const p = G.player.pos;
          c.model.root.position.set(p.x - 1.5 - k * 0.5, p.y, p.z - 1.5);
        }
      } else {
        c.state = 'lost';
        c.model.root.position.copy(c.spot);
      }
      c.model.setVisible(active || c.state === 'home');
    });
  }

  following() { return this.list.filter((c) => c.state === 'following').length; }

  help(c) {
    const domain = G.tutor.weakestDomain(G.unlockedDomains());
    pushActivity(new QuizActivity({
      title: `${c.name}'s Riddle`, subtitle: `Answer it and the ${Y.kind} will follow you home`, color: '#ffb347', count: 1, domain, maxTier: 2,
      shot: twoShot(G.player.pos, c.model.root.position, { dist: 5, up: 1.8, lookUp: 0.9 }),
      onFinish: () => {
        this.s.found.push(c.i);
        c.state = 'following';
        G.audio.play('cheer');
        G.world.effects.sparkle(c.model.root.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xffb347, 30);
        G.toasts.toast(`${c.name} is following you! Walk ${this.following() > 1 ? 'them' : 'it'} home to ${Y.home}.`, { ms: 4200 });
        G.saveSoon();
      },
    }));
  }

  deliver() {
    const arriving = this.list.filter((c) => c.state === 'following');
    if (!arriving.length) return;
    for (const c of arriving) {
      this.s.home.push(c.i);
      c.state = 'walkingHome';
    }
    G.addCoins(10 * arriving.length);
    G.audio.play('chime');
    const total = this.s.home.length;
    G.toasts.toast(`${arriving.map((c) => c.name).join(', ')} ${arriving.length > 1 ? 'are' : 'is'} home! <b>+${10 * arriving.length}</b> (${total}/8)`, { kind: 'gold', ms: 4200 });
    G.saveSoon();
    if (total >= 8 && G.quests.active('sq_chicks')) G.quests.advance('sq_chicks');
    else G.quests.say([[Y.keeper, total === 1 ? Y.firstHome : Y.moreHome(total)]], Y.keeper, { shot: false });
  }

  objective(step) {
    const home = this.s.home.length;
    const f = this.following();
    if (f > 0) return { text: `Walk ${f} ${Y.kind}${f > 1 ? 's' : ''} home to ${Y.homeShort} (${home}/8 home)`, target: new THREE.Vector3(NURSERY.x, 0, NURSERY.z), npc: Y.keeper };
    let best = null, bd = Infinity;
    const p = G.player.pos;
    for (const c of this.list) {
      if (c.state !== 'lost') continue;
      const d = c.spot.distanceTo(p);
      if (d < bd) { bd = d; best = c.spot; }
    }
    return { text: step.text(home, this.s.found.length), target: best };
  }

  update(dt, player) {
    const active = G.quests.active('sq_chicks') || G.quests.done('sq_chicks');
    if (!active) return;
    let leader = player.pos;
    let k = 0;
    this.chirpT -= dt;
    for (const c of this.list) {
      c.t += dt;
      const root = c.model.root;
      let speed = 0;
      if (c.state === 'lost') {
        root.position.x = c.spot.x + Math.sin(c.t * 30) * 0.03;
        if (this.chirpT <= 0 && player.pos.distanceTo(c.spot) < 14) { G.audio.play('blip', { pitch: 1400 }); this.chirpT = 1.6; }
      } else if (c.state === 'following' || c.state === 'walkingHome') {
        const target = c.state === 'following' ? leader : new THREE.Vector3(NURSERY.x + Math.cos((this.list.indexOf(c) / 8) * Math.PI * 2) * 3.2, 0, NURSERY.z + Math.sin((this.list.indexOf(c) / 8) * Math.PI * 2) * 3.2);
        const dx = target.x - root.position.x, dz = target.z - root.position.z;
        const d = Math.hypot(dx, dz);
        const gap = c.state === 'following' ? SPACING : 0.2;
        if (d > gap) {
          speed = Math.min(11, (d - gap) * 4);
          const step = Math.min(d - gap, speed * dt);
          root.position.x += (dx / d) * step;
          root.position.z += (dz / d) * step;
          c.yaw = Math.atan2(dx, dz);
        } else if (c.state === 'walkingHome') {
          c.state = 'home';
        }
        if (d > 40 && c.state === 'following') root.position.set(target.x - 1, target.y, target.z - 1);
        const ground = Math.max(this.ctx.terrain.heightAt(root.position.x, root.position.z), WATER_Y - 0.25);
        root.position.y = ground;
        root.rotation.y = c.yaw;
        if (c.state === 'following') { leader = root.position; k += 1; }
      } else if (c.state === 'home') {
        c.yaw += dt * 0.3;
        root.rotation.y = Math.sin(c.t * 0.5 + c.i) * 0.8 + c.yaw * 0;
      }
      const near = player.pos.distanceTo(root.position) < 70;
      c.model.setCulled(!near);
      if (near) {
        c.model.animate(dt, { speed, grounded: true, celebrate: c.state === 'home' && Math.sin(c.t * 1.3 + c.i) > 0.97 });
        c.model.updateAttachments(dt, root.position.y, false);
      }
    }
    if (this.following() > 0 && Math.hypot(player.pos.x - NURSERY.x, player.pos.z - NURSERY.z) < 9) this.deliver();
  }
}
