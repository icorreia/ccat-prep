import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/rng';
import { askAbout, buildPuzzle, type Constraint, describe as describeConstraint, features, ordering, solve } from './ordering';

describe('solve', () => {
  it('finds the unique arrangement for the blueprint anchors', () => {
    // Tom > Ann > Joe in height.
    expect(solve(['Tom', 'Ann', 'Joe'], [
      { kind: 'before', a: 'Tom', b: 'Ann' },
      { kind: 'before', a: 'Ann', b: 'Joe' },
    ])).toEqual([['Tom', 'Ann', 'Joe']]);

    // Ava ahead of Ben but behind Cal; Dan last.
    expect(solve(['Ava', 'Ben', 'Cal', 'Dan'], [
      { kind: 'before', a: 'Ava', b: 'Ben' },
      { kind: 'before', a: 'Cal', b: 'Ava' },
      { kind: 'at', a: 'Dan', k: 3 },
    ])).toEqual([['Cal', 'Ava', 'Ben', 'Dan']]);

    // Seats: Eve 3, Finn immediately left of Eve, Ian next to Eve, Gus not in seat 1.
    expect(solve(['Eve', 'Finn', 'Gus', 'Hana', 'Ian'], [
      { kind: 'at', a: 'Eve', k: 2 },
      { kind: 'immediately', a: 'Finn', b: 'Eve' },
      { kind: 'adjacent', a: 'Ian', b: 'Eve' },
      { kind: 'notAt', a: 'Gus', k: 0 },
    ])).toEqual([['Hana', 'Finn', 'Eve', 'Ian', 'Gus']]);
  });
});

describe('buildPuzzle', () => {
  it('always yields exactly one solution with no redundant statements', () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = new Rng(seed);
      const names = ['Ava', 'Ben', 'Cal', 'Dan', 'Eve'].slice(0, 3 + (seed % 3));
      const puzzle = buildPuzzle(rng, names, (['race', 'seats', 'height'] as const)[seed % 3]!);
      if (!puzzle) continue;
      expect(solve(names, puzzle.constraints)).toEqual([puzzle.order]);
      for (const c of puzzle.constraints) {
        expect(solve(names, puzzle.constraints.filter((d) => d !== c)).length).toBeGreaterThan(1);
      }
    }
  });

  it('words constraints for each setting', () => {
    const c: Constraint = { kind: 'at', a: 'Eve', k: 4 };
    expect(describeConstraint(c, 'race', 5)).toBe('Eve finished last.');
    expect(describeConstraint(c, 'seats', 5)).toBe('Eve sits in seat 5.');
  });
});

describe('calibration against the blueprint anchors', () => {
  const puzzle = (names: string[], constraints: Constraint[]) => ({ names, setting: 'race' as const, order: names, constraints });
  it.each([
    [2, puzzle(['Tom', 'Ann', 'Joe'], [{ kind: 'before', a: 'Tom', b: 'Ann' }, { kind: 'before', a: 'Ann', b: 'Joe' }])],
    [3, puzzle(['Ava', 'Ben', 'Cal', 'Dan'], [
      { kind: 'before', a: 'Ava', b: 'Ben' },
      { kind: 'before', a: 'Cal', b: 'Ava' },
      { kind: 'at', a: 'Dan', k: 3 },
    ])],
    [4, puzzle(['Eve', 'Finn', 'Gus', 'Hana', 'Ian'], [
      { kind: 'at', a: 'Eve', k: 2 },
      { kind: 'immediately', a: 'Finn', b: 'Eve' },
      { kind: 'adjacent', a: 'Ian', b: 'Eve' },
      { kind: 'notAt', a: 'Gus', k: 0 },
    ])],
  ])('scores the level-%i anchor at its level', (level, p) => {
    expect(ordering.score({ ...features(p), valid: 1 })).toBe(level);
  });
});

describe('notes on wrong names', () => {
  // Ava, Ben, Cal, Dan, Eve finish in that order; the question asks who finished third (Cal).
  const puzzle = {
    names: ['Ava', 'Ben', 'Cal', 'Dan', 'Eve'],
    setting: 'race' as const,
    order: ['Ava', 'Ben', 'Cal', 'Dan', 'Eve'],
    constraints: [
      { kind: 'at', a: 'Cal', k: 2 },
      { kind: 'immediately', a: 'Ava', b: 'Ben' },
      { kind: 'immediately', a: 'Dan', b: 'Eve' },
      { kind: 'at', a: 'Ava', k: 0 },
    ] as Constraint[],
  };
  const { answer, notes } = askAbout(puzzle, 2);

  it('says when only the statement that answers the question rules a name out', () => {
    expect(answer).toBe('Cal');
    expect(notes.get('Dan')).toBe('Ruled out directly: "Cal finished third." Dan finished fourth.');
  });

  it('otherwise says where the person actually is', () => {
    expect(notes.get('Ava')).toBe('Actually, Ava finished first.');
    expect(notes.has('Cal')).toBe(false);
  });
});
