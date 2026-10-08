import { describe, expect, it } from 'vitest';
import { Rng } from './rng';

describe('Rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(
      Array.from({ length: 5 }, () => b.next()),
    );
  });

  it('differs across seeds', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });

  it('int() stays within inclusive bounds and hits both ends', () => {
    const rng = new Rng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(3, 6);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('int() rejects invalid bounds', () => {
    expect(() => new Rng(1).int(5, 4)).toThrow(RangeError);
    expect(() => new Rng(1).int(0.5, 4)).toThrow(RangeError);
  });

  it('shuffle() returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = new Rng(3).shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual(input);
  });

  it('sample() returns distinct items', () => {
    const out = new Rng(9).sample(['a', 'b', 'c', 'd'], 3);
    expect(new Set(out).size).toBe(3);
  });

  it('pick() throws on an empty array', () => {
    expect(() => new Rng(1).pick([])).toThrow(RangeError);
  });
});
