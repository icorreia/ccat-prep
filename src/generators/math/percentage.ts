import { numericChoices } from '../../engine/distractors';
import { because, text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Choice, Difficulty, Draft, Generator } from '../../engine/types';
import { money, percent } from './format';

/** Question kinds, with their base difficulty. */
export const KINDS = { of: 1, whatPercent: 2, change: 3, reverse: 3, successive: 4, lessThan: 4, points: 4 } as const;
export type Kind = keyof typeof KINDS;

/** Percentages most people can apply at a glance. Anything else adds a level. */
export const FRIENDLY = [10, 20, 25, 50, 75, 100];

interface Problem {
  kind: Kind;
  prompt: string;
  answer: Choice;
  distractors: Choice[];
  explanation: string;
  /** Every percentage the solver must work with is in FRIENDLY. */
  friendly: boolean;
  steps: number;
  valid: boolean;
}

const isFriendly = (...ps: number[]) => ps.every((p) => FRIENDLY.includes(Math.abs(p)));

export function of(p: number, n: number, rng: Rng): Problem {
  const answer = (p * n) / 100;
  const valid = Number.isInteger(answer) && answer > 0;
  return {
    kind: 'of',
    prompt: `What is ${p}% of ${n}?`,
    answer: text(answer),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: n - answer, why: `That's the other ${100 - p}% (${n} − ${answer}).` },
            answer * 2,
            { value: (p * n) / 10, why: 'Divided by 10 instead of 100: a decimal-point slip.' },
            { value: p, why: `That's just the percentage itself, not ${p}% of ${n}.` },
          ],
          4,
          rng,
        )
      : [],
    explanation: `${p}% of ${n} = ${p}/100 × ${n} = ${answer}.`,
    friendly: isFriendly(p),
    steps: 1,
    valid,
  };
}

/** Percentage change from `from` to `to`, always asked as a positive increase or decrease. */
export function change(from: number, to: number, rng: Rng): Problem {
  const diff = Math.abs(to - from);
  const answer = (diff / from) * 100;
  const direction = to > from ? 'increase' : 'decrease';
  const wrongBase = (diff / to) * 100;
  const valid = Number.isInteger(answer) && answer > 0 && answer < 100;
  return {
    kind: 'change',
    prompt: `A price ${to > from ? 'rises' : 'falls'} from ${money(from)} to ${money(to)}. What is the percentage ${direction}?`,
    answer: text(percent(answer)),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: wrongBase, why: `Divided the change by the new price (${money(to)}). Percentage change is measured against the original, ${money(from)}.` },
            { value: diff, why: `That's the change in dollars (${money(diff)}), not as a percentage.` },
            answer + 5,
            answer - 5,
          ],
          4,
          rng,
          { step: 5, format: percent },
        )
      : [],
    explanation: `The change is ${money(diff)}. Divide by the original price: ${diff} ÷ ${from} = ${answer}%. (Dividing by the new price, ${to}, is the common mistake.)`,
    friendly: isFriendly(answer),
    steps: 2,
    valid,
  };
}

/** After a p% discount (or increase) the price is `after`; what was it before? */
export function reverse(p: number, after: number, rng: Rng): Problem {
  const factor = 100 + p;
  const answer = (after * 100) / factor;
  const forward = (after * (100 - p)) / 100;
  const valid = Number.isInteger(answer) && answer > 0;
  const label = p < 0 ? `a ${-p}% discount` : `a ${p}% increase`;
  return {
    kind: 'reverse',
    prompt: `After ${label}, an item costs ${money(after)}. What was the price before?`,
    answer: text(money(answer)),
    distractors: valid
      ? numericChoices(
          answer,
          [
            {
              value: forward,
              why:
                p < 0
                  ? `Added ${-p}% to ${money(after)}. The discount was taken from the old price, so divide by ${factor / 100} instead.`
                  : `Took ${p}% off ${money(after)}. The increase was added to the old price, so divide by ${factor / 100} instead.`,
            },
            { value: after - p, why: `Treated ${Math.abs(p)}% as ${money(Math.abs(p))}.` },
            { value: after + Math.abs(p), why: `Treated ${Math.abs(p)}% as ${money(Math.abs(p))}.` },
          ],
          4,
          rng,
          { format: money },
        )
      : [],
    explanation:
      `The new price is ${factor}% of the old one, so the old price is ${after} ÷ ${factor / 100} = ${money(answer)}.` +
      (Number.isInteger(forward)
        ? ` (${p < 0 ? `Adding ${-p}% to` : `Taking ${p}% off`} ${money(after)} gives ${money(forward)}, which is the common mistake.)`
        : ''),
    friendly: isFriendly(p),
    steps: 2,
    valid,
  };
}

/** "x is what percentage of y?": the trap is dividing the wrong way round. */
export function whatPercent(part: number, whole: number, rng: Rng): Problem {
  const answer = (part / whole) * 100;
  const valid = Number.isInteger(answer) && answer > 0 && answer < 100;
  return {
    kind: 'whatPercent',
    prompt: `${part} is what percentage of ${whole}?`,
    answer: text(percent(answer)),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: (whole / part) * 100, why: `Divided the wrong way round (${whole} ÷ ${part}). The number after "of" is the whole: ${part} ÷ ${whole}.` },
            { value: 100 - answer, why: `That's the rest: what ${whole} − ${part} is as a percentage of ${whole}.` },
            { value: whole - part, why: `That's the difference (${whole} − ${part}), not a percentage.` },
          ],
          4,
          rng,
          { step: 5, format: percent },
        )
      : [],
    explanation: `Part ÷ whole: ${part} ÷ ${whole} = ${answer / 100}, which is ${percent(answer)}.`,
    friendly: isFriendly(answer),
    steps: 1,
    valid,
  };
}

/** "A is p% more than B; how much less is B than A?" The same p% back is the trap: the base changes. */
export function lessThan(p: number, rng: Rng): Problem {
  const answer = (p / (100 + p)) * 100;
  const valid = Number.isInteger(answer);
  return {
    kind: 'lessThan',
    prompt: `A's salary is ${p}% higher than B's. By what percentage is B's salary lower than A's?`,
    answer: text(percent(answer)),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: p, why: `The same ${p}% back. But "lower than A's" measures against A, the bigger salary, so the percentage is smaller.` },
            { value: 100 - answer, why: `That's B's salary as a percentage of A's, not how much lower it is.` },
          ],
          4,
          rng,
          { step: 5, format: percent },
        )
      : [],
    explanation: `Say B earns 100. Then A earns ${100 + p}. B is ${p} lower, and ${p} ÷ ${100 + p} = ${percent(answer)} of A's salary.`,
    friendly: isFriendly(p),
    steps: 2,
    valid,
  };
}

/** A rate goes from `from`% to `to`%: the percentage increase, not the rise in percentage points. */
export function points(from: number, to: number, rng: Rng): Problem {
  const answer = ((to - from) / from) * 100;
  const valid = Number.isInteger(answer) && answer > 0;
  return {
    kind: 'points',
    prompt: `A bank raises its interest rate from ${from}% to ${to}%. By what percentage did the interest rate increase?`,
    answer: text(percent(answer)),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: to - from, why: `That's the rise in percentage points (${to} − ${from}). As a percentage of the old rate, it's ${percent(answer)}.` },
            { value: ((to - from) / to) * 100, why: `Divided by the new rate (${to}%). Measure the change from the old rate (${from}%).` },
            { value: to, why: "That's the new rate itself, not the increase." },
          ],
          4,
          rng,
          { step: 5, format: percent },
        )
      : [],
    explanation: `The rate rose by ${to - from} percentage points. As a share of the old rate: ${to - from} ÷ ${from} = ${percent(answer)}.`,
    friendly: isFriendly(answer),
    steps: 2,
    valid,
  };
}

const signed = (n: number) => (n === 0 ? 'No change' : `${percent(Math.abs(n))} ${n > 0 ? 'increase' : 'decrease'}`);

/** Successive changes, e.g. +20% then −20% → 4% decrease. */
export function successive(changes: number[]): Problem {
  const factor = changes.reduce((f, c) => f * (1 + c / 100), 1);
  const answer = Math.round((factor - 1) * 10000) / 100;
  const naive = changes.reduce((a, b) => a + b, 0);
  const valid = Number.isInteger(answer);
  const steps = changes.map((c) => `${c > 0 ? 'increased' : 'decreased'} by ${Math.abs(c)}%`);
  const notes = new Map([
    [naive, "Added the percentages. Each change applies to the price after the previous one, so they don't simply add up."],
    [-answer, 'Right size, wrong direction.'],
  ]);
  const candidates = [naive, -answer, answer + 2, answer - 2, answer + 5, answer - 5, answer + 10];
  const distractors = [...new Set(candidates.filter((v) => v !== answer && Number.isInteger(v)))]
    .slice(0, 4)
    .map((v) => (notes.has(v) ? because(text(signed(v)), notes.get(v)!) : text(signed(v))));
  return {
    kind: 'successive',
    prompt: `A price is ${steps.slice(0, -1).join(', then ')} and then ${steps.at(-1)}. What is the overall change?`,
    answer: text(signed(answer)),
    distractors,
    explanation: `Multiply the factors: ${changes.map((c) => (1 + c / 100).toString()).join(' × ')} = ${Math.round(factor * 10000) / 10000}, which is ${answer === 0 ? 'no change' : `a ${signed(answer)}`}. Adding the percentages (${signed(naive).toLowerCase()}) ignores that each change applies to a different base.`,
    friendly: isFriendly(...changes),
    steps: changes.length,
    valid,
  };
}

function build(rng: Rng, kind: Kind, hard: boolean): Problem {
  const pct = () => (hard ? rng.pick([15, 30, 40, 60, 35, 45, 5]) : rng.pick([10, 20, 25, 50]));
  switch (kind) {
    case 'of':
      return of(hard ? rng.pick([15, 30, 40, 60, 35, 5]) : rng.pick(FRIENDLY.slice(0, 5)), rng.int(2, 30) * 10, rng);
    case 'change': {
      const from = rng.pick([20, 40, 50, 60, 80, 120, 150, 200, 250]);
      const p = pct();
      return change(from, rng.chance(0.5) ? from + (from * p) / 100 : from - (from * p) / 100, rng);
    }
    case 'reverse': {
      const p = rng.chance(0.6) ? -pct() : pct();
      const before = rng.int(2, 30) * 10;
      return reverse(p, (before * (100 + p)) / 100, rng);
    }
    case 'whatPercent': {
      const whole = rng.pick([20, 40, 50, 80, 120, 160, 200, 250, 300, 400]);
      const p = hard ? rng.pick([15, 30, 35, 40, 45, 60, 70, 80]) : rng.pick([10, 20, 25, 50, 75]);
      return whatPercent((whole * p) / 100, whole, rng);
    }
    case 'lessThan':
      return lessThan(hard ? rng.pick([150, 300, 400]) : rng.pick([25, 100]), rng);
    case 'points': {
      const from = rng.pick([4, 5, 8, 10, 12, 20]);
      const p = hard ? rng.pick([20, 30, 40, 60, 75]) : rng.pick([25, 50, 100]);
      return points(from, (from * (100 + p)) / 100, rng);
    }
    case 'successive': {
      const step = () => rng.pick(hard ? [10, 20, 30, 50] : [10, 20, 25, 50]) * (rng.chance(0.5) ? 1 : -1);
      return successive(hard ? [step(), step(), step()] : [step(), step()]);
    }
  }
}

export const percentage: Generator = {
  type: 'percentage',
  category: 'math-logic',
  label: 'Percentages',
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
      features: {
        kind: KINDS[p.kind],
        friendly: p.friendly ? 1 : 0,
        steps: p.steps,
        // Other kinds share successive's base level, so it's flagged explicitly for score().
        successive: p.kind === 'successive' ? 1 : 0,
        valid: p.valid ? 1 : 0,
      },
    };
  },

  score(f) {
    if (!f.valid) return null;
    const kind = f.kind ?? 1;
    if (f.successive) return ((f.steps ?? 2) > 2 ? 5 : 4) as Difficulty;
    return Math.min(5, kind + (f.friendly ? 0 : 1)) as Difficulty;
  },
};
