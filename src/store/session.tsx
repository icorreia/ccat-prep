import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { formatClock } from '../components/Timer';
import { crossoverSettings, type CrossoverSettings } from '../engine/crossover';
import { summarize } from '../engine/historyStats';
import { randomSeed } from '../engine/rng';
import { isFinished, reduce, startSession, type Session, type SessionAction } from '../engine/session';
import { buildDrill, buildTest, SECONDS_PER_QUESTION } from '../engine/testBuilder';
import type { Category, Difficulty, Generator } from '../engine/types';
import { GENERATORS } from '../generators';
import { toStored } from './history';
import { useHistory } from './historyContext';

/** What to practise: the whole CCAT mix, one category, or one question type. */
export type Scope = { kind: 'all' } | { kind: 'category'; category: Category } | { kind: 'type'; type: string };

export type SessionConfig =
  | { kind: 'test'; crossover?: boolean }
  | { kind: 'practice'; scope: Scope; count: number; level: Difficulty | 'ramp'; speed: boolean };

export function generatorsFor(scope: Scope): Generator[] {
  if (scope.kind === 'category') return GENERATORS.filter((g) => g.category === scope.category);
  if (scope.kind === 'type') return GENERATORS.filter((g) => g.type === scope.type);
  return [...GENERATORS];
}

const CATEGORY_LABELS: Record<Category, string> = { verbal: 'Verbal', 'math-logic': 'Math & logic', spatial: 'Spatial' };

/** Short description for the history log, e.g. "Speed · Spatial · 10 questions". */
export function describeConfig(config: SessionConfig, crossover?: CrossoverSettings | null): string {
  if (config.kind === 'test') return crossover ? `Crossover · ${formatClock(crossover.timeLimitMs)} · level +${crossover.levelShift}` : 'Full test';
  const scope =
    config.scope.kind === 'all'
      ? 'All types'
      : config.scope.kind === 'category'
        ? CATEGORY_LABELS[config.scope.category]
        : (GENERATORS.find((g) => g.type === (config.scope as { type: string }).type)?.label ?? config.scope.type);
  const level = config.level === 'ramp' ? 'easy → hard' : `level ${config.level}`;
  return `${config.speed ? 'Speed' : 'Drill'} · ${scope} · ${config.count} questions · ${level}`;
}

function create(config: SessionConfig, now: number, crossover: CrossoverSettings | null): Session {
  if (config.kind === 'test') {
    const test = buildTest(GENERATORS, randomSeed(), crossover ?? {});
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

/** Holds the session in progress (and the last finished one); finished sessions are saved to history. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [lastConfig, setLastConfig] = useState<SessionConfig | null>(null);
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const { add, sessions } = useHistory();

  const start = useCallback(
    (config: SessionConfig) => {
      // Crossover settings come from your latest scores each time, so "Take another test" tightens too.
      const crossover = config.kind === 'test' && config.crossover ? crossoverSettings(summarize(sessions).recentAvg) : null;
      setLastConfig(config);
      setId(crypto.randomUUID());
      setLabel(describeConfig(config, crossover));
      setSession(create(config, Date.now(), crossover));
    },
    [sessions],
  );

  // Save each session to history once it finishes (add() ignores ids it already has).
  useEffect(() => {
    if (session && isFinished(session) && lastConfig) add(toStored(session, id, label, lastConfig.kind === 'test' && !!lastConfig.crossover)!);
  }, [session, id, label, lastConfig, add]);

  const dispatch = useCallback((action: SessionAction) => setSession((s) => (s ? reduce(s, action) : s)), []);

  const value = useMemo(() => ({ session, lastConfig, start, dispatch }), [session, lastConfig, start, dispatch]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionStore {
  const store = useContext(SessionContext);
  if (!store) throw new Error('useSession must be used inside SessionProvider');
  return store;
}
