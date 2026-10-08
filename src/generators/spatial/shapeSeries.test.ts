import { describe, expect, it } from 'vitest';
import { figureKey, visibleRotation, type FigureSpec } from '../../spatial/figure';
import { buildSeries, count, dot, fill, rotate, seriesFeatures, shapeSeries, sides } from './shapeSeries';

const base: FigureSpec = { shape: 'polygon', sides: 3, fill: 'empty', rotation: 0, count: 1 };

describe('figure keys', () => {
  it('treat rotations that look identical as the same figure', () => {
    const square = { ...base, sides: 4 };
    expect(figureKey({ ...square, rotation: 90 })).toBe(figureKey(square));
    expect(figureKey({ ...base, rotation: 120 })).toBe(figureKey(base)); // triangle
    expect(figureKey({ ...base, rotation: 90 })).not.toBe(figureKey(base));
    expect(visibleRotation({ ...base, shape: 'arrow', rotation: -90 })).toBe(270);
  });
});

describe('buildSeries', () => {
  it('applies every rule once per panel', () => {
    const s = buildSeries(base, [sides, fill]);
    expect(s.panels.map((p) => [p.sides, p.fill])).toEqual([
      [3, 'empty'],
      [4, 'striped'],
      [5, 'solid'],
      [6, 'empty'],
    ]);
    expect([s.answer.sides, s.answer.fill]).toEqual([7, 'striped']);
  });

  it('builds wrong answers that differ from the answer', () => {
    const s = buildSeries({ ...base, shape: 'arrow', dot: 0 }, [rotate(90), dot]);
    const answerKey = figureKey(s.answer);
    expect(s.wrong.filter((w) => figureKey(w) !== answerKey).length).toBeGreaterThanOrEqual(4);
  });
});

describe('calibration against the blueprint anchors', () => {
  it.each([
    [2, [rotate(90)]], // a triangle rotates 90° each panel
    [3, [sides, fill]], // triangle, square, pentagon… alternating fill
    [4, [dot, rotate(45)]], // dot moves around the corners while the shape rotates
    [1, [count]],
  ] as const)('scores the level-%i anchor at its level', (level, rules) => {
    const s = buildSeries(base, [...rules]);
    expect(shapeSeries.score({ ...seriesFeatures(s), valid: 1 })).toBe(level);
  });
});
