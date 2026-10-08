import { describe, expect, it } from 'vitest';
import {
  pacingByPosition,
  pointsBreakdown,
  recentAverageAt,
  rollingAverage,
  slowQuestions,
  summarize,
  typeStats,
  weakestTypes,
  type SessionLike,
} from './historyStats';
import type { Attempt } from './types';

const session = (startedAt: number, correct: number, mode = 'test'): SessionLike => ({
  mode,
  startedAt,
  total: 50,
  attempts: Array.from({ length: 50 }, (_, i) => ({
    questionId: `q${i}`,
    type: 'x',
    category: 'verbal',
    position: i,
    choiceIndex: 0,
    correct: i < correct,
    timeMs: 1000,
  })),
});

describe('summarize', () => {
  it('is empty without full tests', () => {
    expect(summarize([session(1, 9, 'drill')])).toEqual({ tests: 0, best: null, last: null, recentAvg: null, change: null });
  });

  it('computes best, last, recent average and change over full tests only', () => {
    const scores = [20, 22, 24, 21, 23, 30, 31, 29, 32, 33];
    const sessions = scores.map((s, i) => session(i, s)).concat(session(99, 50, 'drill'));
    expect(summarize(sessions)).toEqual({ tests: 10, best: 33, last: 33, recentAvg: 31, change: 9 });
  });

  it('orders by start time, not by array order', () => {
    expect(summarize([session(2, 30), session(1, 10)]).last).toBe(30);
  });
});

describe('rollingAverage', () => {
  it('averages a trailing window', () => {
    expect(rollingAverage([10, 20, 30, 40, 50, 60], 3)).toEqual([10, 15, 20, 30, 40, 50]);
  });
});

const attempt = (position: number, over: Partial<Attempt> = {}): Attempt => ({
  questionId: `q${position}`,
  type: 'x',
  category: 'verbal',
  position,
  choiceIndex: 0,
  correct: true,
  timeMs: 1000,
  ...over,
});
const timed = (startedAt: number, attempts: Attempt[], mode = 'test'): SessionLike => ({ mode, startedAt, total: 50, attempts });

describe('pointsBreakdown', () => {
  it('splits each full test into correct, wrong and unanswered (skipped plus never reached)', () => {
    const s = timed(1, [attempt(0), attempt(1, { correct: false }), attempt(2, { choiceIndex: null, correct: false })]);
    expect(pointsBreakdown([s, timed(0, [], 'drill')])).toEqual([{ correct: 1, wrong: 1, unanswered: 48 }]);
  });

  it('orders tests oldest first', () => {
    const late = timed(2, [attempt(0), attempt(1)]);
    const early = timed(1, [attempt(0)]);
    expect(pointsBreakdown([late, early]).map((b) => b.correct)).toEqual([1, 2]);
  });
});

describe('pacingByPosition', () => {
  it('averages time per position over timed sessions only, 1-based', () => {
    const a = timed(1, [attempt(0, { timeMs: 10_000 }), attempt(1, { timeMs: 20_000 })]);
    const b = timed(2, [attempt(0, { timeMs: 20_000 })], 'speed');
    const untimed = timed(3, [attempt(0, { timeMs: 90_000 })], 'drill');
    expect(pacingByPosition([a, b, untimed])).toEqual([
      { position: 1, avgMs: 15_000, samples: 2 },
      { position: 2, avgMs: 20_000, samples: 1 },
    ]);
  });
});

describe('slowQuestions', () => {
  it('counts answers over 30 s in the most recent timed sessions, grouped by type', () => {
    const slow = (p: number, type: string) => attempt(p, { timeMs: 31_000, type });
    const old = timed(1, [slow(0, 'ratio')]);
    const recent = timed(2, [slow(0, 'matrix'), slow(1, 'matrix'), slow(2, 'ratio'), attempt(3, { timeMs: 30_000 })]);
    const drill = timed(3, [slow(0, 'analogy')], 'drill');
    expect(slowQuestions([old, recent, drill], 1)).toEqual({
      sessions: 1,
      slow: 3,
      types: [
        { type: 'matrix', count: 2 },
        { type: 'ratio', count: 1 },
      ],
    });
  });
});

describe('typeStats', () => {
  it('counts attempts, accuracy and median time on correct answers per type', () => {
    const s = timed(1, [
      attempt(0, { type: 'ratio', timeMs: 10_000 }),
      attempt(1, { type: 'ratio', correct: false }),
      attempt(2, { type: 'ratio', timeMs: 20_000 }),
      attempt(3, { type: 'matrix', choiceIndex: null, correct: false }),
    ]);
    const stats = Object.fromEntries(typeStats([s]).map((t) => [t.type, t]));
    expect(stats.ratio).toEqual({ type: 'ratio', attempts: 3, answered: 3, accuracy: 2 / 3, medianCorrectMs: 15_000, trend: null });
    expect(stats.matrix).toMatchObject({ attempts: 1, answered: 0, accuracy: null, medianCorrectMs: null });
  });

  it('compares the last 10 answers with the 10 before them, oldest session first', () => {
    const answers = (startedAt: number, correct: boolean) =>
      timed(startedAt, Array.from({ length: 10 }, (_, i) => attempt(i, { correct })), 'drill');
    const [stat] = typeStats([answers(2, true), answers(1, false)]);
    expect(stat!.trend).toBe(1);
  });
});

describe('weakestTypes', () => {
  it('picks the lowest accuracy among types with at least 5 answers', () => {
    const stat = (type: string, answered: number, accuracy: number) => ({ type, attempts: answered, answered, accuracy, medianCorrectMs: null, trend: null });
    const weak = weakestTypes([stat('a', 5, 0.9), stat('b', 5, 0.4), stat('c', 4, 0.1), stat('d', 9, 0.5)], 2);
    expect([...weak]).toEqual(['b', 'd']);
  });
});

describe('recentAverageAt', () => {
  it('averages the last 5 full tests up to a time', () => {
    const sessions = [10, 20, 30].map((score, i) => session(i * 10, score));
    expect(recentAverageAt(sessions, 15)).toBe(15);
    expect(recentAverageAt(sessions, -1)).toBeNull();
  });
});
