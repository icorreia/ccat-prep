import { describe, expect, it } from 'vitest';
import { numericChoices, numericDistractors } from './distractors';
import { Rng } from './rng';

describe('numericDistractors', () => {
  it('puts mistake-based values first, in order', () => {
    const out = numericDistractors(50, [48, 60], 4, new Rng(1));
    expect(out.slice(0, 2)).toEqual([48, 60]);
    expect(out).toHaveLength(4);
  });

  it('never includes the answer, duplicates, negatives or fractions by default', () => {
    for (let seed = 0; seed < 500; seed++) {
      const answer = new Rng(seed).int(0, 300);
      const out = numericDistractors(answer, [answer, -3, 2.5, answer + 1, answer + 1], 4, new Rng(seed));
      expect(out).toHaveLength(4);
      expect(out).not.toContain(answer);
      expect(new Set(out).size).toBe(4);
      for (const v of out) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(v)).toBe(true);
      }
    }
  });

  it('allows negatives and fractions when asked', () => {
    const out = numericDistractors(-4, [0, -2.5], 2, new Rng(1), { min: -100, integer: false });
    expect(out).toEqual([0, -2.5]);
  });

  it('keeps fillers near the answer', () => {
    const out = numericDistractors(200, [], 4, new Rng(5));
    for (const v of out) expect(Math.abs(v - 200)).toBeLessThanOrEqual(100);
  });
});

describe('numericChoices', () => {
  it('keeps the note of each mistake, formats values, and leaves fillers without a note', () => {
    const choices = numericChoices(50, [{ value: 48, why: 'added instead of reversing' }, 40, { value: 50, why: 'is the answer' }], 4, new Rng(1), {
      format: (v) => `$${v}`,
    });
    expect(choices[0]).toEqual({ kind: 'text', text: '$48', why: 'added instead of reversing' });
    expect(choices[1]).toEqual({ kind: 'text', text: '$40' });
    expect(choices.every((c) => c.text !== '$50')).toBe(true);
    expect(choices.slice(2).every((c) => c.why === undefined)).toBe(true);
  });

  it('picks the same values as numericDistractors for the same seed', () => {
    const mistakes = [{ value: 12, why: 'x' }, 30];
    expect(numericChoices(20, mistakes, 4, new Rng(5)).map((c) => Number(c.text))).toEqual(numericDistractors(20, mistakes, 4, new Rng(5)));
  });
});
