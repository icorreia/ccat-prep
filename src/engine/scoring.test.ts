import { describe, expect, it } from 'vitest';
import { median, scoreSession } from './scoring';
import type { Attempt, Category } from './types';

const attempt = (
  position: number,
  type: string,
  category: Category,
  choiceIndex: number | null,
  correct: boolean,
  timeMs: number,
): Attempt => ({ questionId: `${type}:1:${position}`, type, category, position, choiceIndex, correct, timeMs });

describe('median', () => {
  it('handles empty, odd and even inputs', () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe('scoreSession', () => {
  const attempts = [
    attempt(0, 'antonym', 'verbal', 1, true, 6000),
    attempt(1, 'number-series', 'math-logic', 2, false, 20000),
    attempt(2, 'number-series', 'math-logic', 0, true, 12000),
    attempt(3, 'matrix', 'spatial', null, false, 18000),
    attempt(4, 'antonym', 'verbal', 3, true, 10000),
  ];
  const s = scoreSession(50, attempts);

  it('counts raw score, wrong and unanswered (including unreached questions)', () => {
    expect(s.score).toBe(3);
    expect(s.answered).toBe(4);
    expect(s.wrong).toBe(1);
    expect(s.unanswered).toBe(46);
    expect(s.accuracy).toBe(0.75);
    expect(s.timeMs).toBe(66000);
  });

  it('breaks down by category and type', () => {
    expect(s.byCategory.verbal).toMatchObject({ seen: 2, correct: 2, accuracy: 1, medianCorrectMs: 8000 });
    expect(s.byCategory.spatial).toMatchObject({ seen: 1, answered: 0, accuracy: 0, medianCorrectMs: null });
    expect(s.byType['number-series']).toMatchObject({ answered: 2, correct: 1, accuracy: 0.5 });
  });

  it('handles an empty session', () => {
    expect(scoreSession(50, [])).toMatchObject({ score: 0, unanswered: 50, accuracy: 0 });
  });
});
