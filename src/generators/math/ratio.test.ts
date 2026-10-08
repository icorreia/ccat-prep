import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/rng';
import { chain, inverse, KINDS, ratioGenerator, scaledWork, split } from './ratio';

const rng = () => new Rng(1);
const features = (p: ReturnType<typeof split>) => ({ kind: KINDS[p.kind], valid: p.valid ? 1 : 0 });

describe('ratio problems', () => {
  it('compute the right answers', () => {
    expect(split(3, 5, 40, ['boys', 'girls'], rng()).answer.text).toBe('25');
    expect(inverse(4, 6, 3, rng()).answer.text).toBe('8');
    expect(chain([2, 3], [4, 5]).answer.text).toBe('8:15');
    // 2 machines, 20 parts in 5 h → 2 parts per machine-hour; 4 machines, 40 parts → 5 h.
    expect(scaledWork(2, 20, 5, 4, 40, rng()).answer.text).toBe('5');
  });

  it('includes the blueprint traps', () => {
    expect(chain([2, 3], [4, 5]).distractors.map((c) => c.text)).toContain('2:5');
    // Treating 3 workers as direct proportion: 6 × 3 / 4 = 4.5 is fractional, so it's filtered; the other traps remain.
    expect(inverse(4, 6, 3, rng()).distractors.map((c) => c.text)).toContain('6');
  });
});

describe('calibration against the blueprint anchors', () => {
  it.each([
    [2, split(3, 5, 40, ['boys', 'girls'], rng())],
    [3, inverse(4, 6, 3, rng())],
    [4, chain([2, 3], [4, 5])],
  ])('scores the level-%i anchor at its level', (level, problem) => {
    expect(ratioGenerator.score(features(problem))).toBe(level);
  });
});
