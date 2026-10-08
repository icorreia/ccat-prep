import { describe, expect, it } from 'vitest';
import { generateQuestion, rebuildQuestion, text } from './question';
import type { Difficulty, Generator } from './types';

/** Toy generator: "a + b", difficulty = number of digits in the larger operand. */
const addition: Generator = {
  type: 'toy-add',
  category: 'math-logic',
  label: 'Toy addition',
  draft(rng, target) {
    const max = 10 ** Math.min(target, 3) - 1;
    const a = rng.int(1, max);
    const b = rng.int(1, max);
    const sum = a + b;
    return {
      prompt: `${a} + ${b} = ?`,
      answer: text(sum),
      distractors: [sum + 1, sum - 1, sum + 10, sum - 10, sum + 1].map(text),
      explanation: `${a} + ${b} = ${sum}`,
      features: { digits: String(Math.max(a, b)).length },
    };
  },
  score: (f) => Math.min(5, f.digits ?? 1) as Difficulty,
};

describe('generateQuestion', () => {
  it('produces a question at the requested measured difficulty', () => {
    for (const level of [1, 2, 3] as Difficulty[]) {
      const q = generateQuestion(addition, level, 123);
      expect(q.difficulty).toBe(level);
      expect(addition.score(q.features)).toBe(level);
    }
  });

  it('places the answer at answerIndex among 5 distinct choices', () => {
    for (let seed = 0; seed < 200; seed++) {
      const q = generateQuestion(addition, 2, seed);
      expect(q.choices).toHaveLength(5);
      expect(new Set(q.choices.map((c) => c.text)).size).toBe(5);
      const [a, b] = q.prompt.split(/[+=]/).map((s) => Number(s.trim()));
      expect(q.choices[q.answerIndex]!.text).toBe(String(a! + b!));
    }
  });

  it('is reproducible from its id', () => {
    const q = generateQuestion(addition, 2, 99);
    expect(q.id).toBe('toy-add:2:99');
    expect(rebuildQuestion(addition, q.id)).toEqual(q);
  });

  it('respects a smaller choiceCount', () => {
    const tfu: Generator = {
      ...addition,
      type: 'toy-tfu',
      draft: () => ({
        prompt: 'All A are B. Is every A a B?',
        answer: text('True'),
        distractors: [text('False'), text('Uncertain')],
        explanation: 'Given directly.',
        features: { digits: 1 },
        choiceCount: 3,
      }),
    };
    expect(generateQuestion(tfu, 1, 1).choices).toHaveLength(3);
  });

  it('throws when the target level is unreachable', () => {
    expect(() => generateQuestion(addition, 5, 1)).toThrow(/no level-5 question/);
  });

  it('skips drafts without enough distinct distractors', () => {
    const thin: Generator = {
      ...addition,
      draft: (rng, target) => ({ ...addition.draft(rng, target), distractors: [text(0), text(0)] }),
    };
    expect(() => generateQuestion(thin, 1, 1)).toThrow();
  });
});
