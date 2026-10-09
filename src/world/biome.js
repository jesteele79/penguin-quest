// Light, air, sky and water for the book being played. Book 1 is a moonlit snowy night under the aurora;
// Book 2 is a golden-hour evening on warm volcanic islands.
import * as THREE from 'three';
import { byBook } from '../books/active.js';
import { Sky, FOG_COLOR, MOON_DIR } from './sky.js';
import { SunsetSky, HAZE, SUN_DIR } from '../books/book2/sky.js';
import { TwilightSky, HAZE as TWILIGHT, SUN_DIR as AFTERGLOW } from '../books/book3/sky.js';
import { CloudSea } from '../books/book3/clouds.js';

const GLACIER_BAY = {
  fog: FOG_COLOR, fogDensity: 0.0042,
  hemi: { sky: 0x8c9ef0, ground: 0x1c2462, intensity: 1.7 },
  light: { color: 0xc9d6ff, intensity: 2.0, dir: MOON_DIR },
  Sky,
  water: {},
  effects: {},
  gloom: 0x3a2a66, gloomGlow: [0.18, 0.08, 0.32],
};

const EMBER_ISLES = {
  fog: HAZE, fogDensity: 0.0029,
  hemi: { sky: 0xc4dcff, ground: 0x6e5444, intensity: 1.35 },
  light: { color: 0xffd6a6, intensity: 2.9, dir: SUN_DIR },
  Sky: SunsetSky,
  water: {
    radius: 300, tex: 256, depthScale: 7, floes: false, fish: { count: 70, spread: 175 }, sunDir: SUN_DIR,
    colors: { deep: 0x0d4d72, shallow: 0x52e3cf, glow: 0x2bdcc4, foam: 0xfff8ec, sky: 0xffb894, glowAmt: 0.3, fish: [0xff8a3d, 0xffd23d] },
  },
  // Warm motes drift up through the golden air; sand puffs and darker prints instead of snow.
  effects: { motes: { color: 0xffd9a0, fall: -0.16, sway: 1.8, size: 1.5, twinkle: 1, amount: 0.22 }, spray: [0xa8916a, 0x8a7656], footprint: 0x9c7b52 },
  gloom: 0x3b3230, gloomGlow: [0.09, 0.035, 0.015],
};

// Blue hour above the clouds: violet air, a peach afterglow, starry motes and soft footprints in the grass.
const SKYREACH = {
  fog: TWILIGHT, fogDensity: 0.0024,
  // Light bounces up off the cloud sea, so the ground colour of the sky light is a warm lilac.
  hemi: { sky: 0xbcc8ff, ground: 0xa898c8, intensity: 1.6 },
  light: { color: 0xffd8c8, intensity: 2.4, dir: AFTERGLOW },
  Sky: TwilightSky,
  Sea: CloudSea,
  water: {},
  effects: { motes: { color: 0xe8e4ff, fall: 0.05, sway: 1.4, size: 1.2, twinkle: 1, amount: 0.25 }, spray: [0xb8e8c8, 0xf0f8ff], footprint: 0x6a9a7a },
  gloom: 0x6a6890, gloomGlow: [0.06, 0.06, 0.12],
  // On the map the cloud sea is lilac, paler along the cliffs.
  mapSea: { shallow: [0.7, 0.68, 0.92], deep: [0.52, 0.5, 0.8] },
};

export const BIOME = byBook({ book1: GLACIER_BAY, book2: EMBER_ISLES, book3: SKYREACH });
export const LIGHT_DIR = BIOME.light.dir;
export const lightColor = () => new THREE.Color(BIOME.light.color);
