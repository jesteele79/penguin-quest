// The Gloom King: a 12-puzzle finale at the top of the Aurora Spire, one subject after another.
import * as THREE from 'three';
import { G, pushActivity, popActivity } from '../../core/state.js';
import { Round, V } from './common.js';
import { Gloom } from '../../actors/gloom.js';
import { Cutscene, DialogActivity } from '../activities.js';
import { REGION_COLORS } from '../../core/materials.js';
import { LOC } from '../../world/layout.js';
import { NPCS } from '../content.js';
import { el } from '../../ui/dom.js';

// Every beam is the same wide open tube, stretched from the penguin to the King.
const BEAM = new THREE.CylinderGeometry(0.35, 0.35, 1, 12, 1, true);
const dropBeam = (b) => { G.scene.remove(b.m); b.m.material.dispose(); };

const ORDER = ['lake', 'grove', 'huts', 'cave', 'ridge'];
const HP = 12;
const TAUNTS = ['Ho ho! Too chilly for you?', 'Grrr, is that all you have?', 'The cold is MINE!', 'Brrr-ha-ha!'];

function kingLines(texts) {
  const n = NPCS.king;
  return texts.map((t) => ({ who: 'The Gloom King', text: t.replaceAll('{name}', G.save.data.profile.name), portrait: { gloom: true }, pitch: 180, accent: '#7a4ad8' }));
}

class BossActivity {
  constructor(onDone, onAbort) {
    this.onDone = onDone;
    this.onAbort = onAbort;
    this.hp = HP;
    this.i = 0;
    this.state = 'fight';
    this.beams = [];
  }

  enter() {
    const S = LOC.spire;
    this.top = V(S.x, G.world.ctx.spire.base.y, S.z);
    this.kingPos = this.top.clone().add(V(0, 0, 5.5));
    G.player.teleport(S.x, S.z + 14, Math.PI);
    G.player.frozen = true;
    G.audio.setMood('boss');
    this.king = this.king ?? new Gloom(G.scene, { scale: 3.2, king: true });
    this.king.position.copy(this.kingPos);
    G.cam.setShot({ pos: this.top.clone().add(V(-7, 5.5, 22)), look: this.kingPos.clone().add(V(3.5, 4, 0)), fov: 55 }, 1.0);
    this.bar = el('div', { class: 'boss-bar', html: '<div class="boss-name">The Gloom King</div><div class="boss-track"><div class="boss-fill"></div></div>' });
    G.uiRoot.append(this.bar);
    this.fill = this.bar.querySelector('.boss-fill');
    this.updateBar();
    const panel = G.quiz;
    panel.open({ title: 'The Gloom King', subtitle: 'Answer to send the aurora colors you restored!', color: '#ffd86b', layout: 'side', readAloud: G.save.data.settings.readAloud });
    panel.handlers = {
      onSubmit: (r) => this.submit(r),
      onHint: () => { if (this.round && !this.round.over) { this.round.hint(); G.audio.play('hint'); panel.showHint(this.round.p); } },
      onContinue: () => this.next(),
      onClose: () => this.quit(),
    };
    this.next();
  }

  updateBar() { this.fill.style.width = `${(100 * this.hp) / HP}%`; }

  next() {
    if (G.top !== this || this.hp <= 0) return;
    const domain = ORDER[this.i % ORDER.length];
    this.domain = domain;
    const p = G.tutor.next(domain, {});
    this.round = new Round(p);
    this.state = 'fight';
    G.quiz.showProblem(p);
    G.quiz.setProgress(HP - this.hp, HP);
  }

  submit(resp) {
    if (this.state !== 'fight') return;
    const r = this.round.submit(resp);
    if (r.outcome === 'form') { G.audio.play('hint'); G.quiz.showForm(r.message); return; }
    if (r.outcome === 'correct') {
      this.i += 1;
      this.hp -= 1;
      this.updateBar();
      G.audio.play('zap');
      G.audio.play('correct');
      this.beam(REGION_COLORS[this.domain].a);
      this.king.bump();
      G.cam.addShake(0.4);
      G.quiz.showCorrect(`<span class="coin-pop">+${r.coins}</span> ${this.hp && this.hp % 4 === 0 ? `<span class="streak">The King is weakening!</span>` : ''}`);
      G.quiz.setProgress(HP - this.hp, HP);
      this.state = 'hit';
      if (this.hp <= 0) setTimeout(() => this.win(), 1300);
      else setTimeout(() => { if (this.state === 'hit') this.next(); }, 1300);
      return;
    }
    G.audio.play('wrong');
    if (r.outcome === 'hint') {
      G.quiz.showWrong({ why: r.why, message: TAUNTS[Math.floor(Math.random() * TAUNTS.length)] });
      G.quiz.showHint(this.round.p);
    } else {
      this.i += 1;
      this.state = 'reveal';
      G.quiz.showReveal(this.round.p, "Don't give up! Here's how it works:");
    }
  }

  beam(color) {
    const from = G.player.pos.clone().add(V(0, 1.8, 0));
    const to = this.king.position.clone().add(V(0, 3.2, 0));
    const d = to.clone().sub(from);
    const m = new THREE.Mesh(BEAM, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.copy(from).addScaledVector(d, 0.5);
    m.scale.set(1, d.length(), 1);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
    G.scene.add(m);
    this.beams.push({ m, life: 0.7 });
    G.world.effects.sparkle(to, color, 40);
    G.player.celebrate(0.7);
  }

  win() {
    popActivity(this);
    const king = this.king;
    king.cheerUp();
    const sky = G.world.sky;
    pushActivity(new Cutscene([
      { shot: { pos: this.kingPos.clone().add(V(-6, 4, 9)), look: this.kingPos.clone().add(V(0, 3, 0)), fov: 50 }, blend: 1.2, wait: 1.6, call: () => { G.audio.play('restore'); G.toasts.screenFlash('#ffd86b', 0.6); G.world.effects.sparkle(this.kingPos.clone().add(V(0, 3, 0)), 0xffd86b, 120); } },
      {
        say: kingLines([
          'What... what is this feeling? It is so... warm.',
          'No one ever shared their light with me before. I was so cold and so lonely up here, all by myself.',
          "I'm sorry for all the gloom, {name}. Thank you for being kind to me.",
          'Look at me... I am not gloomy anymore. I am glimmering! I suppose that makes me... the Glimmer King?',
        ]),
      },
      {
        shot: { pos: this.top.clone().add(V(-25, 10, 30)), look: this.top.clone().add(V(0, 60, -60)), fov: 70 }, blend: 2.4, wait: 5,
        call: () => {
          sky.setRestored('crown', true);
          for (const r of ORDER) sky.pulse(r, 2.5);
          G.toasts.showBanner('The Aurora is whole again!', 'Glacier Bay shines', '#ffd86b', 4600, { replace: true });
          G.audio.hero();
          G.world.ctx.spire.setFinale(true);
          G.fireworks?.(this.top.clone().add(V(0, 40, 0)), 7);
        },
      },
    ], () => {
      king.dispose();
      this.beams.forEach(dropBeam);
      this.beams = [];
      G.save.data.finale = true;
      this.onDone?.();
    }));
  }

  quit() { popActivity(this); this.onAbort?.(); }

  onKey(e, inField) {
    if (this.state === 'hit' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.next(); return; }
    G.quiz.handleKey(e, inField);
  }

  update(dt) {
    this.king.update(dt, G.player.pos);
    if (this.king.state === 'grumpy') {
      this.king.position.y = this.kingPos.y + 1.5 + Math.sin(performance.now() / 700) * 0.6;
    }
    for (const b of this.beams) {
      b.life -= dt;
      b.m.material.opacity = Math.max(0, b.life * 1.4);
      if (b.life <= 0) dropBeam(b);
    }
    this.beams = this.beams.filter((b) => b.life > 0);
  }

  exit() {
    G.quiz.close();
    this.bar?.remove();
    G.cam.release(1.0);
    if (this.hp > 0 && this.king) { this.king.dispose(); this.king = null; }
    if (this.hp > 0) { this.beams.forEach(dropBeam); this.beams = []; }
  }
}

export function startBoss(params, onDone, opts = {}) {
  const intro = kingLines([
    'WHO DARES CLIMB MY SPIRE?',
    'Oh. It is a... small penguin.',
    'I am the Gloom King! The aurora light is MINE. It is the only warm thing I have ever had!',
    'If you want it back, you will have to out-think me. Nobody out-thinks the Gloom King!',
  ]);
  const S = LOC.spire;
  const top = V(S.x, G.world.ctx.spire.base.y, S.z);
  const preview = new Gloom(G.scene, { scale: 3.2, king: true });
  preview.position.copy(top.clone().add(V(0, 1.5, 5.5)));
  const animate = (dt) => { if (preview.root.parent) preview.update(dt, G.player.pos); };
  G.world.animated.push(animate);
  pushActivity(new Cutscene([
    { shot: { pos: top.clone().add(V(-8, 5, 20)), look: top.clone().add(V(0, 4, 5)), fov: 55 }, blend: 1.4, wait: 0.8, call: () => { G.audio.play('whoosh'); G.world.effects.burst(preview.position.clone().add(V(0, 2, 0)), { count: 80, color: [0x3a2a6a, 0x6a4ab8], speed: 7, up: 4, life: 1.6, gravity: 1, size: 1.2 }); } },
    { say: intro },
  ], () => {
    preview.dispose();
    const k = G.world.animated.indexOf(animate);
    if (k >= 0) G.world.animated.splice(k, 1);
    pushActivity(new BossActivity(onDone, opts.onAbort));
  }));
}

export { DialogActivity };
