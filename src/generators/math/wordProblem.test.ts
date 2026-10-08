import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/rng';
import { ages, combinedWork, KINDS, meeting, roundTrip, scale, wordProblem } from './wordProblem';

const rng = () => new Rng(1);
const features = (p: ReturnType<typeof scale>) => ({ steps: KINDS[p.kind], valid: p.valid ? 1 : 0 });

describe('word problems', () => {
  it('compute the right answers', () => {
    expect(scale(3, 150, 5, 'drive', rng()).answer.text).toBe('250');
    expect(scale(4, 36, 7, 'buy', rng()).answer.text).toBe('$63');
    expect(meeting(300, 60, 40, rng()).answer.text).toBe('3');
    expect(combinedWork(6, 3, rng()).answer.text).toBe('2');
    expect(roundTrip(120, 60, 40, rng()).answer.text).toBe('48');
    expect(ages(3, 2, 10, ['Ana', 'Ben'], rng()).answer.text).toBe('10');
  });

  it('includes the blueprint traps', () => {
    expect(meeting(300, 60, 40, rng()).distractors.map((c) => c.text)).toContain('5');
    expect(roundTrip(120, 60, 40, rng()).distractors.map((c) => c.text)).toContain('50');
  });

  it('rejects problems without a whole answer', () => {
    expect(combinedWork(5, 3, rng()).valid).toBe(false);
  });
});

describe('calibration against the blueprint anchors', () => {
  it.each([
    [2, scale(3, 150, 5, 'drive', rng())],
    [3, meeting(300, 60, 40, rng())],
    [4, combinedWork(6, 3, rng())],
  ])('scores the level-%i anchor at its level', (level, problem) => {
    expect(wordProblem.score(features(problem))).toBe(level);
  });
});
