import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/rng';
import type { DataTable } from '../../engine/types';
import { combinedGrowth, extreme, KINDS, largestRise, percentChange, tableReading } from './tableReading';

const rng = () => new Rng(1);
const subject = { title: 'Units sold per month', column: 'Units', unit: 'units', amount: 'units', verb: 'sold' };
const months = ['January', 'February', 'March', 'April', 'May'];
const single = (values: number[]): DataTable => ({
  title: 'Units sold per month',
  rowHeader: 'Month',
  columns: ['Units'],
  rows: values.map((v, i) => ({ label: months[i]!, values: [v] })),
  display: 'table',
});
// Blueprint anchors: quarterly sales 120, 150, 90, 180 (plus a fifth month).
const quarterly = single([120, 150, 90, 180, 100]);
const twoProducts: DataTable = {
  title: 'Monthly sales (units)',
  rowHeader: 'Month',
  columns: ['Product A', 'Product B'],
  rows: [
    { label: 'January', values: [40, 35] },
    { label: 'February', values: [55, 60] },
    { label: 'March', values: [65, 50] },
  ],
  display: 'table',
};
const features = (p: ReturnType<typeof extreme>) => ({ kind: KINDS[p.kind], cells: p.cells, valid: p.valid ? 1 : 0 });

describe('table-reading problems', () => {
  it('compute the right answers', () => {
    expect(extreme(quarterly, true, subject).answer.text).toBe('April');
    expect(percentChange(quarterly, 2, 3, subject, rng()).answer.text).toBe('100%');
    expect(combinedGrowth(twoProducts, 0, 1, rng()).answer.text).toBe('40');
  });

  it('puts the runner-up first for "most" questions', () => {
    expect(extreme(quarterly, true, subject).distractors[0]!.text).toBe('February');
  });

  it('uses the biggest absolute rise as the trap for largest percentage rise', () => {
    // 50→100 is +100% (+50); 100→180 is +80% (+80).
    const p = largestRise(single([60, 50, 100, 90, 170]));
    expect(p.answer.text).toBe('February → March');
    expect(p.distractors[0]!.text).toBe('April → May');
    expect(p.valid).toBe(true);
  });
});

describe('calibration against the blueprint anchors', () => {
  it.each([
    [2, extreme(quarterly, true, subject)],
    [3, percentChange(quarterly, 2, 3, subject, rng())],
    [4, combinedGrowth(twoProducts, 0, 1, rng())],
  ])('scores the level-%i anchor at its level', (level, problem) => {
    expect(tableReading.score(features(problem))).toBe(level);
  });
});
