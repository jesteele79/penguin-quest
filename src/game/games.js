// Every playable game, by id. Signature: (params, onDone(result), opts) -> void
import { startWarmup, startPotions, startKnitting } from './minigames/simple.js';
import { startFishing } from './minigames/fishing.js';
import { startFloeHop } from './minigames/floehop.js';
import { startMarket } from './minigames/market.js';
import { startArchitect } from './minigames/architect.js';
import { startBattle } from './minigames/battle.js';
import { startBoss } from './minigames/boss.js';
import { startSlalom } from './minigames/slalom.js';
import { startSpireOpen, startFestival } from './minigames/scenes.js';

export const GAMES = {
  warmup: startWarmup,
  fishing: startFishing,
  floehop: startFloeHop,
  potions: startPotions,
  market: startMarket,
  knitting: startKnitting,
  architect: startArchitect,
  battle: startBattle,
  boss: startBoss,
  slalom: startSlalom,
  spireOpen: startSpireOpen,
  festival: startFestival,
};
