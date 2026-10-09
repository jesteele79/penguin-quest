// Builds the Ember Isles: plants and stones, buildings, the five Ember Vents and the crater.
import { buildNature } from './nature.js';
import { buildStructures } from './structures.js';
import { EmberVent, buildCrater, buildLavaPool } from './landmarks.js';
import { CRYSTALS, LOC, poolDist } from './layout.js';

export function buildEmberIsles(ctx) {
  buildStructures(ctx);
  buildNature(ctx);
  ctx.crystals = {};
  for (const [id, p] of Object.entries(CRYSTALS)) ctx.crystals[id] = new EmberVent(ctx, id, p.x, p.z);
  ctx.animated.push((dt, t) => { for (const c of Object.values(ctx.crystals)) c.update(dt, t); });
  buildCrater(ctx);
  buildLavaPool(ctx);
  // The guide trail never draws a straight line across the lava; the vent's island counts as safe ground.
  const isle = LOC.lavaPool.isle;
  ctx.world.roads.hazardAt = (x, z) => poolDist(x, z) < 0.6 && Math.hypot(x - isle.x, z - isle.z) > isle.r;
  ctx.finishBatch();
  return ctx;
}
