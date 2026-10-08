import { TIME_LIMIT_MS } from './testBuilder';

/**
 * Crossover mode trains harder than the real test, and tightens as you improve.
 * Intensity runs from 0 at an average of EASY_AVG (or with no full tests yet) to 1 at HARD_AVG,
 * taken over the last 5 full tests.
 */
export const EASY_AVG = 25;
export const HARD_AVG = 40;
/** The time limit goes from the real 15 minutes down to 12. */
export const MIN_TIME_LIMIT_MS = 12 * 60 * 1000;
/** Levels added to every question's target: from +1 up to +2 (capped at level 5). */
export const MIN_SHIFT = 1;
export const MAX_SHIFT = 2;

export interface CrossoverSettings {
  /** 0–1. */
  intensity: number;
  timeLimitMs: number;
  levelShift: number;
}

export function crossoverSettings(recentAvg: number | null): CrossoverSettings {
  const intensity = recentAvg === null ? 0 : Math.min(1, Math.max(0, (recentAvg - EASY_AVG) / (HARD_AVG - EASY_AVG)));
  const step = 30_000; // whole half-minutes read better on the clock
  const timeLimitMs = Math.round((TIME_LIMIT_MS - intensity * (TIME_LIMIT_MS - MIN_TIME_LIMIT_MS)) / step) * step;
  const levelShift = Math.round((MIN_SHIFT + intensity * (MAX_SHIFT - MIN_SHIFT)) * 10) / 10;
  return { intensity, timeLimitMs, levelShift };
}
