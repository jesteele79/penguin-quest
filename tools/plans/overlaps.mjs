// Friends, collectibles and quest sites that stand inside something solid (a hut, a rock wall, a campfire),
// and anything solid that blocks a road.
// Run for each book: node tools/shoot.mjs tools/plans/overlaps.mjs --size 600x400 --query book=book3
// Prints [] when everything has room around it.
export default async (page) => {
  await page.wait(1200);
  await page.eval(`const {G}=window.__pq; G.dev.newGame({name:'Sam',grade:5,scarf:'coral'}); G.dev.step(0.5);`);
  console.log(await page.eval(`const {G}=window.__pq; const col = G.world.ctx.collision; const out = [];
    const own = new Set(Object.values(G.npcs.list).map((n) => n.collider));
    const test = (what, x, z, r) => {
      for (const c of col.nearby(x, z, 8)) {
        if (c.r === undefined || own.has(c) || c.active === false || ['rail', 'hush', 'spire-shield'].includes(c.tag)) continue;
        const d = Math.hypot(x - c.x, z - c.z);
        if (d < c.r + r - 0.3 && d > 0.05) out.push(what + ' is inside ' + (c.tag ?? 'something') + ' at (' + c.x.toFixed(1) + ', ' + c.z.toFixed(1) + ')');
      }
    };
    for (const [id, n] of Object.entries(G.npcs.list)) test('friend ' + id, n.pos.x, n.pos.z, 0.7);
    for (const it of G.pickups.items.flakes) test('collectible ' + it.i, it.x, it.z, 0.4);
    for (const s of Object.values(G.sites.sets ?? {}).flat()) if (s?.pos) test('site ' + s.set + ' ' + s.index, s.pos.x, s.pos.z, 0.2);
    // Paths must stay open: nothing solid within a penguin's width of a road's middle.
    for (const [k, road] of G.world.roads.list.entries()) {
      for (let i = 1; i < road.length; i++) {
        const [ax, az] = road[i - 1], [bx, bz] = road[i], len = Math.hypot(bx - ax, bz - az);
        for (let d = 0; d <= len; d += 1) {
          const x = ax + ((bx - ax) * d) / len, z = az + ((bz - az) * d) / len;
          for (const c of col.nearby(x, z, 6)) {
            if (c.r === undefined || own.has(c) || c.active === false || ['rail', 'hush', 'spire-shield'].includes(c.tag)) continue;
            if (Math.hypot(x - c.x, z - c.z) < c.r + 0.9) { out.push('road ' + k + ' is blocked by ' + (c.tag ?? 'something') + ' at (' + c.x.toFixed(1) + ', ' + c.z.toFixed(1) + ')'); break; }
          }
        }
      }
    }
    return JSON.stringify([...new Set(out)], null, 1);`));
};
