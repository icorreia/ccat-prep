import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/rng';
import { compare, fractionGenerator, KINDS, of, remainder, remainderOfRest } from './fraction';
import { fraction } from './format';

const rng = () => new Rng(1);
const features = (p: ReturnType<typeof of>) => ({ kind: KINDS[p.kind], harder: p.harder ? 1 : 0, valid: 1 });
const anchorCompare = compare([[5, 8], [3, 5], [2, 3], [7, 12], [4, 7]], true);

describe('fraction problems', () => {
  it('compute the right answers', () => {
    expect(of([3, 4], 48, rng()).answer.text).toBe('36');
    expect(anchorCompare.answer.text).toBe('2/3');
    expect(compare([[5, 8], [3, 5], [2, 3], [7, 12], [4, 7]], false).answer.text).toBe('4/7');
    expect(remainder([1, 3], [1, 4], 36, rng()).answer.text).toBe('36');
    expect(remainder([1, 3], [1, 4], 36, rng()).prompt).toContain('15 litres remain');
    // 1/3 used leaves 24 of 36; 1/4 of that used leaves 18.
    expect(remainderOfRest([1, 3], [1, 4], 36, rng()).prompt).toContain('18 litres remain');
  });

  it('puts the biggest-numerator trap first when comparing', () => {
    expect(anchorCompare.distractors[0]!.text).toBe('7/12');
  });

  it('reduces fractions for display', () => {
    expect(fraction(6, 8)).toBe('3/4');
    expect(fraction(5, 12)).toBe('5/12');
  });
});

describe('calibration against the blueprint anchors', () => {
  it.each([
    [2, of([3, 4], 48, rng())],
    [3, anchorCompare],
    [4, remainder([1, 3], [1, 4], 36, rng())],
  ])('scores the level-%i anchor at its level', (level, problem) => {
    expect(fractionGenerator.score(features(problem))).toBe(level);
  });
});
