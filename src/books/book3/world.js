// Builds Skyreach: buildings, rope bridges and updrafts, plants and stones, the five Star Anchors and the
// Starwell with the Hush curled around it.
import { buildStructures } from './structures.js';
import { buildBridges, buildUpdrafts } from './bridges.js';
import { buildNature } from './nature.js';
import { StarAnchor, buildStarwell } from './landmarks.js';
import { CRYSTALS, WATER_Y } from './layout.js';

export function buildSkyreach(ctx) {
  buildStructures(ctx);
  buildBridges(ctx);
  buildUpdrafts(ctx);
  buildNature(ctx);
  ctx.crystals = {};
  for (const [id, p] of Object.entries(CRYSTALS)) ctx.crystals[id] = new StarAnchor(ctx, id, p.x, p.z);
  ctx.animated.push((dt, t) => { for (const c of Object.values(ctx.crystals)) c.update(dt, t); });
  buildStarwell(ctx);
  // The cloud sea is not water to swim in: the guide trail never draws a straight line out over it.
  ctx.world.roads.hazardAt = (x, z) => ctx.terrain.heightAt(x, z) < WATER_Y - 1;
  ctx.finishBatch();
  return ctx;
}
