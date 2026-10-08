import type { Generator } from '../engine/types';
import { average } from './math/average';
import { numberSeries } from './math/numberSeries';

export const GENERATORS: readonly Generator[] = [numberSeries, average];

const byType = new Map(GENERATORS.map((g) => [g.type, g]));

export function getGenerator(type: string): Generator {
  const generator = byType.get(type);
  if (!generator) throw new Error(`Unknown question type: ${type}`);
  return generator;
}
