// Book 3's puzzle games that live at a place: Captain Swoop's kite mixing, the balloon lift in the Cloud
// Valleys, Tock's balance gears and clock, Rocco's lantern nets, Astra's star survey, the Professor's sky
// charts and calming the Hush. Each frames the quiz panel on its spot and answers right answers with
// something you can see.
import * as THREE from 'three';
import { G, pushActivity } from '../../core/state.js';
import { QuizActivity } from '../../game/activities.js';
import { twoShot } from '../../game/minigames/common.js';
import { todayStr } from '../../game/questengine.js';
import { LOC } from './layout.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const at = (p, up = 0) => V(p.x, G.terrain.heightAt(p.x, p.z) + up, p.z);
const KITES = [0xff5c8a, 0xffd23d, 0x5aa9e6, 0x39d98a, 0xb97aff, 0xff9a3c];

// A kite that climbs away into the sky from a spot, for each right answer.
function launchKite(from, color) {
  const kite = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.3 }));
  kite.scale.set(0.9, 1.3, 0.12);
  kite.position.copy(from);
  G.scene.add(kite);
  let t = 0;
  const fly = (dt) => {
    t += dt;
    kite.position.x += dt * 2.5;
    kite.position.y += dt * 4.5;
    kite.position.z -= dt * 1.5;
    kite.rotation.z = Math.sin(t * 3) * 0.3;
    if (t > 9) { G.scene.remove(kite); G.world.animated.splice(G.world.animated.indexOf(fly), 1); }
  };
  G.world.animated.push(fly);
}

export function startKiteMix(params, onDone) {
  const meadow = at(LOC.meadow, 1);
  pushActivity(new QuizActivity({
    title: 'Kite Mix', subtitle: '6 kites · ratio tables and rates', color: '#ffb000', count: 6,
    pick: () => ({ domain: 'ratios', skills: ['ratio_table', 'ratio', 'ratio_lang', 'unit_rate', 'convert_ratio'] }),
    shot: twoShot(G.player.pos, meadow, { dist: 9, up: 4, lookUp: 1.5 }),
    onCorrect: (p, n) => {
      launchKite(meadow.clone().add(V(0, 1, 0)), KITES[n % KITES.length]);
      G.toasts.toast('A kite takes off!', { kind: 'gold', ms: 1500 });
    },
    onFinish: () => onDone(),
  }));
}

// The balloon lift: the penguin rides the basket, and right answers that are heights send it to that height on
// the marked mast, down into the clouds for negative ones. It is watched from inland, the mast and its height
// board in the left half of the screen, clear of the quiz.
export function startAltimeter(params, onDone) {
  const lift = G.world.ctx.lift;
  const basket = lift.basket.position;
  const pl = G.player;
  const mast = V(lift.x, lift.ground + 5, lift.z);
  const pos = V(lift.view.x, lift.ground + 10, lift.view.z);
  const fwd = mast.clone().sub(pos).setY(0).normalize();
  const look = mast.clone().addScaledVector(V(-fwd.z, 0, fwd.x), pos.distanceTo(mast) * 0.36);
  const target = { y: lift.ground };
  lift.target = target;
  pl.riding = true;
  pl.yaw = Math.atan2(lift.view.x - basket.x, lift.view.z - basket.z);
  let prev = basket.y;
  const move = (dt) => {
    basket.y += (target.y - basket.y) * Math.min(1, dt * 2.2);
    // Dipping through the cloud line throws up a puff of cloud.
    if (Math.sign(basket.y + 1) !== Math.sign(prev + 1)) G.world.effects.burst(V(basket.x, 0.6, basket.z), { count: 30, color: [0xf3e8ff, 0xffe4dc, 0xffffff], speed: 3, up: 2, life: 1.2, gravity: -0.3, size: 1.1 });
    prev = basket.y;
    if (pl.riding) pl.pos.set(basket.x, basket.y + 0.15, basket.z);
  };
  G.world.animated.push(move);
  const land = () => {
    target.y = lift.ground;
    pl.riding = false;
    pl.teleport(lift.x - lift.out.x * 2.6, lift.z - lift.out.z * 2.6, Math.atan2(-lift.out.x, -lift.out.z));
    setTimeout(() => G.world.animated.splice(G.world.animated.indexOf(move), 1), 3000);
  };
  pushActivity(new QuizActivity({
    title: 'Balloon Lift', subtitle: '6 heights above and below the cloud line', color: '#7ab8ff', count: 6,
    pick: () => ({ domain: 'neg', skills: ['integers', 'abs_order', 'rational_line'] }),
    shot: { pos, look, fov: 58 },
    onCorrect: (p) => {
      const v = p.answer?.kind === 'num' ? p.answer.value.value : null;
      target.y = v !== null && v >= lift.bottom && v <= lift.top ? v : lift.ground + 2 + Math.random() * 6;
      G.world.effects.burst(lift.basket.position.clone().add(V(0, 4, 0)), { count: 24, color: [0xff8fc8, 0xffffff], speed: 3, up: 3, life: 1.1, gravity: 1, size: 0.45 });
    },
    onFinish: () => { land(); onDone(); },
    onClose: () => land(),
  }));
}

// Tock's great balance gears: every solved equation turns the gears a little faster.
export function startBalanceGears(params, onDone) {
  const dome = at(LOC.dome, 4);
  const gears = G.world.ctx.gears;
  pushActivity(new QuizActivity({
    title: 'Balance Gears', subtitle: '6 equations · keep both sides equal', color: '#c9a25a', count: 6,
    pick: () => ({ domain: 'ridge', skills: ['one_step', 'equiv_expr', 'eval_expr', 'write_expr'] }),
    shot: twoShot(G.player.pos, dome.clone().add(V(-3, 0, -11)), { dist: 10, up: 4, lookUp: 1 }),
    onCorrect: () => {
      for (const g of gears) g.turning = Math.min(3, g.turning + 0.5);
      G.audio.play('build');
      G.world.effects.burst(dome.clone().add(V(-3, 1, -11)), { count: 26, color: [0xffd98a, 0xffffff], speed: 4, up: 4, life: 1, gravity: 4, size: 0.4 });
    },
    onFinish: () => onDone(),
  }));
}

// The great clock: hands that move by rules. Finished, the clock starts ticking.
export function startClockFix(params, onDone) {
  const face = at(LOC.clockFace, 6);
  const clock = G.world.ctx.clock;
  pushActivity(new QuizActivity({
    title: 'The Great Clock', subtitle: '5 rules · tables, expressions and inequalities', color: '#c9a25a', count: 5,
    pick: () => ({ domain: 'ridge', skills: ['var_table', 'write_expr', 'eval_expr', 'inequality', 'exponents'] }),
    shot: twoShot(G.player.pos, face.clone().add(V(2, 4, 0)), { dist: 10, up: 3, lookUp: 2 }),
    onCorrect: (p, n) => {
      clock.minute.rotation.x = -n * 1.2;
      clock.hour.rotation.x = -n * 0.3;
      G.audio.play('click');
    },
    onFinish: () => { clock.running = true; G.toasts.toast('Tick, tock! The great clock is running.', { kind: 'gold' }); onDone(); },
  }));
}

// Rocco's lantern nets: each right answer folds a lantern that floats up out of the kiln.
export function startNets(params, onDone) {
  const kiln = at(LOC.kiln, 1);
  pushActivity(new QuizActivity({
    title: 'Lantern Nets', subtitle: '6 lanterns · nets, faces and areas', color: '#ff6b35', count: 6,
    pick: () => ({ domain: 'cave', skills: ['nets', 'surface_area', 'area_poly', 'volume_frac', 'area_tri'] }),
    shot: twoShot(G.player.pos, kiln, { dist: 8, up: 3.5, lookUp: 1 }),
    onCorrect: (p, n) => {
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), new THREE.MeshBasicMaterial({ color: KITES[n % KITES.length] }));
      lantern.position.copy(kiln).add(V(0, 1.5, 0));
      G.scene.add(lantern);
      const glow = G.world.glow.add(lantern.position.x, lantern.position.y, lantern.position.z, KITES[n % KITES.length], 3, 0.8);
      let t = 0;
      const rise = (dt) => {
        t += dt;
        lantern.position.y += dt * 2;
        lantern.position.x += Math.sin(t * 2) * dt;
        lantern.rotation.y += dt;
        G.world.glow.set(glow, { x: lantern.position.x, y: lantern.position.y, z: lantern.position.z, intensity: t > 12 ? 0 : 0.8 });
        if (t > 12) { G.scene.remove(lantern); G.world.animated.splice(G.world.animated.indexOf(rise), 1); }
      };
      G.world.animated.push(rise);
    },
    onFinish: () => onDone(),
  }));
}

// Astra's star survey: data about the stars, and a star twinkles brighter for each right answer.
export function startStarSurvey(params, onDone) {
  const scope = at(LOC.scope, 2);
  pushActivity(new QuizActivity({
    title: 'Star Survey', subtitle: '6 data puzzles · the middle and the spread', color: '#7a7aff', count: 6,
    pick: () => ({ domain: 'stars', skills: ['mean', 'median_mode_range', 'box_plot', 'histogram', 'mad', 'stat_question'] }),
    shot: twoShot(G.player.pos, scope.clone().add(V(6, 4, -4)), { dist: 10, up: 3, lookUp: 3 }),
    onCorrect: () => {
      G.world.effects.burst(scope.clone().add(V(6, 14, -6)), { count: 40, color: [0xfff1b0, 0xc8b8ff, 0xffffff], speed: 6, up: 2, life: 1.6, gravity: 0.5, size: 0.6 });
      G.world.sky.pulse('ridge', 1.2);
    },
    onFinish: () => onDone(),
  }));
}

// Chapter 6's finale on the Starwell: calm the Hush with a puzzle from every subject. Seen from behind the
// penguin, the Hush's face sits in the left half of the screen, clear of the quiz.
export function startHush(params, onDone) {
  const spire = G.world.ctx.spire;
  const order = ['ratios', 'neg', 'ridge', 'cave', 'stars'];
  const S = LOC.spire;
  const pool = V(S.x, G.terrain.heightAt(S.x, S.z) + 1, S.z);
  const head = spire.head.getWorldPosition(V());
  const pl = G.player.pos;
  const dir = head.clone().sub(pl).setY(0).normalize();
  const right = V(-dir.z, 0, dir.x);
  const pos = pl.clone().addScaledVector(dir, -9).addScaledVector(right, -2.5).setY(pl.y + 6);
  const look = head.clone().addScaledVector(right, head.distanceTo(pos) * 0.34).setY(head.y - 3);
  pushActivity(new QuizActivity({
    title: 'Calm the Hush', subtitle: 'Answer gently · 8 puzzles from every subject', color: '#a8a0e0', count: 8, closable: true,
    pick: (i) => ({ domain: order[i % order.length], minTier: 2 }),
    shot: { pos, look, fov: 58 },
    onCorrect: (p, n) => {
      spire.calm = Math.max(spire.calm, 0.35 + (n / 8) * 0.5);
      G.world.sky.pulse(['lake', 'grove', 'huts', 'cave', 'ridge'][(n - 1) % 5], 2);
      G.world.effects.burst(pool.clone().add(V(0, 3, 0)), { count: 30, color: [0xc8b8ff, 0xfff1b0, 0xffffff], speed: 5, up: 4, life: 1.4, gravity: 1, size: 0.55 });
      G.toasts.toast(['The Hush hums softly.', 'The Hush opens one eye.', 'The Hush is listening.', 'The Hush hums along!'][n % 4], { kind: 'teal', ms: 1600 });
    },
    onFinish: () => onDone(),
  }));
}

// The Professor's sky charts at his table: data and coordinate puzzles, a fresh set every day.
export function startSkyCharts() {
  const s = G.save.data;
  const today = todayStr();
  const fresh = !s.counters.chartDays.includes(today);
  const table = at(LOC.easel, 1);
  pushActivity(new QuizActivity({
    title: fresh ? "Today's Sky Chart" : 'Sky Chart Practice', subtitle: fresh ? "5 star and chart puzzles from tonight's sky" : "You finished today's chart. Practice for fun!",
    color: '#7a7aff', count: 5,
    pick: (i) => ({ domain: i % 2 ? 'neg' : 'stars' }),
    shot: twoShot(G.player.pos, table, { lookUp: 1.2 }),
    onFinish: () => {
      if (fresh) {
        s.counters.chartDays.push(today);
        G.addCoins(25);
        G.toasts.toast('Sky chart complete! <b>+25</b>', { kind: 'gold' });
        G.patrol.event('chart');
      }
      G.saveSoon();
    },
  }));
}
