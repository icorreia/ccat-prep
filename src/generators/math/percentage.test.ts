import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/rng';
import { change, KINDS, of, percentage, reverse, successive } from './percentage';

const rng = () => new Rng(1);
const features = (p: ReturnType<typeof of>) => ({
  kind: KINDS[p.kind],
  friendly: p.friendly ? 1 : 0,
  steps: p.steps,
  valid: 1,
});

describe('percentage problems', () => {
  it('compute the right answers', () => {
    expect(of(25, 80, rng()).answer.text).toBe('20');
    expect(change(60, 75, rng()).answer.text).toBe('25%');
    expect(change(80, 60, rng()).answer.text).toBe('25%');
    expect(reverse(-20, 40, rng()).answer.text).toBe('$50');
    expect(reverse(25, 100, rng()).answer.text).toBe('$80');
    expect(successive([20, -20]).answer.text).toBe('4% decrease');
    expect(successive([25, -20]).answer.text).toBe('No change');
  });

  it('includes the blueprint traps', () => {
    // Dividing by the new price: 15 / 75 = 20%.
    expect(change(60, 75, rng()).distractors.map((c) => c.text)).toContain('20%');
    // Adding 20% to the discounted price: $48.
    expect(reverse(-20, 40, rng()).distractors.map((c) => c.text)).toContain('$48');
    // Adding the percentages: +20 − 20 = no change.
    expect(successive([20, -20]).distractors.map((c) => c.text)).toContain('No change');
  });
});

describe('calibration against the blueprint anchors', () => {
  it.each([
    [1, of(25, 80, rng())],
    [3, change(60, 75, rng())],
    [4, successive([20, -20])],
  ])('scores the level-%i anchor at its level', (level, problem) => {
    expect(percentage.score(features(problem))).toBe(level);
  });
});
