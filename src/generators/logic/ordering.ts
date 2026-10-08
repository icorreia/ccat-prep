import { text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';

/** A constraint on an arrangement; `pos[name]` is a 0-based position. */
export type Constraint =
  | { kind: 'before'; a: string; b: string }
  | { kind: 'immediately'; a: string; b: string }
  | { kind: 'at'; a: string; k: number }
  | { kind: 'notAt'; a: string; k: number }
  | { kind: 'adjacent'; a: string; b: string }
  | { kind: 'end'; a: string };

export type Setting = 'race' | 'seats' | 'height';

const KINDS_BY_SETTING: Record<Setting, Constraint['kind'][]> = {
  race: ['before', 'before', 'immediately', 'at', 'notAt'],
  seats: ['at', 'immediately', 'adjacent', 'notAt', 'end', 'before'],
  height: ['before'],
};

export function satisfied(c: Constraint, pos: Record<string, number>, n: number): boolean {
  switch (c.kind) {
    case 'before':
      return pos[c.a]! < pos[c.b]!;
    case 'immediately':
      return pos[c.b]! === pos[c.a]! + 1;
    case 'at':
      return pos[c.a] === c.k;
    case 'notAt':
      return pos[c.a] !== c.k;
    case 'adjacent':
      return Math.abs(pos[c.a]! - pos[c.b]!) === 1;
    case 'end':
      return pos[c.a] === 0 || pos[c.a] === n - 1;
  }
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((p) => [x, ...p]));
}

/** Every arrangement (as an ordered list of names) that satisfies all constraints. */
export function solve(names: string[], constraints: Constraint[]): string[][] {
  return permutations(names).filter((order) => {
    const pos = Object.fromEntries(order.map((name, i) => [name, i]));
    return constraints.every((c) => satisfied(c, pos, names.length));
  });
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

export function describe(c: Constraint, setting: Setting, n: number): string {
  const ord = (k: number) => (setting === 'race' && k === n - 1 ? 'last' : ORDINALS[k]);
  switch (setting) {
    case 'height':
      return `${(c as { a: string }).a} is taller than ${(c as { b: string }).b}.`;
    case 'race':
      switch (c.kind) {
        case 'before':
          return `${c.a} finished ahead of ${c.b}.`;
        case 'immediately':
          return `${c.a} finished immediately ahead of ${c.b}.`;
        case 'at':
          return `${c.a} finished ${ord(c.k)}.`;
        case 'notAt':
          return `${c.a} did not finish ${ord(c.k)}.`;
        default:
          throw new Error(`No race wording for ${c.kind}`);
      }
    case 'seats':
      switch (c.kind) {
        case 'before':
          return `${c.a} sits somewhere to the left of ${c.b}.`;
        case 'immediately':
          return `${c.a} sits immediately to the left of ${c.b}.`;
        case 'at':
          return `${c.a} sits in seat ${c.k + 1}.`;
        case 'notAt':
          return `${c.a} is not in seat ${c.k + 1}.`;
        case 'adjacent':
          return `${c.a} sits next to ${c.b}.`;
        case 'end':
          return `${c.a} sits at one end of the row.`;
      }
  }
}

/** A random constraint that is true for `order`. */
function trueConstraint(rng: Rng, order: string[], setting: Setting): Constraint {
  const n = order.length;
  const kind = rng.pick(KINDS_BY_SETTING[setting]);
  const i = rng.int(0, n - 1);
  const a = order[i]!;
  switch (kind) {
    case 'before': {
      const [x, y] = rng.sample([...order.keys()], 2).sort((p, q) => p - q) as [number, number];
      return { kind, a: order[x]!, b: order[y]! };
    }
    case 'immediately': {
      const j = rng.int(0, n - 2);
      return { kind, a: order[j]!, b: order[j + 1]! };
    }
    case 'at':
      return { kind, a, k: i };
    case 'notAt':
      return { kind, a, k: rng.pick([...order.keys()].filter((k) => k !== i)) };
    case 'adjacent': {
      const j = rng.int(0, n - 2);
      return rng.chance(0.5) ? { kind, a: order[j]!, b: order[j + 1]! } : { kind, a: order[j + 1]!, b: order[j]! };
    }
    case 'end':
      return { kind, a: order[rng.pick([0, n - 1])]! };
  }
}

const key = (c: Constraint) => JSON.stringify(c);

export interface Puzzle {
  names: string[];
  setting: Setting;
  order: string[];
  constraints: Constraint[];
}

/** Adds true constraints until one arrangement remains, then drops any that aren't needed. */
export function buildPuzzle(rng: Rng, names: string[], setting: Setting): Puzzle | null {
  const order = rng.shuffle(names);
  const constraints: Constraint[] = [];
  for (let i = 0; i < 12 && solve(names, constraints).length > 1; i++) {
    const c = trueConstraint(rng, order, setting);
    if (!constraints.some((d) => key(d) === key(c))) constraints.push(c);
  }
  if (solve(names, constraints).length !== 1) return null;
  for (const c of rng.shuffle(constraints)) {
    const without = constraints.filter((d) => d !== c);
    if (solve(names, without).length === 1) constraints.splice(constraints.indexOf(c), 1);
  }
  return { names, setting, order, constraints: rng.shuffle(constraints) };
}

export function features(p: Puzzle) {
  return {
    entities: p.names.length,
    constraints: p.constraints.length,
    negatives: p.constraints.filter((c) => c.kind === 'notAt').length,
  };
}

const PEOPLE = ['Ava', 'Ben', 'Cal', 'Dan', 'Eve', 'Finn', 'Gus', 'Hana', 'Ian', 'Jade', 'Kai', 'Lena', 'Max', 'Nora'];

/** Who is at position k? Wrong choices: whoever would be there if one statement were missed. */
function askAbout(p: Puzzle, k: number): { question: string; answer: string; distractors: string[] } {
  const n = p.names.length;
  const answer = p.order[k]!;
  const counts = new Map<string, number>();
  for (const c of p.constraints) {
    for (const sol of solve(p.names, p.constraints.filter((d) => d !== c))) {
      const name = sol[k]!;
      if (name !== answer) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  const tempting = [...counts.entries()].sort((x, y) => y[1] - x[1]).map(([name]) => name);
  const distractors = [...new Set([...tempting, ...p.names.filter((x) => x !== answer)])];
  const question =
    p.setting === 'race'
      ? `Who finished ${k === n - 1 ? 'last' : ORDINALS[k]}?`
      : p.setting === 'seats'
        ? `Who sits in seat ${k + 1}?`
        : k === n - 1
          ? 'Who is the shortest?'
          : k === 0
            ? 'Who is the tallest?'
            : `Who is the ${ORDINALS[k]} tallest?`;
  return { question, answer, distractors };
}

const INTRO: Record<Setting, (n: number) => string> = {
  race: (n) => `${n} runners finished a race with no ties.`,
  seats: (n) => `${n} people sit in a row of ${n} seats, numbered 1 to ${n} from left to right.`,
  height: (n) => `${n} friends all have different heights.`,
};

export const ordering: Generator = {
  type: 'ordering',
  category: 'math-logic',
  label: 'Ordering and seating',
  levels: [2, 3, 4, 5],

  draft(rng, level): Draft {
    const n = level <= 2 ? 3 : level === 3 ? 4 : 5;
    const setting: Setting = n === 3 ? rng.pick(['height', 'race'] as const) : n === 4 ? rng.pick(['race', 'height', 'seats'] as const) : rng.pick(['race', 'seats'] as const);
    const puzzle = buildPuzzle(rng, rng.sample(PEOPLE, n), setting);
    if (!puzzle) return { prompt: '', answer: text(''), distractors: [], explanation: '', features: { valid: 0 } };
    const k = rng.int(0, n - 1);
    const { question, answer, distractors } = askAbout(puzzle, k);
    const statements = puzzle.constraints.map((c) => describe(c, setting, n)).join('\n');
    const orderText = setting === 'seats' ? `seats 1–${n}: ${puzzle.order.join(', ')}` : `from ${setting === 'height' ? 'tallest' : 'first'} to ${setting === 'height' ? 'shortest' : 'last'}: ${puzzle.order.join(', ')}`;
    return {
      prompt: `${INTRO[setting](n)}\n\n${statements}\n\n${question}`,
      answer: text(answer),
      distractors: distractors.map((d) => text(d)),
      explanation: `The only arrangement that fits every statement is (${orderText}). So the answer is ${answer}.`,
      features: { ...features(puzzle), valid: 1 },
      choiceCount: Math.min(5, n),
    };
  },

  score(f) {
    if (!f.valid) return null;
    const n = f.entities ?? 3;
    if (n <= 3) return 2;
    if (n === 4) return (f.constraints ?? 0) >= 4 ? 4 : 3;
    return ((f.constraints ?? 0) >= 5 ? 5 : 4) as Difficulty;
  },
};
