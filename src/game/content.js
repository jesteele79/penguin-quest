// Characters, wardrobe items and other game content. The cast and place names belong to the book being
// played; the wardrobe is shared, so anything earned in one book can be worn in the others.
import { byBook } from '../books/active.js';
import { NPCS as GLACIER_CAST, REGION_INFO as GLACIER_PLACES } from '../books/book1/cast.js';
import { NPCS as EMBER_CAST, REGION_INFO as EMBER_PLACES } from '../books/book2/cast.js';
import { NPCS as SKY_CAST, REGION_INFO as SKY_PLACES } from '../books/book3/cast.js';

export const NPCS = byBook({ book1: GLACIER_CAST, book2: EMBER_CAST, book3: SKY_CAST });
export const REGION_INFO = byBook({ book1: GLACIER_PLACES, book2: EMBER_PLACES, book3: SKY_PLACES });
// Everyone in the series, for portraits that outlive their book (a lesson mentor, a replayed lesson).
export const CAST = { ...GLACIER_CAST, ...EMBER_CAST, ...SKY_CAST };

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
    { id: 'chick', name: 'Chick Buddy', price: null, how: 'Bring all 8 lost chicks home', book: 'book1' },
    { id: 'glimmer', name: 'Glimmer Buddy', price: null, how: 'Finish the Glimmer Friends quest', book: 'book1' },
    { id: 'hatchling', name: 'Hatchling Buddy', price: null, how: 'Bring all 8 turtle hatchlings home', book: 'book2' },
    { id: 'sparkle', name: 'Sparkle Buddy', price: null, how: "Finish Keeper Lumi's Sparkle Friends quest", book: 'book2' },
    { id: 'puffling', name: 'Puffling Buddy', price: null, how: 'Bring all 8 pufflings home to Wren', book: 'book3' },
    { id: 'cloudlet', name: 'Cloudlet Buddy', price: null, how: "Finish Astra's Little Clouds quest", book: 'book3' },
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
    { id: 'star', name: 'Star Chart', color: 0xffffff, tex: 'star', css: 'radial-gradient(circle at 30% 40%,#ffe68a 0 2px,transparent 3px),radial-gradient(circle at 70% 60%,#fff 0 2px,transparent 3px),#1b2360', price: null, how: 'Finish star charts on 3 days', book: 'book1' },
    { id: 'heart', name: 'Heart Knit', color: 0xffffff, tex: 'heart', css: 'repeating-linear-gradient(90deg,#e8434b 0 10px,#fff4ec 10px 14px)', price: null, how: "Help Granny Purl's knitting", book: 'book1' },
    { id: 'frost', name: 'Frost Flakes', color: 0xffffff, tex: 'frost', css: 'repeating-linear-gradient(90deg,#bfe6ff 0 10px,#ffffff 10px 12px)', price: 300 },
    { id: 'aurora', name: 'Aurora Silk', color: 0xffffff, tex: 'aurora', css: 'linear-gradient(90deg,#4dffa0,#38f0d2,#55b4ff,#b483ff,#ff72c8)', price: 500 },
    { id: 'galaxy', name: 'Galaxy', color: 0xffffff, tex: 'galaxy', css: 'linear-gradient(90deg,#2a1a6a,#6a3ad8,#1a2a8a),#2a1a6a', stars: 8 },
    { id: 'lagoon', name: 'Lagoon Teal', color: 0x2ec4b6, css: '#2ec4b6', price: 40, book: 'book2' },
    { id: 'mango', name: 'Mango', color: 0xff9f1c, css: '#ff9f1c', price: 40, book: 'book2' },
    { id: 'wave', name: 'Wave', color: 0xffffff, tex: 'wave', css: 'repeating-linear-gradient(90deg,#2e86c8 0 9px,#7fe0d0 9px 14px,#ffffff 14px 16px)', price: null, how: 'Finish tide charts on 3 days', book: 'book2' },
    { id: 'twilight', name: 'Twilight', color: 0xffffff, tex: 'twilight', css: 'linear-gradient(90deg,#2a2f7a,#7a6ad8,#ffa98c)', price: 120, book: 'book3' },
    { id: 'constellation', name: 'Constellation', color: 0xffffff, tex: 'constellation', css: 'radial-gradient(circle at 25% 40%,#ffe68a 0 2px,transparent 3px),radial-gradient(circle at 60% 65%,#ffe68a 0 2px,transparent 3px),radial-gradient(circle at 80% 30%,#fff 0 2px,transparent 3px),#2a2f7a', price: null, how: 'Finish sky charts on 3 days', book: 'book3' },
    { id: 'stardust', name: 'Stardust', color: 0xffffff, tex: 'stardust', css: 'linear-gradient(90deg,#c8b8ff,#9fd8ff,#ffb8e8)', price: null, how: "Find Tock's 4 treasures", book: 'book3' },
    { id: 'compass', name: 'Compass Rose', color: 0xffffff, tex: 'compass', css: 'radial-gradient(circle,#c8483a 0 3px,transparent 4px) 0 0/16px 16px,#f3e3c0', price: null, how: "Find Tortuga's 4 treasures", book: 'book2' },
  ],
  hat: [
    { id: null, name: 'No hat', price: 0 },
    { id: 'beanie', name: 'Pom Beanie', price: 50, color: 0x3aa0ff },
    { id: 'earmuffs', name: 'Earmuffs', price: 60 },
    { id: 'headphones', name: 'Headphones', price: 90 },
    { id: 'tophat', name: 'Top Hat', price: 100 },
    { id: 'wizard', name: 'Wizard Hat', price: 150 },
    { id: 'viking', name: 'Viking Helmet', price: 150 },
    { id: 'pirate', name: 'Pirate Hat', price: null, how: "Dig up the Captain's 4 treasures", book: 'book1' },
    { id: 'party', name: 'Party Hat', price: null, how: 'Bring 10 snowflakes to Mo', book: 'book1' },
    { id: 'crown', name: 'Aurora Crown', price: null, how: 'Finish Chapter 6', book: 'book1' },
    { id: 'hibiscus', name: 'Hibiscus', price: 60, book: 'book2' },
    { id: 'souwester', name: "Sou'wester", price: 90, book: 'book2' },
    { id: 'chef', name: "Chef's Hat", price: 120, book: 'book2' },
    { id: 'crest', name: 'Rockhopper Crest', price: 150, book: 'book2' },
    { id: 'sunhat', name: 'Sun Hat', price: null, how: 'Bring 10 sea glass to Nori', book: 'book2' },
    { id: 'goggles', name: 'Inventor Goggles', price: null, how: 'Finish Chapter 6', book: 'book2' },
    { id: 'aviator', name: 'Aviator Cap', price: 110, book: 'book3' },
    { id: 'propeller', name: 'Propeller Cap', price: null, how: 'Bring 10 sky feathers to Zephyr', book: 'book3' },
    { id: 'starhood', name: 'Star Hood', price: null, how: 'Finish Chapter 6', book: 'book3' },
  ],
  trail: [
    { id: 'snow', name: 'Snow Spray', colors: [0xffffff, 0xdfeaff], price: 0 },
    { id: 'sparkle', name: 'Gold Sparkles', colors: [0xffd166, 0xfff3c0], price: 80 },
    { id: 'hearts', name: 'Pink Hearts', colors: [0xff72c8, 0xff4d6d], price: 100 },
    { id: 'stars', name: 'Starlight', colors: [0xfff3a0, 0x9fe8ff], price: null, how: 'Bring 20 snowflakes to Mo', book: 'book1' },
    { id: 'rainbow', name: 'Rainbow Slide', colors: [0xff5a5a, 0xffa53d, 0xffe14d, 0x5ee37a, 0x4db8ff, 0x9a6bff], price: 200 },
    { id: 'ember', name: 'Ember Sparks', colors: [0xff9a3c, 0xffd166, 0xff5a4e], price: 300 },
    { id: 'aurora', name: 'Aurora Ribbon', colors: [0x4dffa0, 0x38f0d2, 0xb483ff, 0xff72c8], price: 450 },
    { id: 'comet', name: 'Comet Tail', colors: [0xffd166, 0xff9a3c, 0xffffff], stars: 6 },
    { id: 'spray', name: 'Sea Spray', colors: [0x7fe0d0, 0xffffff, 0x4fb3ff], price: null, how: 'Bring 20 sea glass to Nori', book: 'book2' },
    { id: 'feathers', name: 'Golden Feathers', colors: [0xffd166, 0xfff4c8, 0xffb000], price: null, how: 'Bring 20 sky feathers to Zephyr', book: 'book3' },
  ],
};

// Gear from a book shows up in the Wardrobe once that book has been played (or the item is owned). Everyday gear
// comes first, then this book's, then other books'.
export const inWardrobe = (data, slot, it) => !it.book || it.book === (data.active ?? 'book1') || !!data.books?.[it.book] || data.owned.includes(`${slot}:${it.id}`);

export const SLOT_NAMES = { scarf: 'Scarves', hat: 'Hats', trail: 'Slide trails', sled: 'Sleds', buddy: 'Buddies' };

export const findItem = (slot, id) => SHOP[slot].find((i) => i.id === id);


export const REGION_ORDER = ['lake', 'grove', 'huts', 'cave', 'ridge'];
