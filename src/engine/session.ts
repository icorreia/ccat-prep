import type { Attempt, Question } from './types';

export type SessionMode = 'test' | 'drill' | 'speed';

export interface Limits {
  /** Whole-session limit (15 minutes for a full test); null = untimed. */
  timeLimitMs: number | null;
  /** Per-question limit (speed training); null = none. */
  perQuestionMs: number | null;
}

/** A test or practice session in progress. Pure state; the UI supplies the clock. */
export interface Session extends Limits {
  mode: SessionMode;
  questions: Question[];
  startedAt: number;
  /** When the current question was shown. */
  questionStartedAt: number;
  index: number;
  attempts: Attempt[];
  finishedAt?: number;
}

export type SessionAction =
  | { type: 'answer'; choiceIndex: number; now: number }
  | { type: 'skip'; now: number }
  | { type: 'timeout'; now: number }
  | { type: 'questionTimeout'; now: number }
  | { type: 'quit'; now: number };

export function startSession(questions: Question[], limits: Limits, now: number, mode: SessionMode = 'test'): Session {
  return { mode, questions, ...limits, startedAt: now, questionStartedAt: now, index: 0, attempts: [] };
}

/** Time left in the whole session (Infinity when untimed). */
export const remainingMs = (s: Session, now: number) =>
  s.timeLimitMs === null ? Infinity : Math.max(0, s.timeLimitMs - (now - s.startedAt));

/** Time left on the current question (Infinity without a per-question limit). */
export const questionRemainingMs = (s: Session, now: number) =>
  s.perQuestionMs === null ? Infinity : Math.max(0, s.perQuestionMs - (now - s.questionStartedAt));
export const isFinished = (s: Session) => s.finishedAt !== undefined;

function record(s: Session, choiceIndex: number | null, now: number): Attempt {
  const q = s.questions[s.index]!;
  return {
    questionId: q.id,
    type: q.type,
    category: q.category,
    position: s.index,
    choiceIndex,
    correct: choiceIndex === q.answerIndex,
    timeMs: now - s.questionStartedAt,
  };
}

/** Answer or skip moves forward (never back); timeout and quit end the test. */
export function reduce(s: Session, action: SessionAction): Session {
  if (isFinished(s)) return s;
  // The clock is authoritative: an answer arriving after time is up counts as a timeout.
  if (action.type !== 'timeout' && remainingMs(s, action.now) === 0) return reduce(s, { type: 'timeout', now: action.now });

  switch (action.type) {
    case 'answer':
    case 'skip':
    case 'questionTimeout': {
      const now = action.type === 'questionTimeout' && s.perQuestionMs !== null ? Math.min(action.now, s.questionStartedAt + s.perQuestionMs) : action.now;
      const attempt = record(s, action.type === 'answer' ? action.choiceIndex : null, now);
      const attempts = [...s.attempts, attempt];
      const index = s.index + 1;
      const done = index >= s.questions.length;
      return { ...s, attempts, index, questionStartedAt: now, ...(done && { finishedAt: now }) };
    }
    case 'timeout':
    case 'quit': {
      // The question on screen counts as seen but unanswered; later ones were never reached.
      const now = action.type === 'timeout' && s.timeLimitMs !== null ? Math.min(action.now, s.startedAt + s.timeLimitMs) : action.now;
      return { ...s, attempts: [...s.attempts, record(s, null, now)], finishedAt: now };
    }
  }
}
