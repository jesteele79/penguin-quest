// Light, air, sky and water for the book being played. Book 1 is a moonlit snowy night under the aurora;
// Book 2 is a golden-hour evening on warm volcanic islands.
import * as THREE from 'three';
import { isBook2 } from '../books/active.js';
import { Sky, FOG_COLOR, MOON_DIR } from './sky.js';
import { SunsetSky, HAZE, SUN_DIR } from '../books/book2/sky.js';

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

export const BIOME = isBook2 ? EMBER_ISLES : GLACIER_BAY;
export const LIGHT_DIR = BIOME.light.dir;
export const lightColor = () => new THREE.Color(BIOME.light.color);
