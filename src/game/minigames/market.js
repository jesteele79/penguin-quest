// The Snack Shack: serve a line of penguin customers by solving their money and decimal problems.
import * as THREE from 'three';
import { G, pushActivity } from '../../core/state.js';
import { QuizActivity } from '../activities.js';
import { Penguin } from '../../actors/penguin.js';
import { V, awardMedal } from './common.js';
import { LOC } from '../../world/layout.js';

const LINES = ['One snack, please!', 'Can you help me with my order?', "I'm so hungry!", 'What do I owe?', 'Mmm, cocoa weather!', 'Two of those, please!', 'Is it on sale today?', 'Keep the change? Just kidding!'];
const SCARVES = [0x2f8cff, 0x39d98a, 0xffd23d, 0x8a5cff, 0xff72c8, 0xff9a3c, 0x4dd8ff, 0xe8434b];
const HATS = [null, null, 'beanie', 'earmuffs', 'party', 'tophat', 'headphones'];

class MarketActivity extends QuizActivity {
  constructor(params, onDone) {
    const rush = !!params.rush;
    const count = params.count ?? 5;
    const standY = G.terrain.heightAt(LOC.counter.x + 2, LOC.counter.z);
    const pos = V(LOC.counter.x + 2.2, standY, LOC.counter.z);
    super({
      title: rush ? 'Snack Shack Rush' : 'Snack Shack', subtitle: rush ? `Serve ${count} customers. Fewer mistakes, better medal!` : `Serve ${count} customers`,
      color: '#ff72c8', count, domain: 'huts',
      pick: () => ({ domain: 'huts', skills: ['money', 'dec_addsub', 'dec_compare', 'unit_rate', 'percent', 'dec_round'] }),
      shot: { pos: V(LOC.counter.x - 3.5, standY + 4.2, LOC.counter.z + 11), look: V(LOC.counter.x + 1.4, standY + 1.2, LOC.counter.z - 0.5), fov: 52 },
      onProblem: () => this.callNext(),
      onCorrect: () => this.serve(),
      onWrong: () => this.puzzled(),
      onFinish: () => this.wrapUp(),
    });
    this.rush = rush;
    this.onDoneGame = onDone;
    this.standPos = pos;
    this.customers = [];
    this.current = null;
    this.firstTries = 0;
    this.spawned = 0;
  }

  enter() {
    G.player.teleport(this.standPos.x, this.standPos.z, -Math.PI / 2);
    for (let i = 0; i < Math.min(3, this.o.count); i++) this.spawn();
    super.enter();
  }

  spawn() {
    if (this.spawned >= this.o.count) return;
    this.spawned += 1;
    const look = {
      scale: 0.88 + Math.random() * 0.18,
      scarf: SCARVES[Math.floor(Math.random() * SCARVES.length)],
      hat: HATS[Math.floor(Math.random() * HATS.length)],
      hatColor: SCARVES[Math.floor(Math.random() * SCARVES.length)],
    };
    const model = new Penguin(G.scene, look);
    const start = V(LOC.counter.x - 16, 0, LOC.counter.z + 6);
    start.y = G.terrain.heightAt(start.x, start.z);
    model.root.position.copy(start);
    this.customers.push({ model, state: 'queue', target: start.clone(), speed: 0, t: Math.random() * 5 });
    this.layoutQueue();
  }

  layoutQueue() {
    const waiting = this.customers.filter((c) => c.state === 'queue' || c.state === 'front');
    waiting.forEach((c, i) => {
      const x = LOC.counter.x - 2.4 - i * 3, z = LOC.counter.z + i * 0.6;
      c.target.set(x, G.terrain.heightAt(x, z), z);
      c.state = i === 0 ? 'front' : 'queue';
    });
  }

  callNext() {
    this.current = this.customers.find((c) => c.state === 'front') ?? null;
    if (this.current && !this.current.bubble) {
      this.current.bubble = G.labels.add(`<span>${LINES[Math.floor(Math.random() * LINES.length)]}</span>`, { cls: 'speech', pos: this.current.model.root.position, offsetY: 3.2, maxDist: 60 });
    }
  }

  serve() {
    if (this.attempts === 0) this.firstTries += 1;
    const c = this.current;
    G.audio.play('register');
    G.save.data.counters.served += 1;
    G.patrol.event('serve');
    if (!c) return;
    c.bubble?.set('<span>Thank you!</span>');
    c.happy = 1.2;
    const item = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.4, 10), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x663300, emissiveIntensity: 0.3 }));
    item.position.set(LOC.counter.x, G.terrain.heightAt(LOC.counter.x, LOC.counter.z) + 1.7, LOC.counter.z);
    G.scene.add(item);
    setTimeout(() => G.scene.remove(item), 1100);
    setTimeout(() => {
      c.state = 'leaving';
      c.bubble?.remove();
      c.bubble = null;
      c.target.set(LOC.counter.x - 12, 0, LOC.counter.z - 14);
      c.target.y = G.terrain.heightAt(c.target.x, c.target.z);
      this.spawn();
      this.layoutQueue();
    }, 900);
  }

  puzzled() {
    const c = this.current;
    if (c?.bubble) c.bubble.set('<span>Hmm, are you sure?</span>');
  }

  wrapUp() {
    if (this.rush) {
      const n = this.o.count;
      const medal = this.firstTries >= n - 1 ? 'gold' : this.firstTries >= n - 3 ? 'silver' : 'bronze';
      const res = awardMedal('market:rush', medal, -this.firstTries);
      G.toasts.showBanner('Lunch rush over!', `${this.firstTries} of ${n} right on the first try: ${medal} medal${res.first ? ` · +${res.coins}` : ''}`, '#ff72c8', 4200);
    }
    this.onDoneGame?.();
  }

  update(dt) {
    for (const c of this.customers) {
      c.t += dt;
      const root = c.model.root;
      const dx = c.target.x - root.position.x, dz = c.target.z - root.position.z;
      const d = Math.hypot(dx, dz);
      let speed = 0;
      if (d > 0.15) {
        speed = Math.min(5, d * 3);
        root.position.x += (dx / d) * speed * dt;
        root.position.z += (dz / d) * speed * dt;
        root.rotation.y = Math.atan2(dx, dz);
      } else if (c.state !== 'leaving') {
        root.rotation.y = Math.PI / 2;
      }
      root.position.y = G.terrain.heightAt(root.position.x, root.position.z);
      if (c.happy > 0) c.happy -= dt;
      if (c.state === 'leaving' && d < 0.5) c.gone = true;
      c.model.animate(dt, { speed, grounded: true, celebrate: c.happy > 0, talking: c === this.current && !c.happy });
      c.model.updateAttachments(dt, root.position.y, true);
      c.bubble?.setPos(root.position);
    }
    for (const c of this.customers.filter((q) => q.gone)) c.model.dispose();
    this.customers = this.customers.filter((q) => !q.gone);
  }

  exit() {
    super.exit();
    for (const c of this.customers) { c.bubble?.remove(); c.model.dispose(); }
    this.customers = [];
  }
}

export function startMarket(params, onDone) {
  pushActivity(new MarketActivity(params, onDone));
}
