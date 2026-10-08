import type { Attempt } from './types';

/** The minimum a stats function needs from a stored session. */
export interface SessionLike {
  mode: string;
  startedAt: number;
  total: number;
  attempts: Attempt[];
}

export const scoreOf = (s: SessionLike) => s.attempts.filter((a) => a.correct).length;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface Summary {
  tests: number;
  best: number | null;
  last: number | null;
  /** Average of the last 5 full tests. */
  recentAvg: number | null;
  /** recentAvg minus the average of the 5 before them; null until there are 6 tests. */
  change: number | null;
}

/** Headline numbers over full tests only (drills and speed sessions have different lengths). */
export function summarize(sessions: SessionLike[]): Summary {
  const scores = sessions
    .filter((s) => s.mode === 'test')
    .sort((a, b) => a.startedAt - b.startedAt)
    .map(scoreOf);
  const recent = scores.slice(-5);
  const previous = scores.slice(-10, -5);
  const recentAvg = mean(recent);
  const previousAvg = mean(previous);
  return {
    tests: scores.length,
    best: scores.length ? Math.max(...scores) : null,
    last: scores.at(-1) ?? null,
    recentAvg,
    change: recentAvg !== null && previousAvg !== null ? recentAvg - previousAvg : null,
  };
}

/** Trailing average over up to `window` points (shorter at the start). */
export function rollingAverage(values: number[], window = 5): number[] {
  return values.map((_, i) => mean(values.slice(Math.max(0, i - window + 1), i + 1))!);
}
