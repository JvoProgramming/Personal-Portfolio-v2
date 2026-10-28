// 3D models and photos used in the room. CC-BY 4.0 requires visible credit, which the Credits window and /credits page give.
export interface Credit {
  title: string
  author: string
  url: string
  license: 'CC-BY 4.0' | 'CC-BY 2.0' | 'CC0'
  usedFor: string
}

export const MODEL_CREDITS: Credit[] = [
  { title: 'Office Chair', author: 'j.a.m', url: 'https://sketchfab.com/3d-models/41973aa1808d4a13b84c24497fc77c63', license: 'CC-BY 4.0', usedFor: 'Desk chair' },
  { title: 'Guitar Hero Controller', author: 'CamSear16', url: 'https://sketchfab.com/3d-models/bcac8f9f95a44008ad90f470326e5fca', license: 'CC-BY 4.0', usedFor: 'Guitar controller' },
  { title: 'CRT Computer Monitor', author: 'fizyman', url: 'https://sketchfab.com/3d-models/f2ff0013f86e4cd0a2aee183a23bdfee', license: 'CC-BY 4.0', usedFor: 'Monitor' },
  { title: 'Desk lamp', author: 'BlueHour', url: 'https://sketchfab.com/3d-models/7377ec591df04445a1aae370017aaa13', license: 'CC-BY 4.0', usedFor: 'Desk lamp' },
  { title: 'Tennis Racket', author: 'Yanez-Designs', url: 'https://sketchfab.com/3d-models/c314dcce06ba488ca624957f579b8196', license: 'CC-BY 4.0', usedFor: 'Racquet on the wall' },
  { title: 'Tennis Ball', author: 'sudharsanme', url: 'https://sketchfab.com/3d-models/edc344dcc65440ea97b5eae84f1957a4', license: 'CC-BY 4.0', usedFor: 'Tennis balls' },
  { title: 'Tennis Bag', author: 'nastimafia', url: 'https://sketchfab.com/3d-models/e0e0696b7e5d48fabd4eefc4e46e52a8', license: 'CC-BY 4.0', usedFor: 'Tennis bag' },
  { title: 'Snake Plant', author: 'digitalurban', url: 'https://sketchfab.com/3d-models/b02cbf156a024565ab6e89e27261b30f', license: 'CC-BY 4.0', usedFor: 'Plant' },
  { title: 'Pizza', author: 'rigsters', url: 'https://sketchfab.com/3d-models/40d50989fec1460f8838b608d999ccd0', license: 'CC-BY 4.0', usedFor: 'Pizza' },
  { title: 'Simple Bean Bag', author: 'AleixoAlonso', url: 'https://sketchfab.com/3d-models/64d111cec3d842f09cbb8c68b1e49c8d', license: 'CC-BY 4.0', usedFor: 'Bean bag' },
  { title: 'Book Encyclopedia Set 01', author: 'Poly Haven', url: 'https://polyhaven.com/a/book_encyclopedia_set_01', license: 'CC0', usedFor: 'Books on the shelf' },
  { title: 'Office Desk 140x60', author: 'AleixoAlonso', url: 'https://sketchfab.com/3d-models/9262f311271c4c4390341e526d3fe103', license: 'CC-BY 4.0', usedFor: 'Desk' },
  { title: 'Logitech mechanical gaming keyboard', author: 'blackcube4', url: 'https://sketchfab.com/3d-models/c775d45baf854606931584404d7b9109', license: 'CC-BY 4.0', usedFor: 'Keyboard' },
  { title: 'Classic Red Coffee Mug', author: 'hungry_beagle', url: 'https://sketchfab.com/3d-models/c89fa8b5390145488a28c41ec54ccc8d', license: 'CC-BY 4.0', usedFor: 'Mug' },
  { title: 'Nintendo Game Boy', author: 'Smoggybeard', url: 'https://sketchfab.com/3d-models/021b1586089044278164dadc584abb89', license: 'CC-BY 4.0', usedFor: 'Game Boy' },
  { title: 'Headphone with stand', author: 'halilkantarci', url: 'https://sketchfab.com/3d-models/4ffedc9bffad4a549f6e0a46b0f92b05', license: 'CC-BY 4.0', usedFor: 'Headphones' },
  { title: 'Round side coffee table marble top', author: '3DTechDesignCo.Ltd', url: 'https://sketchfab.com/3d-models/49e5ede6a16d4dd39386d6aa705fdbeb', license: 'CC-BY 4.0', usedFor: 'Side table' },
  { title: 'Persian Qashqai Rug', author: 'mfb64', url: 'https://sketchfab.com/3d-models/fa968bf5d57a4265bedb233293870dc2', license: 'CC-BY 4.0', usedFor: 'Rug' },
  { title: 'Curtains', author: 'Starven38', url: 'https://sketchfab.com/3d-models/e5b01c717dbd4244b861168eddd67375', license: 'CC-BY 4.0', usedFor: 'Curtains' },
  { title: 'Dog Toy Rope 3D Scan', author: '3dscanx', url: 'https://sketchfab.com/3d-models/c45af57d9a3c47a58da36db2a5d425dd', license: 'CC-BY 4.0', usedFor: "Mochi's rope toy" },
  { title: 'CP Rubber Chicken V2', author: '1027213', url: 'https://sketchfab.com/3d-models/4fb4c054c0bd417a9a952166b37b91c9', license: 'CC-BY 4.0', usedFor: 'Rubber chicken' },
  { title: 'Crocodile dog toy 3D scan', author: 'LukaszRyz', url: 'https://sketchfab.com/3d-models/175f93d5e19d47ae8d2032b726e47dad', license: 'CC-BY 4.0', usedFor: 'Crocodile toy' },
  { title: 'Rubber Duck Toy', author: 'Plat251 (Poly Haven)', url: 'https://polyhaven.com/a/rubber_duck_toy', license: 'CC0', usedFor: 'Rubber duck' },
  { title: 'L.A. Skyline 02 (photo)', author: 'JonDoeForty', url: 'https://commons.wikimedia.org/wiki/File:L.A._Skyline_02.jpg', license: 'CC-BY 2.0', usedFor: 'Night view out the window' },
]
