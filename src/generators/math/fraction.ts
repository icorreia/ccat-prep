import { numericChoices } from '../../engine/distractors';
import { because, text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Choice, Difficulty, Draft, Generator } from '../../engine/types';
import { fraction, gcd, lcm } from './format';

/** Question kinds, with their base difficulty. */
export const KINDS = { of: 1, compare: 3, remainder: 4, remainderOfRest: 5 } as const;
export type Kind = keyof typeof KINDS;

/** Two fractions closer than this are hard to order without converting; adds a level. */
export const CLOSE_GAP = 0.03;

/** If the answer beats the runner-up by more than this, the item is too obvious to use. */
export const MAX_GAP = 0.1;

export type Frac = [numerator: number, denominator: number];

interface Problem {
  kind: Kind;
  prompt: string;
  answer: Choice;
  distractors: Choice[];
  explanation: string;
  /** Extra difficulty within the kind (non-unit fraction, close values, …). */
  harder: boolean;
  valid: boolean;
}

const value = ([n, d]: Frac) => n / d;
const show = ([n, d]: Frac) => fraction(n, d);

export function of([a, b]: Frac, n: number, rng: Rng): Problem {
  const answer = (a * n) / b;
  const valid = Number.isInteger(answer) && gcd(a, b) === 1 && a < b;
  return {
    kind: 'of',
    prompt: `What is ${a}/${b} of ${n}?`,
    answer: text(answer),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: n / b, why: `That's 1/${b} of ${n}. Multiply by ${a} as well.` },
            { value: n - answer, why: `That's the part left over (${n} − ${answer}).` },
            { value: (b * n) / a, why: `Divided by ${a}/${b} instead of multiplying.` },
          ],
          4,
          rng,
        )
      : [],
    explanation: `${n} ÷ ${b} = ${n / b}, and ${n / b} × ${a} = ${answer}.`,
    harder: a !== 1 || n > 50,
    valid,
  };
}

/** Which of these fractions is the largest (or smallest)? The choices are the fractions. */
export function compare(fracs: Frac[], largest: boolean): Problem {
  const sorted = [...fracs].sort((x, y) => value(y) - value(x));
  const best = largest ? sorted[0]! : sorted.at(-1)!;
  const runnerUp = largest ? sorted[1]! : sorted.at(-2)!;
  const values = new Set(fracs.map(value));
  const reduced = fracs.every(([n, d]) => gcd(n, d) === 1);
  const byNumerator = [...fracs].sort((x, y) => (largest ? y[0] - x[0] : x[0] - y[0]))[0]!;
  return {
    kind: 'compare',
    prompt: `Which of these fractions is the ${largest ? 'largest' : 'smallest'}?`,
    answer: text(show(best)),
    // The fraction with the biggest numerator is the classic trap, so it goes first.
    distractors: [
      because(
        text(show(byNumerator)),
        `Has the ${largest ? 'biggest' : 'smallest'} numerator, but the denominators differ: compare the values, not the numerators.`,
      ),
      because(text(show(runnerUp)), `Close, but slightly ${largest ? 'smaller' : 'larger'}. Compare as decimals or by cross-multiplying.`),
      ...fracs.map((f) => text(show(f))),
    ].filter((c) => c.text !== show(best)),
    explanation: `Convert to decimals: ${fracs.map((f) => `${show(f)} ≈ ${value(f).toFixed(3)}`).join(', ')}. The ${largest ? 'largest' : 'smallest'} is ${show(best)}.`,
    harder: Math.abs(value(best) - value(runnerUp)) < CLOSE_GAP,
    valid: values.size === fracs.length && reduced && Math.abs(value(best) - value(runnerUp)) <= MAX_GAP,
  };
}

/** f1 and then f2 of a tank are used (both of the full tank), leaving `left`. */
export function remainder(f1: Frac, f2: Frac, total: number, rng: Rng): Problem {
  // Exact integer arithmetic: 36 × (1 − 7/12) is 15.000000000000002 in floating point.
  const d = lcm(f1[1], f2[1]);
  const usedFrac: Frac = [f1[0] * (d / f1[1]) + f2[0] * (d / f2[1]), d];
  const leftFrac: Frac = [d - usedFrac[0], d];
  const used = value(usedFrac);
  const left = (total * leftFrac[0]) / d;
  const valid = used < 1 && Number.isInteger(left) && left > 0;
  return {
    kind: 'remainder',
    prompt: `A tank is full. First ${show(f1)} of the water is used, then another ${show(f2)} of the full tank. ${left} litres remain. How many litres does the tank hold?`,
    answer: text(total),
    distractors: valid
      ? numericChoices(
          total,
          [
            { value: Math.round(left / used), why: `Divided the ${left} L by the fraction used (${show(usedFrac)}) instead of the fraction left (${show(leftFrac)}).` },
            { value: left * 2, why: 'Doubled what remains, as if exactly half the tank were left.' },
            { value: Math.round(left / (1 - value(f1))), why: `Only allowed for the first ${show(f1)}; the second ${show(f2)} was used too.` },
          ],
          4,
          rng,
        )
      : [],
    explanation: `Used: ${show(f1)} + ${show(f2)} = ${show(usedFrac)}, so ${show(leftFrac)} remains. ${show(leftFrac)} of the tank is ${left} L, so the tank holds ${left} ÷ ${show(leftFrac)} = ${total} L.`,
    harder: false,
    valid,
  };
}

/** f1 of the tank is used, then f2 of what is left, leaving `left`. */
export function remainderOfRest(f1: Frac, f2: Frac, total: number, rng: Rng): Problem {
  const afterFirst = (total * (f1[1] - f1[0])) / f1[1];
  const left = (afterFirst * (f2[1] - f2[0])) / f2[1];
  // Treating both fractions as fractions of the full tank is the trap.
  const naiveLeftShare = 1 - value(f1) - value(f2);
  const valid = Number.isInteger(afterFirst) && Number.isInteger(left) && left > 0;
  return {
    kind: 'remainderOfRest',
    prompt: `A tank is full. First ${show(f1)} of the water is used, then ${show(f2)} of what is left. ${left} litres remain. How many litres does the tank hold?`,
    answer: text(total),
    distractors: valid
      ? numericChoices(
          total,
          [
            {
              value: naiveLeftShare > 0 ? Math.round(left / naiveLeftShare) : -1,
              why: `Treated ${show(f2)} as a fraction of the full tank. It's ${show(f2)} of what was left after the first step.`,
            },
            { value: afterFirst, why: `That's how much was left after the first step only (${afterFirst} L).` },
            { value: left * 2, why: 'Doubled what remains, as if exactly half the tank were left.' },
          ],
          4,
          rng,
        )
      : [],
    explanation: `Using ${show(f1)} leaves ${show([f1[1] - f1[0], f1[1]])} of the tank (${afterFirst} L). Using ${show(f2)} of that leaves ${show([f2[1] - f2[0], f2[1]])} of it (${left} L). Working backwards: ${left} ÷ ${show([f2[1] - f2[0], f2[1]])} = ${afterFirst}, then ${afterFirst} ÷ ${show([f1[1] - f1[0], f1[1]])} = ${total} L.`,
    harder: false,
    valid,
  };
}

const UNIT: Frac[] = [[1, 2], [1, 3], [1, 4], [1, 5], [1, 10]];
const NON_UNIT: Frac[] = [[2, 3], [3, 4], [2, 5], [3, 5], [5, 6], [3, 8], [5, 8], [7, 10]];
const COMPARE_POOL: Frac[] = [
  [1, 2], [2, 3], [3, 4], [3, 5], [5, 8], [7, 12], [4, 7], [5, 9], [7, 10], [2, 5], [5, 6], [4, 9], [7, 11], [3, 7],
];

function build(rng: Rng, kind: Kind, hard: boolean): Problem {
  switch (kind) {
    case 'of': {
      const f = hard ? rng.pick(NON_UNIT) : rng.pick(UNIT);
      return of(f, f[1] * rng.int(hard ? 4 : 2, hard ? 12 : 9), rng);
    }
    case 'compare':
      return compare(rng.sample(COMPARE_POOL, 5), rng.chance(0.7));
    case 'remainder':
    case 'remainderOfRest': {
      const [f1, f2] = rng.sample<Frac>([[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 5], [1, 8]], 2) as [Frac, Frac];
      const total = lcm(f1[1], f2[1]) * rng.int(2, 6);
      return kind === 'remainder' ? remainder(f1, f2, total, rng) : remainderOfRest(f1, f2, total, rng);
    }
  }
}

export const fractionGenerator: Generator = {
  type: 'fraction',
  category: 'math-logic',
  label: 'Fractions',
  levels: [1, 2, 3, 4, 5],

  draft(rng, level): Draft {
    const kinds = (Object.keys(KINDS) as Kind[]).filter((k) => KINDS[k] === level || KINDS[k] === level - 1);
    const kind = kinds.length ? rng.pick(kinds) : 'of';
    const p = build(rng, kind, level > KINDS[kind]);
    return {
      prompt: p.prompt,
      answer: p.answer,
      distractors: p.distractors,
      explanation: p.explanation,
      features: { kind: KINDS[p.kind], harder: p.harder ? 1 : 0, valid: p.valid ? 1 : 0 },
    };
  },

  score(f) {
    if (!f.valid) return null;
    return Math.min(5, (f.kind ?? 1) + (f.harder ? 1 : 0)) as Difficulty;
  },
};
