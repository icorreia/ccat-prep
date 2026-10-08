import { describe, expect, it } from 'vitest';
import { GENERATORS } from '../generators';
import { crossoverSettings } from './crossover';
import { buildTest, TIME_LIMIT_MS } from './testBuilder';

describe('crossoverSettings', () => {
  it('starts at the real 15 minutes with +1 level, before any tests or at low averages', () => {
    expect(crossoverSettings(null)).toEqual({ intensity: 0, timeLimitMs: TIME_LIMIT_MS, levelShift: 1 });
    expect(crossoverSettings(18)).toEqual(crossoverSettings(null));
  });

  it('tightens to 12 minutes and +2 levels as the recent average rises', () => {
    expect(crossoverSettings(32.5)).toEqual({ intensity: 0.5, timeLimitMs: 13.5 * 60_000, levelShift: 1.5 });
    expect(crossoverSettings(40)).toEqual({ intensity: 1, timeLimitMs: 12 * 60_000, levelShift: 2 });
    expect(crossoverSettings(48)).toEqual(crossoverSettings(40));
  });

  it('keeps the limit on whole half-minutes', () => {
    expect(crossoverSettings(31).timeLimitMs % 30_000).toBe(0);
  });
});

describe('buildTest with Crossover options', () => {
  const hardShare = (levelShift: number) => {
    const levels = [1, 2, 3, 4, 5].flatMap((seed) => buildTest(GENERATORS, seed, { levelShift }).questions.map((q) => q.difficulty));
    return levels.filter((d) => d >= 4).length / levels.length;
  };

  it('draws more questions from levels 4–5 as the shift grows', () => {
    const [plain, easy, hard] = [hardShare(0), hardShare(1), hardShare(2)];
    expect(easy).toBeGreaterThan(plain + 0.1);
    expect(hard).toBeGreaterThan(easy + 0.1);
  });

  it('uses the given time limit', () => {
    expect(buildTest(GENERATORS, 1, { timeLimitMs: 720_000 }).timeLimitMs).toBe(720_000);
  });
});
