import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { importHistory, loadHistory, STORAGE_KEY, writeHistory, type StoredSession } from './history';

interface HistoryStore {
  sessions: StoredSession[];
  add: (session: StoredSession) => void;
  /** Merges an exported file; returns how many sessions were new. Throws on invalid files. */
  importJson: (json: string) => number;
}

const HistoryContext = createContext<HistoryStore | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState(loadHistory);

  // Keep tabs in sync: another tab finishing a test updates this one.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setSessions(loadHistory());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((session: StoredSession) => {
    setSessions((current) => (current.some((s) => s.id === session.id) ? current : writeHistory([...current, session])));
  }, []);

  const importJson = useCallback(
    (json: string) => {
      const { sessions: merged, added } = importHistory(json, sessions);
      setSessions(writeHistory(merged));
      return added;
    },
    [sessions],
  );

  const value = useMemo(() => ({ sessions, add, importJson }), [sessions, add, importJson]);
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryStore {
  const store = useContext(HistoryContext);
  if (!store) throw new Error('useHistory must be used inside HistoryProvider');
  return store;
}
