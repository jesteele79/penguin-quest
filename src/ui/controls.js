// Controls in words, for whichever device the child is using right now. Story lines and game instructions write
// {press J}, {hold Shift} and so on, and read "tap the book button" on a tablet or "press △" with a PlayStation
// controller. A capital first letter in the token ({Press J}) starts the phrase with one.
import { G } from '../core/state.js';

// Controller buttons by position, as each family labels them.
const PAD = {
  ps: { bottom: '✕', right: '○', left: '□', top: '△', select: 'the Create button' },
  xbox: { bottom: 'A', right: 'B', left: 'X', top: 'Y', select: 'the View button' },
  nin: { bottom: 'B', right: 'A', left: 'Y', top: 'X', select: 'the − button' },
};

const PHRASES = {
  'how to move': {
    keys: 'Walk with W or the up arrow, and turn with A and D. Space jumps, and holding Shift makes you belly-slide!',
    touch: 'Drag on the left side of the screen to walk and turn. Tap Jump to jump, and hold Slide to belly-slide!',
    pad: (b) => `Walk and turn with the left stick. ${b.bottom} jumps, and holding ${b.right} makes you belly-slide!`,
  },
  'press j': { keys: 'press J', touch: 'tap the book button', pad: (b) => `press ${b.top}` },
  'press m': { keys: 'press M', touch: 'tap the little map', pad: (b) => `press ${b.select}` },
  'press e': { keys: 'press E', touch: 'tap the bubble', pad: (b) => `press ${b.left}` },
  'press h': { keys: 'press H', touch: 'tap Hint', pad: (b) => `press ${b.left}` },
  'press enter': { keys: 'press Enter', touch: 'tap Check', pad: (b) => `press ${b.bottom}` },
  'hold shift': { keys: 'hold Shift', touch: 'hold Slide', pad: (b) => `hold ${b.right}` },
  'hold space': { keys: 'hold Space', touch: 'hold Jump', pad: (b) => `hold ${b.bottom}` },
  'space to jump': { keys: 'Space to jump', touch: 'tap Jump to hop', pad: (b) => `press ${b.bottom} to jump` },
  'pick a lane': { keys: 'press 1, 2 or 3, or the arrow keys', touch: 'tap its sign, or steer', pad: 'steer, or use the D-pad' },
};

export function controlText(text) {
  const mode = G.input?.mode ?? 'keys';
  const b = PAD[G.input?.family] ?? PAD.xbox;
  return text.replace(/\{([A-Za-z][^{}]*)\}/g, (all, token) => {
    const p = PHRASES[token.toLowerCase()];
    if (!p) return all;
    let out = p[mode] ?? p.keys;
    if (typeof out === 'function') out = out(b);
    return token[0] === token[0].toUpperCase() ? out[0].toUpperCase() + out.slice(1) : out;
  });
}
