// Mock personal content. Replace text and add real photo URLs (put images in public/photos/) when ready.

export interface Recipe {
  id: string
  name: string
  emoji: string
  time: string
  blurb: string
  ingredients: string[]
  steps: string[]
}

export const recipes: Recipe[] = [
  {
    id: 'picanha-frites',
    name: 'Picanha Frites',
    emoji: '🥩',
    time: '1 hr',
    blurb: 'Fat-cap-on picanha, crispy fries and chimichurri.',
    ingredients: ['1 picanha (about 1.2 kg)', 'Coarse salt', '4 russet potatoes', 'Parsley, garlic, oregano, red wine vinegar, olive oil'],
    steps: [
      'Score the fat cap and salt generously. Rest 45 minutes.',
      'Cut potatoes, soak, then double-fry until golden.',
      'Sear fat side down, then cook to 52°C inside. Rest 10 minutes.',
      'Slice against the grain and serve with chimichurri.',
    ],
  },
  {
    id: 'pep-ricotta-pizza',
    name: 'Pepperoni, Ricotta & Basil Pizza',
    emoji: '🍕',
    time: '30 min (plus dough)',
    blurb: 'Cupping pepperoni, dollops of ricotta, torn basil.',
    ingredients: ['Pizza dough', 'Crushed tomatoes', 'Low-moisture mozzarella', 'Pepperoni', 'Whole-milk ricotta', 'Fresh basil', 'Hot honey'],
    steps: [
      'Preheat oven and steel as hot as it goes for an hour.',
      'Stretch the dough, add sauce, mozzarella and pepperoni.',
      'Bake until the crust is leopard-spotted.',
      'Add ricotta, basil and a drizzle of hot honey.',
    ],
  },
  {
    id: 'pho',
    name: 'Weekend Phở',
    emoji: '🍜',
    time: '6 hr',
    blurb: 'Sample recipe: slow beef broth with charred aromatics.',
    ingredients: ['Beef bones', 'Onion and ginger', 'Star anise, cinnamon, cloves', 'Rice noodles', 'Herbs and lime'],
    steps: ['Blanch the bones.', 'Char onion and ginger.', 'Simmer everything for 6 hours.', 'Season and serve over noodles.'],
  },
  {
    id: 'garlic-noodles',
    name: 'Garlic Noodles',
    emoji: '🧄',
    time: '20 min',
    blurb: 'Sample recipe: buttery, garlicky, too easy.',
    ingredients: ['Spaghetti', 'Butter', 'A whole head of garlic', 'Oyster sauce', 'Parmesan', 'Green onion'],
    steps: ['Cook pasta.', 'Melt butter and gently cook the garlic.', 'Toss with sauce, cheese and pasta water.'],
  },
]

export interface Photo {
  caption: string
  emoji: string
  color: string
  src?: string
}

export const mochiPhotos: Photo[] = [
  { caption: 'Mochi on her bed', emoji: '🐶', color: '#f4c27a' },
  { caption: 'Bone acquired', emoji: '🦴', color: '#d9b38c' },
  { caption: 'Park day', emoji: '🌳', color: '#8fc78a' },
  { caption: 'Zoomies (blurry)', emoji: '💨', color: '#9ec5e8' },
  { caption: 'Sleepy Mochi', emoji: '😴', color: '#c7b3e6' },
  { caption: 'Begging at dinner', emoji: '🍕', color: '#f2a07b' },
]

export interface Trip {
  id: string
  name: string
  when: string
  photos: Photo[]
  notes: string
}

export const trips: Trip[] = [
  {
    id: 'vietnam',
    name: 'Vietnam',
    when: 'Sample trip',
    notes: 'Street food in Saigon, Ha Long Bay, visiting family.',
    photos: [
      { caption: 'Phở at 7am', emoji: '🍜', color: '#f4d58d' },
      { caption: 'Ha Long Bay', emoji: '⛰️', color: '#7fc8c2' },
      { caption: 'Night market', emoji: '🏮', color: '#e98b74' },
    ],
  },
  {
    id: 'japan',
    name: 'Japan',
    when: 'Sample trip',
    notes: 'Tokyo ramen crawl and a day in Kyoto.',
    photos: [
      { caption: 'Shibuya at night', emoji: '🌃', color: '#7d86d9' },
      { caption: 'Fushimi Inari', emoji: '⛩️', color: '#e8826f' },
    ],
  },
]

export const travelChecklist = ['Japan', 'Vietnam', 'Italy', 'Brazil (picanha pilgrimage)', 'Iceland', 'New Zealand', 'Wimbledon']

export interface Wallpaper {
  id: string
  name: string
  url: string
}

export const fandomWallpapers: Wallpaper[] = [
  { id: 'spidey', name: 'Spider-Man (fan style)', url: '/wallpapers/spidey.svg' },
  { id: 'titan', name: 'Attack on Titan (fan style)', url: '/wallpapers/titan.svg' },
  { id: 'invincible', name: 'Invincible (fan style)', url: '/wallpapers/invincible.svg' },
  { id: 'hill', name: 'Green Hill', url: '/wallpapers/hill.svg' },
  { id: 'night', name: 'Late Night', url: '/wallpapers/night.svg' },
]

export const wiki = {
  title: 'Johnny Vo',
  intro:
    "Johnny Vo is a Los Angeles based software engineer, home cook, recreational tennis player and owner of a dog named Mochi. He is best known for this website. (This article is a parody with placeholder facts.)",
  infobox: [
    ['Born', '199X, California'],
    ['Occupation', 'Software Engineer'],
    ['Known for', 'Picanha, this website'],
    ['Dog', 'Mochi'],
    ['MBTI', 'INFP'],
    ['Main', 'Spider-Man'],
  ],
  sections: [
    {
      heading: 'Early life',
      body: 'Johnny grew up on RuneScape, Club Penguin and Counter-Strike, and made his first website on MySpace. Sources say his top 8 was carefully curated.',
    },
    {
      heading: 'Career',
      body: 'After studying computer science, Johnny became a software engineer. See the Resume and Work Blog apps for the less parody version.',
    },
    {
      heading: 'Personal life',
      body: 'Johnny lives in Los Angeles with Mochi. He enjoys cooking, tennis, travel and rewatching Attack on Titan.',
    },
    {
      heading: 'Legacy',
      body: 'Historians agree the pepperoni, ricotta and basil pizza is his greatest contribution to date.',
    },
  ],
}

export const infp = {
  type: 'INFP',
  nickname: 'The Mediator',
  traits: [
    ['Introverted', 'Recharges with a good show, a long cook or a solo hit at the tennis wall.'],
    ['Intuitive', 'More excited by what something could be than what it is.'],
    ['Feeling', 'Cares how things make people feel, including the people using the software.'],
    ['Perceiving', 'Plans loosely, adapts often.'],
  ],
  blurb: 'Sample text: idealistic, curious and a little nostalgic, which explains why this website is a Windows XP computer.',
}

export const recycleBin = [
  { name: 'myspace_layout_FINAL_v3.html', size: '24 KB', from: 'C:\\Documents\\2007' },
  { name: 'homework_final_FINAL2.doc', size: '88 KB', from: 'C:\\School' },
  { name: 'runescape_gold_plan.txt', size: '1 KB', from: 'C:\\Desktop' },
  { name: 'linkin_park_numb.mp3', size: '4.2 MB', from: 'C:\\Music' },
]

export const contactLinks = [
  { label: 'GitHub', href: 'https://github.com/JvoProgramming' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
]
