import type { Rng } from './rng';

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
  mistakes: readonly number[],
  count: number,
  rng: Rng,
  options: NumericOptions = {},
): number[] {
  const { min = 0, integer = true } = options;
  const step = options.step ?? Math.max(1, Math.round(Math.abs(answer) * 0.1));
  const out: number[] = [];
  const accept = (v: number) => {
    if (out.length >= count) return;
    if (!Number.isFinite(v) || v < min || v === answer || out.includes(v)) return;
    if (integer && !Number.isInteger(v)) return;
    out.push(v);
  };

  mistakes.forEach(accept);
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
