import { describe, expect, it } from 'vitest';
import { RELATIONS } from '../../data/analogies';
import { WORD_PAIRS } from '../../data/words';
import { generateQuestion } from '../../engine/question';
import { analogy, analogyLevel, analogyNote } from './analogy';
import { antonym, gloss, synonym } from './vocabulary';

const pairOf = (word: string) => WORD_PAIRS.find((p) => word in p.a || word in p.b)!;
const sameSide = (x: string, y: string) => {
  const p = pairOf(x);
  return (x in p.a && y in p.a) || (x in p.b && y in p.b);
};
const target = (prompt: string) => prompt.match(/([A-Z-]{2,})\.$/)![1]!.toLowerCase();

describe('synonym and antonym questions', () => {
  it('have exactly one choice with the asked relation', () => {
    for (const [gen, wantSame] of [[synonym, true], [antonym, false]] as const) {
      for (let seed = 0; seed < 300; seed++) {
        const q = generateQuestion(gen, gen.levels[seed % 5]!, seed);
        const t = target(q.prompt);
        const matches = q.choices.filter((c) => pairOf(c.text) === pairOf(t) && sameSide(t, c.text) === wantSame);
        expect(matches.map((c) => c.text), q.id).toEqual([q.choices[q.answerIndex]!.text]);
      }
    }
  });

  it('includes the opposite-relation trap when one exists', () => {
    const q = generateQuestion(antonym, 3, 7);
    const t = target(q.prompt);
    const traps = q.choices.filter((c) => c.text !== t && pairOf(c.text) === pairOf(t) && sameSide(t, c.text));
    expect(traps.length).toBeLessThanOrEqual(1);
  });
});

describe('calibration against the blueprint anchors', () => {
  const level = (word: string, answer: string) => {
    const p = pairOf(word);
    return Math.max((p.a[word] ?? p.b[word])!, (p.a[answer] ?? p.b[answer])!);
  };
  it.each([
    [1, 'big', 'large'],
    [3, 'candid', 'frank'],
    [5, 'obdurate', 'stubborn'],
    [1, 'ancient', 'modern'],
    [3, 'scarce', 'abundant'],
    [5, 'laud', 'disparage'],
  ])('level %i: %s / %s', (expected, word, answer) => {
    expect(level(word, answer)).toBe(expected);
  });

  it.each([
    [2, 'part-whole', 'finger', 'toe'],
    [3, 'measure', 'thermometer', 'barometer'],
    [4, 'degree', 'drizzle', 'breeze'],
  ])('analogy level %i: %s', (expected, relationId, a, c) => {
    const relation = RELATIONS.find((r) => r.id === relationId)!;
    const first = relation.pairs.find((p) => p.a === a)!;
    const second = relation.pairs.find((p) => p.a === c)!;
    expect(analogyLevel({ relation, first, second })).toBe(expected);
    expect(analogy.score({ level: analogyLevel({ relation, first, second }) })).toBe(expected);
  });
});

describe('notes on wrong verbal answers', () => {
  it('glosses a rare word with a common one from its cluster', () => {
    expect(gloss('minuscule')).toBe('small');
    expect(gloss('jubilant')).toBe('happy');
  });

  it('explains analogy lures, the first pair, and words from other relations', () => {
    const relation = RELATIONS.find((r) => r.id === 'worker-tool')!;
    const [first, second] = [relation.pairs.find((p) => p.a === 'painter')!, relation.pairs.find((p) => p.a === 'farmer')!];
    const item = { relation, first, second };
    expect(analogyNote(item, 'field')).toBe('Linked to "farmer", but not in the same way. Test the relation: is it true that a farmer uses a field as a tool?');
    expect(analogyNote(item, 'brush')).toBe('That completes the first pair (painter → brush), not "farmer".');
    const elsewhere = RELATIONS.find((r) => r.id === 'part-whole')!.pairs[0]!;
    expect(analogyNote(item, elsewhere.b)).toContain(`It belongs with "${elsewhere.a}"`);
  });
});
