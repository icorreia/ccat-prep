import { because, text } from '../../engine/question';
import type { Difficulty, Draft, Generator } from '../../engine/types';
import { NAMES, SENTENCES, type SentenceItem } from '../../data/sentences';

const join = (words: string[]) => words.join(' … ');

const SIGNAL_WORDS = ['even though', 'although', 'despite', 'but', 'yet', 'because', 'so', 'therefore'];

/** The signal word as it appears in the sentence, e.g. "although". */
export function signalWord(sentence: string): string | undefined {
  const lower = sentence.toLowerCase();
  return SIGNAL_WORDS.map((w) => ({ w, i: lower.search(new RegExp(`\\b${w}\\b`)) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)[0]?.w;
}

const fill = (sentence: string, words: string[]) => words.reduce((s, word) => s.replace('___', word.toUpperCase()), sentence);

/** Why a wrong option doesn't fit: read back in the sentence, against its signal word. */
function wrongNote(item: SentenceItem, sentence: string, words: string[]): string {
  const said = `"${fill(sentence, words)}"`;
  const word = signalWord(sentence);
  if (item.signal === 'contrast') return `${said} has no contrast${word ? `, yet "${word}" signals one` : ''}: the blank must go against the rest.`;
  if (item.signal === 'cause') return `${said} doesn't follow${word ? ` from the "${word}"` : ''}: the reason and the result don't match.`;
  return `${said} doesn't fit the meaning of the rest of the sentence.`;
}

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
    const filled = fill(sentence, item.answer);
    const signal =
      item.signal === 'contrast'
        ? ' The sentence signals a contrast, so the blank must go against the other half.'
        : item.signal === 'cause'
          ? ' The sentence signals cause and effect, so the blank must fit the reason given.'
          : '';
    return {
      itemKey: String(SENTENCES.indexOf(item)),
      prompt: `Choose the word${item.answer.length > 1 ? 's' : ''} that best complete${item.answer.length > 1 ? '' : 's'} the sentence.\n\n${sentence}`,
      answer: text(join(item.answer)),
      distractors: rng.shuffle(item.wrong).map((w) => because(text(join(w)), wrongNote(item, sentence, w))),
      explanation: `"${filled}"${signal}`,
      features: sentenceFeatures(item),
    };
  },

  /** Rarer answer words, a contrast signal and a second blank each make the item harder. */
  score: (f) => Math.min(5, (f.tier ?? 1) + (f.contrast ?? 0) + ((f.blanks ?? 1) - 1)) as Difficulty,
};
