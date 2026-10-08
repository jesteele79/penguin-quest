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
import { byBook } from '../books/active.js';
import { startForgeOrders, startKelpRecipe, startChartDive, startSiphon } from '../books/book2/games.js';
import { startLavaHop } from '../books/book2/lavahop.js';
import { startSnorkel } from '../books/book2/snorkel.js';
import { startCraterOpen, startRekindle, startEmberFestival } from '../books/book2/scenes.js';
import { startKiteMix, startAltimeter, startBalanceGears, startClockFix, startNets, startStarSurvey, startHush } from '../books/book3/games.js';
import { startGliderTrials } from '../books/book3/glider.js';
import { startWellOpen, startStarMap, startSkyFestival } from '../books/book3/scenes.js';

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
  festival: byBook({ book1: startFestival, book2: startEmberFestival, book3: startSkyFestival }),
  // The Ember Isles
  lavahop: startLavaHop,
  forge: startForgeOrders,
  snorkel: startSnorkel,
  recipe: startKelpRecipe,
  dive: startChartDive,
  siphon: startSiphon,
  craterOpen: startCraterOpen,
  rekindle: startRekindle,
  // Skyreach
  glider: startGliderTrials,
  kitemix: startKiteMix,
  altimeter: startAltimeter,
  balance: startBalanceGears,
  clockfix: startClockFix,
  nets: startNets,
  survey: startStarSurvey,
  hush: startHush,
  wellOpen: startWellOpen,
  starMap: startStarMap,
};
