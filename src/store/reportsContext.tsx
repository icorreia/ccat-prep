import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadReports, upsertReport, writeReports, type QuestionReport } from './reports';

interface ReportsStore {
  reports: QuestionReport[];
  report: (report: QuestionReport) => void;
  withdraw: (questionId: string) => void;
}

const ReportsContext = createContext<ReportsStore | null>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState(loadReports);
  const update = useCallback((next: (current: QuestionReport[]) => QuestionReport[]) => {
    setReports((current) => {
      const updated = next(current);
      writeReports(updated);
      return updated;
    });
  }, []);
  const report = useCallback((r: QuestionReport) => update((current) => upsertReport(current, r)), [update]);
  const withdraw = useCallback((id: string) => update((current) => current.filter((r) => r.questionId !== id)), [update]);
  const value = useMemo(() => ({ reports, report, withdraw }), [reports, report, withdraw]);
  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports(): ReportsStore {
  const store = useContext(ReportsContext);
  if (!store) throw new Error('useReports must be used inside ReportsProvider');
  return store;
}
