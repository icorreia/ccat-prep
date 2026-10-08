import type { Attempt, Category } from './types';

export interface Tally {
  /** Questions shown (answered or skipped). */
  seen: number;
  answered: number;
  correct: number;
  /** correct / answered; 0 when nothing was answered. */
  accuracy: number;
  /** Median time on correctly answered questions, or null if none. */
  medianCorrectMs: number | null;
}

export interface SessionScore extends Tally {
  /** Raw score: number correct. */
  score: number;
  total: number;
  wrong: number;
  /** Skipped, timed out or never reached. */
  unanswered: number;
  timeMs: number;
  byCategory: Partial<Record<Category, Tally>>;
  byType: Record<string, Tally>;
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function tally(attempts: readonly Attempt[]): Tally {
  const answered = attempts.filter((a) => a.choiceIndex !== null);
  const correct = answered.filter((a) => a.correct);
  return {
    seen: attempts.length,
    answered: answered.length,
    correct: correct.length,
    accuracy: answered.length ? correct.length / answered.length : 0,
    medianCorrectMs: median(correct.map((a) => a.timeMs)),
  };
}

function groupBy<K extends string>(attempts: readonly Attempt[], key: (a: Attempt) => K) {
  const groups = {} as Record<K, Attempt[]>;
  for (const a of attempts) (groups[key(a)] ??= []).push(a);
  return groups;
}

const mapValues = <K extends string, V, W>(obj: Record<K, V>, fn: (v: V) => W) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v as V)])) as Record<K, W>;

/** Scores a session of `total` questions from the attempts made (unreached questions count as unanswered). */
export function scoreSession(total: number, attempts: readonly Attempt[]): SessionScore {
  const overall = tally(attempts);
  return {
    ...overall,
    score: overall.correct,
    total,
    wrong: overall.answered - overall.correct,
    unanswered: total - overall.answered,
    timeMs: attempts.reduce((sum, a) => sum + a.timeMs, 0),
    byCategory: mapValues(groupBy(attempts, (a) => a.category), tally),
    byType: mapValues(groupBy(attempts, (a) => a.type), tally),
  };
}
