// Walk across every rope bridge in Skyreach both ways, holding W, and check the penguin reaches the far island.
// Run: node tools/shoot.mjs tools/plans/bridges.mjs --size 800x500 --query book=book3
export default async (page) => {
  await page.wait(1200);
  await page.eval(`const {G}=window.__pq; G.dev.newGame({name:'Sam',grade:5,scarf:'coral'}); G.save.data.settings.pace='free'; G.hud.showControls(false);
    for (const id of ['ch0','ch1','ch2','ch3','ch4','ch5']) G.save.data.q[id] = { done: true, step: 99, data: {} }; G.dev.sync(); G.dev.step(0.5);
    let g = 0; while (G.top?.constructor.name !== 'ExploreActivity' && g++ < 30) { G.dev.key('Enter'); G.dev.step(0.3); } return 1;`);
  console.log(await page.eval(`const {G}=window.__pq; const res = [];
    for (const [k, b] of (G.world.ctx.bridges ?? []).entries()) {
      for (const dir of [1, -1]) {
        const s = dir > 0 ? { x: b.ax, z: b.az } : { x: b.bx, z: b.bz }, e = dir > 0 ? { x: b.bx, z: b.bz } : { x: b.ax, z: b.az };
        const ux = (e.x - s.x) / b.len, uz = (e.z - s.z) / b.len, yaw = Math.atan2(ux, uz);
        G.player.teleport(s.x - ux * 1.5, s.z - uz * 1.5, yaw); G.cam.snap(G.player); G.dev.step(0.3);
        let fell = false;
        for (let i = 0; i < Math.ceil((b.len + 10) / 8.5 / 0.25); i++) { G.player.yaw = yaw; G.dev.step(0.25, { keys: ['KeyW'] }); if (G.player.pos.y < 1) fell = true; }
        const p = G.player.pos, along = (p.x - s.x) * ux + (p.z - s.z) * uz;
        res.push('bridge ' + k + (dir > 0 ? ' there' : ' back') + ': ' + (along > b.len + 2 && !fell ? 'ok' : 'STUCK at ' + along.toFixed(1) + ' of ' + b.len.toFixed(0) + (fell ? ', fell' : '')));
      }
    }
    return JSON.stringify(res, null, 1);`));
};
