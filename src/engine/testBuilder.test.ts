import { describe, expect, it } from 'vitest';
import { GENERATORS } from '../generators';
import { Rng } from './rng';
import { buildDrill, buildTest, categoryCounts, fingerprint, interleave, JITTER, MIX, rampLevel, TEST_LENGTH } from './testBuilder';

const tests = Array.from({ length: 30 }, (_, seed) => buildTest(GENERATORS, seed));

describe('buildTest', () => {
  it('has 50 questions and a 15-minute limit', () => {
    for (const t of tests) {
      expect(t.questions).toHaveLength(TEST_LENGTH);
      expect(t.timeLimitMs).toBe(15 * 60 * 1000);
    }
  });

  it('follows the reported category mix within the jitter', () => {
    for (const t of tests) {
      const count = (c: string) => t.questions.filter((q) => q.category === c).length;
      expect(Math.abs(count('verbal') - MIX.verbal)).toBeLessThanOrEqual(JITTER);
      expect(Math.abs(count('spatial') - MIX.spatial)).toBeLessThanOrEqual(JITTER);
      const logic = t.questions.filter((q) => q.type === 'syllogism' || q.type === 'ordering').length;
      expect(logic).toBeGreaterThanOrEqual(5);
      expect(logic).toBeLessThanOrEqual(6);
    }
  });

  it('uses every question type across a few tests', () => {
    const types = new Set(tests.flatMap((t) => t.questions.map((q) => q.type)));
    expect([...types].sort()).toEqual(GENERATORS.map((g) => g.type).sort());
  });

  it('gets harder from start to end', () => {
    for (const t of tests) {
      const avg = (qs: typeof t.questions) => qs.reduce((s, q) => s + q.difficulty, 0) / qs.length;
      expect(avg(t.questions.slice(0, 10))).toBeLessThan(avg(t.questions.slice(-10)));
    }
  });

  it('never repeats an item within a test', () => {
    for (const t of tests) {
      const keys = t.questions.map(fingerprint);
      const repeats = keys.filter((k, i) => keys.indexOf(k) !== i);
      // Rare collisions are tolerated only after 20 regeneration attempts; there should be none.
      expect(repeats).toEqual([]);
    }
  });

  it('never shows the same type three times in a row', () => {
    for (const t of tests) {
      for (let i = 2; i < t.questions.length; i++) {
        const [a, b, c] = [t.questions[i - 2]!.type, t.questions[i - 1]!.type, t.questions[i]!.type];
        expect(a === b && b === c).toBe(false);
      }
    }
  });

  it('is deterministic for a seed', () => {
    expect(buildTest(GENERATORS, 7).questions.map((q) => q.id)).toEqual(buildTest(GENERATORS, 7).questions.map((q) => q.id));
  });
});

describe('helpers', () => {
  it('categoryCounts always sums to 50', () => {
    for (let s = 0; s < 200; s++) {
      const c = categoryCounts(new Rng(s));
      expect(c.verbal + c.spatial + c['math-logic']).toBe(50);
    }
  });

  it('rampLevel starts easy and ends hard', () => {
    const rng = new Rng(1);
    expect(rampLevel(rng, 0)).toBeLessThanOrEqual(2);
    expect(rampLevel(rng, 49)).toBeGreaterThanOrEqual(4);
  });

  it('interleave breaks up triples', () => {
    expect(interleave(['a', 'a', 'a', 'b'], (x) => x)).toEqual(['a', 'a', 'b', 'a']);
  });
});

describe('buildDrill', () => {
  const series = GENERATORS.filter((g) => g.type === 'number-series');
  const verbal = GENERATORS.filter((g) => g.category === 'verbal');

  it('draws only from the chosen generators, at a fixed level', () => {
    const qs = buildDrill({ generators: series, count: 10, level: 4 }, 1);
    expect(qs).toHaveLength(10);
    expect(qs.every((q) => q.type === 'number-series' && q.difficulty === 4)).toBe(true);
  });

  it('spreads a category evenly over its types', () => {
    const qs = buildDrill({ generators: verbal, count: 20, level: 'ramp' }, 2);
    for (const g of verbal) expect(qs.filter((q) => q.type === g.type)).toHaveLength(4);
  });

  it('uses the nearest supported level when a type lacks the requested one', () => {
    const ratio = GENERATORS.filter((g) => g.type === 'ratio'); // levels 2–5
    expect(buildDrill({ generators: ratio, count: 5, level: 1 }, 3).every((q) => q.difficulty === 2)).toBe(true);
  });

  it('never repeats an item', () => {
    const qs = buildDrill({ generators: GENERATORS.filter((g) => g.type === 'analogy'), count: 30, level: 'ramp' }, 4);
    expect(new Set(qs.map(fingerprint)).size).toBe(30);
  });
});
