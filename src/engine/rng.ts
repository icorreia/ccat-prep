/**
 * Seeded pseudo-random number generator (mulberry32).
 * Every question is a pure function of its seed, so the same seed always rebuilds the same question.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`int(${min}, ${max}): bounds must be integers with min <= max`);
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('pick() from an empty array');
    return items[this.int(0, items.length - 1)]!;
  }

  /** Returns a new shuffled array (Fisher–Yates); the input is not modified. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  }

  /** Picks `count` distinct items. */
  sample<T>(items: readonly T[], count: number): T[] {
    if (count > items.length) throw new RangeError(`sample(${count}) from ${items.length} items`);
    return this.shuffle(items).slice(0, count);
  }
}

/** A fresh 32-bit seed for a new question or test. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296) >>> 0;
}
