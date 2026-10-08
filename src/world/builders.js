// Fills the world with the active book's plants, buildings and landmarks.
import { isBook2, isBook3 } from '../books/active.js';
import { buildNature } from './nature.js';
import { buildStructures } from './structures.js';
import { buildLandmarks } from './landmarks.js';
import { buildEmberIsles } from '../books/book2/world.js';
import { buildSkyreach } from '../books/book3/world.js';

export function buildBookWorld(ctx) {
  if (isBook2) return buildEmberIsles(ctx);
  if (isBook3) return buildSkyreach(ctx);
  buildNature(ctx);
  buildStructures(ctx);
  buildLandmarks(ctx);
  return ctx;
}
