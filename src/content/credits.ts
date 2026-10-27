// 3D models used in the room. CC-BY 4.0 requires visible credit, which the Credits window and /credits page give.
export interface Credit {
  title: string
  author: string
  url: string
  license: 'CC-BY 4.0' | 'CC0'
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
]
