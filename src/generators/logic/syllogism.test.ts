import { describe, expect, it } from 'vitest';
import { evaluate, features, sentence, syllogism, type Statement } from './syllogism';

const [A, B, C] = [0, 1, 2];
const s = (q: Statement['q'], x: number, y: number): Statement => ({ q, x, y });

describe('evaluate (model checker)', () => {
  it.each([
    // Classic valid forms
    ['All A are B; All B are C ⊢ All A are C', [s('all', A, B), s('all', B, C)], s('all', A, C), 'True'],
    ['All A are B; No B are C ⊢ No A are C', [s('all', A, B), s('no', B, C)], s('no', A, C), 'True'],
    ['Some A are B; All B are C ⊢ Some A are C', [s('some', A, B), s('all', B, C)], s('some', A, C), 'True'],
    // Definitely false (existential import: every group has members)
    ['All A are B; All B are C ⊢ No A are C', [s('all', A, B), s('all', B, C)], s('no', A, C), 'False'],
    ['All A are B; No B are C ⊢ Some A are C', [s('all', A, B), s('no', B, C)], s('some', A, C), 'False'],
    // Classic fallacies → Uncertain
    ['All A are B; Some B are C ⊢ Some A are C', [s('all', A, B), s('some', B, C)], s('some', A, C), 'Uncertain'],
    ['All A are B; All C are B ⊢ All A are C', [s('all', A, B), s('all', C, B)], s('all', A, C), 'Uncertain'],
    ['Some A are B; Some B are C ⊢ Some A are C', [s('some', A, B), s('some', B, C)], s('some', A, C), 'Uncertain'],
  ] as const)('%s → %s', (_label, premises, conclusion, verdict) => {
    expect(evaluate(3, [...premises], conclusion)).toBe(verdict);
  });

  it('handles single-premise conversions', () => {
    expect(evaluate(2, [s('no', A, B)], s('no', B, A))).toBe('True');
    expect(evaluate(2, [s('all', A, B)], s('all', B, A))).toBe('Uncertain');
    expect(evaluate(2, [s('all', A, B)], s('some', B, A))).toBe('True');
  });

  it('rejects contradictory premises', () => {
    expect(() => evaluate(2, [s('all', A, B), s('no', A, B)], s('some', A, B))).toThrow(/Contradictory/);
  });

  it('writes plain sentences', () => {
    expect(sentence(s('someNot', A, B), ['bakers', 'runners'])).toBe('Some bakers are not runners.');
  });
});

describe('calibration against the blueprint anchors', () => {
  const names = ['roses', 'flowers', 'plants'];
  it.each([
    [2, [s('all', A, B), s('all', B, C)], s('all', A, C)], // roses → flowers → need water
    [3, [s('some', A, B), s('all', B, C)], s('some', A, C)], // managers / engineers / analysts
    [4, [s('all', A, B), s('some', B, C)], s('some', A, C)], // Uncertain
  ] as const)('scores the level-%i anchor at its level', (level, premises, conclusion) => {
    const puzzle = { names, premises: [...premises], conclusion, verdict: evaluate(3, [...premises], conclusion) };
    expect(syllogism.score({ ...features(puzzle), valid: 1 })).toBe(level);
  });
});
