import { helpers } from './fullrun.mjs';

// Plays the same things over and over and reports whether geometry, textures, scene objects or page elements
// keep growing, which would mean something is never freed. The first round may add shapes that are built once
// and kept; after that each count should hold steady.
// Run: node tools/shoot.mjs tools/plans/leaks.mjs --size 800x500 [--query book=book2]
// LEAK_GAMES=fishing,crystal,hats,battle,market picks what is repeated (any mini-game name works).
export default async (page) => {
  await page.eval(`const {G}=window.__pq; G.dev.newGame({name:'Sam',grade:4,scarf:'coral'}); G.save.data.settings.pace='free'; ${helpers}
    for (const id of ['ch0','ch1','ch2','ch3','ch4','ch5','ch6','ch7']) G.save.data.q[id] = { done: true, step: 99, data: {} };
    G.save.data.finale = true; G.save.data.festival = true;
    for (const r of ['lake','grove','huts','cave','ridge']) G.save.data.crystals[r] = true;
    G.save.data.flags.floeBridge ??= [0, 0, 0, 0, 0];
    G.dev.sync(); G.dev.step(0.5);
    let g = 0; while (G.top?.constructor.name !== 'ExploreActivity' && g++ < 30) { G.dev.key('Enter'); G.dev.step(0.3); }
    window.__count = () => { const R = G.quality.renderer; let objs = 0; G.scene.traverse(() => objs++);
      return { geo: R.info.memory.geometries, tex: R.info.memory.textures, objs, dom: document.getElementsByTagName('*').length, anim: G.world.animated.length }; };
    return 1;`);
  const games = (process.env.LEAK_GAMES ?? 'fishing,crystal,hats,battle,market').split(',');
  for (let round = 0; round < 5; round++) {
    const r = await page.eval(`const {G}=window.__pq; const before = window.__count(); const done = [];
      for (const k of ${JSON.stringify(games)}) {
        if (k === 'crystal') { const c = G.world.ctx.crystals.lake.base; G.dev.tp(c.x + 3, c.z, -Math.PI / 2); G.quests.useCrystal('lake'); await T.solve(30); await T.settle(1); }
        else if (k === 'hats') { for (const h of ['beanie', 'crown', 'party', 'pirate', 'bow']) { G.player.model.setHat(h, 0xff6688); G.dev.step(0.05); } G.applyLook(); }
        else { G.dev.games[k]?.({}, () => {}, { replay: true }); G.dev.step(0.5); await autoGame(); await T.settle(1); }
        let g = 0; while (G.top?.constructor.name !== 'ExploreActivity' && g++ < 20) { G.top?.quit ? G.top.quit() : G.dev.key('Escape'); G.dev.step(0.3); }
        done.push(k + ':' + G.top?.constructor.name);
      }
      G.dev.step(1);
      return JSON.stringify({ before, after: window.__count(), done });`);
    console.log('round', round, r);
  }
};
