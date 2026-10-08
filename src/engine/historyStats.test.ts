import { describe, expect, it } from 'vitest';
import { rollingAverage, summarize, type SessionLike } from './historyStats';

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
