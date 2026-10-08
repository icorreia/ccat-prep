import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/rng';
import { change, KINDS, lessThan, of, percentage, points, reverse, successive, whatPercent } from './percentage';

const rng = () => new Rng(1);
const features = (p: ReturnType<typeof of>) => ({
  kind: KINDS[p.kind],
  friendly: p.friendly ? 1 : 0,
  steps: p.steps,
  successive: p.kind === 'successive' ? 1 : 0,
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
    [2, whatPercent(20, 80, rng())],
    [4, lessThan(25, rng())],
    [5, lessThan(300, rng())],
    [4, points(4, 5, rng())],
  ])('scores the level-%i anchor at its level', (level, problem) => {
    expect(percentage.score(features(problem))).toBe(level);
  });
});

describe('trap variants', () => {
  const note = (p: ReturnType<typeof of>, text: string) => p.distractors.find((c) => c.text === text)?.why;

  it('"x is what percentage of y", with dividing the wrong way round as the trap', () => {
    const p = whatPercent(20, 80, rng());
    expect(p.answer.text).toBe('25%');
    expect(note(p, '400%')).toContain('Divided the wrong way round (80 ÷ 20)');
    expect(note(p, '75%')).toContain("That's the rest");
  });

  it('"p% more" is not "p% less" the other way', () => {
    const p = lessThan(25, rng());
    expect(p.answer.text).toBe('20%');
    expect(note(p, '25%')).toContain('The same 25% back');
    expect(note(p, '80%')).toContain("B's salary as a percentage of A's");
    expect(lessThan(300, rng()).answer.text).toBe('75%');
  });

  it('a rise in percentage points is not the percentage increase', () => {
    const p = points(4, 5, rng());
    expect(p.answer.text).toBe('25%');
    expect(note(p, '1%')).toContain('percentage points (5 − 4)');
    expect(note(p, '20%')).toContain('Divided by the new rate');
  });
});
