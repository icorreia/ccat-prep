import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { randomSeed } from '../engine/rng';
import { reduce, startSession, type Session, type SessionAction } from '../engine/session';
import { buildTest } from '../engine/testBuilder';
import { GENERATORS } from '../generators';

interface SessionStore {
  session: Session | null;
  /** Builds a fresh 50-question test and starts the clock. */
  startTest: () => void;
  dispatch: (action: SessionAction) => void;
}

const SessionContext = createContext<SessionStore | null>(null);

/** Holds the test in progress (and the last finished one) in memory. History persistence comes later. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const startTest = useCallback(() => {
    const test = buildTest(GENERATORS, randomSeed());
    setSession(startSession(test.questions, test.timeLimitMs, Date.now()));
  }, []);

  const dispatch = useCallback((action: SessionAction) => setSession((s) => (s ? reduce(s, action) : s)), []);

  const value = useMemo(() => ({ session, startTest, dispatch }), [session, startTest, dispatch]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionStore {
  const store = useContext(SessionContext);
  if (!store) throw new Error('useSession must be used inside SessionProvider');
  return store;
}
