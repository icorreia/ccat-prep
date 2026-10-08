import { because, text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';
import { RELATIONS, type AnalogyPair, type Relation } from '../../data/analogies';

export interface AnalogyItem {
  relation: Relation;
  first: AnalogyPair;
  second: AnalogyPair;
}

export const analogyLevel = ({ relation, first, second }: AnalogyItem) =>
  Math.max(relation.level, first.level ?? 0, second.level ?? 0) as Difficulty;

/** Wrong answers: words tied to C by another relation, then B itself, then answers from other relations. */
export function analogyDistractors(rng: Rng, { relation, first, second }: AnalogyItem): string[] {
  const others = RELATIONS.filter((r) => r !== relation).flatMap((r) => r.pairs.map((p) => p.b));
  const exclude = new Set([second.b, second.a]);
  return [...new Set([...rng.shuffle(second.lures ?? []), first.b, ...rng.shuffle(others)])].filter((w) => !exclude.has(w));
}

/** Why a wrong word doesn't complete the analogy. */
export function analogyNote({ relation, first, second }: AnalogyItem, word: string): string {
  if (second.lures?.includes(word)) {
    return `Linked to "${second.a}", but not in the same way. Test the relation: is it true that ${relation.describe(second.a, word)}?`;
  }
  if (word === first.b) return `That completes the first pair (${first.a} → ${first.b}), not "${second.a}".`;
  for (const r of RELATIONS) {
    const pair = r.pairs.find((p) => p.b === word);
    if (pair) return `Unrelated to "${second.a}". It belongs with "${pair.a}": ${r.describe(pair.a, word)}.`;
  }
  return `Doesn't relate to "${second.a}" the way "${first.b}" relates to "${first.a}".`;
}

export const analogy: Generator = {
  type: 'analogy',
  category: 'verbal',
  label: 'Analogies',
  levels: [2, 3, 4, 5],

  draft(rng, level): Draft {
    const relation = rng.pick(RELATIONS.filter((r) => r.level <= level));
    const [first, second] = rng.sample(relation.pairs, 2) as [AnalogyPair, AnalogyPair];
    const item = { relation, first, second };
    return {
      itemKey: `${second.a}:${second.b}`,
      prompt: `${first.a.toUpperCase()} is to ${first.b.toUpperCase()} as ${second.a.toUpperCase()} is to:`,
      answer: text(second.b),
      distractors: analogyDistractors(rng, item).map((w) => because(text(w), analogyNote(item, w))),
      explanation: `Just as ${relation.describe(first.a, first.b)}, ${relation.describe(second.a, second.b)}.`,
      features: { level: analogyLevel(item) },
    };
  },

  score: (f) => (f.level ?? 2) as Difficulty,
};
