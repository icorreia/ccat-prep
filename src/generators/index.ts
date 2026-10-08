import type { Generator } from '../engine/types';
import { average } from './math/average';
import { fractionGenerator } from './math/fraction';
import { numberSeries } from './math/numberSeries';
import { percentage } from './math/percentage';

export const GENERATORS: readonly Generator[] = [numberSeries, average, percentage, fractionGenerator];

const byType = new Map(GENERATORS.map((g) => [g.type, g]));

export function getGenerator(type: string): Generator {
  const generator = byType.get(type);
  if (!generator) throw new Error(`Unknown question type: ${type}`);
  return generator;
}
