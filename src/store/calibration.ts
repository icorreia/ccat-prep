import { browserStore } from './history';

/** A raw score from an official practice test (Criteria's or Crossover's), entered by hand. */
export interface CalibrationEntry {
  id: string;
  /** When the official test was taken (ms since epoch, local midnight). */
  takenAt: number;
  score: number;
}

export const CALIBRATION_KEY = 'ccat-prep:calibration:v1';

const isEntry = (x: unknown): x is CalibrationEntry => {
  const e = x as CalibrationEntry;
  return !!e && typeof e.id === 'string' && typeof e.takenAt === 'number' && Number.isInteger(e.score) && e.score >= 0 && e.score <= 50;
};

export function loadCalibration(store = browserStore()): CalibrationEntry[] {
  try {
    const raw = store?.getItem(CALIBRATION_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isEntry).sort((a, b) => a.takenAt - b.takenAt) : [];
  } catch {
    return [];
  }
}

/** Merges the official scores from a history export (by id; existing entries win). Older exports have none. */
export function importCalibration(json: string, current: CalibrationEntry[]): { entries: CalibrationEntry[]; added: number } {
  const data = JSON.parse(json) as { calibration?: unknown };
  const known = new Set(current.map((e) => e.id));
  const incoming = Array.isArray(data.calibration) ? data.calibration.filter(isEntry).filter((e) => !known.has(e.id)) : [];
  return { entries: [...current, ...incoming].sort((a, b) => a.takenAt - b.takenAt), added: incoming.length };
}

export function writeCalibration(entries: CalibrationEntry[], store = browserStore()): void {
  try {
    store?.setItem(CALIBRATION_KEY, JSON.stringify(entries));
  } catch {
    // storage full or blocked: keep the entries in memory for this visit
  }
}
