import type { Attempt, Question } from './types';

/** A test in progress. Pure state; the UI supplies the clock. */
export interface Session {
  questions: Question[];
  timeLimitMs: number;
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
  | { type: 'quit'; now: number };

export function startSession(questions: Question[], timeLimitMs: number, now: number): Session {
  return { questions, timeLimitMs, startedAt: now, questionStartedAt: now, index: 0, attempts: [] };
}

export const remainingMs = (s: Session, now: number) => Math.max(0, s.timeLimitMs - (now - s.startedAt));
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
    case 'skip': {
      const attempt = record(s, action.type === 'answer' ? action.choiceIndex : null, action.now);
      const attempts = [...s.attempts, attempt];
      const index = s.index + 1;
      const done = index >= s.questions.length;
      return { ...s, attempts, index, questionStartedAt: action.now, ...(done && { finishedAt: action.now }) };
    }
    case 'timeout':
    case 'quit': {
      // The question on screen counts as seen but unanswered; later ones were never reached.
      const now = action.type === 'timeout' ? Math.min(action.now, s.startedAt + s.timeLimitMs) : action.now;
      return { ...s, attempts: [...s.attempts, record(s, null, now)], finishedAt: now };
    }
  }
}
