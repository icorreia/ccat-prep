import { describe, expect, it } from 'vitest';
import { choiceKey, generateQuestion, rebuildQuestion } from '../engine/question';
import { GENERATORS, getGenerator } from './index';

/** Seeds per generator, spread evenly over its levels. */
const SEEDS = 1000;

describe.each(GENERATORS.map((g) => [g.type, g] as const))('%s', (_type, generator) => {
  const questions = Array.from({ length: SEEDS }, (_, seed) =>
    generateQuestion(generator, generator.levels[seed % generator.levels.length]!, seed),
  );

  it('produces every declared level at its measured difficulty', () => {
    for (const q of questions) expect(generator.score(q.features)).toBe(q.difficulty);
  });

  it('has visually distinct choices with the answer at answerIndex', () => {
    for (const q of questions) {
      const keys = q.choices.map(choiceKey);
      expect(new Set(keys).size).toBe(keys.length);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(q.choices.length);
    }
  });

  it('keeps numeric choices whole and non-negative (mental math)', () => {
    for (const q of questions) {
      for (const c of q.choices) {
        const raw = c.text.replace(/^\$|%$/g, ''); // "$50" and "25%" are numeric too
        const n = Number(raw);
        if (raw.trim() !== '' && !Number.isNaN(n)) {
          expect(Number.isInteger(n), `${q.id}: ${c.text}`).toBe(true);
          expect(n, `${q.id}: ${c.text}`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('has a prompt and an explanation', () => {
    for (const q of questions) {
      expect(q.prompt.length).toBeGreaterThan(5);
      expect(q.explanation.length).toBeGreaterThan(5);
    }
  });

  it('places the answer at every position across seeds', () => {
    // Grouped by choice count: some types vary it (e.g. 3–5 people in ordering puzzles).
    const positionsByCount = new Map<number, Set<number>>();
    for (const q of questions) {
      const set = positionsByCount.get(q.choices.length) ?? new Set();
      positionsByCount.set(q.choices.length, set.add(q.answerIndex));
    }
    for (const [count, positions] of positionsByCount) expect(positions.size, `${count} choices`).toBe(count);
  });

  it('rebuilds identically from its id', () => {
    for (const q of questions.slice(0, 50)) expect(rebuildQuestion(generator, q.id)).toEqual(q);
  });
});

describe('getGenerator', () => {
  it('finds registered types and rejects unknown ones', () => {
    expect(getGenerator('number-series').type).toBe('number-series');
    expect(() => getGenerator('nope')).toThrow(/Unknown question type/);
  });
});
