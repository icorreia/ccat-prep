import { describe, expect, it } from 'vitest';
import { rebuildQuestion } from '../engine/question';
import { buildTest } from '../engine/testBuilder';
import { GENERATORS, getGenerator } from '../generators';
import type { KeyValueStore } from './history';
import { exportReports, loadReports, REPORTS_KEY, upsertReport, writeReports, type QuestionReport } from './reports';

const memory = (): KeyValueStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

const questions = buildTest(GENERATORS, 3).questions;
const report = (i: number, reason: QuestionReport['reason'] = 'ambiguous'): QuestionReport => ({
  questionId: questions[i]!.id,
  reason,
  note: '',
  reportedAt: i,
  question: questions[i]!,
});

describe('question reports', () => {
  it('round-trips reports and drops invalid ones', () => {
    const store = memory();
    writeReports([report(0), report(1)], store);
    expect(loadReports(store).map((r) => r.questionId)).toEqual([questions[0]!.id, questions[1]!.id]);
    store.data.set(REPORTS_KEY, JSON.stringify([{ ...report(2), reason: 'bogus' }]));
    expect(loadReports(store)).toEqual([]);
    store.data.set(REPORTS_KEY, 'nope');
    expect(loadReports(store)).toEqual([]);
  });

  it('keeps one report per question, the latest', () => {
    const reports = upsertReport(upsertReport([], report(0)), report(0, 'wrong-answer'));
    expect(reports.map((r) => r.reason)).toEqual(['wrong-answer']);
  });

  it('exports ids that rebuild the reported questions', () => {
    const exported = JSON.parse(exportReports([report(4), report(9)])) as { kind: string; reports: QuestionReport[] };
    expect(exported.kind).toBe('question-reports');
    for (const r of exported.reports) {
      expect(rebuildQuestion(getGenerator(r.question.type), r.questionId)).toEqual(r.question);
    }
  });
});
