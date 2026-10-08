import { numericChoices, type Mistake } from '../../engine/distractors';
import { text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';

/** Question kinds, with their base difficulty. */
export const KINDS = { mean: 1, missing: 3, target: 3, remove: 4, combined: 4 } as const;
export type Kind = keyof typeof KINDS;

/** Totals above this make the arithmetic noticeably harder and add a level. */
export const LARGE_TOTAL = 500;

interface Problem {
  kind: Kind;
  prompt: string;
  answer: number;
  mistakes: Mistake[];
  explanation: string;
  count: number;
  /** Largest intermediate total the solver has to hold in their head. */
  total: number;
  largest: number;
  /** Smallest number shown or asked for; anything below 1 reads oddly in a test item. */
  smallest: number;
}

const COUNT_WORDS = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const list = (xs: number[]) => `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`;

/** n values whose mean is a whole number. */
function valuesWithMean(rng: Rng, n: number, mean: number, spread: number): number[] {
  const values = Array.from({ length: n - 1 }, () => mean + rng.int(-spread, spread));
  values.push(n * mean - sum(values));
  return rng.shuffle(values);
}

export function mean(values: number[]): Problem {
  const total = sum(values);
  const answer = total / values.length;
  return {
    kind: 'mean',
    prompt: `What is the average of ${list(values)}?`,
    answer,
    mistakes: [
      { value: total, why: `That's the total. Divide it by how many numbers there are (${values.length}).` },
      answer + 1,
      { value: Math.round(total / (values.length - 1)), why: `Divided by ${values.length - 1} instead of ${values.length}: count the numbers again.` },
    ],
    explanation: `${values.join(' + ')} = ${total}, and ${total} ÷ ${values.length} = ${answer}.`,
    count: values.length,
    total,
    largest: Math.max(...values),
    smallest: Math.min(...values),
  };
}

/** A group of n numbers has average `avg`; all but one are given. */
export function missing(known: number[], avg: number): Problem {
  const n = known.length + 1;
  const total = n * avg;
  const answer = total - sum(known);
  return {
    kind: 'missing',
    prompt: `A group of ${n} numbers has an average of ${avg}. ${COUNT_WORDS[known.length]} of the numbers are ${list(known)}. What is the remaining number?`,
    answer,
    mistakes: [
      { value: avg, why: "That's the average itself, not the missing number." },
      answer + n,
      { value: Math.round(sum(known) / known.length), why: "That's the average of the known numbers. Find the total (count × average) and subtract their sum." },
    ],
    explanation: `The ${n} numbers add up to ${n} × ${avg} = ${total}. ${total} − ${sum(known)} = ${answer}.`,
    count: n,
    total,
    largest: Math.max(answer, ...known),
    smallest: Math.min(answer, ...known),
  };
}

/** n scores average `oldAvg`; what next score lifts the average to `newAvg`? */
export function target(n: number, oldAvg: number, newAvg: number): Problem {
  const total = (n + 1) * newAvg;
  const answer = total - n * oldAvg;
  return {
    kind: 'target',
    prompt: `The average of ${n} test scores is ${oldAvg}. What score is needed on the next test to raise the average to ${newAvg}?`,
    answer,
    mistakes: [
      { value: newAvg + (newAvg - oldAvg), why: `Allowed for the rise of ${newAvg - oldAvg} only once. The new score must also lift each of the ${n} earlier scores by ${newAvg - oldAvg}.` },
      { value: newAvg, why: "That's the target average. The new score has to be higher to pull the others up." },
      answer - (n + 1),
    ],
    explanation: `${n + 1} scores averaging ${newAvg} total ${total}. The first ${n} total ${n} × ${oldAvg} = ${n * oldAvg}, so the next score is ${total} − ${n * oldAvg} = ${answer}.`,
    count: n + 1,
    total,
    largest: answer,
    smallest: answer,
  };
}

/** n numbers average `avg`; one is removed and the rest average `newAvg`. */
export function remove(n: number, avg: number, newAvg: number): Problem {
  const total = n * avg;
  const answer = total - (n - 1) * newAvg;
  return {
    kind: 'remove',
    prompt: `${n} numbers have an average of ${avg}. When one number is removed, the average of the rest is ${newAvg}. What number was removed?`,
    answer,
    mistakes: [
      { value: Math.abs(avg - newAvg), why: "That's how much the average changed, not the number removed." },
      { value: avg + (avg - newAvg), why: `Counted the change in average only once. It applies to each of the ${n - 1} numbers left.` },
      answer + 2,
    ],
    explanation: `Before: ${n} × ${avg} = ${total}. After: ${n - 1} × ${newAvg} = ${(n - 1) * newAvg}. The removed number is ${total} − ${(n - 1) * newAvg} = ${answer}.`,
    count: n,
    total,
    largest: Math.max(answer, avg, newAvg),
    smallest: answer,
  };
}

/** Two groups with known sizes and averages; what is the overall average? */
export function combined(n1: number, a1: number, n2: number, a2: number): Problem {
  const total = n1 * a1 + n2 * a2;
  const answer = total / (n1 + n2);
  return {
    kind: 'combined',
    prompt: `A group of ${n1} people averaged ${a1} points, and another group of ${n2} people averaged ${a2} points. What is the average across all ${n1 + n2} people?`,
    answer,
    mistakes: [
      { value: (a1 + a2) / 2, why: `Averaged ${a1} and ${a2} directly, ignoring that the groups have different sizes (${n1} and ${n2}).` },
      answer + 1,
      answer - 1,
    ],
    explanation: `Total points: ${n1} × ${a1} + ${n2} × ${a2} = ${total}. ${total} ÷ ${n1 + n2} = ${answer}. (Averaging ${a1} and ${a2} directly gives ${(a1 + a2) / 2}, which ignores the group sizes.)`,
    count: n1 + n2,
    total,
    largest: Math.max(a1, a2),
    smallest: answer,
  };
}

function build(rng: Rng, kind: Kind, big: boolean): Problem {
  switch (kind) {
    case 'mean': {
      const n = big ? rng.int(4, 5) : 3;
      return mean(valuesWithMean(rng, n, rng.int(big ? 12 : 3, big ? 40 : 8), big ? 9 : 2));
    }
    case 'missing': {
      const avg = rng.int(big ? 85 : 10, big ? 120 : 25);
      const n = big ? 6 : 3;
      const known = Array.from({ length: n - 1 }, () => avg + rng.int(-9, 9));
      return missing(known, avg);
    }
    case 'target': {
      const oldAvg = rng.int(70, 90);
      return target(big ? rng.int(5, 6) : rng.int(3, 4), oldAvg, oldAvg + rng.int(1, 3));
    }
    case 'remove': {
      const avg = rng.int(big ? 75 : 10, big ? 110 : 25);
      return remove(big ? rng.int(7, 8) : rng.int(4, 5), avg, avg + rng.int(-4, -1));
    }
    case 'combined': {
      // Small groups keep the total under LARGE_TOTAL; drafts with a fractional result are rejected.
      const n1 = rng.int(big ? 5 : 2, big ? 8 : 4);
      const n2 = rng.int(big ? 5 : 2, big ? 8 : 4);
      return combined(n1, rng.int(6, big ? 18 : 12) * 5, n2, rng.int(6, big ? 18 : 12) * 5);
    }
  }
}

export const average: Generator = {
  type: 'average',
  category: 'math-logic',
  label: 'Averages',
  levels: [1, 2, 3, 4, 5],

  draft(rng, level): Draft {
    const kinds = (Object.keys(KINDS) as Kind[]).filter(
      (k) => KINDS[k] === level || KINDS[k] === level - 1,
    );
    const kind = kinds.length ? rng.pick(kinds) : 'mean';
    const p = build(rng, kind, level > KINDS[kind]);
    const whole = Number.isInteger(p.answer) && p.smallest >= 1;
    return {
      prompt: p.prompt,
      answer: text(p.answer),
      // Fractional answers are rejected by score(), so don't build distractors for them.
      distractors: whole ? numericChoices(p.answer, p.mistakes, 4, rng) : [],
      explanation: p.explanation,
      features: {
        kind: KINDS[p.kind],
        count: p.count,
        total: p.total,
        largest: p.largest,
        whole: whole ? 1 : 0,
      },
    };
  },

  score(f) {
    if (!f.whole) return null;
    const kind = f.kind ?? 1;
    if (kind === KINDS.mean) {
      // 3 small values is level 1; more values or larger ones is level 2.
      return (f.count ?? 3) <= 3 && (f.largest ?? 0) <= 10 ? 1 : 2;
    }
    return Math.min(5, kind + ((f.total ?? 0) > LARGE_TOTAL ? 1 : 0)) as Difficulty;
  },
};
