// Book 2, The Ember Isles: every chapter, side quest and line of dialogue. Same format as Book 1's story:
// lines are [speakerId, text]; speaker '' is narration; {name} becomes the player's name.
import { CRYSTALS, LOC, FESTIVAL, VALVES, CORALS, CRATES, LAMPS, TIDE_POOLS } from './layout.js';

export const RESONANCE_NEED = 24;
export const CRYSTAL_GOAL = 8;

export const SITE_SETS = {
  valves: { kind: 'valve', points: VALVES, label: 'Close the siphon valve', title: 'Siphon Valve', domain: 'lake', count: 2 },
  corals: { kind: 'coral', points: CORALS, label: 'Help the coral bloom', title: 'Coral Bed', domain: 'grove', count: 2, radius: 4.8 },
  crates: { kind: 'crate', points: CRATES, label: 'Weigh the cargo', title: 'Cargo Scales', domain: 'huts', skills: ['dec_compare3', 'dec_place', 'place_ten', 'dec_round', 'dec_compare', 'pow10'], count: 2 },
  deliveries: {
    kind: 'npc', npcs: ['professor', 'isa', 'rocco', 'tortuga'], label: 'Deliver mango juice', title: 'Juice Delivery', story: 'cocoa',
    domain: 'huts', skills: ['money', 'dec_addsub'], count: 1,
    greet: {
      professor: "Mango juice from Chef Marlo? On a hot day like this? Splendid! Let me find my coins...",
      isa: 'Oh, how kind! The reef work makes me so thirsty.',
      rocco: 'Juice? For ME? I mean... yeah, I guess I could drink some. How much?',
      tortuga: 'Ahh. Sweet as a warm current. Let an old turtle count out her coins, little one.',
    },
  },
  tides: { kind: 'pool', points: TIDE_POOLS, label: 'Measure the tide pool', title: 'Tide Pool', domain: 'cave', skills: ['volume', 'volume_composite', 'convert5', 'convert', 'area_rect', 'area_missing'], count: 2 },
  lamps: { kind: 'lamp', points: LAMPS, label: 'Light the signal lamp', title: 'Signal Lamp', domain: 'ridge', count: 2 },
  legends: {
    kind: 'lantern', label: 'Begin the Legend Trial', title: 'Legend Trial', count: 6, hard: true,
    points: ['lake', 'grove', 'huts', 'cave', 'ridge'].map((r) => [CRYSTALS[r].x + 4.5, CRYSTALS[r].z + 4.5]),
    domains: ['lake', 'grove', 'huts', 'cave', 'ridge'],
  },
  invites: {
    kind: 'npc', quiz: false, npcs: ['professor', 'isa', 'rocco', 'marlo', 'shelldon', 'tortuga', 'lumi', 'cinder'], label: 'Invite to the festival', title: 'Invitation',
    greet: {
      professor: 'The Festival of Currents! I shall measure how fast the lantern boats drift. For science, and for fun!',
      isa: "I'll weave flower crowns for everyone. Even you, Rocco.",
      rocco: 'A festival? Will there be a hopping contest? ...There will be now. I am entering it. I will win it.',
      marlo: 'Leave the food to me! Mango tarts, coconut rolls, and my famous five-fish soup.',
      shelldon: 'A party means customers! I mean... friends. Friends who might want shells. Count me in!',
      tortuga: 'I have seen a hundred festivals, little one. I would very much like to see one more.',
      lumi: 'I will keep the lighthouse burning all night so every boat finds its way.',
      cinder: "Me? You want me there? After everything? ...Thank you. I'll bring the airship. Everyone can have a ride.",
    },
  },
};

export const MAIN = [
  {
    id: 'ch0', type: 'main', chapter: 0, region: 'home', title: 'Prologue: Arrival Beach',
    blurb: 'The sea back home turned cold. The warm current leads here.',
    steps: [
      {
        type: 'talk', npc: 'professor', text: 'Talk to Professor Waddlesworth at the camp',
        lines: [
          ['professor', '{name}! You made it! Welcome to the Ember Isles.'],
          ['professor', 'Do you feel how warm it is? A warm sea current flows from these islands all the way to Glacier Bay.'],
          ['professor', 'But it is cooling. Deep in the volcano sits the Heart-Ember, and five Ember Vents feed it heat. Someone has bolted strange brass valves onto all five!'],
          ['professor', 'If the Heart goes cold, the current stops, and these islands will slowly drift apart.'],
          ['professor', 'First, stretch those flippers. The beach around camp is sprinkled with sea glass. Can you find three pieces?'],
          ['professor', 'Walk with W or the up arrow, turn with A and D. Space jumps, and Shift is for belly-sliding. Sand is very slidey!'],
        ],
        onDone: 'showControls',
      },
      { type: 'count', counter: 'tutorialFlakes', need: 3, absolute: true, text: (n) => `Find sea glass on the beach near camp (${n}/3)`, target: 'nextTutorialFlake' },
      {
        type: 'talk', npc: 'professor', text: 'Show the Professor your sea glass',
        lines: [
          ['professor', 'Beautiful! Sea glass is old glass the waves have smoothed for years and years.'],
          ['professor', 'Now, a few warm-up puzzles. Some will feel familiar, and some will be brand new. New ideas come with a lesson first.'],
        ],
      },
      {
        type: 'game', game: 'warmup', auto: true, at: 'professor', label: 'Warm-up puzzles', text: 'Finish the warm-up puzzles with the Professor',
        after: [
          ['professor', 'Wonderful! Here is your Island Journal. Press J any time to see your quests.'],
          ['professor', 'The nearest vent is at the Lava Forge, up the jungle path to the north. A rockhopper named Rocco works there.'],
          ['professor', 'Follow the golden sparkle trail. I will call you on the radio if I learn anything new!'],
        ],
      },
    ],
    reward: { coins: 20 },
  },
  {
    id: 'ch1', type: 'main', chapter: 1, region: 'lake', title: 'Chapter 1: The Lava Forge',
    blurb: 'Rocco\'s glass forge has gone cold. Find out why.',
    steps: [
      {
        type: 'talk', npc: 'rocco', text: 'Meet Rocco at the Lava Forge',
        lines: [
          ['rocco', 'Whoa, a snow penguin! Did you get lost? Hah! Just kidding. I am Rocco. Best hopper on the islands.'],
          ['rocco', 'My forge runs on volcano heat, but it went cold three days ago. Somebody bolted brass valves onto the pipes and they are sucking the steam away!'],
          ['rocco', 'Each valve has a number lock. Multiply and divide, and they spin shut. Close two of them for me?'],
          ['rocco', "I'd do it myself, but... my flippers are tired. From hopping. Lots of hopping."],
        ],
      },
      {
        type: 'sites', set: 'valves', text: (d, t) => `Close the siphon valves around the forge (${d}/${t})`, shard: true,
        after: [
          ['rocco', 'The steam is coming back! Okay, okay, you are pretty good.'],
          ['rocco', 'Look what was stuck in the last valve: a brass gear stamped with a letter C. And a tiny drawing of a balloon. Weird.'],
          ['rocco', 'Now the lava stream is warm again, but the vent is on the far side. Only the stones with the right answers are cool enough to stand on. Race you! ...I mean, you go first.'],
        ],
      },
      {
        type: 'game', game: 'lavahop', at: 'lavaStart', label: 'Start the Lava Hop', text: 'Hop across the lava stream on the cool stones', shard: true,
        after: [
          ['rocco', 'You did not even singe a feather! Fine. You are a real hopper.'],
          ['rocco', 'One last thing before we wake the vent: I have a pile of glass orders. Everybody wants bowls and floats, and I need help with the numbers.'],
        ],
      },
      {
        type: 'game', game: 'forge', at: 'forgeFire', label: 'Fill the glass orders', text: "Fill Rocco's glass orders at the forge", shard: true,
        after: [['rocco', 'Every order done! The forge vent is ready. Charge it up with multiplying and dividing puzzles!']],
      },
      { type: 'crystal', region: 'lake' },
    ],
    outro: [
      ['rocco', 'My forge is roaring again! Hey, snow penguin... thanks. Come back and hop with me sometime.'],
      ['professor', 'I can feel the sea warming already, {name}! One vent down, four to go.'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch2', type: 'main', chapter: 2, region: 'grove', title: 'Chapter 2: The Coral Lagoon',
    blurb: 'Help Isa bring color back to the reef.',
    briefing: [
      ['professor', '{name}, good morning! I took the water temperature in the Coral Lagoon, on the west shore. It is far too cold.'],
      ['professor', 'Isa looks after the reef there. She is a Galapagos penguin, the only kind of penguin that lives north of the equator!'],
    ],
    briefingNow: [
      ['professor', '{name}, can you hear me? The water in the Coral Lagoon, on the west shore, is still far too cold.'],
      ['professor', 'Isa looks after the reef there. She is a Galapagos penguin, the only kind of penguin that lives north of the equator!'],
    ],
    steps: [
      {
        type: 'talk', npc: 'isa', text: 'Meet Isa at the Coral Lagoon',
        lines: [
          ['isa', "Oh, hello. I'm Isa. I look after the coral here."],
          ['isa', 'When the water got cold, the coral lost its colors. It is not gone, just very, very tired.'],
          ['isa', 'Each coral bed needs exactly the right share of warm water and sunlight. Fractions, really. Could you swim out to them? Hold Shift to swim faster.'],
        ],
      },
      {
        type: 'sites', set: 'corals', text: (d, t) => `Help the coral beds bloom (${d}/${t})`, shard: true,
        after: [
          ['isa', 'Pink! And orange! The reef is waking up. Thank you.'],
          ['isa', 'Something strange: last night a big round shadow floated over the lagoon. Like a balloon. And it was humming.'],
          ['isa', 'There is a snorkel trail of gates through the reef. Swim through the right ones and the fish will follow you to the vent. Ready?'],
        ],
      },
      {
        type: 'game', game: 'snorkel', at: 'snorkelStart', label: 'Start the snorkel trail', text: 'Swim the snorkel trail through the reef', shard: true,
        after: [
          ['isa', 'The fish love you! They follow anyone who swims as gracefully as a penguin.'],
          ['isa', "Chef Marlo needs help with a reef-safe kelp recipe. If we scale it right, there will be enough to feed the whole lagoon. She's waiting at my station."],
        ],
      },
      {
        type: 'game', game: 'recipe', at: 'station', label: 'Scale the kelp recipe', text: 'Scale the kelp recipe with Chef Marlo', shard: true,
        after: [['isa', 'Enough kelp for every fish in the lagoon! The vent is on the reef ring. Charge it with fraction puzzles.']],
      },
      { type: 'crystal', region: 'grove' },
    ],
    outro: [
      ['isa', 'Look at the lagoon glow. You are welcome here any time, {name}.'],
      ['professor', 'Two vents! The current is noticeably warmer, {name}. Rest well tonight.'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch3', type: 'main', chapter: 3, region: 'huts', title: 'Chapter 3: Harbor Market',
    blurb: 'Chef Marlo and Shelldon need a sharp eye for decimals.',
    briefing: [
      ['professor', 'Good morning, {name}! The harbor on the east coast is in a muddle. The scales went wonky when the vent cooled.'],
      ['professor', 'Chef Marlo runs the food stall there, and a hermit crab named Shelldon trades shells. Both could use your help.'],
    ],
    briefingNow: [
      ['professor', 'Still going, {name}? Splendid! The harbor on the east coast is in a muddle. The scales went wonky when the vent cooled.'],
      ['professor', 'Chef Marlo runs the food stall there, and a hermit crab named Shelldon trades shells. Both could use your help.'],
    ],
    steps: [
      {
        type: 'talk', npc: 'marlo', text: 'Meet Chef Marlo at the Harbor Market',
        lines: [
          ["marlo", "There you are, sweet pea! Chef Marlo, best food on the seven seas."],
          ['marlo', 'My helper went fishing and never came back, and now look at this line! Everybody wants lunch.'],
          ['marlo', 'Run my counter for a bit? Serve five customers and count their change to the penny.'],
        ],
      },
      {
        type: 'game', game: 'market', params: { count: 5 }, at: 'counter', label: 'Run the food stall', text: "Serve 5 customers at Chef Marlo's stall", shard: true,
        after: [
          ['marlo', 'Not a penny out of place! You have a chef\'s brain, sweet pea.'],
          ['marlo', 'Shelldon next door is in a pickle with his cargo scales. And after that, I have mango juice to deliver around the island!'],
        ],
      },
      {
        type: 'talk', npc: 'shelldon', text: 'Talk to Shelldon at his shell stall',
        lines: [
          ['shelldon', 'Customer! No? Helper! Even better! Shelldon, trader of fine shells. Deal? Deal!'],
          ['shelldon', 'My cargo crates have to be weighed to the thousandth of a kilogram. Thousandths! Three places past the point! My poor eyes.'],
          ['shelldon', 'And between you and me, I traded a whole crate of brass pipes last week to a kid with goggles. Paid in sunflower seeds. Good seeds, though.'],
        ],
      },
      {
        type: 'sites', set: 'crates', text: (d, t) => `Weigh Shelldon's cargo crates (${d}/${t})`, shard: true,
        after: [
          ['shelldon', 'Every crate weighed! You have the sharpest eyes on the harbor. Here, take a shell. No charge. Okay, small charge. Kidding! Free!'],
          ['marlo', 'Now, those juice deliveries! The Professor, Isa, Rocco and Tortuga. They pay when you hand it over, so count the change carefully!'],
        ],
      },
      {
        type: 'sites', set: 'deliveries', text: (d, t) => `Deliver mango juice around the island (${d}/${t})`, shard: true,
        after: [['marlo', 'Everyone is happy and hydrated! The harbor vent is waiting by the docks. Charge it up with decimal puzzles.']],
      },
      { type: 'crystal', region: 'huts' },
    ],
    outro: [
      ['marlo', 'The harbor is humming again! And sweet pea, my wardrobe trunk is open to you. Talk to me any time to shop.'],
      ['professor', 'Three vents, {name}! I have been reading about brass gears and balloons. Something tells me we will meet our valve-builder soon.'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch4', type: 'main', chapter: 4, region: 'cave', title: 'Chapter 4: The Sunken Temple',
    blurb: 'Old Tortuga knows the way to the temple vent.',
    briefing: [
      ['professor', 'Good morning, {name}! The vent at the Sunken Temple, off the south-west beach, has gone very quiet.'],
      ['professor', 'An old sea turtle named Tortuga watches over it. She has been sailing these seas for over a hundred years!'],
    ],
    briefingNow: [
      ['professor', 'On to the next one, {name}! The vent at the Sunken Temple, off the south-west beach, has gone very quiet.'],
      ['professor', 'An old sea turtle named Tortuga watches over it. She has been sailing these seas for over a hundred years!'],
    ],
    steps: [
      {
        type: 'talk', npc: 'tortuga', text: 'Find Tortuga by the sandbar',
        lines: [
          ['tortuga', 'Ahh. A young one, come across the cold water. I am Tortuga.'],
          ['tortuga', 'Turtles find their way across the whole ocean with two numbers: how far one way, and how far the other. You will need that skill soon.'],
          ['tortuga', 'The temple steps crumbled when the sea cooled. We must rebuild them, block by block. Come to the build stones beside the temple.'],
        ],
      },
      {
        type: 'game', game: 'architect', params: { count: 5 }, at: 'pad', label: 'Rebuild the temple', text: 'Rebuild the temple with Tortuga', shard: true,
        after: [
          ['tortuga', 'Strong steps. Strong as a turtle shell.'],
          ['tortuga', 'The tide pools on the beach hold old temple water. Measure them for me, little one, and we will know if the sea is ready.'],
        ],
      },
      {
        type: 'sites', set: 'tides', text: (d, t) => `Measure the tide pools on the beach (${d}/${t})`, shard: true,
        after: [
          ['tortuga', 'The water is ready. Now, read my old sea chart. Three of the temple\'s stone keys lie on the sea floor. Find them by their two numbers.'],
        ],
      },
      {
        type: 'game', game: 'dive', at: 'templeSteps', label: 'Read the sea chart', text: "Dive for the temple keys on Tortuga's chart", shard: true,
        after: [
          ['tortuga', 'All three keys. Look at the carving they reveal...'],
          ['tortuga', 'An island floating in the sky, with a little workshop on it. I have seen that island once, long ago. It drifted away in a great storm.'],
          ['tortuga', 'The vent sleeps on top of the temple. Wake it with puzzles of shapes and measures.'],
        ],
      },
      { type: 'crystal', region: 'cave' },
    ],
    outro: [
      ['tortuga', 'The sea remembers kindness, little one.'],
      ['professor', 'Four vents! An island in the sky? I have heard that story too, {name}, from my old Star Guild days. Get some rest.'],
    ],
    reward: { coins: 60 },
  },
  {
    id: 'ch5', type: 'main', chapter: 5, region: 'ridge', title: 'Chapter 5: Lighthouse Cliffs',
    blurb: 'Keeper Lumi\'s lighthouse has gone dark under the soot.',
    briefing: [
      ['professor', 'Good morning, {name}. The lighthouse on the north-east cliffs went dark last night. The boats are in danger!'],
      ['professor', 'Keeper Lumi lives up there. She is a little blue penguin, the smallest kind of penguin there is, and the bravest one I know.'],
    ],
    briefingNow: [
      ['professor', '{name}! The lighthouse on the north-east cliffs just went dark. The boats are in danger!'],
      ['professor', 'Keeper Lumi lives up there. She is a little blue penguin, the smallest kind of penguin there is, and the bravest one I know.'],
    ],
    steps: [
      {
        type: 'talk', npc: 'lumi', text: 'Meet Keeper Lumi on the cliffs',
        lines: [
          ['lumi', 'You came! I am Lumi. I keep the light.'],
          ['lumi', 'Soot is pouring out of the brass pipes near the vent, and it has turned into little grumpy puffs. Sootlings. They smother every flame they find.'],
          ['lumi', 'First, the signal lamps. Each one blinks a code, and the codes are written as expressions. Light them and the boats will know to stay away from the rocks.'],
        ],
      },
      {
        type: 'sites', set: 'lamps', text: (d, t) => `Light the signal lamps on the cliffs (${d}/${t})`, shard: true,
        after: [
          ['lumi', 'The boats can see the cliffs! Now the Sootlings. They have piled up around the old lookout circle.'],
          ['lumi', 'Sootlings are not mean. They are just smoke that forgot it was once warm. Solve their puzzles and they turn back into sparkles.'],
        ],
      },
      {
        type: 'game', game: 'battle', at: 'arena', label: 'Face the Sootlings', text: 'Cheer up the Sootlings at the lookout', shard: true,
        after: [
          ['lumi', 'They are sparkling! But a few drifted off across the island. Find four more and cheer them up too. Look for gray puffs on your map.'],
        ],
      },
      {
        type: 'count', counter: 'glooms', need: 4, text: (n) => `Cheer up wandering Sootlings (${n}/4)`, target: 'nearestGloom', shard: true,
        after: [['lumi', 'The air is clear. The cliff vent is right by my lighthouse. Charge it with expression and pattern puzzles!']],
      },
      { type: 'crystal', region: 'ridge' },
    ],
    outro: [
      ['lumi', 'My light is shining again. Every boat on the sea can find home tonight.'],
      ['professor', "All five vents, {name}! Look at the volcano. Something is moving up there, at the crater. I'll watch it tonight."],
    ],
    reward: { coins: 80 },
  },
  {
    id: 'ch6', type: 'main', chapter: 6, region: 'spire', title: 'Chapter 6: The Ember Heart',
    blurb: 'The soot over the crater is lifting. Someone is up there.',
    briefing: [
      ['professor', 'Good morning, {name}! With all five vents open, the soot over Mount Ember is lifting. And I saw a balloon moored at the crater rim!'],
      ['professor', 'Whoever built those valves is up there. Climb the volcano path... and remember, there is usually a reason behind a mystery.'],
    ],
    briefingNow: [
      ['professor', '{name}, look at Mount Ember! The soot is lifting, and there is a balloon moored at the crater rim!'],
      ['professor', 'Whoever built those valves is up there. Climb the volcano path... and remember, there is usually a reason behind a mystery.'],
    ],
    steps: [
      { type: 'scene', scene: 'craterOpen', auto: true, text: 'The soot over the crater is lifting...' },
      { type: 'reach', at: 'craterRim', radius: 10, minY: 34, text: 'Climb to the crater of Mount Ember', run: 'siphon' },
      {
        type: 'talk', npc: 'cinder', text: 'Talk to Cinder',
        lines: [
          ['cinder', "I'm sorry. I'm so sorry. I'm Cinder. I built the valves."],
          ['cinder', 'My home is an island in the sky. Skyreach. A storm blew our workshop loose and I fell all the way down here when I was little.'],
          ['cinder', 'I built the airship to fly back up and find it. But it needed so much steam. I never thought the sea would go cold.'],
          ['cinder', 'Will you help me give the heat back? We can rekindle the Heart together.'],
        ],
      },
      { type: 'scene', scene: 'rekindle', auto: true, text: 'Rekindle the Heart-Ember with Cinder' },
      {
        type: 'talk', npc: 'cinder', text: 'Talk to Cinder at the rekindled Heart',
        lines: [
          ['cinder', "Look at it glow! The current will carry warmth all the way to Glacier Bay again."],
          ['cinder', "Here, take my spare goggles. Every inventor needs a good pair."],
          ['cinder', "And... the Professor says Skyreach is real. That there's a map of the sky somewhere, in pieces. Maybe someday we can find it together."],
        ],
        reward: { items: ['hat:goggles'] },
      },
    ],
    outro: [['professor', 'You did it, {name}! The Heart-Ember is warm, the current is flowing, and we made a new friend. I am so proud of you.']],
    reward: { coins: 200 },
  },
  {
    id: 'ch7', type: 'main', chapter: 7, region: 'festival', title: 'Chapter 7: The Festival of Currents',
    blurb: 'Light the Legend Lanterns and send lantern boats out to sea.',
    briefing: [
      ['professor', "Good morning, {name}! The islanders want to celebrate with the Festival of Currents, and they want you to light the Legend Lanterns."],
      ['professor', 'Cinder is at the camp with an idea. Go and see!'],
    ],
    briefingNow: [
      ['professor', '{name}, the islanders could not wait! They want to celebrate with the Festival of Currents right away.'],
      ['professor', 'Cinder is at the camp with an idea. Go and see!'],
    ],
    steps: [
      {
        type: 'talk', npc: 'cinder', text: 'Talk to Cinder at the camp',
        lines: [
          ['cinder', '{name}! Every festival here needs the five Legend Lanterns lit, one beside each vent.'],
          ['cinder', "They only light for a true Legend, with the hardest puzzles on the islands. You've got this."],
        ],
      },
      { type: 'sites', set: 'legends', text: (d, t) => `Complete the Legend Trials beside each vent (${d}/${t})` },
      {
        type: 'talk', npc: 'cinder', text: 'Tell Cinder the lanterns are lit',
        lines: [
          ['cinder', 'All five! I watched from the airship. The whole island lit up like a birthday cake.'],
          ['cinder', 'Now invite everybody to the beach. Every friend gets a lantern boat to send out to sea.'],
        ],
      },
      { type: 'sites', set: 'invites', text: (d, t) => `Invite your friends to the festival (${d}/${t})` },
      { type: 'reach', at: 'festival', radius: 9, text: 'Go to the festival on Arrival Beach', run: 'festival' },
    ],
    reward: { coins: 300 },
  },
];

export const SIDE = [
  {
    id: 'sq_flakes', type: 'side', giver: 'nori', after: 'ch0', title: 'Sea Glass Seekers',
    blurb: 'Nori, Kai and Lani collect sea glass. There are 30 pieces hidden around the islands.',
    offer: [
      ['nori', 'We collect sea glass! Green, blue, even red. There are 30 pieces hidden all over the Ember Isles.'],
      ['nori', 'Bring us 10 and we will make you something special!'],
    ],
    steps: [
      { type: 'count', counter: 'flakes', need: 10, absolute: true, turnin: 'nori', text: (n) => `Find sea glass (${n}/10)`, target: 'nearestFlake', after: [['nori', 'Ten pieces! This Sun Hat is for you. Next prize at 20!']], reward: { items: ['hat:sunhat'] } },
      { type: 'count', counter: 'flakes', need: 20, absolute: true, turnin: 'nori', text: (n) => `Find sea glass (${n}/20)`, target: 'nearestFlake', after: [['kai', 'Twenty! You earned the Sea Spray slide trail. Belly-slide on the sand to see it!']], reward: { items: ['trail:spray'] } },
      { type: 'count', counter: 'flakes', need: 30, absolute: true, turnin: 'nori', text: (n) => `Find sea glass (${n}/30)`, target: 'nearestFlake', after: [['lani', 'ALL THIRTY! You are the best sea glass seeker ever! Here are 150 fish coins!']], reward: { coins: 150 } },
    ],
  },
  {
    id: 'sq_slalom', type: 'side', giver: 'kai', after: 'ch1', title: 'Ash Slope Slalom',
    blurb: 'Sand-board down the volcano\'s ash slope through answer gates.',
    offer: [
      ['kai', 'Want to race down the ash slope on the volcano? It is like snow, but warm and gray!'],
      ['kai', 'Before each gate, pick the lane with the right answer: press 1, 2 or 3, or the arrow keys. Right answers make you zoom!'],
    ],
    steps: [{ type: 'game', game: 'slalom', at: 'slalomTop', label: 'Start the slalom', text: 'Race down the ash slope', after: [['kai', 'Wooo! Race again any time for a better medal!']] }],
    reward: { coins: 30 },
  },
  {
    id: 'sq_stars', type: 'side', giver: 'professor', after: 'ch0', title: 'Tide Charts',
    blurb: 'Solve a set of tide chart puzzles at the camp. New charts every day.',
    offer: [
      ['professor', 'I measure the tides here every day. Would you help with my tide charts?'],
      ['professor', 'There is a fresh chart on my camp table every day. Finish charts on three different days and I will give you something special.'],
    ],
    steps: [{ type: 'count', counter: 'chartDays', need: 3, absolute: true, turnin: 'professor', text: (n) => `Finish tide charts on 3 different days (${n}/3)`, target: 'easel', after: [['professor', 'Three days of tide charts! This Wave scarf is for you.']], reward: { items: ['scarf:wave'] } }],
  },
  {
    id: 'sq_chicks', type: 'side', giver: 'lani', after: 'ch1', title: 'Little Turtles Home',
    blurb: 'Eight turtle hatchlings wandered off. Find them and lead them to the nest beach.',
    offer: [
      ['lani', 'Tortuga\'s nest hatched, and eight baby turtles wandered the wrong way! They should be heading to the sea.'],
      ['lani', 'They only follow someone who answers their riddles. Lead them back to the nest beach by the camp, please!'],
    ],
    steps: [{ type: 'chicks', text: (home) => `Lead the turtle hatchlings to the nest beach (${home}/8)`, after: [['lani', 'All eight made it! This little one wants to stay with you. Take it along from your Wardrobe!']], reward: { items: ['buddy:hatchling'], coins: 100 } }],
  },
  {
    id: 'sq_map', type: 'side', giver: 'tortuga', after: 'ch2', title: "Tortuga's Sea Chart",
    blurb: 'Read coordinates on Tortuga\'s sea chart to find four old treasures.',
    offer: [
      ['tortuga', 'Little one, I have carried this sea chart for a very long time. Four treasures are buried on these islands.'],
      ['tortuga', 'Open it with M. Count across first for x, then up for y. When you are near, the sand will sparkle. Press E to dig.'],
    ],
    steps: [{ type: 'treasure', text: (n, clue) => `Treasure ${n + 1} of 4: ${clue}`, after: [['tortuga', 'All four. You read the sea like a turtle now. Keep this compass scarf, for your journeys.']], reward: { items: ['scarf:compass'] } }],
  },
  {
    id: 'sq_tourney', type: 'side', giver: 'captain', after: 'ch1', title: 'Harbor Fishing Derby',
    blurb: 'Catch 10 fish at the harbor pier. Fewer misses win a better medal.',
    offer: [['captain', 'Ahoy! The harbor folk hold a fishing derby on the pier. Catch 10 fish, and the fewer misses, the shinier your medal!']],
    steps: [{ type: 'game', game: 'fishing', params: { count: 10, tourney: true }, at: 'fishSpot', label: 'Start the derby', text: 'Catch 10 fish in the Harbor Fishing Derby' }],
    reward: { coins: 40 },
  },
  {
    id: 'sq_rush', type: 'side', giver: 'marlo', after: 'ch3', title: 'Lunch Rush',
    blurb: 'Serve 8 customers in a row at Chef Marlo\'s stall.',
    offer: [['marlo', 'Lunch rush, sweet pea! Serve 8 customers in a row. Fewer mistakes, happier tummies, better medal.']],
    steps: [{ type: 'game', game: 'market', params: { count: 8, rush: true }, at: 'counter', label: 'Start the lunch rush', text: 'Serve 8 customers in the Lunch Rush' }],
    reward: { coins: 40 },
  },
  {
    id: 'sq_sculpt', type: 'side', giver: 'tortuga', after: 'ch4', title: 'Sandcastle Contest',
    blurb: 'Build four sandcastles for the judges on the temple build stones.',
    offer: [['tortuga', 'The young ones hold a sandcastle contest every year. Build four castles on the build stones. The judges love exact measures.']],
    steps: [{ type: 'game', game: 'architect', params: { count: 4, sculpture: true }, at: 'pad', label: 'Build for the contest', text: 'Build 4 castles for the Sandcastle Contest' }],
    reward: { coins: 40 },
  },
  {
    id: 'sq_glimmers', type: 'side', giver: 'lumi', after: 'ch5', title: 'Sparkle Friends',
    blurb: 'Cheer up a Sootling at every one of the 8 spots where they drift.',
    offer: [['lumi', 'There are 8 spots where Sootlings like to drift. Cheer one up at every spot, and they will all be friends!']],
    steps: [{ type: 'count', counter: 'gloomSpots', need: 8, absolute: true, turnin: 'lumi', text: (n) => `Cheer up a Sootling at every drifting spot (${n}/8)`, target: 'nearestGloom', after: [['lumi', 'Every spot! This little Sparkle wants to float along with you.']], reward: { items: ['buddy:sparkle'], coins: 100 } }],
  },
];

export const CHATTER = {
  professor: [
    'Penguins in the tropics? Yes! Galapagos penguins live right on the equator. They cool off by panting, like puppies.',
    'Press M for the map. The gold star shows where to go next.',
    'If a puzzle feels new, look for the lesson. Every expert was a beginner once.',
    'Check the Island Patrol board by camp. New tasks every day!',
    'The sea here is warm enough for long swims. Hold Shift to zoom!',
    'My radio picks up the strangest humming from the volcano at night.',
  ],
  captain: ['I sail back to Glacier Bay any time you like. Just say the word, matey.', 'Warm water, warm flippers. I could get used to this!'],
  isa: ['Coral is alive, you know. It just looks like rock.', 'Galapagos penguins nest in cracks in the lava. Cozy and shady.'],
  rocco: ['Rockhoppers hop. Everybody else walks. That is the difference.', 'Glass is just sand that got really, really hot.'],
  marlo: ['A recipe is just fractions you can eat!', 'Sweet pea, never trust a chef who does not taste her food.'],
  shelldon: ['Every shell I own was somebody\'s house once. I am basically a real estate dealer.', 'Deal? Deal!'],
  tortuga: ['Slow and steady crosses every ocean.', 'Two numbers can find any spot in the sea: across, and then up.'],
  lumi: ['Little blue penguins are the smallest penguins. We make up for it with bravery.', 'A light is a promise: someone is watching out for you.'],
  cinder: ['I fix everything with gears. Even breakfast. Do not ask about breakfast.', 'Someday the airship will fly high enough to see Skyreach.'],
  nori: ['Sea glass hides near the water. And sometimes on top of hills!'],
  kai: ['The ash slope on the volcano is the best slide on the islands!', 'I saw a treasure chest near the lagoon. I bet there are more!'],
  lani: ['Baby turtles always head for the brightest light, which is usually the sea.'],
};

export const FESTIVAL_SPOT = FESTIVAL;
export const SPIRE_TOP = { x: LOC.volcano.x, z: LOC.volcano.z + LOC.volcano.crater + 1 };
