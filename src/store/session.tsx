import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { randomSeed } from '../engine/rng';
import { reduce, startSession, type Session, type SessionAction } from '../engine/session';
import { buildDrill, buildTest, SECONDS_PER_QUESTION } from '../engine/testBuilder';
import type { Category, Difficulty, Generator } from '../engine/types';
import { GENERATORS } from '../generators';

/** What to practise: the whole CCAT mix, one category, or one question type. */
export type Scope = { kind: 'all' } | { kind: 'category'; category: Category } | { kind: 'type'; type: string };

export type SessionConfig =
  | { kind: 'test' }
  | { kind: 'practice'; scope: Scope; count: number; level: Difficulty | 'ramp'; speed: boolean };

export function generatorsFor(scope: Scope): Generator[] {
  if (scope.kind === 'category') return GENERATORS.filter((g) => g.category === scope.category);
  if (scope.kind === 'type') return GENERATORS.filter((g) => g.type === scope.type);
  return [...GENERATORS];
}

function create(config: SessionConfig, now: number): Session {
  if (config.kind === 'test') {
    const test = buildTest(GENERATORS, randomSeed());
    return startSession(test.questions, { timeLimitMs: test.timeLimitMs, perQuestionMs: null }, now, 'test');
  }
  const questions = buildDrill({ generators: generatorsFor(config.scope), count: config.count, level: config.level }, randomSeed());
  return config.speed
    ? startSession(questions, { timeLimitMs: null, perQuestionMs: SECONDS_PER_QUESTION * 1000 }, now, 'speed')
    : startSession(questions, { timeLimitMs: null, perQuestionMs: null }, now, 'drill');
}

interface SessionStore {
  session: Session | null;
  /** The settings of the last session started, to run it again. */
  lastConfig: SessionConfig | null;
  start: (config: SessionConfig) => void;
  dispatch: (action: SessionAction) => void;
}

const SessionContext = createContext<SessionStore | null>(null);

/** Holds the session in progress (and the last finished one) in memory. History persistence comes later. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [lastConfig, setLastConfig] = useState<SessionConfig | null>(null);

  const start = useCallback((config: SessionConfig) => {
    setLastConfig(config);
    setSession(create(config, Date.now()));
  }, []);

  const dispatch = useCallback((action: SessionAction) => setSession((s) => (s ? reduce(s, action) : s)), []);

  const value = useMemo(() => ({ session, lastConfig, start, dispatch }), [session, lastConfig, start, dispatch]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionStore {
  const store = useContext(SessionContext);
  if (!store) throw new Error('useSession must be used inside SessionProvider');
  return store;
}
