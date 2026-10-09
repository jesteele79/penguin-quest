// Plays the whole story (prologue to festival) through the dev harness and reports errors. The helpers below
// play each kind of step and mini-game; tools/plans/leaks.mjs reuses them.
// Run: node tools/shoot.mjs tools/plans/fullrun.mjs --out .cache/shots/full --size 1100x700 --query book=book2
export const helpers = `
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
window.autoStep = async function(){ const id=G.quests.trackedId(); const step=G.quests.step(id); const o=G.quests.objective(); const r={id,type:step?.type,obj:o?.text};
 if(!step) return r;
 if(step.type==='talk'){ const n=G.npcs.get(step.npc); G.dev.tp(n.pos.x+2.5,n.pos.z,-Math.PI/2); r.u=await T.use(); r.log=(await T.adv()); }
 else if(step.type==='reach'){ const a=G.quests.anchor(step.at); G.dev.tp(a.x+2,a.z-6,0); await T.settle(1); r.log=await T.adv(); }
 else { const t=o.target; if(!t){r.noTarget=true; return r;} if(o.npc){const n=G.npcs.get(o.npc); G.dev.tp(n.pos.x+2.5,n.pos.z,-Math.PI/2);} else { G.dev.tp(t.x+(step.type==='collect'?0:1.5), t.z, -Math.PI/2);} await T.settle(0.5);
   if(step.type!=='collect'){ r.u=await T.use(); } r.log0=await T.adv(); r.s=(await T.solve(30)).length; await T.settle(1); for(let j=0;j<8 && G.top?.constructor.name==='Cutscene';j++) await T.settle(2); r.log=(await T.adv()); }
 await T.settle(0.5); return r; };
window.autoGame = async function(){ const act=G.top; const n=act?.constructor.name;
 if(n==='FishingActivity'){ for(let i=0;i<200 && G.top===act;i++){ if(act.state==='aim'){ act.cast(act.round.p.choices.findIndex(c=>c.correct)); } if(act.state==='reveal'||act.state==='caught'){act.state='next';act.next();} G.dev.step(0.3); await sleep(0);} }
 else if(n==='FloeHopActivity'){ for(let r=0;r<40 && G.top===act && act.row<5;r++){ await sleep(800); await T.settle(1.2); const f=act.floes.find(o=>o.correct&&o.row===act.row&&o.rise>=1); if(!f) continue; G.player.teleport(f.x,f.z,Math.PI,f.platform.top+0.3); await T.settle(0.6);} G.player.teleport(-2,10,Math.PI); await T.settle(1); }
 else if(n==='LavaHopActivity'){ for(let r=0;r<40 && G.top===act && act.row<5;r++){ await sleep(800); await T.settle(1.2); const f=act.stones.find(o=>o.correct&&o.row===act.row&&o.rise>=1); if(!f) continue; G.player.teleport(f.x,f.z,Math.PI/2,f.platform.top+0.3); await T.settle(0.6);} const b=G.world.ctx.crystals.lake.base; G.player.teleport(b.x-3.8,b.z,Math.PI/2); await T.settle(1); }
 else if(n==='SnorkelActivity'){ for(let r=0;r<40 && G.top===act && act.row<6;r++){ await sleep(700); await T.settle(1.0); const g=act.gates.find(o=>o.correct&&o.row===act.row&&o.rise>=1); if(!g) continue; const F=act.dir; G.player.teleport(g.x-F.tx*2,g.z-F.tz*2,Math.atan2(F.tx,F.tz)); await T.settle(0.3); G.player.teleport(g.x+F.tx*2,g.z+F.tz*2,Math.atan2(F.tx,F.tz)); await T.settle(0.5);} const v=G.world.ctx.crystals.grove.base; G.player.teleport(v.x-2,v.z+4,0); await T.settle(1); }
 else if(n==='GliderTrials'){ for(let r=0;r<60 && G.top===act && act.n<5;r++){ await sleep(300); await T.settle(0.4); const g=act.rings.find(o=>o.correct&&!o.popped); if(!g) continue; const d=act.dir; G.player.teleport(g.c.x-d.x*2,g.c.z-d.z*2,act.yaw,g.c.y-0.6); G.player.grounded=false; G.dev.step(0.02); G.player.teleport(g.c.x+d.x*2,g.c.z+d.z*2,act.yaw,g.c.y-0.6); G.player.grounded=false; G.dev.step(0.05); G.player.teleport(g.c.x+d.x*12,g.c.z+d.z*12,act.yaw); await T.settle(1.2);} }
 else if(n==='BattleActivity'){ for(let i=0;i<200 && G.top===act;i++){ if(act.state==='fight'&&act.target&&G.quiz.state==='answering'){ G.quiz.input.value=G.dev.typed(act.target.round.p.answer); G.quiz.submitInput(); } await sleep(350); G.dev.step(0.3);} }
 else if(n==='BossActivity'){ for(let i=0;i<80 && G.top===act;i++){ if(act.state==='fight'&&G.quiz.state==='answering'){ const p=act.round.p; if(G.quiz.format==='choice') G.quiz.pick(p.choices.findIndex(c=>c.correct)); else {G.quiz.input.value=G.dev.typed(p.answer); G.quiz.submitInput();} } await sleep(1400); G.dev.step(0.2);} }
 else if(n==='QuizActivity'||n==='LessonActivity'){ await T.solve(30); }
 for(let k=0;k<6;k++){ await T.adv(); await T.settle(1.5);} return n; };
`;
export default async (page) => {
  await page.eval(`const {G}=window.__pq; G.dev.newGame({name:'Sam',grade:4,scarf:'coral'}); G.save.data.settings.pace='free'; ${helpers} return 1;`);
  const t0 = Date.now();
  let lastQ = '';
  for (let i = 0; i < 400; i++) {
    const r = await page.eval(`const {G}=window.__pq;
      if (G.quests.done('ch7')) return {done:true};
      if (G.quests.active('ch5') && G.quests.st('ch5').step===3) { const t=G.quests.objective().target; if(t){ G.dev.tp(t.x+1.5,t.z,-Math.PI/2); await T.settle(0.3); await T.use(); await T.adv(); await T.solve(5); await T.settle(1); await T.adv(); } return {t:'glooms'}; }
      const r = await autoStep();
      if (G.top?.constructor.name !== 'ExploreActivity') r.game = await autoGame();
      const q = Object.entries(G.save.data.q).map(([k,v])=>k+':'+(v.done?'done':v.step)).join(' ');
      return { t: r.type, game: r.game, q, top: G.top?.constructor.name, err: T.errors.length };`);
    if (r.done) break;
    if (r.q !== lastQ) { console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s`, r.q, r.game ?? ''); lastQ = r.q; }
    if (Date.now() - t0 > 540000) { console.log('timeout'); break; }
  }
  console.log(await page.eval(`const {G}=window.__pq; return JSON.stringify({done:G.quests.done('ch7'), coins:G.save.data.coins, errors:T.errors.slice(0,5)})`));
  await page.shot('end');
};
