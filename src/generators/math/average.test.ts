import { describe, expect, it } from 'vitest';
import { average, combined, KINDS, mean, missing, remove, target } from './average';

const features = (p: ReturnType<typeof mean>) => ({
  kind: KINDS[p.kind],
  count: p.count,
  total: p.total,
  largest: p.largest,
  whole: 1,
});

describe('average problems', () => {
  it('compute the right answers', () => {
    expect(mean([6, 10, 14]).answer).toBe(10);
    expect(missing([12, 19], 17).answer).toBe(20); // Criteria's public sample
    expect(target(4, 85, 87).answer).toBe(95);
    expect(remove(5, 20, 18).answer).toBe(28);
    expect(combined(2, 40, 3, 60).answer).toBe(52);
  });

  it('offers the "average of averages" trap for combined groups', () => {
    expect(combined(2, 40, 3, 60).mistakes).toContain(50);
  });
});

describe('calibration against the blueprint anchors', () => {
  it.each([
    [2, mean([6, 10, 14])],
    [3, target(4, 85, 87)],
    [4, remove(5, 20, 18)],
  ])('scores the level-%i anchor at its level', (level, problem) => {
    expect(average.score(features(problem))).toBe(level);
  });
});
