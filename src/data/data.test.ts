import { describe, expect, it } from 'vitest';
import { RELATIONS } from './analogies';
import { WORD_PAIRS } from './words';

describe('WORD_PAIRS', () => {
  const all = WORD_PAIRS.flatMap((p) => [...Object.keys(p.a), ...Object.keys(p.b)]);

  it('uses every word exactly once (so a wrong answer is never a hidden synonym)', () => {
    const dupes = all.filter((w, i) => all.indexOf(w) !== i);
    expect(dupes).toEqual([]);
  });

  it('has unique ids and valid avoid references, listed both ways', () => {
    const ids = WORD_PAIRS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of WORD_PAIRS) {
      for (const other of p.avoid ?? []) {
        expect(ids, `${p.id} avoids unknown ${other}`).toContain(other);
        const back = WORD_PAIRS.find((q) => q.id === other)!;
        expect(back.avoid ?? [], `${other} should also avoid ${p.id}`).toContain(p.id);
      }
    }
  });

  it('has an easy word on both sides of most pairs, so low levels have material', () => {
    const easy = WORD_PAIRS.filter((p) => Object.values(p.a).some((t) => t <= 2) && Object.values(p.b).some((t) => t <= 2));
    expect(easy.length).toBeGreaterThanOrEqual(30);
  });
});

describe('RELATIONS', () => {
  it('never uses a lure that is also a valid answer within the same relation', () => {
    for (const r of RELATIONS) {
      const answers = new Set(r.pairs.map((p) => p.b));
      for (const p of r.pairs) for (const lure of p.lures ?? []) expect(answers.has(lure), `${r.id}: ${p.a} lure ${lure}`).toBe(false);
    }
  });

  it('has at least 6 pairs per relation', () => {
    for (const r of RELATIONS) expect(r.pairs.length, r.id).toBeGreaterThanOrEqual(6);
  });
});
