import { describe, expect, it } from 'vitest';
import { SENTENCES } from '../../data/sentences';
import { Rng } from '../../engine/rng';
import { attentionToDetail, buildItem, countNote, detailFeatures, mutate } from './attentionToDetail';
import { sentenceCompletion, sentenceFeatures, signalWord } from './sentenceCompletion';

describe('sentence data', () => {
  it('has one word per blank in the answer and in every wrong option', () => {
    for (const item of SENTENCES) {
      const blanks = item.text.split('___').length - 1;
      expect(item.answer.length, item.text).toBe(blanks);
      expect(item.wrong.length, item.text).toBeGreaterThanOrEqual(4);
      for (const w of item.wrong) expect(w.length, item.text).toBe(blanks);
    }
  });

  it('never repeats the answer among the wrong options', () => {
    for (const item of SENTENCES) {
      for (const w of item.wrong) expect(w.join('|'), item.text).not.toBe(item.answer.join('|'));
    }
  });

  it('scores the blueprint anchors at their levels', () => {
    const anchor = (start: string) => SENTENCES.find((s) => s.text.startsWith(start))!;
    expect(sentenceCompletion.score(sentenceFeatures(anchor('Despite the heavy rain')))).toBe(2);
    expect(sentenceCompletion.score(sentenceFeatures(anchor('Her explanation was so')))).toBe(3);
    expect(sentenceCompletion.score(sentenceFeatures(anchor('Although the critic')))).toBe(4);
  });
});

describe('attention to detail', () => {
  it('mutate() always produces a different string', () => {
    for (let seed = 0; seed < 500; seed++) {
      const rng = new Rng(seed);
      const s = rng.pick(['4821', 'Okafor, T. 12-4406', '1420 Elm Street, Apt 5B', 'Haddad, R. 64-0029']);
      const [changed, description] = mutate(rng, s);
      expect(changed).not.toBe(s);
      expect(description.length).toBeGreaterThan(3);
    }
  });

  it('counts identical pairs correctly', () => {
    for (let seed = 0; seed < 300; seed++) {
      const item = buildItem(new Rng(seed), 'records', 5, false);
      expect(item.pairs.filter((p) => p.left === p.right).length).toBe(item.identical);
    }
  });

  it('scores the blueprint anchors at their levels', () => {
    const score = (kind: 'codes' | 'addresses' | 'records', pairs: number, length: number) =>
      attentionToDetail.score(detailFeatures({ kind, identical: 0, pairs: Array.from({ length: pairs }, () => ({ left: 'x'.repeat(length), right: 'x'.repeat(length) })) }));
    expect(score('codes', 4, 4)).toBe(2); // 4821 / 4821 · …
    expect(score('addresses', 3, 24)).toBe(3); // 1420 Elm Street, Apt 5B …
    expect(score('records', 5, 20)).toBe(4); // Kowalski, J. 55-0912 …
  });
});

describe('notes on wrong verbal answers', () => {
  it('finds the first signal word as a whole word', () => {
    expect(signalWord('Even though he was ___, Sam spoke confidently.')).toBe('even though');
    expect(signalWord('The food was ___, so the guests asked for more.')).toBe('so');
    expect(signalWord('Her butler was ___.')).toBeUndefined();
  });

  it('says whether a wrong count missed differences or doubted identical pairs', () => {
    const item = { kind: 'codes' as const, identical: 1, pairs: [{ left: 'AB-12', right: 'AB-12' }, { left: 'CD-34', right: 'CD-43', change: '"34" became "43"' }] };
    expect(countNote(item, 2)).toBe('Missed 1 difference. Compare character by character; for example, in "CD-34" vs "CD-43", "34" became "43".');
    expect(countNote(item, 0)).toBe('Counted 1 identical pair as different. Pairs that look alike at a glance can be exactly the same.');
  });
});
