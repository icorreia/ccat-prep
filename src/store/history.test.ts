import { describe, expect, it } from 'vitest';
import { buildTest } from '../engine/testBuilder';
import { reduce, startSession } from '../engine/session';
import { GENERATORS } from '../generators';
import { exportHistory, importHistory, loadHistory, STORAGE_KEY, toSession, toStored, writeHistory, type KeyValueStore } from './history';

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  constructor(private limit = Infinity) {}
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (v.length > this.limit) throw new Error('QuotaExceededError');
    this.data.set(k, v);
  }
}

function finished(seed: number, startedAt: number) {
  const test = buildTest(GENERATORS, seed);
  let s = startSession(test.questions.slice(0, 5), { timeLimitMs: 900_000, perQuestionMs: null }, startedAt);
  for (let i = 0; i < 5; i++) s = reduce(s, { type: 'answer', choiceIndex: 0, now: startedAt + (i + 1) * 10_000 });
  return toStored(s, `id-${seed}`, 'Full test')!;
}

describe('history storage', () => {
  it('round-trips sessions, sorted by start time', () => {
    const store = new MemoryStore();
    writeHistory([finished(2, 2_000), finished(1, 1_000)], store);
    expect(loadHistory(store).map((s) => s.id)).toEqual(['id-1', 'id-2']);
  });

  it('survives missing or corrupt data', () => {
    const store = new MemoryStore();
    expect(loadHistory(store)).toEqual([]);
    store.data.set(STORAGE_KEY, '{not json');
    expect(loadHistory(store)).toEqual([]);
    expect(loadHistory(null)).toEqual([]);
  });

  it('drops questions from the oldest sessions when storage is full, keeping scores', () => {
    const sessions = [finished(1, 1_000), finished(2, 2_000), finished(3, 3_000)];
    const full = JSON.stringify(sessions).length;
    const store = new MemoryStore(full - 100);
    const written = writeHistory(sessions, store);
    expect(written[0]!.questions).toBeUndefined();
    expect(written[2]!.questions).toBeDefined();
    expect(loadHistory(store).every((s) => s.attempts.length === 5)).toBe(true);
  });

  it('rebuilds a reviewable session only when questions were kept', () => {
    const s = finished(1, 1_000);
    expect(toSession(s)?.attempts).toHaveLength(5);
    expect(toSession({ ...s, questions: undefined })).toBeNull();
  });

  it('exports and imports, merging by id', () => {
    const a = finished(1, 1_000);
    const b = finished(2, 2_000);
    const { sessions, added } = importHistory(exportHistory([a, b]), [a]);
    expect(added).toBe(1);
    expect(sessions.map((s) => s.id)).toEqual(['id-1', 'id-2']);
    expect(() => importHistory('{"hello":1}', [])).toThrow(/not a CCAT Prep/);
  });
});
