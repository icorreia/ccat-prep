import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/rng';
import { chain, inverse, KINDS, ratioGenerator, scaledWork, split, threePart } from './ratio';

const rng = () => new Rng(1);
const features = (p: ReturnType<typeof split>) => ({ kind: KINDS[p.kind], valid: p.valid ? 1 : 0 });

describe('ratio problems', () => {
  it('compute the right answers', () => {
    expect(split(3, 5, 40, ['boys', 'girls'], rng()).answer.text).toBe('25');
    expect(inverse(4, 6, 3, rng()).answer.text).toBe('8');
    expect(chain([2, 3], [4, 5]).answer.text).toBe('8:15');
    // 2 machines, 20 parts in 5 h → 2 parts per machine-hour; 4 machines, 40 parts → 5 h.
    expect(scaledWork(2, 20, 5, 4, 40, rng()).answer.text).toBe('5');
  });

  it('includes the blueprint traps', () => {
    expect(chain([2, 3], [4, 5]).distractors.map((c) => c.text)).toContain('2:5');
    // Treating 3 workers as direct proportion: 6 × 3 / 4 = 4.5 is fractional, so it's filtered; the other traps remain.
    expect(inverse(4, 6, 3, rng()).distractors.map((c) => c.text)).toContain('6');
  });
});

describe('calibration against the blueprint anchors', () => {
  it.each([
    [2, split(3, 5, 40, ['boys', 'girls'], rng())],
    [3, inverse(4, 6, 3, rng())],
    [4, chain([2, 3], [4, 5])],
    [4, chain([3, 4], [5, 6], { askReverse: true })],
    [5, chain([3, 4], [5, 6], { flipped: true })],
    [5, threePart([3, 4], [5, 6], 2, 'C', rng())],
  ])('scores the level-%i anchor at its level', (level, problem) => {
    expect(ratioGenerator.score(features(problem))).toBe(level);
  });
});

describe('trap variants', () => {
  const choice = (p: ReturnType<typeof chain>, text: string) => p.distractors.find((c) => c.text === text);

  it('gives the second ratio as C:B, with "forgot to flip" as the trap', () => {
    // A:B = 3:4, C:B = 6:5 → B:C = 5:6 → A:B:C = 15:20:24 → A:C = 5:8. Read as B:C = 6:5, it gives 9:10.
    const p = chain([3, 4], [5, 6], { flipped: true });
    expect(p.prompt).toContain('the ratio C:B is 6:5');
    expect(p.answer.text).toBe('5:8');
    expect(choice(p, '9:10')?.why).toContain('Flip it first: B:C = 5:6');
    expect(p.explanation).toMatch(/^Flip C:B to B:C = 5:6\./);
  });

  it('asks for C:A, with A:C as the trap', () => {
    const p = chain([3, 4], [5, 6], { askReverse: true });
    expect(p.prompt).toContain('What is the ratio C:A?');
    expect(p.answer.text).toBe('8:5');
    expect(choice(p, '5:8')?.why).toBe("That's A:C; the question asks for C:A.");
  });

  it('splits a total in a three-part ratio, offering the other parts as traps', () => {
    const p = threePart([3, 4], [5, 6], 2, 'C', rng());
    expect(p.prompt).toContain('A + B + C = 118. What is C?');
    expect(p.answer.text).toBe('48');
    expect(p.distractors.find((c) => c.text === '30')?.why).toBe("That's A, not C.");
    expect(p.explanation).toContain('A:B:C = 15:20:24, which is 59 parts');
  });
});
