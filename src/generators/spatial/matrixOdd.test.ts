import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/rng';
import { generateQuestion } from '../../engine/question';
import { figureKey, type FigureSpec } from '../../spatial/figure';
import { buildLayout, cell, matrix, matrixFeatures, type Arrangement, type Layout } from './matrix';
import { isFair, oddOneOut } from './oddOneOut';

const layout = (shape: Arrangement, count: Arrangement, fill: Arrangement): Layout => ({
  shape: { arrangement: shape, order: [0, 1, 2] },
  count: { arrangement: count, order: [0, 1, 2] },
  fill: { arrangement: fill, order: [0, 1, 2] },
});

describe('matrix', () => {
  it('keeps row attributes constant along rows and Latin attributes unique per row and column', () => {
    for (let seed = 0; seed < 100; seed++) {
      const l = buildLayout(new Rng(seed), ['latin', 'row', 'column']);
      for (let i = 0; i < 3; i++) {
        const row = [0, 1, 2].map((c) => cell(l, i, c));
        const col = [0, 1, 2].map((r) => cell(l, r, i));
        const latinAttr = (Object.keys(l) as (keyof Layout)[]).find((k) => l[k].arrangement === 'latin')!;
        const attr = (f: FigureSpec) => JSON.stringify(latinAttr === 'shape' ? [f.shape, f.sides] : f[latinAttr]);
        expect(new Set(row.map(attr)).size).toBe(3);
        expect(new Set(col.map(attr)).size).toBe(3);
      }
    }
  });

  it.each([
    [3, layout('row', 'column', 'constant')], // shape per row, count per column
    [4, layout('row', 'column', 'column')], // plus shading
    [5, layout('latin', 'latin', 'latin')], // every attribute a Latin square
    [1, layout('row', 'constant', 'constant')],
  ])('scores the level-%i anchor at its level', (level, l) => {
    expect(matrix.score(matrixFeatures(l))).toBe(level);
  });
});

describe('odd one out', () => {
  /** Rule checks written independently of the generator. */
  const holds: Record<number, (f: FigureSpec, all: FigureSpec[]) => boolean> = {
    1: (f, all) => all.filter((g) => g.fill === f.fill).length >= 4,
    2: (f, all) => all.filter((g) => g.sides === f.sides).length >= 4,
    3: (f, all) => all.filter((g) => g.count % 2 === f.count % 2).length >= 4,
    4: (f) => f.count === f.sides,
    5: (f) => [315, 45, 135, 225][f.dot!] === f.rotation,
  };

  it('has exactly one figure that breaks the rule, at every level', () => {
    for (let seed = 0; seed < 200; seed++) {
      const level = oddOneOut.levels[seed % 5]!;
      const q = generateQuestion(oddOneOut, level, seed);
      const figures = q.choices.map((c) => (c.kind === 'figure' ? c.figure : null)!);
      const breakers = figures.filter((f) => !holds[level]!(f, figures));
      expect(breakers.map(figureKey), q.id).toEqual([figureKey(figures[q.answerIndex]!)]);
    }
  });

  it('rejects sets where another figure stands out on its own', () => {
    const square = (fill: FigureSpec['fill'], count: number): FigureSpec => ({ shape: 'polygon', sides: 4, fill, rotation: 0, count });
    // The intended odd one has 3 shapes, but the striped one is a second lone outlier.
    const members = [square('solid', 2), square('solid', 4), square('striped', 2), square('solid', 6)];
    expect(isFair({ rule: 'parity', members, odd: square('solid', 3), explanation: '' })).toBe(false);
  });
});

describe('odd one out shortcuts', () => {
  it('never lets an unrelated trait single out the answer', () => {
    for (let seed = 0; seed < 200; seed++) {
      const q = generateQuestion(oddOneOut, 5, seed);
      const fills = q.choices.map((c) => (c.kind === 'figure' ? c.figure.fill : ''));
      const answerFill = fills[q.answerIndex];
      expect(fills.filter((f) => f === answerFill).length, q.id).toBeGreaterThan(1);
    }
  });
});
