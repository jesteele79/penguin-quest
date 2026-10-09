import * as THREE from 'three';
import { G, pushActivity } from '../core/state.js';
import { DialogActivity, QuizActivity, Cutscene, ExploreActivity } from './activities.js';
import { NPCS, REGION_INFO } from './content.js';
import { MAIN, SIDE, SITE_SETS, CHATTER, RESONANCE_NEED, CRYSTAL_GOAL } from './questdata.js';
import { REGION_COLORS } from '../core/materials.js';
import { CRYSTALS, SNOWFLAKES, GLOOM_SPOTS } from '../world/layout.js';
import { BOOK } from '../books/current.js';
import { T } from '../books/terms.js';
import { GAMES } from './games.js';
import { DOMAINS, SKILLS } from '../math/skills.js';
import { cocoaOrder } from '../math/skills/decimals.js';
import { bookById, voyages, placeName } from '../books/books.js';
import { ShopScreen, VoyageScreen } from './screens.js';
import { ACTIVE } from '../books/active.js';
import { domainOf, regionOf } from '../books/regions.js';
import { orbitShot, angleToPlayer } from './minigames/common.js';

const V = (x, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const todayStr = () => new Date().toLocaleDateString('en-CA');
const REGIONS = ['lake', 'grove', 'huts', 'cave', 'ridge'];
const CHAPTER_OF = { lake: 'ch1', grove: 'ch2', huts: 'ch3', cave: 'ch4', ridge: 'ch5' };

export class QuestEngine {
  constructor() {
    this.defs = [...MAIN, ...SIDE];
    this.byId = Object.fromEntries(this.defs.map((d) => [d.id, d]));
    this.queue = [];
    this.chatterIdx = {};
    this.busy = false;
  }

  get s() { return G.save.data; }

  // ------------------------------------------------------------ state helpers
  st(id) { return this.s.q[id]; }
  started(id) { return !!this.s.q[id]; }
  done(id) { return !!this.s.q[id]?.done; }
  active(id) { const q = this.s.q[id]; return !!q && !q.done; }
  step(id) { const q = this.s.q[id]; return q && !q.done ? this.byId[id].steps[q.step] ?? null : null; }
  activeIds() { return this.defs.filter((d) => this.active(d.id)).map((d) => d.id); }
  mainNext() { return MAIN.find((d) => !this.done(d.id)) ?? null; }

  chapterOpen(def) {
    if (def.chapter === 0) return true;
    const prev = MAIN[def.chapter - 1];
    if (!this.done(prev.id)) return false;
    if (def.chapter === 1 || this.s.settings.pace === 'free') return true;
    return (this.s.q[prev.id].doneDay || '') < todayStr();
  }

  sideOpen(def) { return !this.started(def.id) && (!def.after || this.done(def.after)); }

  lines(arr) {
    return arr.map(([who, text]) => {
      const t = text.replaceAll('{name}', this.s.profile.name);
      if (!who) return { who: '', text: t, portrait: false };
      const n = NPCS[who];
      return { who: n.name, text: t, portrait: n.portrait, pitch: n.pitch, accent: n.accent };
    });
  }

  // Say lines now, or queue them until the player is back to exploring.
  say(arr, npcId = null, { shot = true } = {}) {
    return new Promise((resolve) => {
      const run = () => pushActivity(new DialogActivity(this.lines(arr), { npc: npcId ? G.npcs.get(npcId) : null, shot, onDone: resolve }));
      if (G.top instanceof ExploreActivity) run();
      else this.queue.push(run);
    });
  }

  // ------------------------------------------------------------ flow
  start(id) {
    this.s.q[id] = { step: 0, data: { stepIndex: 0 }, started: Date.now() };
    this.enterStep(id);
  }

  // Step data must be valid as soon as q.step changes: the HUD reads it every frame, even while
  // the previous step's closing dialog is still on screen.
  prepStep(id) {
    const q = this.st(id);
    const step = this.step(id);
    if (!step) return null;
    q.data = q.data && q.data.stepIndex === q.step ? q.data : { stepIndex: q.step };
    if (step.type === 'count' && !step.absolute && q.data.base === undefined) q.data.base = this.counter(step.counter);
    if (step.type === 'sites' && !q.data.done) q.data.done = [];
    return step;
  }

  enterStep(id) {
    const step = this.prepStep(id);
    if (!step) return;
    G.sites?.refresh();
    G.pickups?.refresh();
    G.saveSoon();
    if (step.auto) this.queue.push(() => this.runAction(id, step));
  }

  runAction(id, step) {
    if (step.type === 'game') {
      const fn = GAMES[step.game];
      if (fn) fn(step.params ?? {}, (result) => this.advance(id, result), { questId: id });
    } else if (step.type === 'scene') {
      GAMES[step.scene]?.({}, () => this.advance(id));
    }
  }

  advance(id) {
    const def = this.byId[id];
    const q = this.st(id);
    if (!q || q.done) return;
    const step = def.steps[q.step];
    if (!step) return;
    if (step.shard) this.addShard(def.region);
    if (step.reward) this.giveReward(step.reward);
    q.step += 1;
    q.data = { stepIndex: q.step };
    this.prepStep(id);
    const finish = () => {
      if (q.step >= def.steps.length) this.complete(id);
      else this.enterStep(id);
      G.saveNow();
    };
    if (step.after) this.say(step.after, null, { shot: false }).then(finish);
    else finish();
    G.sites?.refresh();
    G.pickups?.refresh();
  }

  complete(id) {
    const def = this.byId[id];
    const q = this.st(id);
    q.done = true;
    q.doneDay = todayStr();
    q.doneAt = Date.now();
    if (def.reward) this.giveReward(def.reward);
    if (def.type === 'main') {
      if (def.chapter === 0 && !G.hud.controls.classList.contains('hidden')) {
        G.hud.showControls(false);
        G.toasts.toast('Press <b>C</b> any time to see the controls again.', { ms: 4200 });
      }
      if (def.chapter > 0) G.toasts.showBanner(`${def.title.split(':')[0]} complete!`, def.title.split(': ')[1] ?? '', '#ffd166', 3600);
      if (this.s.tracked && !this.active(this.s.tracked)) this.s.tracked = null;
    } else {
      G.toasts.showBanner('Side quest complete!', def.title, '#9fe8ff', 3000);
      if (this.s.tracked === id) this.s.tracked = null;
    }
    G.audio.play('fanfare');
    const after = () => {
      const next = this.mainNext();
      if (def.type === 'main' && next && !this.chapterOpen(next) && this.done(def.id)) {
        G.toasts.toast(`${next.title.split(':')[0]} opens tomorrow! Try the ${T.patrol} board and side quests.`, { ms: 6000 });
      }
    };
    if (def.outro) this.say(def.outro, null, { shot: false }).then(after);
    else after();
    G.saveNow();
  }

  giveReward(r) {
    if (r.coins) G.addCoins(r.coins);
    if (r.stars) G.addStars(r.stars);
    for (const item of r.items ?? []) {
      if (!this.s.owned.includes(item)) {
        this.s.owned.push(item);
        G.toasts.toast(`New in your Wardrobe: <b>${G.itemName(item)}</b>`, { ms: 4200 });
      }
    }
  }

  addShard(region) {
    if (!REGIONS.includes(region)) return;
    const n = (this.s.shards[region] = Math.min(3, (this.s.shards[region] || 0) + 1));
    G.world.ctx.crystals[region]?.setShards(n);
    G.audio.play('chime');
    G.toasts.showBanner(`${T.shard}!`, `${n} of 3 for the ${T.crystalOf(REGION_INFO[region].name)}`, REGION_COLORS[region].css, 2600);
  }

  // ------------------------------------------------------------ counters & events
  counter(name) {
    const s = this.s;
    switch (name) {
      case 'tutorialFlakes': return [0, 1, 2].filter((i) => s.snowflakes.includes(i)).length;
      case 'flakes': return s.snowflakes.length;
      case 'gloomSpots': return s.counters.gloomSpots.length;
      case 'chartDays': return s.counters.chartDays.length;
      default: return s.counters[name] ?? 0;
    }
  }

  countProgress(id) {
    const step = this.step(id);
    const q = this.st(id);
    const v = this.counter(step.counter);
    return step.absolute ? v : v - (q.data.base ?? 0);
  }

  onSolve(problem, result) {
    const region = regionOf(problem.domain);
    if (!REGIONS.includes(region)) return;
    const add = result.firstTry ? (result.hintUsed ? 0.7 : 1) : result.solved ? 0.5 : 0.25;
    this.s.resonance[region] = Math.min(RESONANCE_NEED * 3, (this.s.resonance[region] || 0) + add);
    const c = G.world.ctx.crystals[region];
    if (c && !this.s.crystals[region]) c.setCharge(Math.min(1, this.s.resonance[region] / RESONANCE_NEED) * 0.75);
  }

  // ------------------------------------------------------------ positions
  anchor(key) { return BOOK.anchor(key, G.world.ctx); }

  target(key) {
    const p = G.player.pos;
    const s = this.s;
    switch (key) {
      case 'nextTutorialFlake': { const i = [0, 1, 2].find((k) => !s.snowflakes.includes(k)) ?? 0; return V(SNOWFLAKES[i][0], 0, SNOWFLAKES[i][1]); }
      case 'nearestFlake': return G.pickups?.nearestFlake(p) ?? null;
      case 'nearestGloom': return G.wander?.nearest(p) ?? null;
      default: return this.anchor(key);
    }
  }

  // ------------------------------------------------------------ objectives
  trackedId() {
    const t = this.s.tracked;
    if (t && this.active(t)) return t;
    const main = MAIN.find((d) => this.active(d.id));
    if (main) return main.id;
    return this.activeIds()[0] ?? null;
  }

  objective() {
    const id = this.trackedId();
    if (id) return { ...this.objectiveFor(id), questId: id };
    const next = this.mainNext();
    if (next && !this.chapterOpen(next) && this.started('ch0')) {
      return { text: `${next.title.split(':')[0]} opens tomorrow. Try the ${T.patrol} board or a side quest!`, target: this.anchor('board') };
    }
    if (!next) {
      const onward = this.onwardVoyage();
      if (onward) {
        const npc = this.ferryFor(onward.id);
        return { text: `${npc === 'cinder' ? 'Fly' : 'Sail'} to ${placeName(onward.world)} with ${NPCS[npc]?.name ?? 'a friend'}`, target: G.npcs.get(npc)?.pos ?? null, npc };
      }
      const offer = SIDE.find((d) => this.sideOpen(d));
      if (offer) return { text: `New side quest: talk to ${NPCS[offer.giver].name}`, target: G.npcs.get(offer.giver).pos, npc: offer.giver };
      return { text: `Free play: ${T.patrol}, collections and practice`, target: null };
    }
    return null;
  }

  objectiveFor(id) {
    const step = this.step(id);
    const q = this.st(id);
    if (!step) return { text: '', target: null };
    const txt = (t, ...a) => (typeof t === 'function' ? t(...a) : t);
    switch (step.type) {
      case 'talk': return { text: txt(step.text), target: G.npcs.get(step.npc)?.pos ?? null, npc: step.npc };
      case 'game': return { text: txt(step.text), target: this.anchor(step.at) };
      case 'scene': return { text: txt(step.text), target: null };
      case 'reach': return { text: txt(step.text), target: this.anchor(step.at) };
      case 'sites': {
        const set = SITE_SETS[step.set];
        const total = G.sites.count(step.set);
        const doneList = q.data.done ?? [];
        const done = doneList.length;
        const npc = set.kind === 'npc' ? set.npcs.find((n, i) => !doneList.includes(i)) : null;
        const next = set.kind === 'npc' ? G.npcs.get(npc)?.pos : G.sites.nearestUndone(step.set, doneList, G.player.pos);
        return { text: txt(step.text, done, total), target: next ?? null, npc };
      }
      case 'collect': {
        const got = G.pickups.collectedCount(step.set);
        return { text: txt(step.text, got, G.pickups.total(step.set)), target: G.pickups.nearestUncollected(step.set, G.player.pos) };
      }
      case 'count': {
        const n = Math.min(step.need, this.countProgress(id));
        if (step.turnin && n >= step.need) return { text: `Tell ${NPCS[step.turnin].name} the good news`, target: G.npcs.get(step.turnin).pos, npc: step.turnin };
        return { text: txt(step.text, n), target: step.target ? this.target(step.target) : null };
      }
      case 'crystal': {
        const r = step.region;
        const res = Math.floor(this.s.resonance[r] || 0);
        const c = CRYSTALS[r];
        const text = res < RESONANCE_NEED
          ? `${T.charge} the ${T.crystalOf(REGION_INFO[r].name)} with puzzles (${res}/${RESONANCE_NEED})`
          : `${T.wake} the ${T.crystalOf(REGION_INFO[r].name)} (${this.s.progress.charge[r] || 0}/${CRYSTAL_GOAL})`;
        return { text, target: V(c.x, 0, c.z) };
      }
      case 'chicks': return G.chicks.objective(step);
      case 'treasure': return G.treasure.objective(step);
      default: return { text: '', target: null };
    }
  }

  // NPCs that should show a "!" (gold = story, blue = new side quest)
  marks() {
    const out = {};
    const obj = this.objective();
    for (const id of this.activeIds()) {
      const o = this.objectiveFor(id);
      if (o.npc) out[o.npc] = out[o.npc] ?? (id === obj?.questId ? 'main' : 'side');
    }
    for (const d of SIDE) if (this.sideOpen(d)) out[d.giver] = out[d.giver] ?? 'new';
    return out;
  }

  // ------------------------------------------------------------ talking
  talk(npcId) {
    if (this.busy) return;
    const s = this.s;
    if (!this.done('ch0') && !BOOK.prologueFriends.includes(npcId)) return this.say([[npcId, BOOK.prologueLine]], npcId);
    // 1. Story or side "talk" steps
    for (const id of this.activeIds()) {
      const step = this.step(id);
      if (step?.type === 'talk' && step.npc === npcId) {
        return this.say(step.lines, npcId).then(() => {
          if (step.onDone === 'showControls') G.hud.showControls(true);
          this.advance(id);
        });
      }
    }
    // 1b. Games hosted by this friend (the warm-up, knitting)
    const hosted = this.gameAt(npcId);
    if (hosted && !hosted.replay) return this.useGameAt(npcId);
    // 2. Deliveries and invitations
    for (const id of this.activeIds()) {
      const step = this.step(id);
      if (step?.type !== 'sites') continue;
      const set = SITE_SETS[step.set];
      const idx = set.kind === 'npc' ? set.npcs.indexOf(npcId) : -1;
      if (idx >= 0 && !(this.st(id).data.done ?? []).includes(idx)) return this.useSite(step.set, idx);
    }
    // 3. Turn-ins
    for (const id of this.activeIds()) {
      const step = this.step(id);
      if (step?.type === 'count' && step.turnin === npcId && this.countProgress(id) >= step.need) return this.advance(id);
    }
    // 4. Special friends
    if (npcId === BOOK.nursery && this.active('sq_chicks') && G.chicks.following() > 0) return G.chicks.deliver();
    // 5. A ferry friend (Captain Flipper's boat, Cinder's airship) carries the penguin to another open book,
    // the next one first, until told "not yet" this visit.
    const dests = BOOK.ferries?.[npcId];
    if (dests && this.done('ch0') && !this.voyageDeclined) {
      const open = voyages(G.save.data, G.tutor, ACTIVE).filter((b) => dests.includes(b.id));
      const here = bookById(ACTIVE);
      const to = open.find((b) => b.n > here.n) ?? open[0];
      if (to) {
        const sailor = npcId === 'captain';
        // A boat cannot reach the sky islands, so the Captain sails out to meet Cinder's airship.
        const line = sailor && to.travel === 'fly'
          ? `${to.world} is up above the clouds, matey! I'll sail you out to meet Cinder's airship.`
          : to.n < here.n
            ? (sailor ? `Homesick for ${placeName(to.world)}, matey? My boat is ready whenever you are.` : `Want to fly down to ${placeName(to.world)}? Hop in, the airship is ready!`)
            : (sailor ? `${to.world} ${to.world.endsWith('s') ? 'are' : 'is'} waiting, matey! Shall we set sail?` : `Ready to fly up to ${placeName(to.world)}? The airship is all fueled up!`);
        return this.say([[npcId, line]], npcId).then(() => pushActivity(new VoyageScreen(to.id, () => { this.voyageDeclined = true; })));
      }
    }
    // 6. Offer a new side quest
    const offer = SIDE.find((d) => d.giver === npcId && this.sideOpen(d));
    if (offer) {
      return this.say(offer.offer, npcId).then(() => {
        this.start(offer.id);
        G.toasts.toast(`New side quest: <b>${offer.title}</b>. Press J to see your quests.`, { ms: 4200 });
      });
    }
    // 7. Shop
    if (npcId === BOOK.shop.npc && this.done(BOOK.shop.after)) {
      return this.say([[npcId, BOOK.shop.line]], npcId).then(() => pushActivity(new ShopScreen(true)));
    }
    // 8. Reminders for active side quests from this friend, then chatter
    const mine = SIDE.find((d) => d.giver === npcId && this.active(d.id));
    if (mine) {
      const o = this.objectiveFor(mine.id);
      return this.say([[npcId, `How is it going? ${o.text}.`]], npcId);
    }
    const list = CHATTER[npcId] ?? ['Hello!'];
    const i = (this.chatterIdx[npcId] = ((this.chatterIdx[npcId] ?? -1) + 1) % list.length);
    return this.say([[npcId, list[i]]], npcId);
  }

  // ------------------------------------------------------------ sites
  siteQuest(setName) {
    for (const id of this.activeIds()) {
      const step = this.step(id);
      if (step?.type === 'sites' && step.set === setName) return id;
    }
    return null;
  }

  // Visual state for a site set: 'done' indices, whether it is active.
  siteState(setName) {
    for (const def of this.defs) {
      const idx = def.steps.findIndex((st) => st.type === 'sites' && st.set === setName);
      if (idx < 0) continue;
      const q = this.st(def.id);
      if (!q) return { active: false, done: [] };
      if (q.done || q.step > idx) return { active: false, done: 'all' };
      if (q.step === idx) return { active: true, done: q.data.done ?? [] };
      return { active: false, done: [] };
    }
    return { active: false, done: [] };
  }

  useSite(setName, index) {
    const id = this.siteQuest(setName);
    if (!id) return;
    this.prepStep(id);
    const q = this.st(id);
    if (q.data.done.includes(index)) return;
    const set = SITE_SETS[setName];
    const finish = () => {
      if (q.data.done.includes(index)) return;
      q.data.done.push(index);
      G.sites.markDone(setName, index);
      G.audio.play('chime');
      G.saveSoon();
      if (q.data.done.length >= G.sites.count(setName)) this.advance(id);
    };
    if (set.kind === 'npc') {
      const npcId = set.npcs[index];
      const greet = set.greet?.[npcId];
      const lines = greet ? [[npcId, greet]] : [];
      const after = () => {
        if (set.quiz === false) { finish(); return; }
        this.siteQuiz(setName, index, set, () => this.say([[npcId, 'Thank you so much!']], npcId, { shot: false }).then(finish));
      };
      if (lines.length) this.say(lines, npcId).then(after); else after();
      return;
    }
    this.siteQuiz(setName, index, set, finish);
  }

  siteQuiz(setName, index, set, onFinish) {
    const domain = set.domains ? set.domains[index] : set.domain;
    const count = set.picks ? set.picks.length : set.count;
    const color = REGION_COLORS[regionOf(domain)]?.css ?? '#ffd166';
    const hooks = G.sites.hooks(setName, index);
    // Legend mode: the upper half of the subject's open skills, at the hardest tier.
    const hardSkills = set.hard
      ? DOMAINS[domain].skills.filter((s) => G.tutor.isUnlocked(s)).sort((a, b) => b.grade - a.grade)
        .slice(0, Math.max(3, Math.ceil(DOMAINS[domain].skills.length / 2))).map((s) => s.id)
      : null;
    pushActivity(new QuizActivity({
      title: set.title,
      subtitle: set.hard ? `${REGION_INFO[regionOf(domain)]?.subject ?? DOMAINS[domain].name} · Legend mode: extra hard` : `${count} puzzle${count > 1 ? 's' : ''}`,
      color, count, closable: true,
      pick: (i) => (set.story === 'cocoa' ? { problem: this.cocoaProblem(set.npcs[index]) }
        : set.picks ? set.picks[i] : { domain, skills: hardSkills ?? set.skills, minTier: set.hard ? 3 : undefined }),
      shot: hooks.shot?.(),
      onProblem: (p, n) => hooks.onProblem?.(p, n),
      onCorrect: (p, n) => hooks.onCorrect?.(p, n / count),
      onFinish: () => { hooks.onDone?.(); onFinish(); },
    }));
  }

  // The friend being served pays for the cocoa, so the money problem is about them.
  cocoaProblem(npcId) {
    const p = cocoaOrder(G.tutor.rng, G.tutor.tierFor('money'), NPCS[npcId].name);
    p.domain = 'huts';
    p.skillName = SKILLS.money.name;
    return p;
  }

  // ------------------------------------------------------------ crystals
  crystalStep(region) {
    const id = CHAPTER_OF[region];
    const step = this.step(id);
    return step?.type === 'crystal' ? id : null;
  }

  crystalLabel(region) {
    if (!this.done('ch0')) return null;
    if (this.s.crystals[region]) return `Practice at the ${T.crystal}`;
    if (this.crystalStep(region)) {
      const r = Math.floor(this.s.resonance[region] || 0);
      return r < RESONANCE_NEED ? `${T.charge} the ${T.crystal} (${r}/${RESONANCE_NEED})` : `${T.wake} the ${T.crystal}`;
    }
    return `Look at the ${T.crystal}`;
  }

  useCrystal(region) {
    const c = G.world.ctx.crystals[region];
    const info = REGION_INFO[region];
    const color = REGION_COLORS[region].css;
    if (this.s.crystals[region]) {
      // Practice goes to this subject's grade-level skills that are not mastered yet, if there are any.
      const grade = bookById(this.s.active).grade;
      const todo = DOMAINS[domainOf(region)].skills.filter((s) => s.grade === grade && G.tutor.isUnlocked(s) && !G.tutor.isMastered(s.id)).map((s) => s.id);
      return pushActivity(new QuizActivity({
        title: `${T.Crystal} Practice`, subtitle: `${info.subject} · ${todo.length ? 'skills to master' : '5 puzzles'} for fish coins`, color, count: 5,
        pick: () => ({ domain: domainOf(region), skills: todo.length ? todo : undefined }), shot: this.crystalShot(c.base),
        onCorrect: () => { c.flash(); G.world.effects.sparkle(c.mesh.position, REGION_COLORS[region].a, 20); },
        onFinish: () => { G.addCoins(15); G.toasts.toast('Practice complete! +15 bonus'); },
      }));
    }
    const id = this.crystalStep(region);
    if (!id) {
      const shards = this.s.shards[region] || 0;
      const who = BOOK.helpers[region];
      const msg = this.started(CHAPTER_OF[region])
        ? `The ${T.crystal} is sealed. It needs 3 ${T.shard}s (you have ${shards}). ${who[0].toUpperCase() + who.slice(1)} can help you find them.`
        : `The ${T.crystal} is sealed tight. One day, ${who} will need your help.`;
      return this.say([['', msg]]);
    }
    const res = this.s.resonance[region] || 0;
    if (res < RESONANCE_NEED) {
      return pushActivity(new QuizActivity({
        title: `${T.charge} the ${T.Crystal}`, subtitle: `Every puzzle adds ${T.energy} (${Math.floor(res)}/${RESONANCE_NEED})`, color,
        count: Math.max(2, Math.min(5, Math.ceil(RESONANCE_NEED - res))), domain: domainOf(region), shot: this.crystalShot(c.base),
        onCorrect: () => { c.flash(); G.world.effects.sparkle(c.mesh.position, REGION_COLORS[region].a, 25); },
        onFinish: () => {
          const now = Math.floor(this.s.resonance[region]);
          G.toasts.toast(now >= RESONANCE_NEED ? `The ${T.crystal} is ready! ${T.wake} it!` : `${T.Crystal} charge: ${now}/${RESONANCE_NEED}`, { ms: 3600 });
        },
      }));
    }
    return pushActivity(new QuizActivity({
      title: `${T.Crystal} Challenge`, subtitle: `${info.name} · ${info.subject}`, color,
      count: CRYSTAL_GOAL, done: this.s.progress.charge[region] || 0, domain: domainOf(region), shot: this.crystalShot(c.base),
      onCorrect: (p, n) => { this.s.progress.charge[region] = n; c.setCharge(0.75 + (0.25 * n) / CRYSTAL_GOAL); c.flash(); G.world.effects.sparkle(c.mesh.position, REGION_COLORS[region].a, 30); },
      onFinish: () => this.restoreCrystal(region, id),
      onClose: (n) => { this.s.progress.charge[region] = n; G.saveSoon(); },
    }));
  }

  crystalShot(base) {
    // A quarter turn from the player's side, so the player stands beside the crystal instead of in front of it.
    return orbitShot(base, { radius: 10, height: 4, lookUp: 3.2, shift: 3.4, prefer: angleToPlayer(base) + Math.PI / 2 });
  }

  restoreCrystal(region, questId) {
    const c = G.world.ctx.crystals[region];
    const base = c.base;
    const color = REGION_COLORS[region];
    const info = REGION_INFO[region];
    pushActivity(new Cutscene([
      { shot: orbitShot(base, { radius: 10, height: 3, lookUp: 3.5, prefer: angleToPlayer(base) }), blend: 1.2, wait: 1.3 },
      {
        call: () => {
          c.setRestored(true);
          G.audio.play('restore');
          G.toasts.screenFlash(color.css, 0.55);
          G.world.effects.sparkle(c.mesh.position, color.a, 80);
          G.world.effects.burst(c.mesh.position, { count: 60, color: [color.a, color.b, 0xffffff], speed: 12, up: 8, life: 2, gravity: 2, size: 0.9 });
        },
        wait: 1.8,
      },
      {
        shot: { pos: base.clone().add(V(-4, 2.5, -4)), look: base.clone().add(V(20, 120, 20)), fov: 70 }, blend: 2.2, wait: 2.6,
        call: () => {
          G.world.sky.setRestored(region, true);
          G.world.sky.pulse(region, 2);
          G.toasts.showBanner(T.restored, `${info.name} ${T.glowsAgain}`, color.css, 3600, { replace: true });
          G.audio.hero({ bars: 2 });
          BOOK.onRestore(region, G.world.ctx);
        },
      },
    ], () => {
      this.s.crystals[region] = true;
      G.hud.setCrystals(this.s.crystals);
      G.audio.setLayers(1 + REGIONS.filter((r) => this.s.crystals[r]).length);
      G.addCoins(50);
      this.advance(questId);
    }));
  }

  // ------------------------------------------------------------ location interactions
  gameAt(anchor) {
    for (const id of this.activeIds()) {
      const step = this.step(id);
      if (step?.type === 'game' && step.at === anchor) return { id, step, replay: false };
    }
    const replay = SIDE.find((d) => this.done(d.id) && d.steps.length === 1 && d.steps[0].type === 'game' && d.steps[0].at === anchor);
    if (replay) return { id: replay.id, step: replay.steps[0], replay: true, title: replay.title };
    return null;
  }

  gameLabel(anchor) {
    const g = this.gameAt(anchor);
    if (!g) return null;
    if (g.replay) {
      const m = this.s.medals[g.step.game + (g.step.params?.tourney ? ':tourney' : g.step.params?.rush ? ':rush' : g.step.params?.sculpture ? ':sculpt' : '')];
      return `${g.title} (play again${m?.medal ? `, best: ${m.medal}` : ''})`;
    }
    return g.step.label;
  }

  useGameAt(anchor) {
    const g = this.gameAt(anchor);
    if (!g) return;
    const fn = GAMES[g.step.game];
    if (!fn) return;
    if (g.replay) fn(g.step.params ?? {}, () => {}, { replay: true });
    else fn(g.step.params ?? {}, (result) => this.advance(g.id, result), { questId: g.id });
  }

  // The next book in the series, once it is open and ready to sail to.
  onwardVoyage() {
    const here = bookById(ACTIVE);
    return voyages(G.save.data, G.tutor, ACTIVE).find((b) => b.n > here.n) ?? null;
  }

  // Who in this book carries a penguin to that book. The Captain always sails and Cinder always flies, whatever
  // the destination: the Captain takes a penguin bound for the sky out to meet Cinder's airship.
  ferryFor(bookId) { return Object.keys(BOOK.ferries ?? {}).find((npc) => BOOK.ferries[npc].includes(bookId)) ?? 'captain'; }

  // A book that has just opened is announced once (mastery can tip it over at any time, not only at the end).
  announceVoyage() {
    const d = G.save.data;
    const book = this.onwardVoyage();
    if (!book || d.flags.announced?.includes(book.id)) return;
    d.flags.announced = [...(d.flags.announced ?? []), book.id];
    G.audio.play('fanfare');
    const npc = this.ferryFor(book.id);
    G.toasts.showBanner(`Book ${book.n} unlocked: ${book.title}!`, `${NPCS[npc]?.name ?? 'A friend'} is ready to ${npc === 'cinder' ? 'fly' : 'sail'} you there`, book.colors[1], 5600);
    G.saveSoon();
  }

  // ------------------------------------------------------------ per-frame
  update(dt) {
    if (!(G.top instanceof ExploreActivity)) return;
    this.voyageT = (this.voyageT ?? 2) - dt;
    if (this.voyageT <= 0) { this.voyageT = 5; this.announceVoyage(); }
    if (this.queue.length) { this.queue.shift()(); return; }
    const next = this.mainNext();
    if (next && !this.started(next.id) && this.chapterOpen(next)) {
      this.start(next.id);
      if (next.chapter >= 1) G.toasts.showBanner(next.title.split(':')[0], next.title.split(': ')[1] ?? '', '#ffd166', 3400);
      if (next.briefing && !this.s.briefed[next.id]) {
        this.s.briefed[next.id] = true;
        // "Good morning" only makes sense if the last chapter ended on an earlier day (free pacing can chain them).
        const prev = MAIN[next.chapter - 1];
        const sameDay = prev && this.s.q[prev.id]?.doneDay === todayStr();
        this.say(sameDay && next.briefingNow ? next.briefingNow : next.briefing, null, { shot: false });
      }
      return;
    }
    for (const id of this.activeIds()) {
      const step = this.step(id);
      if (!step) continue;
      if (step.type === 'count' && !step.turnin && this.countProgress(id) >= step.need) { this.advance(id); return; }
      if (step.type === 'collect' && G.pickups.collectedCount(step.set) >= G.pickups.total(step.set)) { this.advance(id); return; }
      if (step.type === 'reach') {
        const a = this.anchor(step.at);
        const p = G.player.pos;
        if (a && Math.hypot(p.x - a.x, p.z - a.z) < step.radius && (step.minY === undefined || p.y > step.minY)) {
          const q = this.st(id);
          if (q.data.running) continue;
          q.data.running = true;
          GAMES[step.run]?.({}, () => { q.data.running = false; this.advance(id); }, { onAbort: () => { q.data.running = false; } });
          return;
        }
      }
    }
    BOOK.update(this);
  }

  // ------------------------------------------------------------ markers for maps
  markers(big = false) {
    const out = [];
    for (const r of REGIONS) {
      const c = CRYSTALS[r];
      out.push({ x: c.x, z: c.z, kind: 'crystal', color: this.s.crystals[r] ? REGION_COLORS[r].css : '#6a6a9a', edge: false });
    }
    const marks = this.marks();
    for (const [id, n] of Object.entries(G.npcs.list)) if (n.visible) out.push({ x: n.pos.x, z: n.pos.z, kind: marks[id] === 'new' ? 'newquest' : 'npc', edge: false, id });
    for (const id of this.activeIds()) {
      const step = this.step(id);
      if (step?.type === 'sites' && SITE_SETS[step.set].kind !== 'npc') {
        for (const p of G.sites.undonePositions(step.set, this.st(id).data.done)) out.push({ x: p.x, z: p.z, kind: 'site', edge: false });
      }
    }
    if (!big) {
      for (const ch of G.chests.markers()) out.push(ch);
      for (const gl of G.wander.markers()) out.push(gl);
    } else if (this.active('sq_map')) {
      for (const t of G.treasure.markers()) out.push(t);
    }
    const obj = this.objective();
    if (obj?.target) out.push({ x: obj.target.x, z: obj.target.z, kind: 'objective', edge: true });
    return out;
  }
}

export { REGIONS, CHAPTER_OF, MAIN, SIDE, GLOOM_SPOTS };
