/**
 * Vocabulary for synonym and antonym questions.
 *
 * Each entry pairs two synonym clusters that are opposites. Words are tagged with a difficulty
 * tier (1 = everyday, 5 = rare), assigned by hand from how common the word is in everyday
 * English. Every word appears in exactly one cluster (enforced by tests), so a word drawn as a
 * wrong answer can't secretly be a synonym of the target.
 *
 * `avoid` lists entries whose meanings overlap with this one (e.g. "lazy" and "slow"); their
 * words are never used as wrong answers for each other.
 */

export type PartOfSpeech = 'adj' | 'verb' | 'noun';

/** word → tier */
export type Cluster = Record<string, 1 | 2 | 3 | 4 | 5>;

export interface WordPair {
  id: string;
  pos: PartOfSpeech;
  a: Cluster;
  b: Cluster;
  avoid?: string[];
}

export const WORD_PAIRS: WordPair[] = [
  {
    id: 'happy',
    pos: 'adj',
    a: { happy: 1, glad: 1, cheerful: 2, joyful: 2, content: 3, elated: 4, jubilant: 5 },
    b: { sad: 1, unhappy: 1, gloomy: 2, miserable: 2, sorrowful: 3, melancholy: 4, despondent: 5 },
    avoid: ['calm'],
  },
  {
    id: 'big',
    pos: 'adj',
    a: { big: 1, large: 1, huge: 2, enormous: 3, immense: 4, colossal: 4 },
    b: { small: 1, little: 1, tiny: 2, petite: 3, diminutive: 4, minuscule: 5 },
    avoid: ['plentiful'],
  },
  {
    id: 'fast',
    pos: 'adj',
    a: { fast: 1, quick: 1, rapid: 2, speedy: 2, swift: 3, brisk: 4 },
    b: { slow: 1, sluggish: 3, leisurely: 3, plodding: 4, torpid: 5 },
    avoid: ['lazy', 'brief'],
  },
  {
    id: 'brave',
    pos: 'adj',
    a: { brave: 1, bold: 2, fearless: 2, courageous: 3, valiant: 4, intrepid: 5 },
    b: { cowardly: 2, fearful: 2, timid: 3, craven: 5, pusillanimous: 5 },
    avoid: ['calm', 'strong'],
  },
  {
    id: 'honest',
    pos: 'adj',
    a: { honest: 1, truthful: 2, sincere: 3, candid: 3, frank: 3, forthright: 4, veracious: 5 },
    b: { dishonest: 1, untruthful: 2, deceitful: 3, duplicitous: 5, mendacious: 5 },
  },
  {
    id: 'rich',
    pos: 'adj',
    a: { rich: 1, wealthy: 2, prosperous: 3, affluent: 4, opulent: 5 },
    b: { poor: 1, needy: 2, destitute: 4, impoverished: 4, indigent: 5 },
  },
  {
    id: 'old',
    pos: 'adj',
    a: { old: 1, ancient: 1, antique: 3, archaic: 4, antiquated: 4 },
    b: { new: 1, modern: 1, recent: 2, contemporary: 3, novel: 4 },
  },
  {
    id: 'easy',
    pos: 'adj',
    a: { easy: 1, simple: 1, effortless: 3, straightforward: 3, facile: 5 },
    b: { difficult: 1, tough: 2, arduous: 4, laborious: 4, onerous: 5 },
  },
  {
    id: 'plentiful',
    pos: 'adj',
    a: { plentiful: 2, abundant: 3, ample: 3, bountiful: 4, copious: 4, profuse: 5 },
    b: { scarce: 3, sparse: 3, meager: 4, scant: 4, paltry: 5 },
    avoid: ['big'],
  },
  {
    id: 'calm',
    pos: 'adj',
    a: { calm: 1, peaceful: 1, serene: 3, tranquil: 3, placid: 4 },
    b: { nervous: 1, anxious: 2, restless: 2, agitated: 3, frantic: 3, turbulent: 4 },
    avoid: ['happy', 'brave', 'noisy'],
  },
  {
    id: 'clean',
    pos: 'adj',
    a: { clean: 1, spotless: 2, pristine: 4, immaculate: 4 },
    b: { dirty: 1, filthy: 2, grimy: 3, soiled: 3, squalid: 5 },
  },
  {
    id: 'kind',
    pos: 'adj',
    a: { kind: 1, caring: 1, sympathetic: 3, compassionate: 3, benevolent: 4, humane: 4 },
    b: { cruel: 1, mean: 1, harsh: 2, brutal: 3, callous: 4, malevolent: 5 },
    avoid: ['generous', 'friendly', 'polite'],
  },
  {
    id: 'generous',
    pos: 'adj',
    a: { generous: 2, charitable: 3, magnanimous: 5, munificent: 5 },
    b: { stingy: 3, miserly: 3, 'penny-pinching': 3, parsimonious: 5 },
    avoid: ['kind'],
  },
  {
    id: 'wise',
    pos: 'adj',
    a: { wise: 2, clever: 1, smart: 1, intelligent: 2, shrewd: 4, astute: 4, sagacious: 5 },
    b: { foolish: 2, silly: 1, unwise: 2, imprudent: 4, obtuse: 5 },
    avoid: ['careful'],
  },
  {
    id: 'strong',
    pos: 'adj',
    a: { strong: 1, powerful: 2, sturdy: 3, robust: 3, vigorous: 4, stalwart: 5 },
    b: { weak: 1, fragile: 2, feeble: 3, frail: 3, flimsy: 3, debilitated: 5 },
    avoid: ['brave'],
  },
  {
    id: 'noisy',
    pos: 'adj',
    a: { noisy: 1, loud: 1, rowdy: 3, raucous: 4, boisterous: 4, clamorous: 5 },
    b: { quiet: 1, silent: 1, soundless: 2, hushed: 3, muted: 3 },
    avoid: ['calm'],
  },
  {
    id: 'famous',
    pos: 'adj',
    a: { famous: 1, 'well-known': 1, renowned: 3, celebrated: 3, eminent: 4, illustrious: 5 },
    b: { unknown: 1, obscure: 3, anonymous: 3, unsung: 4 },
    avoid: ['obvious', 'ordinary'],
  },
  {
    id: 'brief',
    pos: 'adj',
    a: { brief: 2, short: 1, concise: 3, succinct: 4, terse: 4, laconic: 5 },
    b: { long: 1, lengthy: 2, wordy: 3, 'long-winded': 3, verbose: 4, prolix: 5 },
    avoid: ['fast'],
  },
  {
    id: 'friendly',
    pos: 'adj',
    a: { friendly: 1, outgoing: 2, sociable: 3, affable: 4, amiable: 4, gregarious: 4 },
    b: { unfriendly: 1, hostile: 3, standoffish: 3, aloof: 4 },
    avoid: ['kind', 'polite'],
  },
  {
    id: 'careful',
    pos: 'adj',
    a: { careful: 1, cautious: 2, wary: 3, prudent: 4, meticulous: 4, circumspect: 5 },
    b: { careless: 1, hasty: 2, rash: 3, reckless: 3, negligent: 4, heedless: 4 },
    avoid: ['wise', 'dangerous'],
  },
  {
    id: 'humble',
    pos: 'adj',
    a: { humble: 2, modest: 2, unassuming: 4, 'self-effacing': 5 },
    b: { boastful: 2, arrogant: 3, conceited: 3, haughty: 4, pompous: 4, supercilious: 5 },
  },
  {
    id: 'lazy',
    pos: 'adj',
    a: { lazy: 1, idle: 2, lethargic: 4, slothful: 4, indolent: 5 },
    b: { hardworking: 1, diligent: 3, industrious: 4, conscientious: 4, assiduous: 5 },
    avoid: ['fast'],
  },
  {
    id: 'obvious',
    pos: 'adj',
    a: { obvious: 2, evident: 3, apparent: 3, conspicuous: 4, manifest: 5 },
    b: { hidden: 1, concealed: 3, covert: 4, latent: 5 },
    avoid: ['famous'],
  },
  {
    id: 'ordinary',
    pos: 'adj',
    a: { ordinary: 1, common: 1, usual: 1, typical: 2, commonplace: 3, mundane: 4 },
    b: { unusual: 1, unique: 2, exceptional: 3, extraordinary: 3, remarkable: 3 },
    avoid: ['famous'],
  },
  {
    id: 'wet',
    pos: 'adj',
    a: { wet: 1, damp: 2, moist: 2, soggy: 3, sodden: 5 },
    b: { dry: 1, parched: 3, dehydrated: 3, arid: 4, desiccated: 5 },
  },
  {
    id: 'polite',
    pos: 'adj',
    a: { polite: 1, respectful: 2, courteous: 3, civil: 4, gracious: 4 },
    b: { rude: 1, impolite: 1, disrespectful: 2, discourteous: 3, insolent: 5, impudent: 5 },
    avoid: ['kind', 'friendly'],
  },
  {
    id: 'dangerous',
    pos: 'adj',
    a: { dangerous: 1, risky: 2, hazardous: 3, perilous: 4, precarious: 5 },
    b: { safe: 1, harmless: 2, secure: 2 },
    avoid: ['careful'],
  },
  {
    id: 'stubborn',
    pos: 'adj',
    a: { stubborn: 2, headstrong: 3, inflexible: 3, obstinate: 4, obdurate: 5 },
    b: { compliant: 4, docile: 4, yielding: 4, amenable: 5 },
  },
  {
    id: 'optional',
    pos: 'adj',
    a: { optional: 2, voluntary: 3, elective: 4, discretionary: 5 },
    b: { required: 2, mandatory: 3, compulsory: 4, obligatory: 4 },
  },
  {
    id: 'begin',
    pos: 'verb',
    a: { begin: 1, start: 1, launch: 2, commence: 4, initiate: 4 },
    b: { end: 1, finish: 1, conclude: 3, terminate: 4, cease: 4 },
  },
  {
    id: 'increase',
    pos: 'verb',
    a: { increase: 1, grow: 1, expand: 2, enlarge: 3, amplify: 4, augment: 5 },
    b: { decrease: 1, reduce: 2, shrink: 2, lessen: 3, diminish: 4 },
    avoid: ['lengthen'],
  },
  {
    id: 'praise',
    pos: 'verb',
    a: { praise: 2, compliment: 2, applaud: 3, commend: 4, laud: 5, extol: 5 },
    b: { criticize: 2, condemn: 3, belittle: 4, denounce: 4, disparage: 5, deride: 5 },
  },
  {
    id: 'help',
    pos: 'verb',
    a: { help: 1, aid: 2, assist: 2, support: 2, facilitate: 4 },
    b: { block: 2, hinder: 3, hamper: 3, impede: 4, obstruct: 4, thwart: 4 },
    avoid: ['defend'],
  },
  {
    id: 'allow',
    pos: 'verb',
    a: { allow: 1, let: 1, permit: 2, authorize: 4 },
    b: { forbid: 2, ban: 2, prohibit: 3, veto: 4, proscribe: 5 },
    avoid: ['agree'],
  },
  {
    id: 'gather',
    pos: 'verb',
    a: { collect: 1, gather: 2, assemble: 3, accumulate: 4, amass: 5 },
    b: { scatter: 2, disperse: 4, dissipate: 5 },
  },
  {
    id: 'lengthen',
    pos: 'verb',
    a: { lengthen: 2, extend: 2, prolong: 3, elongate: 4 },
    b: { shorten: 1, condense: 4, abbreviate: 4, truncate: 5, abridge: 5 },
    avoid: ['increase'],
  },
  {
    id: 'reveal',
    pos: 'verb',
    a: { show: 1, uncover: 2, reveal: 3, expose: 3, disclose: 4, divulge: 5 },
    b: { hide: 1, conceal: 3, cloak: 4, veil: 4 },
  },
  {
    id: 'agree',
    pos: 'verb',
    a: { agree: 1, consent: 3, concur: 4, assent: 5 },
    b: { disagree: 1, object: 2, dissent: 4, demur: 5 },
    avoid: ['allow'],
  },
  {
    id: 'repair',
    pos: 'verb',
    a: { fix: 1, repair: 2, mend: 2, restore: 3, rectify: 4 },
    b: { break: 1, damage: 2, wreck: 2, impair: 4, sabotage: 4 },
  },
  {
    id: 'defend',
    pos: 'verb',
    a: { protect: 1, guard: 1, defend: 2, shield: 2, safeguard: 3 },
    b: { attack: 2, assault: 3, assail: 5 },
    avoid: ['help'],
  },
  {
    id: 'friend',
    pos: 'noun',
    a: { friend: 1, ally: 2, companion: 2, comrade: 3, confidant: 4 },
    b: { enemy: 1, foe: 2, adversary: 3, antagonist: 4, nemesis: 5 },
  },
  {
    id: 'courage',
    pos: 'noun',
    a: { courage: 2, bravery: 2, valor: 4, fortitude: 5, mettle: 5 },
    b: { fear: 1, cowardice: 3, timidity: 4 },
  },
];
