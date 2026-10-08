import { numericChoices } from '../../engine/distractors';
import { because, text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Choice, Difficulty, Draft, Generator } from '../../engine/types';
import { gcd } from './format';

/** Question kinds, with their base difficulty. */
export const KINDS = { split: 2, inverse: 3, chain: 4, scaledWork: 5 } as const;
export type Kind = keyof typeof KINDS;

interface Problem {
  kind: Kind;
  prompt: string;
  answer: Choice;
  distractors: Choice[];
  explanation: string;
  valid: boolean;
}

const ratio = (a: number, b: number) => {
  const g = gcd(a, b);
  return `${a / g}:${b / g}`;
};

/** Split `total` in the ratio a:b; ask for the second part. */
export function split(a: number, b: number, total: number, names: [string, string], rng: Rng): Problem {
  const part = total / (a + b);
  const answer = part * b;
  const valid = Number.isInteger(part) && gcd(a, b) === 1;
  return {
    kind: 'split',
    prompt: `The ratio of ${names[0]} to ${names[1]} in a group is ${a}:${b}. There are ${total} in total. How many are ${names[1]}?`,
    answer: text(answer),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: part * a, why: `That's the number of ${names[0]}; the question asks for ${names[1]}.` },
            { value: total - part, why: `The total minus one part. One part is ${part}, but ${names[1]} make up ${b} parts.` },
            { value: (total / b) * a, why: `Took ${a}/${b} of the total. The ratio splits the total into ${a} + ${b} = ${a + b} parts, not ${b}.` },
          ],
          4,
          rng,
        )
      : [],
    explanation: `${a} + ${b} = ${b + a} parts, so each part is ${total} ÷ ${a + b} = ${part}. ${names[1]}: ${b} × ${part} = ${answer}.`,
    valid,
  };
}

/** `workers` people take `days`; how long for `fewer` people? (inverse proportion) */
export function inverse(workers: number, days: number, other: number, rng: Rng): Problem {
  const answer = (workers * days) / other;
  const direct = (days * other) / workers;
  const valid = Number.isInteger(answer) && other !== workers;
  return {
    kind: 'inverse',
    prompt: `${workers} workers finish a job in ${days} days. Working at the same rate, how many days would ${other} workers need?`,
    answer: text(answer),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: direct, why: `Scaled the days the same way as the workers. ${other < workers ? 'Fewer' : 'More'} workers need ${other < workers ? 'more' : 'fewer'} days: it's an inverse proportion.` },
            { value: days + (workers - other), why: `Changed the days by the difference in workers. Time scales with the ratio of workers (${workers} ÷ ${other}), not the difference.` },
            { value: days, why: 'The original time. The number of workers changed, so the time changes too.' },
          ],
          4,
          rng,
        )
      : [],
    explanation: `The job takes ${workers} × ${days} = ${workers * days} worker-days. ${workers * days} ÷ ${other} = ${answer} days. (${other < workers ? 'Fewer workers means more days' : 'More workers means fewer days'}, so this is an inverse proportion.)`,
    valid,
  };
}

/** A:B = a1:b1 and B:C = b2:c2; what is A:C? */
export function chain([a1, b1]: [number, number], [b2, c2]: [number, number]): Problem {
  const m = b1 * b2 / gcd(b1, b2); // common value for B
  const a = a1 * (m / b1);
  const c = c2 * (m / b2);
  const answer = ratio(a, c);
  const mistakes = [
    because(text(ratio(a1, c2)), `Took A from the first ratio and C from the second without making B the same in both (B is ${b1} in one and ${b2} in the other).`),
    because(text(ratio(c, a)), "That's C:A, the reverse of what was asked."),
    because(text(ratio(a1 * b1, b2 * c2)), 'Multiplied the terms within each ratio. Multiply across instead (A/B × B/C) so the B cancels.'),
    because(text(ratio(a1 + b2, b1 + c2)), 'Added the two ratios term by term. Ratios combine by scaling, not adding.'),
    because(text(ratio(a1 * b2, c2)), `Scaled A but not C. Both need scaling: A by ${b2}, C by ${b1}.`),
  ];
  return {
    kind: 'chain',
    prompt: `The ratio A:B is ${a1}:${b1} and the ratio B:C is ${b2}:${c2}. What is the ratio A:C?`,
    answer: text(answer),
    distractors: mistakes,
    explanation: `Make B the same in both: A:B = ${a}:${m} and B:C = ${m}:${c}. So A:C = ${a}:${c}${`${a}:${c}` === answer ? '' : ` = ${answer}`}.`,
    valid: b1 !== b2 && gcd(a1, b1) === 1 && gcd(b2, c2) === 1,
  };
}

/** m1 machines make `items1` in `hours1`; how long for m2 machines to make items2? */
export function scaledWork(m1: number, items1: number, hours1: number, m2: number, items2: number, rng: Rng): Problem {
  const perMachineHour = items1 / (m1 * hours1);
  const answer = items2 / (perMachineHour * m2);
  const valid = Number.isInteger(perMachineHour) && Number.isInteger(answer) && m1 !== m2;
  return {
    kind: 'scaledWork',
    prompt: `${m1} machines make ${items1} parts in ${hours1} hours. At the same rate, how many hours do ${m2} machines need to make ${items2} parts?`,
    answer: text(answer),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: (hours1 * items2) / items1, why: 'Scaled for the number of parts only; the number of machines changed too.' },
            { value: (hours1 * m2) / m1, why: 'Scaled the hours in the same direction as the machines. More machines need fewer hours, and the number of parts changed too.' },
            { value: (hours1 * m1) / m2, why: 'Adjusted for the machines but forgot that the number of parts changed.' },
          ],
          4,
          rng,
        )
      : [],
    explanation: `One machine makes ${items1} ÷ (${m1} × ${hours1}) = ${perMachineHour} parts per hour. ${m2} machines make ${perMachineHour * m2} per hour, so ${items2} parts take ${items2} ÷ ${perMachineHour * m2} = ${answer} hours.`,
    valid,
  };
}

const GROUPS: [string, string][] = [
  ['boys', 'girls'],
  ['cats', 'dogs'],
  ['red marbles', 'blue marbles'],
  ['managers', 'engineers'],
  ['adults', 'children'],
];

function build(rng: Rng, kind: Kind): Problem {
  switch (kind) {
    case 'split': {
      const [a, b] = rng.pick([[1, 2], [2, 3], [3, 5], [3, 4], [2, 5], [4, 5], [5, 7]] as [number, number][]);
      return split(a, b, (a + b) * rng.int(3, 12), rng.pick(GROUPS), rng);
    }
    case 'inverse': {
      const workers = rng.int(2, 8);
      return inverse(workers, rng.int(2, 12), rng.int(2, 9), rng);
    }
    case 'chain': {
      const pairs: [number, number][] = [[2, 3], [3, 4], [4, 5], [1, 2], [2, 5], [3, 5], [5, 6]];
      return chain(rng.pick(pairs), rng.pick(pairs));
    }
    case 'scaledWork': {
      const rate = rng.int(2, 6);
      const [m1, h1, m2] = [rng.int(2, 6), rng.int(2, 5), rng.int(2, 8)];
      return scaledWork(m1, rate * m1 * h1, h1, m2, rate * m2 * rng.int(2, 8), rng);
    }
  }
}

export const ratioGenerator: Generator = {
  type: 'ratio',
  category: 'math-logic',
  label: 'Ratios and proportions',
  levels: [2, 3, 4, 5],

  draft(rng, level): Draft {
    const kind = (Object.keys(KINDS) as Kind[]).find((k) => KINDS[k] === level)!;
    const p = build(rng, kind);
    return {
      prompt: p.prompt,
      answer: p.answer,
      distractors: p.distractors,
      explanation: p.explanation,
      features: { kind: KINDS[p.kind], valid: p.valid ? 1 : 0 },
    };
  },

  score: (f) => (f.valid ? ((f.kind ?? 2) as Difficulty) : null),
};
