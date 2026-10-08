import { because, text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';

/** All X are Y · No X are Y · Some X are Y · Some X are not Y. */
export type Quantifier = 'all' | 'no' | 'some' | 'someNot';

export interface Statement {
  q: Quantifier;
  /** Indexes into the term list. */
  x: number;
  y: number;
}

export type Verdict = 'True' | 'False' | 'Uncertain';

/**
 * A model is a bitmask over Venn regions: bit r is set when region r is inhabited. Region r holds
 * the things that belong exactly to the terms whose bits are set in r. With 4 terms there are
 * 16 regions and 65,536 models, so everything here is plain integer arithmetic.
 */
type Model = number;

/** Bitmask of the regions where `pred(inX, inY)` holds. */
function regions(terms: number, x: number, y: number, pred: (inX: boolean, inY: boolean) => boolean): number {
  let mask = 0;
  for (let r = 0; r < 1 << terms; r++) if (pred(!!(r & (1 << x)), !!(r & (1 << y)))) mask |= 1 << r;
  return mask;
}

/** Returns a test `model => boolean` for a statement. */
function compile(s: Statement, terms: number): (model: Model) => boolean {
  const xy = regions(terms, s.x, s.y, (x, y) => x && y);
  const xNotY = regions(terms, s.x, s.y, (x, y) => x && !y);
  switch (s.q) {
    case 'all':
      return (m) => (m & xNotY) === 0;
    case 'no':
      return (m) => (m & xy) === 0;
    case 'some':
      return (m) => (m & xy) !== 0;
    case 'someNot':
      return (m) => (m & xNotY) !== 0;
  }
}

/**
 * Checks the conclusion against every model where the premises hold and every term is
 * non-empty (the natural reading: "all bakers are…" implies there are bakers).
 */
export function evaluate(terms: number, premises: Statement[], conclusion: Statement): Verdict {
  return analyse(terms, premises, conclusion).verdict;
}

/** The verdict, plus the simplest situation (fewest kinds of people) where the conclusion fails. */
export function analyse(terms: number, premises: Statement[], conclusion: Statement): { verdict: Verdict; counterexample?: Model } {
  const termMasks = Array.from({ length: terms }, (_, t) => regions(terms, t, t, (x) => x));
  const tests = premises.map((p) => compile(p, terms));
  const concludes = compile(conclusion, terms);
  let canHold = false;
  let counterexample: Model | undefined;
  for (let model = 0; model < 2 ** (1 << terms); model++) {
    if (!termMasks.every((t) => model & t) || !tests.every((test) => test(model))) continue;
    if (concludes(model)) canHold = true;
    else if (counterexample === undefined || popcount(model) < popcount(counterexample)) counterexample = model;
  }
  if (!canHold && counterexample === undefined) throw new Error('Contradictory premises');
  return { verdict: counterexample === undefined ? 'True' : canHold ? 'Uncertain' : 'False', counterexample };
}

const popcount = (n: number) => n.toString(2).replace(/0/g, '').length;

/** "some who are bakers and runners but not artists; some who are only runners" */
export function describeModel(model: Model, names: string[]): string {
  const parts: string[] = [];
  for (let r = 1; r < 1 << names.length; r++) {
    if (!(model & (1 << r))) continue;
    const inside = names.filter((_, t) => r & (1 << t));
    const outside = names.filter((_, t) => !(r & (1 << t)));
    parts.push(
      inside.length === 1
        ? `some who are only ${inside[0]}`
        : `some who are ${inside.join(' and ')}${outside.length ? ` but not ${outside.join(' or ')}` : ''}`,
    );
  }
  return parts.join('; ');
}

const NEGATION: Record<Quantifier, Quantifier> = { all: 'someNot', someNot: 'all', no: 'some', some: 'no' };
export const negate = (s: Statement): Statement => ({ ...s, q: NEGATION[s.q] });

export function sentence(s: Statement, names: string[]): string {
  const [x, y] = [names[s.x]!, names[s.y]!];
  switch (s.q) {
    case 'all':
      return `All ${x} are ${y}.`;
    case 'no':
      return `No ${x} are ${y}.`;
    case 'some':
      return `Some ${x} are ${y}.`;
    case 'someNot':
      return `Some ${x} are not ${y}.`;
  }
}

/** Neutral groups of people, so real-world knowledge can't hint at the answer. */
const GROUPS = [
  'artists', 'bakers', 'cyclists', 'dancers', 'engineers', 'farmers', 'gardeners', 'hikers',
  'jugglers', 'lawyers', 'musicians', 'painters', 'runners', 'sailors', 'teachers', 'writers',
];

function explain(p: Puzzle, counterexample?: Model): string {
  const lower = (t: string) => t[0]!.toLowerCase() + t.slice(1);
  switch (p.verdict) {
    case 'True':
      return `True. In every situation the statements allow, ${lower(sentence(p.conclusion, p.names))}`;
    case 'False':
      return `False. The statements guarantee the opposite: ${lower(sentence(negate(p.conclusion), p.names))}`;
    case 'Uncertain':
      return `Uncertain. The conclusion could be true, but it doesn't have to be. For example, the statements allow a group made up of ${describeModel(counterexample!, p.names)}. There, the conclusion fails.`;
  }
}

/** Why each wrong verdict is wrong, for Review. */
export function verdictNotes(p: Puzzle): Record<Verdict, string> {
  const opposite = sentence(negate(p.conclusion), p.names).replace(/^./, (c) => c.toLowerCase());
  const [premise] = p.premises;
  // "All A are B, so all B are A": the most common slip, worth naming when it's exactly the trap.
  const reversed =
    p.premises.length === 1 && premise!.q === 'all' && p.conclusion.q === 'all' && p.conclusion.x === premise!.y && p.conclusion.y === premise!.x;
  const [a, b] = [p.names[premise!.x]!, p.names[premise!.y]!];
  return {
    True:
      p.verdict === 'False'
        ? `The statements rule it out: they guarantee the opposite, ${opposite}`
        : reversed
          ? `"All ${a} are ${b}" doesn't mean "all ${b} are ${a}". The statements allow a situation where the conclusion fails.`
          : "It could be true, but nothing forces it: the statements also allow a situation where it fails (see above). Use only what's stated, not what seems likely.",
    False:
      p.verdict === 'True'
        ? 'The statements guarantee the conclusion, so it cannot be false.'
        : "Nothing rules it out either: some situations the statements allow make it true. If it isn't forced either way, it's uncertain.",
    Uncertain:
      p.verdict === 'True'
        ? "It isn't open: every situation the statements allow makes it true. Follow the chain of statements from one group to the other."
        : `It isn't open: the statements guarantee the opposite, ${opposite}`,
  };
}

const isParticular = (s: Statement) => s.q === 'some' || s.q === 'someNot';

export interface Puzzle {
  names: string[];
  premises: Statement[];
  conclusion: Statement;
  verdict: Verdict;
  counterexample?: Model;
}

const isNegative = (s: Statement) => s.q === 'no' || s.q === 'someNot';

export function features(p: Puzzle) {
  return {
    premises: p.premises.length,
    /** "Some" premises are harder to chain; a "some" conclusion on its own is not. */
    particular: p.premises.some(isParticular) ? 1 : 0,
    uncertain: p.verdict === 'Uncertain' ? 1 : 0,
    /** A "no" or "some … not" premise makes the chain harder to follow. */
    negative: p.premises.some(isNegative) ? 1 : 0,
  };
}

/** Premise quantifier pools (repeats weight them). Level 5 leans on "no" and "some" so True/False items exist. */
const PREMISE_QUANTIFIERS: Record<Difficulty, Quantifier[]> = {
  1: ['all'],
  2: ['all', 'no', 'all'],
  3: ['all', 'no', 'some', 'someNot', 'all'],
  4: ['all', 'no', 'some', 'someNot', 'all'],
  5: ['all', 'no', 'some', 'no', 'someNot'],
};

/** Verdicts each level can produce. Drafts aim for one at random, so no level gives the answer away. */
const VERDICTS: Record<Difficulty, Verdict[]> = {
  1: ['True', 'False'],
  2: ['True', 'False', 'Uncertain'],
  3: ['True', 'False', 'Uncertain'],
  4: ['True', 'False', 'Uncertain'],
  5: ['True', 'False', 'Uncertain'],
};

/**
 * Three premises that actually link up (some/all A are B; all B are C; all/no C are D), so the
 * conclusion about A and D can be definite. Random three-premise chains are almost always
 * Uncertain (~0.4% definite), which would starve True/False at the top level.
 */
function linkedChain(rng: Rng): Statement[] {
  const last: Statement = rng.chance(0.5) ? { q: 'all', x: 2, y: 3 } : rng.chance(0.5) ? { q: 'no', x: 2, y: 3 } : { q: 'no', x: 3, y: 2 };
  return [{ q: rng.pick(['some', 'all'] as const), x: 0, y: 1 }, { q: 'all', x: 1, y: 2 }, last];
}

/** Builds a chain of premises linking term 0 → 1 → … → n-1, and a conclusion about 0 and n-1. */
function buildPuzzle(rng: Rng, premiseCount: number, quantifiers: Quantifier[], linked = false): Puzzle | null {
  const terms = premiseCount === 1 ? 2 : premiseCount + 1;
  const names = rng.sample(GROUPS, terms);
  const anyQuantifier: Quantifier[] = ['all', 'no', 'some', 'someNot'];
  const premises = linked ? linkedChain(rng) : Array.from({ length: premiseCount }, (_, i) => {
    const [x, y] = premiseCount === 1 ? [0, 1] : [i, i + 1];
    // Some premises are stated in reverse order ("All B are A") to avoid an obvious pattern.
    return rng.chance(0.3) ? { q: rng.pick(quantifiers), x: y, y: x } : { q: rng.pick(quantifiers), x, y };
  });
  const [cx, cy] = rng.chance(0.75) ? [0, terms - 1] : [terms - 1, 0];
  const conclusion: Statement = { q: rng.pick(anyQuantifier), x: cx, y: cy };
  if (premiseCount === 1 && conclusion.q === premises[0]!.q && conclusion.x === premises[0]!.x) return null; // just a repeat
  try {
    const { verdict, counterexample } = analyse(terms, premises, conclusion);
    return { names, premises, conclusion, verdict, counterexample };
  } catch {
    return null;
  }
}

export const syllogism: Generator = {
  type: 'syllogism',
  category: 'math-logic',
  label: 'Syllogisms (True / False / Uncertain)',
  levels: [1, 2, 3, 4, 5],

  draft(rng, level, variant): Draft {
    const options = VERDICTS[level];
    const wanted = options[Math.floor(variant * options.length)]!;
    const premiseCount =
      level === 1 || (level === 2 && wanted === 'Uncertain') ? 1 : level <= 3 ? 2 : level === 4 ? rng.pick([2, 3]) : 3;
    const linked = premiseCount === 3 && wanted !== 'Uncertain' && rng.chance(0.8);
    const puzzle = buildPuzzle(rng, premiseCount, PREMISE_QUANTIFIERS[level], linked);
    if (!puzzle || puzzle.verdict !== wanted) {
      return { prompt: '', answer: text(''), distractors: [], explanation: '', features: { valid: 0 } };
    }
    const { names, premises, conclusion, verdict } = puzzle;
    const lines = premises.map((p) => sentence(p, names)).join('\n');
    return {
      prompt: `Assume the following statements are true:\n\n${lines}\n\nConclusion: ${sentence(conclusion, names)}\n\nIf the statements are true, the conclusion is:`,
      answer: text(verdict),
      distractors: [],
      fixedChoices: (['True', 'False', 'Uncertain'] as const).map((v) => (v === verdict ? text(v) : because(text(v), verdictNotes(puzzle)[v]))),
      explanation: explain(puzzle, puzzle.counterexample),
      features: { ...features(puzzle), valid: 1 },
    };
  },

  score(f) {
    if (!f.valid) return null;
    return Math.min(5, (f.premises ?? 1) + (f.particular ?? 0) + (f.uncertain ?? 0) + (f.negative ?? 0)) as Difficulty;
  },
};
