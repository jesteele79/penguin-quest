// World layout: single source of truth for where things are.
// Axes: +x east, +z south (north is -z). Units are roughly "penguin meters".

export const WATER_Y = 0;
export const WORLD_HALF = 220;
export const GRID_STEP = 2;
export const WORLD_RADIUS = 186; // hard boundary for the player

export const LOC = {
  home: { x: -100, z: 100 },
  igloo: { x: -112, z: 110 },
  professor: { x: -100, z: 104 },
  flag: { x: -95, z: 116 },
  kids: { x: -118, z: 94 },
  start: { x: -90, z: 90, yaw: -0.62 }, // facing the Professor

  lake: { x: 0, z: 0 },
  island: { x: 0, z: 4, r: 9 },
  // Piers are built from their water end back to shore (see structures.buildPier).
  dock: { x1: -44, z: -4, w: 3.4, top: 1.0 },
  launch: { x0: 0, z1: 51, w: 4.2, top: 1.0 },
  floeRows: [44.6, 38.2, 31.8, 25.4, 19],

  grove: { x: -140, z: -30 },
  fern: { x: -124, z: -30 },

  huts: { x: 118, z: 50 },
  mittens: { x: 119.5, z: 44.5 },
  counter: { x: 116, z: 40 },
  hutA: { x: 103, z: 57 },
  hutB: { x: 127, z: 34 },
  hutC: { x: 132, z: 57 },
  campfire: { x: 119, z: 53 },
  easel: { x: -103, z: 113 },
  purl: { x: 125, z: 57 },
  nestle: { x: 129, z: 47 },
  kingSpot: { x: 85, z: -121 },

  caveDome: { x: 104, z: 124, r: 13 },
  caveHill: { x: 124, z: 146 },
  pebble: { x: 92, z: 112 },

  ridge: { x: -35, z: -120, rx: 40, rz: 26, top: 22 },
  rampA: { x: -98, z: -84, h: 4.5 },
  rampB: { x: -66, z: -110, h: 22 },
  skipper: { x: -100, z: -76 },
  arena: { x: -30, z: -118 },

  spire: { x: 85, z: -130, top: 32 },
};

// Crystal positions (the five main Aurora Crystals).
export const CRYSTALS = {
  lake: { x: 0, z: 2 },
  grove: { x: -144, z: -34 },
  huts: { x: 120, z: 67 },
  cave: { x: 108, z: 128 },
  ridge: { x: -18, z: -126 },
};

// Golden road network. Each road is a polyline of [x, z] points; nodes shared between roads connect.
export const ROADS = [
  // Home down to the south beach, then east around the shore to the huts.
  [[-92, 92], [-80, 78], [-64, 66], [-44, 62], [-22, 64], [0, 62], [22, 64], [44, 62], [62, 50], [76, 36], [94, 34], [110, 40]],
  // South beach branch to the floe launch.
  [[0, 62], [0, 60]],
  // West shore: south beach junction to the dock and on to the grove.
  [[-64, 66], [-70, 44], [-72, 22], [-70, 4], [-64, -4]],
  [[-70, 4], [-86, -8], [-104, -18], [-122, -24]],
  // Grove north to the ridge ramp and up.
  [[-104, -18], [-104, -44], [-102, -66], [-98, -84], [-82, -97], [-66, -110], [-48, -118], [-30, -118]],
  // Huts south to the cave.
  [[110, 40], [104, 62], [100, 86], [96, 106], [94, 112]],
  // Huts north up the spire.
  [[110, 40], [116, 14], [118, -14], [114, -44], [106, -72], [100, -96], [92, -116], [86, -126]],
];

// Golden snowflakes. The first three are the tutorial ones near the igloo.
export const SNOWFLAKES = [
  [-91, 97], [-104, 90], [-86, 111],
  [-40, 118], [-47, 126], [-150, 72], [-138, 70], [52, 112], [60, 106], [36, -100],
  [-128, -95], [150, -10], [-10, 150], [-2, 158], [-120, -60], [-60, -128], [-15, -136],
  [70, 80], [128, 30], [140, 60], [104, 124], [92, 132], [100, -60], [64, -112], [60, -150],
  [-165, 5], [-140, -30], [-75, 150], [30, 130], [-110, 40],
];

export const CHESTS = [
  [-152, 62], [-36, 112], [57, 116], [40, -92], [-126, -102], [152, -2],
  [-14, 144], [-62, -72], [74, -38], [-132, 18], [140, 96], [-44, -142],
];

// Where wandering Glooms appear, and which subject they quiz on (null = the weakest one).
export const GLOOM_SPOTS = [
  { x: 30, z: 76, domain: 'lake' }, { x: -80, z: 40, domain: 'lake' },
  { x: -122, z: -58, domain: 'grove' }, { x: 94, z: 72, domain: 'huts' },
  { x: 80, z: 138, domain: 'cave' }, { x: -84, z: -58, domain: 'ridge' },
  { x: 114, z: -28, domain: null }, { x: -80, z: 125, domain: null },
];

// Quest sites.
export const BUOYS = [[-32, -28], [26, -26], [40, 22], [-38, 26]];
export const SURVEY = [[-75, 130], [76, -58], [142, 18], [-128, -76]];
export const BEACONS = [[-52, -134], [-157, 51], [146, -14], [-6, 146]];
export const BEDS = [30, 100, 170, 240, 310].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return [LOC.grove.x + Math.cos(a) * 14, LOC.grove.z + Math.sin(a) * 14];
});
export const SEEDS = [[-166, -12], [-118, -48], [-160, -62], [-108, -2], [-152, 14]];
export const CHICK_SPOTS = [[-122, 118], [-5, 8], [99, 129], [68, -118], [-160, -40], [-22, -110], [138, 66], [-46, 130]];
export const NURSERY = { x: 129, z: 47 };
export const PATROL_BOARD = { x: -93, z: 108 };
export const CAULDRON = { x: -133, z: -14 };
export const FESTIVAL = { x: 6, z: 70 };
export const SLALOM = { top: { x: -40, z: 118 }, toward: { x: -12, z: 86 } };

// The Captain's treasure map uses a 12 x 12 grid over the island, 30 units per square,
// with (0, 0) at the south-west corner and y growing to the north.
export const GRID = { x0: -180, z0: 180, cell: 30, n: 12 };
export const gridToWorld = (gx, gy) => ({ x: GRID.x0 + gx * GRID.cell, z: GRID.z0 - gy * GRID.cell });
export const TREASURE_CLUES = [
  { gx: 3, gy: 4, clue: 'X marks the spot at (3, 4).' },
  { gx: 8, gy: 3, clue: 'x is 2 × 4. y is 9 − 6.' },
  { gx: 6, gy: 9, clue: 'x is half of 12. y is 5 + 4.' },
  { gx: 2, gy: 9, clue: 'x is 10 − 8. y is 3 × 3.' },
];

// Points of interest used by the map and signposts.
export const REGIONS = [
  { id: 'home', name: 'Snowdrift Home', x: -100, z: 100 },
  { id: 'lake', name: 'Glimmer Lake', x: 0, z: 0 },
  { id: 'grove', name: 'Crystal Grove', x: -140, z: -30 },
  { id: 'huts', name: 'Heart Huts', x: 118, z: 50 },
  { id: 'cave', name: 'Glacier Cave', x: 104, z: 124 },
  { id: 'ridge', name: 'Gloom Ridge', x: -35, z: -120 },
  { id: 'spire', name: 'Aurora Spire', x: 85, z: -130 },
];
