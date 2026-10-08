/**
 * Word pairs for analogy questions ("A is to B as C is to ?"), grouped by relation.
 *
 * `level` is the relation's base difficulty (from docs/item-blueprint.md: concrete relations
 * like part:whole are easier than degree or cause:effect). A pair can raise it with its own
 * `level` when its words are rare. `lures` are words associated with the pair's first word that
 * complete the analogy wrongly: they make the best distractors when this pair is the question.
 */

export interface AnalogyPair {
  a: string;
  b: string;
  lures?: string[];
  level?: 1 | 2 | 3 | 4 | 5;
}

export interface Relation {
  id: string;
  /** How the relation reads, used in explanations: "{a} is part of a {b}". */
  describe: (a: string, b: string) => string;
  level: 1 | 2 | 3 | 4 | 5;
  pairs: AnalogyPair[];
}

const article = (w: string) => (/^[aeiou]/i.test(w) ? `an ${w}` : `a ${w}`);

export const RELATIONS: Relation[] = [
  {
    id: 'part-whole',
    describe: (a, b) => `${article(a)} is part of ${article(b)}`,
    level: 2,
    pairs: [
      { a: 'finger', b: 'hand', lures: ['ring', 'nail', 'glove'] },
      { a: 'toe', b: 'foot', lures: ['shoe', 'nail', 'sock'] },
      { a: 'page', b: 'book', lures: ['paper', 'word', 'ink'] },
      { a: 'petal', b: 'flower', lures: ['bee', 'garden', 'stem'] },
      { a: 'branch', b: 'tree', lures: ['leaf', 'forest', 'bird'] },
      { a: 'key', b: 'keyboard', lures: ['lock', 'door', 'type'] },
      { a: 'brick', b: 'wall', lures: ['clay', 'builder', 'cement'] },
      { a: 'room', b: 'house', lures: ['door', 'furniture', 'guest'] },
      { a: 'wheel', b: 'bicycle', lures: ['tire', 'road', 'spoke'] },
      { a: 'player', b: 'team', lures: ['game', 'coach', 'ball'] },
    ],
  },
  {
    id: 'category',
    describe: (a, b) => `${article(a)} is a kind of ${b}`,
    level: 2,
    pairs: [
      { a: 'dog', b: 'animal', lures: ['bone', 'bark', 'cat'] },
      { a: 'rose', b: 'flower', lures: ['thorn', 'red', 'garden'] },
      { a: 'oak', b: 'tree', lures: ['acorn', 'wood', 'leaf'] },
      { a: 'hammer', b: 'tool', lures: ['nail', 'wood', 'hit'] },
      { a: 'violin', b: 'instrument', lures: ['bow', 'string', 'music'] },
      { a: 'apple', b: 'fruit', lures: ['seed', 'pie', 'orchard'] },
      { a: 'carrot', b: 'vegetable', lures: ['orange', 'rabbit', 'soil'] },
      { a: 'eagle', b: 'bird', lures: ['nest', 'feather', 'fly'] },
      { a: 'salmon', b: 'fish', lures: ['river', 'swim', 'scale'] },
      { a: 'chair', b: 'furniture', lures: ['sit', 'table', 'wood'] },
    ],
  },
  {
    id: 'young',
    describe: (a, b) => `${article(a)} is a young ${b}`,
    level: 2,
    pairs: [
      { a: 'puppy', b: 'dog', lures: ['kennel', 'bark', 'bone'] },
      { a: 'kitten', b: 'cat', lures: ['milk', 'yarn', 'purr'] },
      { a: 'calf', b: 'cow', lures: ['farm', 'milk', 'grass'] },
      { a: 'foal', b: 'horse', lures: ['stable', 'hay', 'saddle'] },
      { a: 'cub', b: 'bear', lures: ['den', 'honey', 'cave'] },
      { a: 'tadpole', b: 'frog', lures: ['pond', 'egg', 'swim'], level: 3 },
    ],
  },
  {
    id: 'tool-function',
    describe: (a, b) => `you use ${article(a)} to ${b}`,
    level: 3,
    pairs: [
      { a: 'knife', b: 'cut', lures: ['fork', 'sharp', 'kitchen'] },
      { a: 'pen', b: 'write', lures: ['ink', 'paper', 'pencil'] },
      { a: 'broom', b: 'sweep', lures: ['floor', 'dust', 'handle'] },
      { a: 'needle', b: 'sew', lures: ['thread', 'sharp', 'cloth'] },
      { a: 'shovel', b: 'dig', lures: ['dirt', 'garden', 'hole'] },
      { a: 'ladder', b: 'climb', lures: ['roof', 'step', 'tall'] },
      { a: 'oven', b: 'bake', lures: ['kitchen', 'hot', 'bread'] },
      { a: 'eraser', b: 'erase', lures: ['pencil', 'mistake', 'rubber'] },
    ],
  },
  {
    id: 'worker-tool',
    describe: (a, b) => `${article(a)} uses ${article(b)} as a tool`,
    level: 3,
    pairs: [
      { a: 'painter', b: 'brush', lures: ['canvas', 'art', 'color'] },
      { a: 'surgeon', b: 'scalpel', lures: ['hospital', 'patient', 'doctor'] },
      { a: 'carpenter', b: 'saw', lures: ['wood', 'table', 'workshop'] },
      { a: 'photographer', b: 'camera', lures: ['picture', 'model', 'light'] },
      { a: 'tailor', b: 'needle', lures: ['suit', 'cloth', 'shop'] },
      { a: 'astronomer', b: 'telescope', lures: ['star', 'sky', 'planet'] },
      { a: 'farmer', b: 'plow', lures: ['field', 'crop', 'barn'] },
    ],
  },
  {
    id: 'measure',
    describe: (a, b) => `${article(a)} measures ${b}`,
    level: 3,
    pairs: [
      { a: 'thermometer', b: 'temperature', lures: ['heat', 'fever', 'weather'] },
      { a: 'barometer', b: 'pressure', lures: ['weather', 'rain', 'cloud'] },
      { a: 'scale', b: 'weight', lures: ['fish', 'kitchen', 'heavy'] },
      { a: 'clock', b: 'time', lures: ['wall', 'alarm', 'hand'] },
      { a: 'ruler', b: 'length', lures: ['king', 'straight', 'line'] },
      { a: 'speedometer', b: 'speed', lures: ['car', 'road', 'fast'] },
      { a: 'odometer', b: 'distance', lures: ['car', 'mile', 'trip'], level: 4 },
    ],
  },
  {
    id: 'degree',
    describe: (a, b) => `${b} is a more extreme version of ${a}`,
    level: 4,
    pairs: [
      { a: 'drizzle', b: 'downpour', lures: ['umbrella', 'cloud', 'wet'] },
      { a: 'breeze', b: 'gale', lures: ['kite', 'cool', 'air'] },
      { a: 'whisper', b: 'shout', lures: ['secret', 'quiet', 'ear'] },
      { a: 'chilly', b: 'freezing', lures: ['winter', 'coat', 'snow'] },
      { a: 'tired', b: 'exhausted', lures: ['bed', 'sleep', 'yawn'] },
      { a: 'hill', b: 'mountain', lures: ['valley', 'climb', 'grass'] },
      { a: 'annoyed', b: 'furious', lures: ['noise', 'calm', 'frown'] },
      { a: 'pleased', b: 'ecstatic', lures: ['smile', 'polite', 'gift'], level: 5 },
    ],
  },
  {
    id: 'cause-effect',
    describe: (a, b) => `${article(a)} can cause ${article(b)}`,
    level: 4,
    pairs: [
      { a: 'fire', b: 'smoke', lures: ['match', 'wood', 'firefighter'] },
      { a: 'virus', b: 'illness', lures: ['doctor', 'germ', 'hospital'] },
      { a: 'drought', b: 'famine', lures: ['desert', 'sun', 'rain'], level: 5 },
      { a: 'practice', b: 'skill', lures: ['coach', 'lesson', 'piano'] },
      { a: 'exercise', b: 'fitness', lures: ['gym', 'sweat', 'running'] },
      { a: 'earthquake', b: 'tsunami', lures: ['ground', 'crack', 'shake'] },
      { a: 'flood', b: 'damage', lures: ['river', 'rain', 'water'] },
    ],
  },
  {
    id: 'opposite',
    describe: (a, b) => `${a} is the opposite of ${b}`,
    level: 4,
    pairs: [
      { a: 'scarce', b: 'abundant', lures: ['rare', 'few', 'little'] },
      { a: 'frugal', b: 'extravagant', lures: ['thrifty', 'careful', 'cheap'], level: 5 },
      { a: 'transparent', b: 'opaque', lures: ['clear', 'glass', 'window'], level: 5 },
      { a: 'expand', b: 'contract', lures: ['grow', 'widen', 'stretch'] },
      { a: 'timid', b: 'bold', lures: ['shy', 'quiet', 'meek'] },
      { a: 'accept', b: 'reject', lures: ['receive', 'agree', 'take'] },
      { a: 'ascend', b: 'descend', lures: ['climb', 'rise', 'mount'] },
    ],
  },
];
