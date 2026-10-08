import { numericDistractors } from '../../engine/distractors';
import { text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';

/** Rule families, ordered by how hard the rule is to spot (the base difficulty). */
export const FAMILIES = {
  constant: 1,
  geometric: 2,
  fibonacci: 3,
  alternating: 3,
  secondOrder: 4,
  interleaved: 4,
  mixed: 5,
} as const;

export type Family = keyof typeof FAMILIES;

/** Terms above this are no longer comfortable mental math and add one level. */
export const LARGE_TERM = 150;

export interface Series {
  family: Family;
  /** Terms shown, followed by the answer as the last element. */
  terms: number[];
  /** Plausible wrong next terms, most tempting first. */
  mistakes: number[];
  rule: string;
}

export function constant(start: number, step: number, shown: number): Series {
  const terms = Array.from({ length: shown + 1 }, (_, i) => start + i * step);
  const answer = terms[shown]!;
  return {
    family: 'constant',
    terms,
    mistakes: [answer + step, answer - step + 1, answer + 1],
    rule: `add ${step} each time`,
  };
}

export function geometric(start: number, ratio: number, shown: number): Series {
  const terms = Array.from({ length: shown + 1 }, (_, i) => start * ratio ** i);
  const answer = terms[shown]!;
  const last = terms[shown - 1]!;
  const prev = terms[shown - 2]!;
  return {
    family: 'geometric',
    terms,
    mistakes: [last + (last - prev), answer + ratio, answer - last / 2],
    rule: `multiply by ${ratio} each time`,
  };
}

export function fibonacci(a: number, b: number, shown: number): Series {
  const terms = [a, b];
  while (terms.length < shown + 1) terms.push(terms.at(-1)! + terms.at(-2)!);
  const answer = terms[shown]!;
  const last = terms[shown - 1]!;
  return {
    family: 'fibonacci',
    terms,
    mistakes: [last + (last - terms[shown - 2]!), answer + 1, last * 2],
    rule: 'each term is the sum of the two before it',
  };
}

/** Two operations applied in turn, e.g. ×3 then −3. */
export function alternating(start: number, ops: [Op, Op], shown: number): Series {
  const terms = [start];
  for (let i = 0; i < shown; i++) terms.push(apply(ops[i % 2]!, terms[i]!));
  const answer = terms[shown]!;
  const last = terms[shown - 1]!;
  const otherOp = ops[shown % 2 === 0 ? 1 : 0]!;
  return {
    family: 'alternating',
    terms,
    mistakes: [apply(otherOp, last), answer + 1, answer - 1],
    rule: `alternate ${describe(ops[0])} and ${describe(ops[1])}`,
  };
}

/** Differences grow by a constant (+2, +5, +8, …) or are consecutive squares (1, 4, 9, …). */
export function secondOrder(start: number, firstGap: number, growth: number | 'squares', shown: number): Series {
  const gap = (i: number) => (growth === 'squares' ? (i + 1) ** 2 : firstGap + i * growth);
  const terms = [start];
  for (let i = 0; i < shown; i++) terms.push(terms[i]! + gap(i));
  const answer = terms[shown]!;
  const last = terms[shown - 1]!;
  const lastGap = gap(shown - 2);
  return {
    family: 'secondOrder',
    terms,
    mistakes: [last + lastGap, answer + 1, answer + (growth === 'squares' ? 2 * shown - 1 : growth)],
    rule:
      growth === 'squares'
        ? 'the gaps are consecutive squares (1, 4, 9, 16, …)'
        : `the gap grows by ${growth} each time (starting at ${firstGap})`,
  };
}

/** Two arithmetic series woven together: positions 1,3,5… and 2,4,6…. */
export function interleaved(a: number, stepA: number, b: number, stepB: number, shown: number): Series {
  const terms = Array.from({ length: shown + 1 }, (_, i) =>
    i % 2 === 0 ? a + (i / 2) * stepA : b + ((i - 1) / 2) * stepB,
  );
  const answer = terms[shown]!;
  const last = terms[shown - 1]!;
  const otherNext = shown % 2 === 0 ? last + stepB : last + stepA;
  return {
    family: 'interleaved',
    terms,
    mistakes: [otherNext, answer + (shown % 2 === 0 ? stepA : stepB), last + 1],
    rule: `two series alternate: one adds ${stepA}, the other adds ${stepB}`,
  };
}

/** Each term is the previous one multiplied and then shifted, e.g. ×2 + 1. */
export function mixed(start: number, factor: number, shift: number, shown: number): Series {
  const terms = [start];
  for (let i = 0; i < shown; i++) terms.push(terms[i]! * factor + shift);
  const answer = terms[shown]!;
  const last = terms[shown - 1]!;
  return {
    family: 'mixed',
    terms,
    mistakes: [last * factor, last + (last - terms[shown - 2]!), answer - 2 * shift],
    rule: `multiply by ${factor}, then ${shift >= 0 ? `add ${shift}` : `subtract ${-shift}`}`,
  };
}

export type Op = { kind: '+' | '-' | '×'; n: number };
const apply = (op: Op, x: number) => (op.kind === '+' ? x + op.n : op.kind === '-' ? x - op.n : x * op.n);
const describe = (op: Op) => `${op.kind === '-' ? '−' : op.kind}${op.n}`;

function build(rng: Rng, family: Family, target: Difficulty): Series {
  const big = target > FAMILIES[family]; // aim for large terms when the family alone is too easy
  switch (family) {
    case 'constant':
      return big
        ? constant(rng.int(60, 140), rng.int(11, 25), 5)
        : constant(rng.int(1, 20), rng.int(2, 9), 4);
    case 'geometric':
      return big ? geometric(rng.int(3, 6), 3, 5) : geometric(rng.int(1, 4), rng.int(2, 3), 4);
    case 'fibonacci':
      return fibonacci(rng.int(1, big ? 12 : 5), rng.int(1, big ? 12 : 6), big ? 7 : 5);
    case 'alternating': {
      const ops: [Op, Op] = rng.pick([
        [{ kind: '×', n: rng.int(2, 3) }, { kind: '-', n: rng.int(1, 4) }],
        [{ kind: '+', n: rng.int(4, 9) }, { kind: '-', n: rng.int(1, 3) }],
        [{ kind: '×', n: 2 }, { kind: '+', n: rng.int(1, 5) }],
      ]);
      return alternating(rng.int(2, big ? 20 : 8), ops, 6);
    }
    case 'secondOrder':
      return rng.chance(0.4)
        ? secondOrder(rng.int(big ? 60 : 1, big ? 120 : 10), 1, 'squares', 5)
        : secondOrder(rng.int(1, big ? 90 : 15), rng.int(1, 4), rng.int(1, 4), 5);
    case 'interleaved': {
      const [stepA, stepB] = rng.sample([2, 3, 4, 5, 6, 7, 8, 9], 2) as [number, number];
      return interleaved(rng.int(1, big ? 90 : 20), stepA, rng.int(1, big ? 90 : 20), stepB, 6);
    }
    case 'mixed':
      return mixed(rng.int(1, 4), 2, rng.pick([1, 2, 3, -1]), 5);
  }
}

export const numberSeries: Generator = {
  type: 'number-series',
  category: 'math-logic',
  label: 'Number series',
  levels: [1, 2, 3, 4, 5],

  draft(rng, target): Draft {
    // Families whose base level is the target, or one below (large terms add a level).
    const candidates = (Object.keys(FAMILIES) as Family[]).filter(
      (f) => FAMILIES[f] === target || FAMILIES[f] === target - 1,
    );
    // Geometric is the natural level-2 rule; weight it over "constant with large terms".
    const family = target === 2 && rng.chance(0.5) ? 'geometric' : rng.pick(candidates);
    const series = build(rng, family, target);
    const shown = series.terms.slice(0, -1);
    const answer = series.terms.at(-1)!;
    const largest = Math.max(...series.terms.map(Math.abs));
    const valid = series.terms.every((t) => Number.isInteger(t) && t >= 0);

    return {
      prompt: `What number comes next?\n\n${shown.join(', ')}, ?`,
      answer: text(answer),
      // Invalid drafts are rejected by score(), so don't build distractors for them.
      distractors: valid ? numericDistractors(answer, series.mistakes, 4, rng).map(text) : [],
      explanation: `The rule is: ${series.rule}. So the next number is ${answer}.`,
      features: {
        family: FAMILIES[series.family],
        largest,
        valid: valid ? 1 : 0,
      },
    };
  },

  score(f) {
    if (!f.valid) return null; // negative or fractional terms
    const level = (f.family ?? 1) + ((f.largest ?? 0) > LARGE_TERM ? 1 : 0);
    return Math.min(5, level) as Difficulty;
  },
};
