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
  start: { x: -90, z: 90, yaw: 2.36 },

  lake: { x: 0, z: 0 },
  island: { x: 0, z: 4, r: 9 },
  // Piers are built from their water end back to shore (see structures.buildPier).
  dock: { x1: -44, z: -4, w: 3.4, top: 1.0 },
  launch: { x0: 0, z1: 51, w: 4.2, top: 1.0 },
  floeRows: [44.6, 38.2, 31.8, 25.4, 19],

  grove: { x: -140, z: -30 },
  fern: { x: -126, z: -22 },

  huts: { x: 118, z: 50 },
  mittens: { x: 119.5, z: 44.5 },
  counter: { x: 116, z: 40 },
  hutA: { x: 103, z: 57 },
  hutB: { x: 127, z: 34 },
  hutC: { x: 132, z: 57 },
  campfire: { x: 119, z: 53 },
  easel: { x: -103, z: 113 },

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
