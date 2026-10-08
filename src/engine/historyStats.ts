import type { Attempt } from './types';

/** The minimum a stats function needs from a stored session. */
export interface SessionLike {
  mode: string;
  startedAt: number;
  total: number;
  attempts: Attempt[];
}

export const scoreOf = (s: SessionLike) => s.attempts.filter((a) => a.correct).length;

const fullTests = <S extends SessionLike>(sessions: S[]) => sessions.filter((s) => s.mode === 'test').sort((a, b) => a.startedAt - b.startedAt);

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
  const scores = fullTests(sessions).map(scoreOf);
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

export interface Breakdown {
  correct: number;
  wrong: number;
  /** Skipped, timed out or never reached. */
  unanswered: number;
}

/** Where each full test's points went, oldest first: losing them to speed (unanswered) or to accuracy (wrong). */
export function pointsBreakdown(sessions: SessionLike[]): Breakdown[] {
  return fullTests(sessions).map((s) => {
    const answered = s.attempts.filter((a) => a.choiceIndex !== null).length;
    const correct = scoreOf(s);
    return { correct, wrong: answered - correct, unanswered: s.total - answered };
  });
}

/** The time budget per question on the real test: 15 minutes for 50 questions. */
export const BUDGET_MS = 18_000;
/** Questions that took longer than this are flagged as time sinks. */
export const SLOW_MS = 30_000;

/** Sessions where time pressure was real; untimed drills would skew pacing. */
const isTimed = (s: SessionLike) => s.mode === 'test' || s.mode === 'speed';

export interface PacePoint {
  /** 1-based question position. */
  position: number;
  avgMs: number;
  /** How many questions at this position went into the average. */
  samples: number;
}

/** Average time spent at each question position across timed sessions (positions never reached are left out). */
export function pacingByPosition(sessions: SessionLike[]): PacePoint[] {
  const byPosition = new Map<number, number[]>();
  for (const s of sessions.filter(isTimed)) {
    for (const a of s.attempts) {
      const times = byPosition.get(a.position) ?? [];
      times.push(a.timeMs);
      byPosition.set(a.position, times);
    }
  }
  return [...byPosition.entries()]
    .sort(([a], [b]) => a - b)
    .map(([position, times]) => ({ position: position + 1, avgMs: mean(times)!, samples: times.length }));
}

export interface SlowSummary {
  /** Timed sessions looked at (the most recent ones). */
  sessions: number;
  slow: number;
  /** Question types with slow answers, most frequent first. */
  types: { type: string; count: number }[];
}

/** Questions over SLOW_MS in the last `last` timed sessions. */
export function slowQuestions(sessions: SessionLike[], last = 5): SlowSummary {
  const recent = sessions
    .filter(isTimed)
    .sort((a, b) => a.startedAt - b.startedAt)
    .slice(-last);
  const counts = new Map<string, number>();
  for (const a of recent.flatMap((s) => s.attempts)) if (a.timeMs > SLOW_MS) counts.set(a.type, (counts.get(a.type) ?? 0) + 1);
  const types = [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  return { sessions: recent.length, slow: types.reduce((sum, t) => sum + t.count, 0), types };
}
