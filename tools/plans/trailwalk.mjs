// Follows the gold guide trail on foot (holding W and turning, no teleports) from the start to every friend,
// crystal, quest spot and game spot, and reports any trip that gets stuck, falls or takes too long. Treasures are
// left out: the trail never points at them, they are found by reading the treasure map.
// Run: node tools/shoot.mjs tools/plans/trailwalk.mjs --size 400x300 --query book=book3
// TRAILWALK_ONLY=npc (or crystal, site, game) limits the trips.
export default async (page) => {
  await page.wait(1200);
  await page.eval(`const {G}=window.__pq; G.dev.newGame({name:'Sam',grade:5,scarf:'coral'}); G.save.data.settings.pace='free'; G.hud.showControls(false);
    // As a player leaves the world after the story: every crystal restored, the floe and lava-stone paths left
    // behind by their games, and nothing waiting to start when a place is reached.
    for (const id of ['ch0','ch1','ch2','ch3','ch4','ch5','ch6','ch7']) G.save.data.q[id] = { done: true, step: 99, data: {} };
    G.save.data.finale = true; G.save.data.festival = true;
    for (const r of ['lake','grove','huts','cave','ridge']) G.save.data.crystals[r] = true;
    G.save.data.flags.floeBridge ??= [0, 0, 0, 0, 0];
    G.save.data.flags.lavaBridge ??= [-42, -42, -42, -42, -42];
    G.dev.sync(); G.world.ctx.spire?.setOpen?.(true, true); G.dev.step(0.5);
    let g = 0; while (G.top?.constructor.name !== 'ExploreActivity' && g++ < 30) { G.dev.key('Enter'); G.dev.step(0.3); }
    window.__walk = async (tx, tz, reach) => {
      const P = G.player, R = G.world.roads, start = P.pos.clone();
      let route = null, routeT = 0, t = 0, lastCheck = P.pos.clone(), checkT = 0, stuck = 0, jumps = 0, worst = null;
      const total = R.computeRoute(start.x, start.z, tx, tz).reduce((s, p, i, a) => s + (i ? Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) : 0), 0);
      const limit = total / 8.5 * 2.2 + 25;
      while (t < limit) {
        if (G.top?.constructor.name !== 'ExploreActivity') return { ok: false, why: 'interrupted by ' + G.top?.constructor.name, at: [+P.pos.x.toFixed(0), +P.pos.z.toFixed(0)], t: +t.toFixed(1) };
        const d = Math.hypot(P.pos.x - tx, P.pos.z - tz);
        if (d < reach) return { ok: true, t: +t.toFixed(1), total: +total.toFixed(0) };
        if (!route || routeT <= 0) { route = R.computeRoute(P.pos.x, P.pos.z, tx, tz); routeT = 0.6; }
        // Drop points passed since the route was worked out, or the walker would turn back for them.
        while (route.length > 2) {
          const [ox, oz] = route[0], [ax, az] = route[1];
          if (Math.hypot(P.pos.x - ax, P.pos.z - az) > 1.2 && (ax - P.pos.x) * (ax - ox) + (az - P.pos.z) * (az - oz) > 0) break;
          route.shift();
        }
        // Aim at the point 4 m further along the route, but walk to a sharp corner before turning, as a child
        // following the sparkles would.
        let aim = null, walked = 0;
        for (let i = 1; i < route.length && !aim; i++) {
          const [ax, az] = i === 1 ? [P.pos.x, P.pos.z] : route[i - 1], [bx, bz] = route[i], l = Math.hypot(bx - ax, bz - az);
          if (walked + l >= 4) { const u = (4 - walked) / l; aim = [ax + (bx - ax) * u, az + (bz - az) * u]; break; }
          walked += l;
          if (i + 1 < route.length && l > 0.8) {
            const [cx, cz] = route[i + 1], ex = cx - bx, ez = cz - bz;
            if (((bx - ax) * ex + (bz - az) * ez) / (l * Math.hypot(ex, ez) || 1) < 0.7) aim = [bx, bz];
          }
        }
        aim ??= route[route.length - 1];
        P.yaw = Math.atan2(aim[0] - P.pos.x, aim[1] - P.pos.z);
        // Jump a gap of water or lava at its edge when there is safe footing beyond it (a stone, a floe, the far
        // bank), and slow down near such an edge so the jump is not missed. Ramps and cliffsides are not gaps.
        const at = (d) => [P.pos.x + Math.sin(P.yaw) * d, P.pos.z + Math.cos(P.yaw) * d];
        const ground = (d) => { const [x, z] = at(d); return G.world.groundAt(x, z, P.pos.y + 0.6); };
        const wet = (d) => { const [x, z] = at(d); return !ground(d).platform && (G.world.roads.hazardAt?.(x, z) || G.terrain.heightAt(x, z) < -0.5); };
        const landing = [2.4, 3.1, 3.8, 4.6, 5.4].some((d) => { const g = ground(d); return !wet(d) && g.y > P.pos.y - 2.2 && g.y < P.pos.y + 1; });
        const gap = P.grounded && wet(1.0) && landing;
        const step = !gap && wet(2.0) && landing ? 0.1 : 0.2;
        const before = P.pos.clone();
        G.dev.step(step, { keys: ['KeyW'], press: gap ? ['Space'] : [] });
        t += step; routeT -= step; checkT += step;
        if (P.pos.distanceTo(before) > 12) return { ok: false, why: 'fell or was carried back', at: [+before.x.toFixed(0), +before.z.toFixed(0)], t: +t.toFixed(1) };
        if (checkT >= 1.2) {
          if (P.pos.distanceTo(lastCheck) < 1.2) {
            stuck++;
            worst = [+P.pos.x.toFixed(0), +P.pos.z.toFixed(0)];
            if (stuck > 7) return { ok: false, why: 'stuck', at: worst, t: +t.toFixed(1) };
            // Get unstuck like a child would: jump forward, or step to one side.
            if (stuck % 2) { jumps++; G.dev.step(0.7, { keys: ['KeyW'], press: ['Space'] }); }
            else { P.yaw += (stuck % 4 === 0 ? 1.1 : -1.1); G.dev.step(0.8, { keys: ['KeyW'] }); }
            t += 0.8;
          }
          lastCheck = P.pos.clone(); checkT = 0;
        }
      }
      return { ok: false, why: 'too slow', at: [+P.pos.x.toFixed(0), +P.pos.z.toFixed(0)], t: +t.toFixed(1), total: +total.toFixed(0) };
    };
    return 1;`);
  const only = process.env.TRAILWALK_ONLY ?? '';
  const targets = JSON.parse(await page.eval(`const {G}=window.__pq; const out = [];
    for (const [id, n] of Object.entries(G.npcs.list)) if (n.visible !== false) out.push(['npc ' + id, n.pos.x, n.pos.z, 3.2]);
    for (const [r, c] of Object.entries(G.world.ctx.crystals)) out.push(['crystal ' + r, c.base.x, c.base.z, 5]);
    for (const s of Object.values(G.sites.sets ?? {}).flat()) if (s?.pos) out.push(['site ' + s.set + ' ' + s.index, s.pos.x, s.pos.z, 3.8]);
    for (const k of G.dev.book.gameAnchors ?? []) { const a = G.quests.anchor(k); if (a) out.push(['game ' + k, a.x, a.z, 3.5]); }
    return JSON.stringify(out);`)).filter(([name]) => !only || name.startsWith(only));
  const start = await page.eval(`const {G}=window.__pq; return JSON.stringify([G.player.pos.x, G.player.pos.z]);`);
  const fails = [];
  let n = 0;
  for (const [name, x, z, reach] of targets) {
    const r = JSON.parse(await page.eval(`const {G}=window.__pq; const [sx, sz] = ${start}; G.player.teleport(sx, sz, 0); G.dev.step(0.2); return JSON.stringify(await window.__walk(${x}, ${z}, ${reach}));`));
    n++;
    if (!r.ok) { fails.push(`${name} at (${x.toFixed(0)}, ${z.toFixed(0)}): ${r.why} near (${r.at}) after ${r.t}s`); await page.shot('fail-' + name.replace(/\W+/g, '_')); }
  }
  console.log(JSON.stringify({ trips: n, failed: fails.length, fails }, null, 1));
};
