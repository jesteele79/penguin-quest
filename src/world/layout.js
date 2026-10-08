// Where things are in the book being played. Shared systems import from here; each book's own content
// imports its layout directly. Both books use the same names wherever the meaning is the same.
import { isBook2 } from '../books/active.js';
import * as glacierBay from '../books/book1/layout.js';
import * as emberIsles from '../books/book2/layout.js';

const L = isBook2 ? emberIsles : glacierBay;

export const WATER_Y = L.WATER_Y;
export const WORLD_HALF = L.WORLD_HALF;
export const GRID_STEP = L.GRID_STEP;
export const WORLD_RADIUS = L.WORLD_RADIUS;
export const LOC = L.LOC;
export const CRYSTALS = L.CRYSTALS;
export const ROADS = L.ROADS;
export const SNOWFLAKES = L.SNOWFLAKES;
export const CHESTS = L.CHESTS;
export const GLOOM_SPOTS = L.GLOOM_SPOTS;
export const BUOYS = L.BUOYS;
export const SURVEY = L.SURVEY;
export const BEACONS = L.BEACONS;
export const BEDS = L.BEDS;
export const SEEDS = L.SEEDS;
export const CHICK_SPOTS = L.CHICK_SPOTS;
export const NURSERY = L.NURSERY;
export const PATROL_BOARD = L.PATROL_BOARD;
export const CAULDRON = L.CAULDRON;
export const FESTIVAL = L.FESTIVAL;
export const SLALOM = L.SLALOM;
export const GRID = L.GRID;
export const gridToWorld = L.gridToWorld;
export const TREASURE_CLUES = L.TREASURE_CLUES;
export const REGIONS = L.REGIONS;
