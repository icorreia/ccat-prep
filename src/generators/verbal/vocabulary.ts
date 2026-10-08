import { text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';
import { WORD_PAIRS, type Cluster, type WordPair } from '../../data/words';

type Mode = 'synonym' | 'antonym';

const words = (c: Cluster) => Object.keys(c);
const tier = (pair: WordPair, word: string) => (pair.a[word] ?? pair.b[word])!;

/** Words that can safely be wrong answers for a question about `pair`: same part of speech, unrelated meaning. */
function unrelatedWords(pair: WordPair): string[] {
  return WORD_PAIRS.filter(
    (p) => p.pos === pair.pos && p.id !== pair.id && !pair.avoid?.includes(p.id) && !p.avoid?.includes(pair.id),
  ).flatMap((p) => [...words(p.a), ...words(p.b)]);
}

/** Picks a word from `cluster` with tier <= maxTier, preferring tiers close to `level`. */
function pickNear(rng: Rng, cluster: Cluster, level: number, exclude: string[] = []): string | undefined {
  const candidates = words(cluster).filter((w) => !exclude.includes(w) && cluster[w]! <= level);
  const close = candidates.filter((w) => cluster[w]! >= level - 1);
  return close.length ? rng.pick(close) : candidates.length ? rng.pick(candidates) : undefined;
}

export interface VocabItem {
  pair: WordPair;
  target: string;
  answer: string;
  /** The opposite relation: an antonym for synonym questions, a synonym for antonym questions. */
  traps: string[];
  others: string[];
}

export function buildItem(rng: Rng, mode: Mode, level: Difficulty): VocabItem | null {
  const pair = rng.pick(WORD_PAIRS);
  const [same, opposite] = rng.chance(0.5) ? [pair.a, pair.b] : [pair.b, pair.a];
  const target = pickNear(rng, same, level);
  if (!target) return null;
  const answer = mode === 'synonym' ? pickNear(rng, same, level, [target]) : pickNear(rng, opposite, level);
  if (!answer) return null;
  const trapSource = mode === 'synonym' ? opposite : same;
  const traps = rng.shuffle(words(trapSource).filter((w) => w !== target && w !== answer && trapSource[w]! <= level + 1));
  const others = rng.shuffle(unrelatedWords(pair).filter((w) => Math.abs(tierOf(w) - level) <= 1));
  return { pair, target, answer, traps, others };
}

const tierOf = (word: string) => {
  for (const p of WORD_PAIRS) if (word in p.a || word in p.b) return tier(p, word);
  throw new Error(`Unknown word: ${word}`);
};

export function vocabularyFeatures(item: VocabItem) {
  return { targetTier: tier(item.pair, item.target), answerTier: tier(item.pair, item.answer) };
}

function makeGenerator(mode: Mode): Generator {
  return {
    type: mode,
    category: 'verbal',
    label: mode === 'synonym' ? 'Synonyms' : 'Antonyms',
    levels: [1, 2, 3, 4, 5],

    draft(rng, level): Draft {
      const item = buildItem(rng, mode, level);
      if (!item) return { prompt: '', answer: text(''), distractors: [], explanation: '', features: { valid: 0 } };
      const { target, answer, traps, others } = item;
      // One trap from the opposite relation (e.g. "elongate" for the opposite of "lengthen"), then unrelated words.
      const distractors = [...traps.slice(0, 1), ...others].map((w) => text(w));
      const trapNote = traps.length
        ? ` "${traps[0]}" is a trap: it means the ${mode === 'synonym' ? 'opposite' : 'same'}.`
        : '';
      return {
        prompt: `${mode === 'synonym' ? 'Choose the word that means most nearly the SAME as' : 'Choose the word that is most nearly OPPOSITE to'} ${target.toUpperCase()}.`,
        answer: text(answer),
        distractors,
        explanation: `${target.toUpperCase()} and "${answer}" mean ${mode === 'synonym' ? 'about the same thing' : 'opposite things'}.${trapNote}`,
        features: { ...vocabularyFeatures(item), valid: 1 },
      };
    },

    score(f) {
      if (!f.valid) return null;
      return Math.max(f.targetTier ?? 1, f.answerTier ?? 1) as Difficulty;
    },
  };
}

export const synonym = makeGenerator('synonym');
export const antonym = makeGenerator('antonym');
