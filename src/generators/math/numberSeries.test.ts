import { describe, expect, it } from 'vitest';
import {
  alternating,
  constant,
  fibonacci,
  FAMILIES,
  geometric,
  interleaved,
  mixed,
  numberSeries,
  secondOrder,
  type Series,
} from './numberSeries';

const features = (s: Series) => ({
  family: FAMILIES[s.family],
  largest: Math.max(...s.terms),
  valid: 1,
});

describe('series builders', () => {
  it('build the expected terms (last element is the answer)', () => {
    expect(constant(4, 5, 4).terms).toEqual([4, 9, 14, 19, 24]);
    expect(geometric(2, 3, 4).terms).toEqual([2, 6, 18, 54, 162]);
    expect(fibonacci(1, 2, 5).terms).toEqual([1, 2, 3, 5, 8, 13]);
    expect(alternating(2, [{ kind: '×', n: 3 }, { kind: '-', n: 3 }], 6).terms).toEqual([2, 6, 3, 9, 6, 18, 15]);
    expect(secondOrder(3, 1, 'squares', 5).terms).toEqual([3, 4, 8, 17, 33, 58]);
    expect(secondOrder(1, 2, 3, 4).terms).toEqual([1, 3, 8, 16, 27]);
    expect(interleaved(1, 2, 10, 5, 6).terms).toEqual([1, 10, 3, 15, 5, 20, 7]);
    expect(mixed(1, 2, 1, 4).terms).toEqual([1, 3, 7, 15, 31]);
  });

  it('includes the "repeat the last gap" trap for second-order series', () => {
    // 3, 4, 8, 17, 33 → 58; repeating the last gap (16) gives 49.
    expect(secondOrder(3, 1, 'squares', 5).mistakes).toContain(49);
  });
});

describe('calibration against the blueprint anchors', () => {
  it.each([
    [1, constant(4, 5, 4)], // 4, 9, 14, 19, ?
    [3, alternating(2, [{ kind: '×', n: 3 }, { kind: '-', n: 3 }], 6)], // 2, 6, 3, 9, 6, 18, ?
    [4, secondOrder(3, 1, 'squares', 5)], // 3, 4, 8, 17, 33, ?
  ])('scores the level-%i anchor at its level', (level, series) => {
    expect(numberSeries.score(features(series))).toBe(level);
  });
});
