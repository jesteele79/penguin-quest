// Words the shared game systems use, in each book's own language: the crystals of Glacier Bay are the
// Ember Vents of the Ember Isles, golden snowflakes are sea glass, Glooms are Sootlings.
import { byBook } from './active.js';

const GLACIER_BAY = {
  place: 'Glacier Bay', where: 'around the bay', home: 'the igloo',
  crystal: 'crystal', Crystal: 'Crystal', crystals: 'crystals', crystalOf: (name) => `${name} crystal`,
  shard: 'Aurora Shard', energy: 'aurora energy', restored: 'Aurora Crystal Restored!', glowsAgain: 'glows again',
  wake: 'Wake', charge: 'Charge',
  flake: 'golden snowflake', flakes: 'golden snowflakes', Flake: 'Golden snowflake', Flakes: 'Golden snowflakes', crystalName: 'Aurora Crystal',
  gloom: 'Gloom', glooms: 'Glooms', glimmer: 'Glimmer', gloomGift: 'aurora light', gloomColor: '#b483ff', gloomHex: 0xb483ff, hurtFlash: '#6a4ab8',
  patrol: 'Aurora Patrol', stars: 'Aurora Stars', star: 'Aurora Star', legend: 'Aurora Legend', journal: 'Aurora Journal',
  praise: ['Brilliant!', 'You got it!', 'Fin-tastic!', 'Ice work!', 'Cool thinking!', 'Aurora-some!', 'Spot on!', 'Waddle-ful!', 'Snow problem!', 'Perfect!'],
  dataPlace: 'Star charts at the easel',
  swimPlace: 'Glimmer Lake', fishPlace: 'the dock', stall: 'Snack Shack', slalom: 'Sledding Hill Slalom', chart: 'Star Chart', chartPlace: 'the easel',
};

const EMBER_ISLES = {
  place: 'the Ember Isles', where: 'around the islands', home: 'the camp',
  crystal: 'vent', Crystal: 'Vent', crystals: 'vents', crystalOf: (name) => `${name} vent`,
  shard: 'Ember Shard', energy: 'warmth', restored: 'Ember Vent Rekindled!', glowsAgain: 'is warm again',
  wake: 'Rekindle', charge: 'Warm up',
  flake: 'piece of sea glass', flakes: 'pieces of sea glass', Flake: 'Sea glass', Flakes: 'Sea glass', crystalName: 'Ember Vent',
  gloom: 'Sootling', glooms: 'Sootlings', glimmer: 'Sparkle', gloomGift: 'warmth', gloomColor: '#ff9a5a', gloomHex: 0xffb050, hurtFlash: '#5a3a34',
  patrol: 'Island Patrol', stars: 'Aurora Stars', star: 'Aurora Star', legend: 'Ember Legend', journal: 'Island Journal',
  praise: ['Brilliant!', 'You got it!', 'Fin-tastic!', 'Shell-ebrate!', 'Hot stuff!', 'Sea-riously good!', 'Spot on!', 'Waddle-ful!', 'Wave-tastic!', 'Perfect!'],
  dataPlace: 'Tide charts at the camp',
  swimPlace: 'the sea', fishPlace: 'the harbor pier', stall: "Chef Marlo's stall", slalom: 'Ash Slope Slalom', chart: 'Tide Chart', chartPlace: 'the camp table',
};

const SKYREACH = {
  place: 'Skyreach', where: 'around the islands', home: 'Guild Town',
  crystal: 'anchor', Crystal: 'Anchor', crystals: 'anchors', crystalOf: (name) => `${name} anchor`,
  shard: 'Star Shard', energy: 'starlight', restored: 'Star Anchor Relit!', glowsAgain: 'shines again',
  wake: 'Relight', charge: 'Charge',
  flake: 'sky feather', flakes: 'sky feathers', Flake: 'Sky feather', Flakes: 'Sky feathers', crystalName: 'Star Anchor',
  gloom: 'Hushling', glooms: 'Hushlings', glimmer: 'Cloudlet', gloomGift: 'a happy hum', gloomColor: '#a8a0e0', gloomHex: 0xc8c0ff, hurtFlash: '#4a4a7a',
  patrol: 'Sky Patrol', stars: 'Aurora Stars', star: 'Aurora Star', legend: 'Sky Legend', journal: 'Sky Journal',
  praise: ['Brilliant!', 'You got it!', 'Fin-tastic!', 'Sky-high!', 'Out of this world!', 'Star-tastic!', 'Spot on!', 'Waddle-ful!', 'Soaring!', 'Perfect!'],
  dataPlace: "Sky charts at the Professor's table",
  swimPlace: 'the clouds', fishPlace: 'the mooring pier', stall: "Nimbus's stall", slalom: 'Meadow Kite Run', chart: 'Sky Chart', chartPlace: "the Professor's table",
};

export const T = byBook({ book1: GLACIER_BAY, book2: EMBER_ISLES, book3: SKYREACH });
