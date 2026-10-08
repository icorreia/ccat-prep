import { generateQuestion, choiceKey } from './question';
import { Rng } from './rng';
import type { Category, Difficulty, Generator, Question } from './types';

export const TEST_LENGTH = 50;
export const TIME_LIMIT_MS = 15 * 60 * 1000;

/**
 * Reported CCAT mix (Criteria publishes no official split; see docs/item-blueprint.md).
 * Each test varies every count by up to ±JITTER, keeping the total at 50.
 */
export const MIX: Record<Category, number> = { verbal: 17, 'math-logic': 22, spatial: 11 };
export const LOGIC_RANGE: [number, number] = [5, 6];
export const JITTER = 2;
const LOGIC_TYPES = ['syllogism', 'ordering'];

export interface Test {
  seed: number;
  questions: Question[];
  timeLimitMs: number;
}

/** Category counts for one test: the reported mix with jitter, summing to `total`. */
export function categoryCounts(rng: Rng, total = TEST_LENGTH): Record<Category, number> {
  const verbal = MIX.verbal + rng.int(-JITTER, JITTER);
  const spatial = MIX.spatial + rng.int(-JITTER, JITTER);
  return { verbal, spatial, 'math-logic': total - verbal - spatial };
}

/** Target level for a position: easy at the start, hardest at the end, with a little noise. */
export function rampLevel(rng: Rng, position: number, total = TEST_LENGTH): Difficulty {
  const base = 1 + (4 * position) / (total - 1);
  return Math.min(5, Math.max(1, Math.round(base + rng.int(-1, 1) * 0.6))) as Difficulty;
}

const nearestLevel = (g: Generator, target: Difficulty) =>
  [...g.levels].sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0]!;

/** Spread `count` questions over `types` as evenly as possible, in random order. */
function spread(rng: Rng, types: Generator[], count: number): Generator[] {
  const out = Array.from({ length: count }, (_, i) => types[i % types.length]!);
  return rng.shuffle(out);
}

/** Reorders so no type appears three times in a row (best effort, by swapping forward). */
export function interleave<T>(items: T[], key: (t: T) => string): T[] {
  const out = [...items];
  for (let i = 2; i < out.length; i++) {
    if (key(out[i]!) === key(out[i - 1]!) && key(out[i]!) === key(out[i - 2]!)) {
      const j = out.findIndex((x, k) => k > i && key(x) !== key(out[i]!));
      if (j > 0) [out[i], out[j]] = [out[j]!, out[i]!];
    }
  }
  return out;
}

/** Content fingerprint: same prompt, figures/table and answer means the same item to a test-taker. */
export const fingerprint = (q: Question) =>
  q.itemKey ? `${q.type}|${q.itemKey}` : [q.type, q.prompt, JSON.stringify(q.visual ?? q.table ?? null), choiceKey(q.choices[q.answerIndex]!)].join('|');

export const SECONDS_PER_QUESTION = 18;

export interface DrillOptions {
  /** Generators to draw from: one type, one category, or all of them. */
  generators: readonly Generator[];
  count: number;
  /** A fixed level, or 'ramp' to go from easy to hard like the real test. */
  level: Difficulty | 'ramp';
}

/** Practice set: types spread evenly, no repeated items, no type three times in a row. */
export function buildDrill({ generators, count, level }: DrillOptions, seed: number): Question[] {
  const rng = new Rng(seed);
  const plan = interleave(spread(rng, [...generators], count), (g) => g.type);
  return generateUnique(rng, plan, (position) => (level === 'ramp' ? rampLevel(rng, position, count) : level));
}

/** Generates one question per planned generator, regenerating repeats (up to 20 tries each). */
function generateUnique(rng: Rng, plan: Generator[], target: (position: number) => Difficulty): Question[] {
  const seen = new Set<string>();
  return plan.map((generator, position) => {
    const level = nearestLevel(generator, target(position));
    for (let attempt = 0; ; attempt++) {
      const q = generateQuestion(generator, level, rng.int(0, 2 ** 31));
      if (!seen.has(fingerprint(q)) || attempt >= 20) {
        seen.add(fingerprint(q));
        return q;
      }
    }
  });
}

export function buildTest(generators: readonly Generator[], seed: number): Test {
  const rng = new Rng(seed);
  const byCategory = (c: Category) => generators.filter((g) => g.category === c);
  const counts = categoryCounts(rng);
  const logicCount = rng.int(...LOGIC_RANGE);
  const mathLogic = byCategory('math-logic');
  const logic = mathLogic.filter((g) => LOGIC_TYPES.includes(g.type));
  const math = mathLogic.filter((g) => !LOGIC_TYPES.includes(g.type));

  const plan = interleave(
    rng.shuffle([
      ...spread(rng, byCategory('verbal'), counts.verbal),
      ...spread(rng, math, counts['math-logic'] - logicCount),
      ...spread(rng, logic, logicCount),
      ...spread(rng, byCategory('spatial'), counts.spatial),
    ]),
    (g) => g.type,
  );

  const questions = generateUnique(rng, plan, (position) => rampLevel(rng, position));
  return { seed, questions, timeLimitMs: TIME_LIMIT_MS };
}
