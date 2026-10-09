// Skyreach: sky islands above a sea of clouds, around the Starwell. Same axes and scale as the other books
// (+x east, +z south). WATER_Y is the top of the cloud sea: nothing stands below it, and a penguin who
// drops into it is carried back up by the wind. Shared names mean what they mean elsewhere: CRYSTALS are the
// five Star Anchors, SNOWFLAKES are sky feathers, CHICK_SPOTS are lost pufflings, GLOOM_SPOTS are where
// Hushlings drift.

export const WATER_Y = 0;
export const WORLD_HALF = 220;
export const GRID_STEP = 2;
export const WORLD_RADIUS = 186;

// The islands: centre, radius, the height of the top, and how lumpy the edge is.
export const ISLANDS = {
  town: { x: 0, z: 70, r: 40, h: 12, wob: 5 },
  wind: { x: -98, z: -4, r: 34, h: 18, wob: 4 },
  valley: { x: -104, z: 100, r: 30, h: 4, wob: 5 },
  clock: { x: 106, z: 28, r: 31, h: 24, wob: 3 },
  crystal: { x: 84, z: 128, r: 26, h: 10, wob: 4 },
  stars: { x: 76, z: -88, r: 28, h: 32, wob: 3 },
  well: { x: -6, z: -86, r: 27, h: 46, wob: 2 },
};

export const LOC = {
  home: { x: 0, z: 70 },
  start: { x: 4, z: 98, yaw: Math.PI },
  // Cinder's airship rides at the mooring mast on the town's south edge.
  arrival: { x: 0, z: 108 },
  professor: { x: -12, z: 62 },
  camp: { x: -16, z: 56 },
  easel: { x: -20, z: 68 },
  kids: { x: 18, z: 84 },
  vela: { x: 8, z: 60 },
  cinder: { x: 8, z: 100 },
  nimbus: { x: 25, z: 66 },
  counter: { x: 21, z: 62 },
  // Wind Gardens: the Glider Guild's launch tower and the kite meadows.
  swoop: { x: -92, z: -14 },
  tower: { x: -104, z: -20 },
  meadow: { x: -86, z: 10 },
  // Cloud Valleys: low and misty, right at the cloud line. The balloon lift's landing reaches out over the
  // clouds from the north-west rim (vale is its land end, lift the mast at its tip), by the misty well.
  well2: { x: -123.6, z: 86.2 },
  vale: { x: -129.2, z: 78.9 },
  lift: { x: -135.7, z: 73.4 },
  // Where the lift is watched from during the ride: inland and to one side, so the mast stays clear.
  liftView: { x: -115.7, z: 83.8 },
  // Clockwork Observatory.
  tock: { x: 98, z: 24 },
  dome: { x: 114, z: 30 },
  // Crystal Workshop.
  rocco: { x: 78, z: 122 },
  kiln: { x: 90, z: 134 },
  // Star Guild.
  scope: { x: 82, z: -94 },
  // The Starwell, the highest island, where Guildmaster Astra keeps the stars.
  astra: { x: 70, z: -80 },
  spire: { x: -6, z: -88 },
  wren: { x: -21, z: 85 },
  // The cheer-up circle in the Cloud Valleys, where Hushlings gather.
  arena: { x: -112, z: 92 },
  // The mooring pier reaches east over the clouds: sky carp rise to bait dropped off its end.
  dock: { x1: 56, z: 84, w: 3.4, top: 12.3 },
  clockFace: { x: 92, z: 38 },
  floeRows: [],
  island: { x: 0, z: 0, r: 0 },
};

// The five Star Anchors that hold the islands in place, one per subject.
export const CRYSTALS = {
  lake: { x: -106, z: 6 },
  grove: { x: -112, z: 116 },
  huts: { x: 118, z: 18 },
  cave: { x: 94, z: 120 },
  ridge: { x: 66, z: -96 },
};

// Rope bridges between the islands: from one rim to another (the heights come from the islands).
export const BRIDGES = [
  { from: [-30, 46], to: [-70, 14] },
  { from: [-33, 88], to: [-77, 98] },
  { from: [38, 58], to: [77, 38] },
  { from: [30, 98], to: [62, 114] },
  { from: [102, -2], to: [86, -61] },
  { from: [50, -86], to: [20, -86] },
];

// Updrafts: columns of rising wind that lift a penguin to a higher island or into a glide.
export const UPDRAFTS = [
  { x: 14, z: 42, top: 40 },
  { x: -76, z: -22, top: 58 },
  { x: -86, z: 112, top: 22 },
];

// Paths on the island tops. They pass around the plaza fountain, beside the Professor's camp, to the foot of
// the launch tower's ramp and up to the Starwell's ring of stones (tools/plans/overlaps.mjs checks they stay open).
export const ROADS = [
  [[4, 100], [2, 88], [0, 81], [-5, 76], [-11, 71], [-21, 60], [-30, 46]],
  [[0, 81], [18, 66], [38, 58]],
  [[2, 88], [-14, 88], [-33, 88]],
  [[2, 88], [18, 92], [30, 98]],
  [[-70, 14], [-84, 4], [-95, -3], [-99, -6]],
  [[-77, 98], [-92, 98], [-106, 104]],
  [[77, 38], [92, 32], [106, 26], [104, 6], [102, -2]],
  [[62, 114], [70, 113], [80, 118], [88, 128]],
  [[86, -61], [80, -76], [76, -90], [62, -88], [50, -86]],
  [[20, -86], [8, -84], [3, -81]],
];

// Every bridge joins the ends of two paths, so the guide trail can cross from island to island.
export const LINKS = BRIDGES.map((B) => [B.from, B.to]);

// Guild Town's round cottages: x, z and a colour index.
export const COTTAGES = [[-14, 80, 1], [16, 52, 2], [-26, 64, 3], [26, 78, 4], [-6, 46, 5], [31, 71, 0], [-34, 80, 2]];
export const cottageRadius = (i) => 2.3 + (i % 3) * 0.3;

// Street lamps in Guild Town, beside the paths (never on them).
export const LAMPS = [[6.4, 86.4], [-4, 82], [7.4, 68.9], [-8, 70], [14, 62], [-16, 50], [30, 58], [-26, 90.6], [19.2, 95.5], [2, 104]];

// Sky feathers. The first three are near the mooring, for the tutorial.
export const SNOWFLAKES = [
  [10, 94], [-8, 98], [16, 76],
  [-24, 76], [28, 82], [-10, 46], [24, 48], [-112, -18], [-80, -22], [-118, 14], [-86, 22],
  [-120, 98], [-96, 112], [-88, 86], [96, 44], [120, 36], [112, 8], [90, 18], [72, 132],
  [96, 140], [100, 118], [64, -80], [80, -104], [86, -76], [-16, -96], [10, -92], [-2, -66],
  [-36, 70], [34, 88], [-72, 8],
];

export const CHESTS = [
  [-28, 62], [26, 90], [-110, -26], [-80, 16], [-118, 90], [-92, 116],
  [122, 28], [90, 10], [74, 140], [100, 128], [90, -84], [-18, -84],
];

// Where shy Hushlings drift, and which subject they quiz on (null = the weakest one).
export const GLOOM_SPOTS = [
  { x: -88, z: -2, domain: 'ratios' }, { x: -98, z: 90, domain: 'neg' }, { x: -116, z: 104, domain: 'neg' },
  { x: 96, z: 36, domain: 'ridge' }, { x: 80, z: 130, domain: 'cave' }, { x: 72, z: -82, domain: 'stars' },
  { x: 20, z: 56, domain: null }, { x: -20, z: 86, domain: null },
];

// Quest sites.
export const BUOYS = [];
export const SURVEY = [];
export const BEACONS = [];
export const BEDS = [];
export const SEEDS = [];
export const PINWHEELS = [[-84, -10], [-110, 0], [-96, 16], [-118, -12]];
export const GAUGES = [[-96, 106], [-114, 92], [-89, 94], [-108, 120]];
export const GEARS = [[96, 22], [122, 36], [110, 10], [100, 40]];
export const PRISMS = [[78, 134], [92, 116], [70, 124], [98, 136]];
export const SCOPES = [[70, -98], [84, -80], [94, -90], [64, -82]];

export const CHICK_SPOTS = [[-36, 74], [22, 44], [-100, -24], [-94, 112], [116, 40], [72, 120], [80, -78], [-10, -94]];
export const NURSERY = { x: -24, z: 86 };
export const PATROL_BOARD = { x: 10, z: 78 };
export const CAULDRON = { x: 26, z: 70 };
export const FESTIVAL = { x: 0, z: 74 };
// The glide course: from the Starwell's rim down over the clouds to the town.
export const SLALOM = { top: { x: -116, z: -26 }, toward: { x: -72, z: 8 } };

// Tock's star chart: a grid with (0, 0) in the middle of the sky, 15 units a square, running from -8 to 8
// both ways, so treasure hides in all four quadrants. origin says which line is zero.
export const GRID = { x0: -120, z0: 120, cell: 15, n: 16, origin: 8 };
export const gridToWorld = (gx, gy) => ({ x: gx * GRID.cell, z: -gy * GRID.cell });
export const TREASURE_CLUES = [
  { gx: -6, gy: 2, clue: 'Tock says: (−6, 2).' },
  { gx: 7, gy: -2, clue: 'x is 7. y is 4 − 6.' },
  { gx: 5, gy: 6, clue: 'x is the opposite of −5. y is 6.' },
  { gx: -7, gy: -7, clue: 'x is 3 less than −4. y is the same as x.' },
];

export const REGIONS = [
  { id: 'home', name: 'Guild Town', x: 0, z: 70 },
  { id: 'lake', name: 'Wind Gardens', x: -98, z: -4 },
  { id: 'grove', name: 'Cloud Valleys', x: -104, z: 100 },
  { id: 'huts', name: 'Clockwork Observatory', x: 106, z: 28 },
  { id: 'cave', name: 'Crystal Workshop', x: 84, z: 128 },
  { id: 'ridge', name: 'Star Guild', x: 76, z: -88 },
  { id: 'spire', name: 'The Starwell', x: -6, z: -86 },
];
