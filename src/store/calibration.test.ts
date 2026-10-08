import { describe, expect, it } from 'vitest';
import { CALIBRATION_KEY, loadCalibration, writeCalibration } from './calibration';
import type { KeyValueStore } from './history';

const memory = (): KeyValueStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('calibration storage', () => {
  it('round-trips entries, sorted by date', () => {
    const store = memory();
    writeCalibration([{ id: 'b', takenAt: 2, score: 31 }, { id: 'a', takenAt: 1, score: 28 }], store);
    expect(loadCalibration(store).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('drops invalid entries and survives corrupt or missing storage', () => {
    const store = memory();
    store.data.set(CALIBRATION_KEY, JSON.stringify([{ id: 'x', takenAt: 1, score: 51 }, { id: 'y', takenAt: 1, score: 30 }]));
    expect(loadCalibration(store).map((e) => e.id)).toEqual(['y']);
    store.data.set(CALIBRATION_KEY, '{not json');
    expect(loadCalibration(store)).toEqual([]);
    expect(loadCalibration(null)).toEqual([]);
  });

  it('does not throw when storage is full', () => {
    const full: KeyValueStore = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(() => writeCalibration([{ id: 'a', takenAt: 1, score: 30 }], full)).not.toThrow();
  });
});
