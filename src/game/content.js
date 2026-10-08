// Characters, wardrobe items and other game content. The cast and place names belong to the book being
// played; the wardrobe is shared, so anything earned in one book can be worn in the others.
import { isBook2 } from '../books/active.js';
import { NPCS as GLACIER_CAST, REGION_INFO as GLACIER_PLACES } from '../books/book1/cast.js';
import { NPCS as EMBER_CAST, REGION_INFO as EMBER_PLACES } from '../books/book2/cast.js';

export const NPCS = isBook2 ? EMBER_CAST : GLACIER_CAST;
export const REGION_INFO = isBook2 ? EMBER_PLACES : GLACIER_PLACES;
// Everyone in the series, for portraits that outlive their book (a lesson mentor, a replayed lesson).
export const CAST = { ...GLACIER_CAST, ...EMBER_CAST };

// Wardrobe. price = fish coins; stars = Aurora Stars from the daily patrol; price null = earned.
export const SHOP = {
  sled: [
    { id: null, name: 'Belly (no sled)', price: 0 },
    { id: 'wood', name: 'Wooden Sled', price: 80, color: 0x9a6a44 },
    { id: 'ice', name: 'Ice Sled', price: 140, color: 0x9fe8ff },
    { id: 'royal', name: 'Royal Sled', price: 400, color: 0x8a5cff },
    { id: 'golden', name: 'Golden Sled', price: 700, color: 0xffcc3d },
    { id: 'comet', name: 'Comet Sled', stars: 12, color: 0xffd166 },
  ],
  buddy: [
    { id: null, name: 'No buddy', price: 0 },
    { id: 'chick', name: 'Chick Buddy', price: null, how: 'Bring all 8 lost chicks home' },
    { id: 'glimmer', name: 'Glimmer Buddy', price: null, how: 'Finish the Glimmer Friends quest' },
  ],
  scarf: [
    { id: 'coral', name: 'Coral Red', color: 0xff5a4e, css: '#ff5a4e', price: 0 },
    { id: 'ocean', name: 'Ocean Blue', color: 0x2f8cff, css: '#2f8cff', price: 40 },
    { id: 'mint', name: 'Minty Green', color: 0x39d98a, css: '#39d98a', price: 40 },
    { id: 'sunny', name: 'Sunny Yellow', color: 0xffd23d, css: '#ffd23d', price: 40 },
    { id: 'royal', name: 'Royal Purple', color: 0x8a5cff, css: '#8a5cff', price: 60 },
    { id: 'midnight', name: 'Midnight', color: 0x2a2f6a, css: '#2a2f6a', price: 60 },
    { id: 'candy', name: 'Candy Stripe', color: 0xffffff, tex: 'candy', css: 'repeating-linear-gradient(90deg,#ff4d6d 0 8px,#fff 8px 16px)', price: 120 },
    { id: 'rainbow', name: 'Rainbow', color: 0xffffff, tex: 'rainbow', css: 'linear-gradient(90deg,#ff5a5a,#ffa53d,#ffe14d,#5ee37a,#4db8ff,#9a6bff)', price: 250 },
    { id: 'star', name: 'Star Chart', color: 0xffffff, tex: 'star', css: 'radial-gradient(circle at 30% 40%,#ffe68a 0 2px,transparent 3px),radial-gradient(circle at 70% 60%,#fff 0 2px,transparent 3px),#1b2360', price: null, how: 'Finish star charts on 3 days' },
    { id: 'heart', name: 'Heart Knit', color: 0xffffff, tex: 'heart', css: 'repeating-linear-gradient(90deg,#e8434b 0 10px,#fff4ec 10px 14px)', price: null, how: "Help Granny Purl's knitting" },
    { id: 'frost', name: 'Frost Flakes', color: 0xffffff, tex: 'frost', css: 'repeating-linear-gradient(90deg,#bfe6ff 0 10px,#ffffff 10px 12px)', price: 300 },
    { id: 'aurora', name: 'Aurora Silk', color: 0xffffff, tex: 'aurora', css: 'linear-gradient(90deg,#4dffa0,#38f0d2,#55b4ff,#b483ff,#ff72c8)', price: 500 },
    { id: 'galaxy', name: 'Galaxy', color: 0xffffff, tex: 'galaxy', css: 'linear-gradient(90deg,#2a1a6a,#6a3ad8,#1a2a8a),#2a1a6a', stars: 8 },
  ],
  hat: [
    { id: null, name: 'No hat', price: 0 },
    { id: 'beanie', name: 'Pom Beanie', price: 50, color: 0x3aa0ff },
    { id: 'earmuffs', name: 'Earmuffs', price: 60 },
    { id: 'headphones', name: 'Headphones', price: 90 },
    { id: 'tophat', name: 'Top Hat', price: 100 },
    { id: 'wizard', name: 'Wizard Hat', price: 150 },
    { id: 'viking', name: 'Viking Helmet', price: 150 },
    { id: 'pirate', name: 'Pirate Hat', price: null, how: "Dig up the Captain's 4 treasures" },
    { id: 'party', name: 'Party Hat', price: null, how: 'Bring 10 snowflakes to Mo' },
    { id: 'crown', name: 'Aurora Crown', price: null, how: 'Finish Chapter 6' },
  ],
  trail: [
    { id: 'snow', name: 'Snow Spray', colors: [0xffffff, 0xdfeaff], price: 0 },
    { id: 'sparkle', name: 'Gold Sparkles', colors: [0xffd166, 0xfff3c0], price: 80 },
    { id: 'hearts', name: 'Pink Hearts', colors: [0xff72c8, 0xff4d6d], price: 100 },
    { id: 'stars', name: 'Starlight', colors: [0xfff3a0, 0x9fe8ff], price: null, how: 'Bring 20 snowflakes to Mo' },
    { id: 'rainbow', name: 'Rainbow Slide', colors: [0xff5a5a, 0xffa53d, 0xffe14d, 0x5ee37a, 0x4db8ff, 0x9a6bff], price: 200 },
    { id: 'ember', name: 'Ember Sparks', colors: [0xff9a3c, 0xffd166, 0xff5a4e], price: 300 },
    { id: 'aurora', name: 'Aurora Ribbon', colors: [0x4dffa0, 0x38f0d2, 0xb483ff, 0xff72c8], price: 450 },
    { id: 'comet', name: 'Comet Tail', colors: [0xffd166, 0xff9a3c, 0xffffff], stars: 6 },
  ],
};

export const SLOT_NAMES = { scarf: 'Scarves', hat: 'Hats', trail: 'Slide trails', sled: 'Sleds', buddy: 'Buddies' };

export const findItem = (slot, id) => SHOP[slot].find((i) => i.id === id);


export const REGION_ORDER = ['lake', 'grove', 'huts', 'cave', 'ridge'];
