import { describe, expect, it } from 'vitest';
import { attributeValue, differences } from './diff';
import type { FigureSpec } from './figure';

const square: FigureSpec = { shape: 'polygon', sides: 4, fill: 'solid', rotation: 0, count: 2, dot: 0 };

describe('figure differences', () => {
  it('lists what a test-taker would see as different', () => {
    expect(differences(square, { ...square, fill: 'striped', count: 3 })).toEqual(['fill', 'count']);
    expect(differences(square, { ...square, sides: 5, dot: 1 })).toEqual(['shape', 'dot']);
  });

  it('ignores rotations that look the same', () => {
    expect(differences(square, { ...square, rotation: 90 })).toEqual([]);
    expect(differences({ ...square, sides: 3 }, { ...square, sides: 3, rotation: 90 })).toEqual(['rotation']);
  });

  it('reads attribute values in plain words', () => {
    expect(attributeValue({ ...square, sides: 8 }, 'shape')).toBe('an octagon');
    expect(attributeValue(square, 'count')).toBe('2 shapes');
    expect(attributeValue(square, 'dot')).toBe('the dot top-left');
  });
});
