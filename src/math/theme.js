// Word problems speak the language of the book being played: its friends' names and the things on its
// island. Book 1 keeps the original wording; later books swap names and snow-and-ice nouns for their own.
// Swaps run in order, longest phrases first, and only ever replace whole words.
const THEMES = {
  book1: { friends: ['Mo', 'Lulu', 'Sunny', 'Fern', 'Pebble', 'Skipper'], swaps: [] },
  book2: {
    friends: ['Isa', 'Rocco', 'Nori', 'Kai', 'Lani', 'Shelldon'],
    swaps: [
      [/\bMama Mittens\b/g, 'Chef Marlo'], [/\bMittens\b/g, 'Marlo'], [/\bPebble\b/g, 'Rocco'], [/\bFern\b/g, 'Isa'],
      [/\bLulu\b/g, 'Nori'], [/\bSunny\b/g, 'Kai'], [/\bSkipper\b/g, 'Shelldon'], [/\bMo\b/g, 'Lani'],
      [/\bcocoas\b/g, 'mango juices'], [/\bcocoa\b/g, 'mango juice'],
      [/\bsnow cones\b/g, 'fruit cups'], [/\bsnow cone\b/g, 'fruit cup'], [/\bice pops\b/g, 'fruit pops'], [/\bice pop\b/g, 'fruit pop'],
      [/\bsnowballs\b/g, 'coconuts'], [/\bsnowball\b/g, 'coconut'], [/\bSnowflake counts\b/g, 'Seashell counts'], [/\bIcicle\b/g, 'Seashell'], [/\bicicles\b/g, 'seashells'], [/\bicicle\b/g, 'seashell'],
      [/\bice sleds\b/g, 'canoes'], [/\bice sled\b/g, 'canoe'], [/\bsleds\b/g, 'canoes'], [/\bsled\b/g, 'canoe'],
      [/\bice rafts\b/g, 'rafts'], [/\bice raft\b/g, 'raft'],
      [/\bAn ice block\b/g, 'A stone block'], [/\ban ice block\b/g, 'a stone block'], [/\bice block\b/g, 'stone block'],
      [/\bA cube of ice\b/g, 'A cube of stone'], [/\bice wall\b/g, 'stone wall'], [/\bice rectangle\b/g, 'stone tile'],
      [/\bice floor\b/g, 'temple floor'], [/\bice bar\b/g, 'coconut bar'], [/\bsnow pie\b/g, 'mango pie'],
      [/\bcrystal lock\b/g, 'coral lock'], [/\bcrystal beads\b/g, 'sea glass beads'], [/\bigloo\b/g, 'hut'],
      [/\bred scarves\b/g, 'red shells'], [/\bblue scarves\b/g, 'blue shells'], [/\bscarves\b/g, 'sun hats'], [/\bscarf\b/g, 'sun hat'],
      [/\bmittens\b/g, 'flip-flops'], [/\bmitten\b/g, 'flip-flop'],
      [/\bslides\b/g, 'surfs'], [/\bslide each\b/g, 'surf each'],
      [/\bcrystal bars\b/g, 'coconut bars'], [/\bcrystal juice\b/g, 'coconut juice'], [/\bCrystal juice\b/g, 'Coconut juice'],
      [/\bbar is glowing\b/g, 'bar is shaded'], [/\bpie is glowing\b/g, 'pie is shaded'],
      [/\bglow potions\b/g, 'reef smoothies'], [/\bglow potion\b/g, 'reef smoothie'], [/\bpotions\b/g, 'smoothies'], [/\bpotion\b/g, 'smoothie'],
    ],
  },
};

THEMES.book3 = {
  friends: ['Vela', 'Zephyr', 'Comet', 'Skye', 'Rocco', 'Nimbus'],
  swaps: [
    [/\bMama Mittens\b/g, 'Nimbus'], [/\bMittens\b/g, 'Nimbus'], [/\bPebble\b/g, 'Rocco'], [/\bFern\b/g, 'Vela'],
    [/\bLulu\b/g, 'Zephyr'], [/\bSunny\b/g, 'Comet'], [/\bSkipper\b/g, 'Skye'], [/\bMo\b/g, 'Wren'],
    [/\bcocoas\b/g, 'cloud candies'], [/\bcocoa\b/g, 'cloud candy'],
    [/\bsnow cones\b/g, 'star cookies'], [/\bsnow cone\b/g, 'star cookie'], [/\bice pops\b/g, 'berry pops'], [/\bice pop\b/g, 'berry pop'],
    [/\bsnowballs\b/g, 'feathers'], [/\bsnowball\b/g, 'feather'], [/\bSnowflake counts\b/g, 'Feather counts'], [/\bIcicle\b/g, 'Feather'], [/\bicicles\b/g, 'feathers'], [/\bicicle\b/g, 'feather'],
    [/\bice sleds\b/g, 'gliders'], [/\bice sled\b/g, 'glider'], [/\bsleds\b/g, 'gliders'], [/\bsled\b/g, 'glider'],
    [/\bice rafts\b/g, 'balloons'], [/\bice raft\b/g, 'balloon'],
    [/\bAn ice block\b/g, 'A glass block'], [/\ban ice block\b/g, 'a glass block'], [/\bice block\b/g, 'glass block'],
    [/\bA cube of ice\b/g, 'A cube of glass'], [/\bice wall\b/g, 'glass wall'], [/\bice rectangle\b/g, 'glass tile'],
    [/\bice floor\b/g, 'workshop floor'], [/\bice bar\b/g, 'honey bar'], [/\bsnow pie\b/g, 'berry pie'],
    [/\bcrystal lock\b/g, 'star lock'], [/\bcrystal beads\b/g, 'glass beads'], [/\bigloo\b/g, 'cottage'],
    [/\bred scarves\b/g, 'red kites'], [/\bblue scarves\b/g, 'blue kites'], [/\bscarves\b/g, 'kites'], [/\bscarf\b/g, 'kite'],
    [/\bmittens\b/g, 'goggles'], [/\bmitten\b/g, 'pair of goggles'],
    [/\bslides\b/g, 'glides'], [/\bslide each\b/g, 'glide each'],
    [/\bcrystal bars\b/g, 'honey bars'], [/\bcrystal juice\b/g, 'berry juice'], [/\bCrystal juice\b/g, 'Berry juice'],
    [/\bbar is glowing\b/g, 'bar is shaded'], [/\bpie is glowing\b/g, 'pie is shaded'],
    [/\bglow potions\b/g, 'sky lanterns'], [/\bglow potion\b/g, 'sky lantern'], [/\bpotions\b/g, 'lanterns'], [/\bpotion\b/g, 'lantern'],
  ],
};

let current = THEMES.book1;

export function setTheme(id) { current = THEMES[id] ?? THEMES.book1; }

export const friend = (rng) => rng.pick(current.friends);
export const friendList = () => [...current.friends];

export function flavor(s) {
  if (typeof s !== 'string' || !current.swaps.length) return s;
  for (const [re, to] of current.swaps) s = s.replace(re, to);
  return s;
}

// The words inside a picture (a title, table rows, tape labels, axis names) change with the book too. Kinds,
// icons and colours name parts of the drawing, not things in the story, so they stay as they are.
const DRAWING_KEYS = new Set(['kind', 'icon', 'color', 'colors', 'cls', 'shape']);
export function flavorVisual(v) {
  if (!current.swaps.length) return v;
  if (typeof v === 'string') return flavor(v);
  if (Array.isArray(v)) return v.map(flavorVisual);
  if (v && Object.getPrototypeOf(v) === Object.prototype) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, DRAWING_KEYS.has(k) ? x : flavorVisual(x)]));
  }
  return v;
}
