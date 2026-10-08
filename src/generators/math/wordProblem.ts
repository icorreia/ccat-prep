import { numericChoices, type Mistake } from '../../engine/distractors';
import { text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Choice, Difficulty, Draft, Generator } from '../../engine/types';
import { money } from './format';

/**
 * Question kinds and the number of reasoning steps each needs (which is its difficulty):
 * scale 2, meeting 3, combinedWork 4, roundTrip 5, ages 5.
 */
export const KINDS = { scale: 2, meeting: 3, combinedWork: 4, roundTrip: 5, ages: 5 } as const;
export type Kind = keyof typeof KINDS;

interface Problem {
  kind: Kind;
  prompt: string;
  answer: Choice;
  distractors: Choice[];
  explanation: string;
  valid: boolean;
}

const nums = (answer: number, mistakes: Mistake[], rng: Rng, format: (n: number) => string = String) =>
  numericChoices(answer, mistakes, 4, rng, { format });

/** Direct proportion: `n1` units take/cost `v1`; what about `n2`? */
export function scale(n1: number, v1: number, n2: number, setting: 'drive' | 'buy', rng: Rng): Problem {
  const unit = v1 / n1;
  const answer = unit * n2;
  const valid = Number.isInteger(unit) && n1 !== n2;
  const prompt =
    setting === 'drive'
      ? `A car travels ${v1} miles in ${n1} hours. At the same speed, how many miles does it travel in ${n2} hours?`
      : `${n1} tickets cost ${money(v1)}. At the same price, how much do ${n2} tickets cost?`;
  const format = setting === 'buy' ? money : String;
  return {
    kind: 'scale',
    prompt,
    answer: text(format(answer)),
    distractors: valid
      ? nums(
          answer,
          [
            { value: v1 + n2, why: `Added ${n2} to ${v1}. Find the rate for one ${setting === 'drive' ? 'hour' : 'ticket'} (${v1} ÷ ${n1}) and multiply.` },
            { value: v1 * n2, why: `Multiplied ${v1} by ${n2} without first dividing by ${n1} to get the rate for one ${setting === 'drive' ? 'hour' : 'ticket'}.` },
            { value: answer - unit, why: `That's ${n2 - 1} ${setting === 'drive' ? 'hours' : 'tickets'}' worth, not ${n2}: an off-by-one.` },
          ],
          rng,
          format,
        )
      : [],
    explanation: `One ${setting === 'drive' ? 'hour' : 'ticket'}: ${v1} ÷ ${n1} = ${unit}. ${n2} × ${unit} = ${format(answer)}.`,
    valid,
  };
}

/** Two travellers `distance` apart head toward each other. */
export function meeting(distance: number, s1: number, s2: number, rng: Rng): Problem {
  const answer = distance / (s1 + s2);
  const valid = Number.isInteger(answer);
  return {
    kind: 'meeting',
    prompt: `Two trains are ${distance} km apart and travel toward each other at ${s1} km/h and ${s2} km/h. After how many hours do they meet?`,
    answer: text(answer),
    distractors: valid
      ? nums(
          answer,
          [
            { value: distance / s1, why: `Used only the first train's speed. Together they close the gap at ${s1} + ${s2} = ${s1 + s2} km/h.` },
            { value: distance / s2, why: `Used only the second train's speed. Together they close the gap at ${s1} + ${s2} = ${s1 + s2} km/h.` },
            { value: distance / Math.abs(s1 - s2), why: 'Subtracted the speeds. Trains moving toward each other add their speeds.' },
          ],
          rng,
        )
      : [],
    explanation: `They close the gap at ${s1} + ${s2} = ${s1 + s2} km/h. ${distance} ÷ ${s1 + s2} = ${answer} hours.`,
    valid,
  };
}

/** Pipe A fills a tank in `a` hours, pipe B in `b` hours; together? */
export function combinedWork(a: number, b: number, rng: Rng): Problem {
  const answer = (a * b) / (a + b);
  const valid = Number.isInteger(answer) && a !== b;
  return {
    kind: 'combinedWork',
    prompt: `Pipe A fills a tank in ${a} hours and pipe B fills it in ${b} hours. How many hours do they take together?`,
    answer: text(answer),
    distractors: valid
      ? nums(
          answer,
          [
            { value: (a + b) / 2, why: `Averaged the two times. Add the rates instead: 1/${a} + 1/${b} of the tank per hour.` },
            { value: Math.abs(a - b), why: `Subtracted the times. Add the rates instead: 1/${a} + 1/${b} of the tank per hour.` },
            { value: a + b, why: `Added the times. Two pipes together are faster than either alone, so the answer is under ${Math.min(a, b)} hours.` },
            { value: Math.min(a, b), why: `That's pipe ${a < b ? 'A' : 'B'} on its own. With both pipes running it's faster.` },
          ],
          rng,
        )
      : [],
    explanation: `Per hour, A fills 1/${a} and B fills 1/${b} of the tank: together ${a + b}/${a * b} = 1/${answer}. So it takes ${answer} hours. (Averaging the times, ${(a + b) / 2}, is the trap.)`,
    valid,
  };
}

/** Out at `s1`, back the same distance at `s2`; average speed for the round trip? */
export function roundTrip(distance: number, s1: number, s2: number, rng: Rng): Problem {
  const time = distance / s1 + distance / s2;
  const answer = (2 * distance) / time;
  const valid = Number.isInteger(distance / s1) && Number.isInteger(distance / s2) && Number.isInteger(answer) && s1 !== s2;
  return {
    kind: 'roundTrip',
    prompt: `A driver goes ${distance} km to a city at ${s1} km/h and returns the same way at ${s2} km/h. What is the average speed for the whole trip, in km/h?`,
    answer: text(answer),
    distractors: valid
      ? nums(
          answer,
          [
            { value: (s1 + s2) / 2, why: `Averaged the two speeds. The slower leg takes longer, so divide the total distance (${2 * distance} km) by the total time.` },
            Math.max(s1, s2) - 5,
            answer + 2,
          ],
          rng,
        )
      : [],
    explanation: `Time: ${distance} ÷ ${s1} + ${distance} ÷ ${s2} = ${distance / s1} + ${distance / s2} = ${time} hours for ${2 * distance} km. ${2 * distance} ÷ ${time} = ${answer} km/h. (The plain average of the speeds, ${(s1 + s2) / 2}, ignores that the slower leg takes longer.)`,
    valid,
  };
}

/** A is `k` times as old as B; in `n` years A will be `m` times as old. How old is B? */
export function ages(k: number, m: number, n: number, names: [string, string], rng: Rng): Problem {
  const b = ((m - 1) * n) / (k - m);
  const a = k * b;
  const valid = Number.isInteger(b) && b > 0 && k > m;
  const times = (t: number) => (t === 2 ? 'twice' : `${t} times`);
  return {
    kind: 'ages',
    prompt: `${names[0]} is ${times(k)} as old as ${names[1]}. In ${n} years, ${names[0]} will be ${times(m)} as old as ${names[1]}. How old is ${names[1]} now?`,
    answer: text(b),
    distractors: valid
      ? nums(
          b,
          [
            { value: a, why: `That's ${names[0]}'s age now. The question asks for ${names[1]}.` },
            { value: b + n, why: `That's ${names[1]}'s age in ${n} years, not now.` },
            n,
            { value: a - b, why: `That's the difference in their ages.` },
          ],
          rng,
        )
      : [],
    explanation: `Let ${names[1]} be x, so ${names[0]} is ${k}x. Then ${k}x + ${n} = ${m}(x + ${n}), so ${k - m === 1 ? `x = ${b}` : `${k - m}x = ${(m - 1) * n} and x = ${b}`}. Check: ${a} + ${n} = ${a + n} = ${m} × ${b + n}.`,
    valid,
  };
}

const NAMES: [string, string][] = [
  ['Ana', 'Ben'],
  ['Maya', 'Leo'],
  ['Sara', 'Tom'],
  ['Ines', 'Raj'],
];

function build(rng: Rng, kind: Kind): Problem {
  switch (kind) {
    case 'scale': {
      const n1 = rng.int(2, 6);
      const setting = rng.pick(['drive', 'buy'] as const);
      const unit = setting === 'drive' ? rng.int(4, 13) * 5 : rng.int(3, 15);
      return scale(n1, unit * n1, rng.int(2, 9), setting, rng);
    }
    case 'meeting': {
      const [s1, s2] = [rng.int(4, 12) * 10, rng.int(4, 12) * 10];
      return meeting((s1 + s2) * rng.int(2, 5), s1, s2, rng);
    }
    case 'combinedWork':
      return combinedWork(...rng.pick([[6, 3], [12, 6], [10, 15], [12, 4], [30, 6], [20, 5], [6, 12], [3, 6], [20, 30], [4, 12]] as [number, number][]), rng);
    case 'roundTrip': {
      const [s1, s2] = rng.pick([[60, 40], [30, 60], [40, 60], [60, 90], [20, 30], [30, 20], [90, 60]] as [number, number][]);
      return roundTrip(rng.pick([60, 120, 180, 360]), s1, s2, rng);
    }
    case 'ages': {
      const [k, m] = rng.pick([[3, 2], [4, 2], [4, 3], [5, 3], [5, 2]] as [number, number][]);
      return ages(k, m, rng.int(2, 12), rng.pick(NAMES), rng);
    }
  }
}

export const wordProblem: Generator = {
  type: 'word-problem',
  category: 'math-logic',
  label: 'Word problems',
  levels: [2, 3, 4, 5],

  draft(rng, level): Draft {
    const kinds = (Object.keys(KINDS) as Kind[]).filter((k) => KINDS[k] === level);
    const p = build(rng, rng.pick(kinds));
    return {
      prompt: p.prompt,
      answer: p.answer,
      distractors: p.distractors,
      explanation: p.explanation,
      features: { steps: KINDS[p.kind], valid: p.valid ? 1 : 0 },
    };
  },

  score: (f) => (f.valid ? ((f.steps ?? 2) as Difficulty) : null),
};
