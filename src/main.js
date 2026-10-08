import * as THREE from 'three';
import { G, pushActivity, popActivity } from './core/state.js';
import { Input } from './core/input.js';
import { AudioEngine } from './core/audio.js';
import { Quality, PRESETS } from './core/quality.js';
import { damp } from './core/mathutil.js';
import { World } from './world/world.js';
import { terrainColor } from './world/terrain.js';
import { Player } from './actors/player.js';
import { FollowCam } from './actors/camera.js';
import { Buddy } from './actors/buddy.js';
import { LOC, WORLD_HALF, WATER_Y, CRYSTALS } from './world/layout.js';
import { SaveStore } from './game/save.js';
import { Tutor } from './math/tutor.js';
import { bookScope } from './books/books.js';
import { typedValue } from './math/build.js';
import { installHarness } from './dev/harness.js';
import { GAMES } from './game/games.js';
import { HUD } from './ui/hud.js';
import { DialogBox } from './ui/dialog.js';
import { QuizPanel, setSpeechVolume } from './ui/quizpanel.js';
import { Toasts } from './ui/toast.js';
import { WorldLabels } from './ui/labels.js';
import { TouchControls } from './ui/touch.js';
import { ExploreActivity } from './game/activities.js';
import { lessonDue, LessonActivity } from './game/lesson.js';
import { TitleScreen, NewGameScreen, PauseScreen, MapScreen, JournalScreen } from './game/screens.js';
import { QuestEngine, REGIONS, CHAPTER_OF } from './game/questengine.js';
import { NPCManager } from './game/npcs.js';
import { Interactions } from './game/interact.js';
import { SiteManager } from './game/sites.js';
import { Pickups } from './game/pickups.js';
import { Chests } from './game/chests.js';
import { Wanderers } from './game/wander.js';
import { Chicks } from './game/chicks.js';
import { Treasure } from './game/treasure.js';
import { Patrol } from './game/patrol.js';
import { fireworks } from './game/minigames/scenes.js';
import { BOOK } from './books/current.js';
import { T } from './books/terms.js';
import { ACTIVE } from './books/active.js';
import { SHOP, findItem, NPCS } from './game/content.js';
import { setTheme } from './math/theme.js';
import { domainOf } from './books/regions.js';

// Word problems and lessons speak the language of the book on this page.
setTheme(ACTIVE);

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------ helpers on G
function installHelpers() {
  let saveTimer = null;
  G.saveNow = () => {
    clearTimeout(saveTimer);
    const d = G.save.data;
    const p = G.player;
    if (G.inGame && p.grounded && !p.platform && !p.swimming && G.top instanceof ExploreActivity) d.pos = { x: p.pos.x, z: p.pos.z, yaw: p.yaw };
    G.save.save();
  };
  G.saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(G.saveNow, 1500); };
  G.addCoins = (n, toast = true) => {
    G.save.data.coins += n;
    if (n > 0) { G.audio.play('coin'); G.input?.rumble(0.08, 0.3, 45); }
    if (toast && n > 0) G.toasts.toast(`<b>+${n}</b> fish coins`, { kind: 'gold', ms: 1800 });
  };
  G.addStars = (n) => {
    G.save.data.stars += n;
    G.toasts.toast(`<b>+${n}</b> ${n > 1 ? T.stars : T.star}`, { kind: 'gold', ms: 2400 });
  };
  G.itemName = (key) => {
    const [slot, id] = key.split(':');
    return findItem(slot, id === 'null' ? null : id)?.name ?? key;
  };
  G.unlockedDomains = () => {
    const out = [domainOf('lake')];
    for (const r of REGIONS) if (r !== 'lake' && G.quests.started(CHAPTER_OF[r])) out.push(domainOf(r));
    return out;
  };
  G.makeTutor = (data) => new Tutor(data.tutor, data.profile.grade, undefined, bookScope(data.active));
  G.applyLook = (look = G.save.data.equipped) => {
    const m = G.player.model;
    const scarf = findItem('scarf', look.scarf) ?? SHOP.scarf[0];
    m.setScarf(scarf.color, scarf.tex);
    const hat = findItem('hat', look.hat);
    m.setHat(look.hat, hat?.color);
    const trail = findItem('trail', look.trail) ?? SHOP.trail[0];
    G.trailColors = trail.colors;
    const sled = findItem('sled', look.sled);
    m.setSled(look.sled, sled?.color);
    G.buddy.set(look.buddy, G.player.pos);
  };
  G.applySettings = (qualityChanged = false) => {
    const s = G.save.data.settings;
    G.audio.setVolumes(s.music, s.sfx);
    // Text size: 100/125/150%. Older saves only had a big-text switch.
    const size = s.textSize ?? (s.bigText ? 1.25 : 1);
    document.documentElement.style.setProperty('--ui-scale', String(size));
    // Reduced motion follows the ChromeOS setting unless a grown-up chose otherwise.
    G.reduceMotion = s.reduceMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    document.documentElement.classList.toggle('reduce-motion', !!G.reduceMotion);
    document.documentElement.classList.toggle('easy-read', !!s.easyRead);
    G.dialog.setSpeed(s.textSpeed);
    G.dialog.autoRead = !!s.readAloud;
    setSpeechVolume(s.voice ?? 1);
    if (qualityChanged) G.quality.setMode(s.quality);
  };
  G.qualityNote = () => `Now using ${PRESETS[G.quality.level]?.label ?? 'Medium'}${G.quality.mode === 'auto' ? ' (picked automatically)' : ''}. Lower settings run smoother on Chromebooks.`;
  G.screens = {
    map: () => pushActivity(new MapScreen()),
    pause: () => pushActivity(new PauseScreen()),
    journal: (tab) => pushActivity(new JournalScreen(tab)),
  };
  G.toTitle = () => { G.saveNow(); location.reload(); };
  // A tiny freeze-frame that makes a correct answer land (off with reduced motion).
  G.hitStopT = 0;
  G.hitStop = (s) => { if (!G.reduceMotion) G.hitStopT = Math.max(G.hitStopT, s); };
  G.fireworks = fireworks;
}

// ------------------------------------------------------------ map image
function buildMapImage(terrain) {
  const S = 440;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const col = [0, 0, 0];
  const k = (WORLD_HALF * 2) / S;
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const x = -WORLD_HALF + (px + 0.5) * k, z = -WORLD_HALF + (py + 0.5) * k;
      const h = terrain.heightAt(x, z);
      const gx = terrain.heightAt(x + 1, z) - terrain.heightAt(x - 1, z);
      const gz = terrain.heightAt(x, z + 1) - terrain.heightAt(x, z - 1);
      const slope = Math.hypot(gx, gz) / 2;
      const i = Math.round((z + WORLD_HALF) / terrain.step) * terrain.n + Math.round((x + WORLD_HALF) / terrain.step);
      terrainColor(x, z, h, slope, terrain.roadDist[Math.max(0, Math.min(terrain.roadDist.length - 1, i))], col);
      const shade = Math.max(0.45, Math.min(1.2, 1 + (gx + gz) * 0.35));
      let r = col[0] * shade, gg = col[1] * shade, b = col[2] * shade;
      if (h < WATER_Y) { const d = Math.min(1, -h / 5); r = 0.15 - d * 0.1; gg = 0.75 - d * 0.35; b = 0.8 - d * 0.25; }
      const o = (py * S + px) * 4;
      img.data[o] = Math.min(255, r * 235); img.data[o + 1] = Math.min(255, gg * 235); img.data[o + 2] = Math.min(255, b * 245); img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

// ------------------------------------------------------------ colour grade
// Grading lives inside tone mapping, so every preset gets it with no extra render pass. The Neutral
// curve keeps the hand-picked palette's hues (ACES washed them out); then cool shadows, warm highlights
// and a little extra saturation.
function installGrade() {
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `vec3 CustomToneMapping( vec3 color ) {
      color = NeutralToneMapping( color );
      float l = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
      color *= mix( vec3( 0.93, 0.97, 1.07 ), vec3( 1.0 ), smoothstep( 0.0, 0.45, l ) );
      color *= mix( vec3( 1.0 ), vec3( 1.05, 1.0, 0.93 ), smoothstep( 0.6, 1.0, l ) * 0.6 );
      color = max( mix( vec3( l ), color, 1.12 ), 0.0 );
      return color;
    }`,
  );
}

// ------------------------------------------------------------ boot
function boot() {
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  installGrade();
  renderer.toneMapping = THREE.CustomToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.3, 1400);

  G.save = new SaveStore();
  const peek = G.save.peek();
  if (peek && (peek.active ?? 'book1') !== ACTIVE) { G.save.load(); G.save.switchBook(ACTIVE); G.save.save(); }
  const world = new World(scene, renderer);
  const ctx = world.ctx;
  BOOK.extras(ctx);
  const player = new Player(scene, world);
  player.model.setVisible(false);
  const input = new Input();
  input.attach(canvas);
  const cam = new FollowCam(camera, world.terrain);
  const audio = new AudioEngine();
  audio.usePalette(ACTIVE);
  const quality = new Quality(renderer, scene, camera, world);
  const uiRoot = document.getElementById('ui');
  Object.assign(G, {
    renderer, scene, camera, world, player, input, cam, audio, quality, uiRoot,
    terrain: world.terrain, effects: world.effects,
  });
  installHelpers();
  G.hud = new HUD(uiRoot);
  G.hud.setVisible(false);
  G.dialog = new DialogBox(uiRoot, audio);
  G.dialog.onClick = () => G.dialogClick?.();
  G.quiz = new QuizPanel(uiRoot);
  const quizOpen = G.quiz.open.bind(G.quiz), quizClose = G.quiz.close.bind(G.quiz);
  G.quiz.open = (o) => { quizOpen(o); audio.setDuck(true); };
  G.quiz.close = () => { quizClose(); audio.setDuck(false); };
  G.toasts = new Toasts(uiRoot);
  G.toasts.blocked = () => G.dialog.box.classList.contains('show');
  G.labels = new WorldLabels(uiRoot);
  G.labels.safeTop = () => G.quiz.topEdge;
  G.hud.attachWorldPrompt(G.labels, () => { G.tappedPrompt = true; });
  G.touch = new TouchControls(uiRoot, input, { onMenu: () => G.screens.pause(), onJournal: () => G.screens.journal() });
  // Prompts, the keypad and the controls card follow the device used last.
  const PAD_USE = { xbox: 'X', ps: '□', nin: 'Y' };
  input.onMode = (mode) => {
    document.documentElement.dataset.input = mode;
    G.quiz.setDevice(mode);
    G.hud.setPromptKey(mode === 'touch' ? 'Tap' : mode === 'pad' ? PAD_USE[input.family] : 'E');
    if (mode !== 'keys') G.hud.showControls(false);
  };
  document.documentElement.dataset.input = 'keys';
  G.interactions = new Interactions();
  G.npcs = new NPCManager(scene, world, G.labels);
  G.quests = new QuestEngine();
  G.sites = new SiteManager(ctx);
  G.pickups = new Pickups(ctx);
  G.chests = new Chests(ctx, G.interactions);
  G.wander = new Wanderers(ctx, G.interactions, G.labels);
  G.chicks = new Chicks(ctx, G.interactions);
  G.treasure = new Treasure(ctx, G.interactions);
  G.patrol = new Patrol();
  G.buddy = new Buddy(scene, world.terrain);
  G.mapImage = buildMapImage(world.terrain);
  registerInteractions();
  quality.onChange = (lvl) => G.toasts.toast(`Graphics set to ${PRESETS[lvl].label} for smoother play`, { ms: 3500 });
  quality.setMode(peek?.settings.quality ?? 'auto');
  window.__pq = { G, THREE };

  window.addEventListener('resize', () => { quality.resize(window.innerWidth, window.innerHeight); G.frozenDrawn = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.inGame) G.saveNow(); });
  // When hosted as a claude.ai artifact, an update reloads open copies: save first so no progress is lost.
  window.claude?.hot?.snapshot?.(() => { if (G.inGame) G.saveNow(); return {}; });
  const wake = () => { audio.init(); audio.setVolumes(G.save.data.settings.music, G.save.data.settings.sfx); if (!G.inGame) audio.setMood('title'); };
  window.addEventListener('pointerdown', wake, { once: false });
  window.addEventListener('keydown', wake, { once: false });

  showTitle();
  startLoop();
  document.getElementById('boot').classList.add('gone');
}

function registerInteractions() {
  const I = G.interactions;
  for (const id of Object.keys(NPCS)) {
    // Friends with something to say win over nearby objects; idle chatter does not.
    I.add({
      id: `npc-${id}`, radius: 3.8,
      priority: () => (G.quests.marks()[id] || G.quests.gameAt(id) ? 1 : 0),
      pos: () => { const n = G.npcs.get(id); return n.visible ? n.pos : null; },
      label: () => {
        const g = G.quests.gameAt(id);
        return g && !g.replay ? g.step.label : `Talk to ${NPCS[id].name}`;
      },
      action: () => G.quests.talk(id),
    });
  }
  for (const r of REGIONS) {
    const c = CRYSTALS[r];
    I.add({ id: `crystal-${r}`, pos: { x: c.x, z: c.z }, radius: 4.4, label: () => G.quests.crystalLabel(r), action: () => G.quests.useCrystal(r) });
  }
  for (const key of BOOK.gameAnchors) {
    I.add({ id: `game-${key}`, pos: () => G.quests.anchor(key), radius: key === 'arena' ? 7 : 3.8, label: () => G.quests.gameLabel(key), action: () => G.quests.useGameAt(key) });
  }
  BOOK.interactions(I);
  G.sites.registerInteractions(I);
}

// ------------------------------------------------------------ title and game entry
function showTitle() {
  G.inGame = false;
  BOOK.titleWorld();
  pushActivity(new TitleScreen(
    () => { popActivity(); G.save.load(); enterGame(false); },
    () => pushActivity(new NewGameScreen((profile) => {
      popActivity();
      G.save.fresh(profile);
      // This page was built for another book's world: reload into Book 1's.
      if (ACTIVE !== 'book1') { G.save.save(); location.reload(); return; }
      enterGame(true);
    })),
  ));
}

function syncWorld() {
  const d = G.save.data;
  const ctx = G.world.ctx;
  for (const r of REGIONS) {
    const c = ctx.crystals[r];
    c.setRestored(d.crystals[r], true);
    c.setShards(d.shards[r] || 0);
    if (!d.crystals[r]) c.setCharge(Math.min(1, (d.resonance[r] || 0) / 24) * 0.75);
    G.world.sky.setRestored(r, d.crystals[r], true);
  }
  BOOK.syncWorld(d, ctx);
  G.world.terrainMesh.userData.uniforms.uGloom.value = BOOK.gloomCleared(d) ? 0 : 1;
  G.audio.setLayers(1 + REGIONS.filter((r) => d.crystals[r]).length);
}

function enterGame(isNew) {
  const d = G.save.data;
  G.tutor = new Tutor(d.tutor, d.profile.grade, undefined, bookScope(d.active));
  G.tutor.lessonGate = (id) => lessonDue(id, 'new');
  G.lesson = (id) => pushActivity(new LessonActivity(id, { replay: true }));
  const record = G.tutor.record.bind(G.tutor);
  G.tutor.record = (p, r) => {
    const out = record(p, r);
    G.quests.onSolve(p, r);
    G.patrol.onSolve(p, r);
    if (out.newlyMastered) {
      // Naming the skill tells the child what they got better at, not just that they earned something.
      G.addCoins(15, false);
      G.audio.play('chime');
      G.toasts.showBanner('Skill mastered!', `${p.skillName ?? 'A new math skill'} · +15 fish coins`, '#ffd166', 3200);
    }
    return out;
  };
  G.inGame = true;
  d.stats.sessions += 1;
  for (const id of G.quests.activeIds()) G.quests.prepStep(id);
  syncWorld();
  const pl = G.player;
  pl.model.setVisible(true);
  if (d.pos && !isNew) pl.teleport(d.pos.x, d.pos.z, d.pos.yaw);
  else pl.teleport(LOC.start.x, LOC.start.z, LOC.start.yaw);
  G.applyLook();
  G.applySettings();
  G.cam.snap(pl);
  G.sites.refresh();
  G.pickups.refresh();
  G.chests.refresh();
  G.treasure.refresh();
  G.chicks.refresh();
  G.hud.setCrystals(d.crystals);
  G.hud.showControls(!G.quests.done('ch0'));
  const newDay = G.patrol.ensureToday();
  pushActivity(new ExploreActivity());
  if (isNew) BOOK.intro();
  if (newDay && G.quests.done('ch0')) setTimeout(() => G.toasts.toast(`New ${T.patrol} tasks today! Press J to see them.`, { ms: 5000 }), 1800);
  G.saveNow();
}

// ------------------------------------------------------------ loop
function startLoop() {
  const timer = new THREE.Timer();
  timer.connect(document);
  let time = 0, miniT = 0, saveT = 0, distT = { slide: 0, swim: 0 };
  let lastTarget = null;
  const { world, player, cam, camera, input } = G;

  // One broken system must not freeze the whole game: log it once and keep drawing.
  const reported = new Set();
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!G.quality.shouldRender(ts)) return;
    timer.update(ts);
    try {
      tick(timer.getDelta(), true);
    } catch (e) {
      const key = String(e?.stack ?? e);
      if (!reported.has(key)) { reported.add(key); console.error(e); }
      input.endFrame();
      G.quality.render();
    }
  }

  // Dev builds can drive the simulation without rAF (hidden preview panes never fire it).
  if (__DEV__) {
    G.dev = {
      step(seconds = 1, { keys = [], fps = 30 } = {}) {
        keys.forEach((k) => input.held.add(k));
        const n = Math.max(1, Math.round(seconds * fps));
        for (let i = 0; i < n; i++) tick(1 / fps, i === n - 1);
        keys.forEach((k) => input.held.delete(k));
      },
      key(code, opts = {}) {
        const target = opts.target ?? document.activeElement ?? window;
        target.dispatchEvent(new KeyboardEvent('keydown', { code, key: opts.key ?? code, bubbles: true, cancelable: true }));
        target.dispatchEvent(new KeyboardEvent('keyup', { code, key: opts.key ?? code, bubbles: true }));
        tick(1 / 30, true);
      },
      tp(x, z, yaw = 0) { player.teleport(x, z, yaw); cam.snap(player); tick(1 / 30, true); },
      typed: typedValue,
      games: GAMES,
      newGame(profile = { name: 'Pip', grade: 5, scarf: 'coral' }) {
        while (G.activities.length) popActivity();
        G.quests.queue.length = 0;
        G.save.fresh(profile, ACTIVE);
        enterGame(false);
        tick(1 / 30, true);
      },
      sync() {
        syncWorld();
        for (const s of [G.sites, G.pickups, G.chests, G.treasure, G.chicks]) s.refresh();
        G.hud.setCrystals(G.save.data.crystals);
        tick(1 / 30, true);
      },
    };
    installHarness();
  }

  function tick(raw, draw) {
    const t0 = performance.now();
    // Freeze-frame: hold the picture for a moment, keep reading input.
    if (G.hitStopT > 0) {
      G.hitStopT -= raw;
      input.endFrame();
      if (draw) G.quality.render();
      return;
    }
    // Behind a full-screen menu the world holds still and is drawn once.
    if (G.inGame && G.top?.freezesWorld) {
      G.top.update?.(Math.min(raw, 1 / 20), true);
      input.endFrame();
      if (draw && !G.frozenDrawn) { G.quality.render(); G.frozenDrawn = true; }
      return;
    }
    G.frozenDrawn = false;
    input.pollPad();
    G.touch.update(input.mode === 'touch' && G.inGame && !G.player.frozen);
    const dt = Math.min(raw, 1 / 20);
    time += dt;
    G.time = time;
    const acts = [...G.activities];
    acts.forEach((a, i) => a.update?.(dt, i === acts.length - 1));

    if (G.inGame) {
      const d = G.save.data;
      player.update(dt, input);
      for (const e of player.takeEvents()) {
        if (e.type === 'step') { G.audio.play('step', { wood: !!e.platform }); if (!e.platform) world.effects.footprint(player.pos.x, player.pos.z, player.yaw); }
        else if (e.type === 'jump') { G.audio.play('jump'); player.model.hop(); }
        else if (e.type === 'land') { G.audio.play('land'); player.model.land(e.speed); world.effects.snowSpray(player.pos, 0, 0, 2); }
        else if (e.type === 'splash') { G.audio.play('splash'); world.effects.splash(player.pos, Math.min(1.5, 0.5 + e.speed * 0.05)); }
        else if (e.type === 'stroke') G.audio.play('stroke');
        else if (e.type === 'slide') G.audio.play('whoosh');
      }
      BOOK.frame(dt, player);
      const sp = Math.abs(player.speed);
      if (player.sliding && player.grounded) {
        if (Math.random() < dt * 40) world.effects.burst(player.pos.clone().add(V(0, 0.3, 0)), { count: 2, color: G.trailColors ?? [0xffffff], speed: 2.5, up: 2.5, life: 0.6, gravity: 9, size: 0.45, vx: -Math.sin(player.yaw) * sp * 0.2, vz: -Math.cos(player.yaw) * sp * 0.2, spread: 0.8 });
        distT.slide += sp * dt;
      }
      if (player.swimming) distT.swim += sp * dt;
      if (distT.slide > 5) { G.patrol.event('slide', { amount: distT.slide }); d.counters.slide += distT.slide; distT.slide = 0; }
      if (distT.swim > 5) { G.patrol.event('swim', { amount: distT.swim }); d.counters.swim += distT.swim; distT.swim = 0; }
      G.audio.setSlide(player.sliding ? Math.min(1, sp / 18) : player.swimming && sp > 2 ? 0.35 : 0, player.swimming);

      cam.update(dt, player, input);
      G.npcs.update(dt, player.pos, camera.position);
      G.wander.update(dt, player);
      G.pickups.update(dt, time, player);
      G.chests.update(dt);
      G.chicks.update(dt, player);
      G.treasure.update(dt, time, player);
      G.sites.update(dt, time);
      G.buddy.update(dt, player);
      G.quests.update(dt);
      const ug = world.terrainMesh.userData.uniforms.uGloom;
      ug.value = damp(ug.value, BOOK.gloomCleared(d) ? 0 : 1, 0.5, dt);

      // HUD
      const scarf = findItem('scarf', d.equipped.scarf);
      G.hud.setPlayer({
        name: d.profile.name, hearts: G.hearts?.now ?? 0, maxHearts: G.hearts?.max ?? 0,
        coins: d.coins, stars: d.stars, flakes: d.snowflakes.length, flakesTotal: 30,
        scarfColor: scarf?.css?.startsWith('#') ? scarf.css : '#ff5a4e', hat: d.equipped.hat,
      });
      const obj = G.quests.objective();
      player.objective = obj?.target ?? null;
      const dist = obj?.target ? Math.hypot(obj.target.x - player.pos.x, obj.target.z - player.pos.z) : null;
      G.hud.setObjective(obj?.text ?? '', dist);
      G.hud.setQuiet(Math.abs(player.speed) > 1.5 && performance.now() - (G.hud.lastChange ?? 0) > 4000);
      const tKey = obj?.target ? `${Math.round(obj.target.x)},${Math.round(obj.target.z)}` : null;
      if (tKey !== lastTarget) { world.roads.setTarget(obj?.target ?? null); lastTarget = tKey; }
      miniT -= dt;
      if (miniT <= 0) {
        miniT = 0.1;
        G.hud.drawMinimap(G.mapImage, WORLD_HALF, player.pos.x, player.pos.z, player.yaw, G.quests.markers(false));
        const marks = G.top instanceof ExploreActivity ? G.quests.marks() : {};
        for (const id of Object.keys(G.npcs.list)) G.npcs.setMarkKind(id, marks[id] ?? null);
      }
      d.stats.playSeconds += raw < 1 ? raw : 0;
      saveT += dt;
      if (saveT > 30) { saveT = 0; G.saveNow(); }
    } else {
      const a = time * 0.035;
      camera.position.set(Math.cos(a) * 118, 50 + Math.sin(time * 0.08) * 6, Math.sin(a) * 118 + 12);
      camera.lookAt(0, 4, -25);
    }

    const showTrail = G.inGame && G.save.data.settings.showTrail && G.top instanceof ExploreActivity;
    world.update(dt, time, camera, G.inGame ? player.pos : V(0, 0, 0));
    world.roads.update(time, dt, player.pos, showTrail, world.pixelScale);
    input.endFrame();
    if (!draw) return;
    G.labels.update(camera, window.innerWidth, window.innerHeight);
    G.quality.sample(performance.now() - t0, raw);
    G.quality.render();
  }
  requestAnimationFrame(frame);
}

try {
  boot();
} catch (e) {
  console.error(e);
  const b = document.getElementById('boot');
  if (b) b.querySelector('.boot-sub').textContent = 'Something went wrong starting the game. Try reloading the page.';
}
