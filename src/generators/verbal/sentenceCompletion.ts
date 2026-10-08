import { text } from '../../engine/question';
import type { Difficulty, Draft, Generator } from '../../engine/types';
import { NAMES, SENTENCES, type SentenceItem } from '../../data/sentences';

const join = (words: string[]) => words.join(' … ');

export function sentenceFeatures(item: SentenceItem) {
  return { tier: item.tier, blanks: item.answer.length, contrast: item.signal === 'contrast' ? 1 : 0 };
}

export const sentenceCompletion: Generator = {
  type: 'sentence-completion',
  category: 'verbal',
  label: 'Sentence completion',
  levels: [1, 2, 3, 4, 5],

  draft(rng): Draft {
    const item = rng.pick(SENTENCES);
    const sentence = item.text.replace('{name}', rng.pick(NAMES));
    const filled = item.answer.reduce((s, word) => s.replace('___', word.toUpperCase()), sentence);
    const signal =
      item.signal === 'contrast'
        ? ' The sentence signals a contrast, so the blank must go against the other half.'
        : item.signal === 'cause'
          ? ' The sentence signals cause and effect, so the blank must fit the reason given.'
          : '';
    return {
      prompt: `Choose the word${item.answer.length > 1 ? 's' : ''} that best complete${item.answer.length > 1 ? '' : 's'} the sentence.\n\n${sentence}`,
      answer: text(join(item.answer)),
      distractors: rng.shuffle(item.wrong).map((w) => text(join(w))),
      explanation: `"${filled}"${signal}`,
      features: sentenceFeatures(item),
    };
  },

  /** Rarer answer words, a contrast signal and a second blank each make the item harder. */
  score: (f) => Math.min(5, (f.tier ?? 1) + (f.contrast ?? 0) + ((f.blanks ?? 1) - 1)) as Difficulty,
};
