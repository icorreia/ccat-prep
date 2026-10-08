import type { Question } from '../engine/types';
import { browserStore } from './history';

export const REPORT_REASONS = {
  'wrong-answer': 'The marked answer is wrong',
  'two-answers': 'More than one answer is correct',
  ambiguous: 'The question is ambiguous',
  display: 'Typo or display problem',
  difficulty: 'Wrong difficulty for its level',
  other: 'Something else',
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

/** A question flagged as bad, kept so it can be rebuilt (from its id) and turned into a regression test. */
export interface QuestionReport {
  /** The question id, `${type}:${difficulty}:${seed}`; rebuildQuestion() turns it back into the question. */
  questionId: string;
  reason: ReportReason;
  note: string;
  reportedAt: number;
  /** The question exactly as shown, in case its generator changes before the report is looked at. */
  question: Question;
}

export const REPORTS_KEY = 'ccat-prep:reports:v1';

const isReport = (x: unknown): x is QuestionReport => {
  const r = x as QuestionReport;
  return !!r && typeof r.questionId === 'string' && typeof r.reason === 'string' && r.reason in REPORT_REASONS && typeof r.reportedAt === 'number' && !!r.question;
};

export function loadReports(store = browserStore()): QuestionReport[] {
  try {
    const raw = store?.getItem(REPORTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isReport) : [];
  } catch {
    return [];
  }
}

export function writeReports(reports: QuestionReport[], store = browserStore()): void {
  try {
    store?.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // storage full or blocked: keep the reports in memory for this visit
  }
}

/** Adds or replaces the report for a question (one report per question). */
export const upsertReport = (reports: QuestionReport[], report: QuestionReport) => [...reports.filter((r) => r.questionId !== report.questionId), report];

export function exportReports(reports: QuestionReport[]): string {
  return JSON.stringify({ app: 'ccat-prep', kind: 'question-reports', version: 1, exportedAt: new Date().toISOString(), reports }, null, 2);
}
