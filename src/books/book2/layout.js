// The Ember Isles: where everything is. Same axes and scale as Book 1 (+x east, +z south).
// Shared systems read these through world/layout.js, so the names match Book 1's where they mean the same
// thing: CRYSTALS are the five Ember Vents, SNOWFLAKES are pieces of sea glass, CHICK_SPOTS are lost
// turtle hatchlings, GLOOM_SPOTS are where grumpy Sootlings drift.

export const WATER_Y = 0;
export const WORLD_HALF = 220;
export const GRID_STEP = 2;
export const WORLD_RADIUS = 186;

export const LOC = {
  home: { x: 0, z: 100 },
  start: { x: 4, z: 116, yaw: Math.PI },
  professor: { x: -9, z: 95 },
  camp: { x: -12, z: 92 },
  kids: { x: 20, z: 104 },
  easel: { x: -15, z: 100 },
  lavaStart: { x: -34, z: -38 },
  snorkelStart: { x: -104, z: 14 },
  arrival: { x: 0, z1: 122, w: 4, top: 1.1 },
  launch: { x0: 0, z1: 122, w: 4, top: 1.1 },
  floeRows: [],
  isa: { x: -100, z: 20 },
  lagoon: { x: -138, z: 18, r: 26 },
  station: { x: -122, z: 22 },
  forge: { x: -44, z: -52 },
  rocco: { x: -38, z: -46 },
  lavaField: { x: -12, z: -46 },
  volcano: { x: 0, z: -96, top: 44, crater: 13 },
  camp2: { x: 46, z: -62 },
  cinder: { x: 48, z: -66 },
  harbor: { x: 120, z: 30 },
  marlo: { x: 116, z: 24 },
  counter: { x: 113, z: 20 },
  shelldon: { x: 128, z: 40 },
  dock: { x1: 152, z: 30, w: 3.4, top: 1.0 },
  temple: { x: -98, z: 132, r: 24 },
  tortuga: { x: -74, z: 116 },
  sandbar: [{ x: -54, z: 108 }, { x: -82, z: 124 }],
  cliffs: { x: 104, z: -104, r: 20, top: 20 },
  lighthouse: { x: 110, z: -112 },
  lumi: { x: 98, z: -98 },
  rampA: { x: 66, z: -74, h: 7 },
  rampB: { x: 88, z: -90, h: 20 },
  arena: { x: 26, z: -48 },
  island: { x: 0, z: 0, r: 0 },
};

// The five Ember Vents that feed the Heart-Ember, one per subject.
export const CRYSTALS = {
  lake: { x: -52, z: -60 },
  grove: { x: -124, z: -7 },
  huts: { x: 132, z: 14 },
  cave: { x: -98, z: 132 },
  ridge: { x: 112, z: -102 },
};

// Paths of packed golden sand. Shared nodes connect.
export const ROADS = [
  // Arrival pier up to the camp, then north through the jungle to the forge.
  [[0, 120], [0, 108], [-4, 96], [-10, 80], [-22, 62], [-30, 40], [-34, 18], [-38, -6], [-42, -28], [-44, -46]],
  // Camp east along the coast to the harbor.
  [[-4, 96], [14, 88], [36, 80], [60, 72], [82, 60], [100, 46], [114, 34]],
  // Harbor north to the lighthouse ramp.
  [[100, 46], [96, 20], [88, -6], [80, -32], [72, -56], [66, -74], [88, -90], [100, -100]],
  // Jungle crossroads west to the lagoon shore.
  [[-34, 18], [-58, 16], [-80, 16], [-98, 18]],
  // Camp west along the south shore to the sandbar.
  [[-10, 80], [-30, 92], [-48, 104], [-54, 108]],
  // Forge up the volcano to the crater rim, in two switchbacks.
  [[-44, -46], [-30, -58], [-14, -64], [-26, -76], [-14, -84], [-6, -82]],
  // The lookout camp on the east slope.
  [[80, -32], [64, -48], [46, -62]],
];

// Pieces of sea glass. The first three are near the camp, for the tutorial.
export const SNOWFLAKES = [
  [8, 110], [-12, 112], [16, 96],
  [-60, 60], [40, 40], [34, 92], [-22, 116], [48, 76], [-80, 56], [-68, -20],
  [30, -20], [-6, 20], [90, -60], [114, 55], [133, 47], [-93, 35], [-150, -10], [-143, 46],
  [-96, 112], [-112, 146], [-80, 128], [10, -40], [-30, -90], [30, -110], [72, -110],
  [116, -126], [92, -20], [6, 60], [-86, -48], [50, 8],
];

export const CHESTS = [
  [-24, 70], [56, 52], [132, 49], [96, 2], [-74, 40], [-112, 22],
  [-112, 124], [-40, -30], [20, -70], [124, -96], [-14, -20], [23, 114],
];

// Where grumpy Sootlings drift, and which subject they quiz on (null = the weakest one).
export const GLOOM_SPOTS = [
  { x: -30, z: -36, domain: 'lake' }, { x: -64, z: -64, domain: 'lake' },
  { x: -100, z: 30, domain: 'grove' }, { x: 104, z: 8, domain: 'huts' },
  { x: -86, z: 119, domain: 'cave' }, { x: 74, z: -84, domain: 'ridge' },
  { x: 24, z: -30, domain: null }, { x: 40, z: 70, domain: null },
];

// Quest sites.
export const BUOYS = [];
export const SURVEY = [];
export const BEACONS = [];
export const BEDS = [];
export const SEEDS = [];
export const VALVES = [[-60, -44], [-58, -70], [-30, -66], [-44, -34]];
export const CORALS = [[-146, 12], [-132, 28], [-150, 30], [-136, 6], [-126, 14]];
export const CRATES = [[106, 36], [124, 50], [134, 28], [110, 14]];
export const LAMPS = [[94, -108], [104, -94], [116, -110], [108, -120]];
export const TIDE_POOLS = [[-36, 116], [24, 120], [-46, 98]];

export const CHICK_SPOTS = [[-32, 104], [30, 58], [-106, 28], [122, 54], [60, -40], [-70, -36], [101, -79], [-88, 140]];
export const NURSERY = { x: 26, z: 114 };
export const PATROL_BOARD = { x: 8, z: 92 };
export const CAULDRON = { x: 122, z: 18 };
export const FESTIVAL = { x: 0, z: 86 };
export const SLALOM = { top: { x: 12, z: -78 }, toward: { x: 26, z: -40 } };

// Tortuga's sea chart: a 12 x 12 grid over the islands, 30 units per square, (0, 0) at the south-west.
export const GRID = { x0: -180, z0: 180, cell: 30, n: 12 };
export const gridToWorld = (gx, gy) => ({ x: GRID.x0 + gx * GRID.cell, z: GRID.z0 - gy * GRID.cell });
export const TREASURE_CLUES = [
  { gx: 5, gy: 2, clue: 'The chart says (5, 2).' },
  { gx: 9, gy: 5, clue: 'x is 3 × 3. y is 10 − 5.' },
  { gx: 2, gy: 6, clue: 'x is 8 ÷ 4. y is 2 × 3.' },
  { gx: 7, gy: 10, clue: 'x is 12 − 5. y is 5 + 5.' },
];

export const REGIONS = [
  { id: 'home', name: 'Arrival Beach', x: 0, z: 100 },
  { id: 'lake', name: 'Forge Volcano', x: -44, z: -52 },
  { id: 'grove', name: 'Coral Lagoon', x: -138, z: 18 },
  { id: 'huts', name: 'Harbor Market', x: 120, z: 30 },
  { id: 'cave', name: 'Sunken Temple', x: -98, z: 132 },
  { id: 'ridge', name: 'Lighthouse Cliffs', x: 104, z: -104 },
  { id: 'spire', name: 'The Ember Heart', x: 0, z: -96 },
];
