import { because, text } from './question';
import type { Rng } from './rng';
import type { Choice } from './types';

/** A wrong value produced by a specific error, optionally with a short note on that error for Review. */
export type Mistake = number | { value: number; why: string };

export interface NumericOptions {
  /** Smallest allowed value (default 0: no negative distractors). */
  min?: number;
  /** Only whole numbers (default true). */
  integer?: boolean;
  /** Gap used for near-miss fillers (default: about 10% of the answer, at least 1). */
  step?: number;
}

/**
 * Numeric wrong answers. `mistakes` are values produced by specific errors (wrong operation,
 * off-by-one step, reversed percentage...) and come first, in order. Near-miss values around
 * the answer fill the remaining slots, so the correct answer never stands out by magnitude.
 */
export function numericDistractors(
  answer: number,
  mistakes: readonly Mistake[],
  count: number,
  rng: Rng,
  options: NumericOptions = {},
): number[] {
  return pickNumeric(answer, mistakes, count, rng, options).map((d) => d.value);
}

/**
 * Like numericDistractors, but returns choices that keep each mistake's note (`why`), formatted
 * with `format`. Near-miss fillers have no note.
 */
export function numericChoices(
  answer: number,
  mistakes: readonly Mistake[],
  count: number,
  rng: Rng,
  options: NumericOptions & { format?: (value: number) => string } = {},
): Choice[] {
  const format = options.format ?? String;
  return pickNumeric(answer, mistakes, count, rng, options).map((d) => (d.why ? because(text(format(d.value)), d.why) : text(format(d.value))));
}

function pickNumeric(
  answer: number,
  mistakes: readonly Mistake[],
  count: number,
  rng: Rng,
  options: NumericOptions,
): { value: number; why?: string }[] {
  const { min = 0, integer = true } = options;
  const step = options.step ?? Math.max(1, Math.round(Math.abs(answer) * 0.1));
  const out: { value: number; why?: string }[] = [];
  const accept = (v: number, why?: string) => {
    if (out.length >= count) return;
    if (!Number.isFinite(v) || v < min || v === answer || out.some((d) => d.value === v)) return;
    if (integer && !Number.isInteger(v)) return;
    out.push(why ? { value: v, why } : { value: v });
  };

  mistakes.forEach((m) => (typeof m === 'number' ? accept(m) : accept(m.value, m.why)));
  for (let k = 1; out.length < count && k <= count * 4; k++) {
    const sign = rng.chance(0.5) ? 1 : -1;
    accept(answer + sign * k * step);
    accept(answer - sign * k * step);
  }
  if (out.length < count) {
    throw new Error(`numericDistractors: only ${out.length}/${count} for answer ${answer}`);
  }
  return out;
}
