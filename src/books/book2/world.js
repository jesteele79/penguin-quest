// Builds the Ember Isles: plants and stones, buildings, the five Ember Vents and the crater.
import { buildNature } from './nature.js';
import { buildStructures } from './structures.js';
import { EmberVent, buildCrater, buildLavaPool } from './landmarks.js';
import { CRYSTALS } from './layout.js';

export function buildEmberIsles(ctx) {
  buildStructures(ctx);
  buildNature(ctx);
  ctx.crystals = {};
  for (const [id, p] of Object.entries(CRYSTALS)) ctx.crystals[id] = new EmberVent(ctx, id, p.x, p.z);
  ctx.animated.push((dt, t) => { for (const c of Object.values(ctx.crystals)) c.update(dt, t); });
  buildCrater(ctx);
  buildLavaPool(ctx);
  ctx.finishBatch();
  return ctx;
}
