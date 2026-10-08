import { isFinished, type Session, type SessionMode } from '../engine/session';
import type { Attempt, Question } from '../engine/types';

/** A finished session as stored in the browser. */
export interface StoredSession {
  id: string;
  mode: SessionMode;
  /** Short description, e.g. "Full test" or "Speed · Spatial · 10". */
  label: string;
  startedAt: number;
  finishedAt: number;
  timeLimitMs: number | null;
  perQuestionMs: number | null;
  total: number;
  attempts: Attempt[];
  /**
   * The exact questions shown, so Review matches what you saw even if generators change later.
   * Dropped from the oldest sessions first if browser storage fills up (scores are kept).
   */
  questions?: Question[];
}

export const STORAGE_KEY = 'ccat-prep:history:v1';
const EXPORT_VERSION = 1;

/** Browser storage, swappable in tests. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null; // private mode, blocked storage, or no window
  }
}

const isStoredSession = (x: unknown): x is StoredSession => {
  const s = x as StoredSession;
  return !!s && typeof s.id === 'string' && typeof s.startedAt === 'number' && Array.isArray(s.attempts) && typeof s.total === 'number';
};

export function loadHistory(store = browserStore()): StoredSession[] {
  try {
    const raw = store?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isStoredSession).sort((a, b) => a.startedAt - b.startedAt) : [];
  } catch {
    return [];
  }
}

/** Writes the history, dropping stored questions from the oldest sessions until it fits. */
export function writeHistory(sessions: StoredSession[], store = browserStore()): StoredSession[] {
  if (!store) return sessions;
  let toWrite = sessions;
  for (let dropped = 0; dropped <= sessions.length; dropped++) {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(toWrite));
      return toWrite;
    } catch {
      toWrite = toWrite.map((s, i) => (i <= dropped ? { ...s, questions: undefined } : s));
    }
  }
  return sessions; // storage unavailable: keep it in memory for this visit
}

export function toStored(session: Session, id: string, label: string): StoredSession | null {
  if (!isFinished(session)) return null;
  return {
    id,
    mode: session.mode,
    label,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt!,
    timeLimitMs: session.timeLimitMs,
    perQuestionMs: session.perQuestionMs,
    total: session.questions.length,
    attempts: session.attempts,
    questions: session.questions,
  };
}

/** Back to a Session for Review (only when its questions were kept). */
export function toSession(s: StoredSession): Session | null {
  if (!s.questions) return null;
  return {
    mode: s.mode,
    questions: s.questions,
    timeLimitMs: s.timeLimitMs,
    perQuestionMs: s.perQuestionMs,
    startedAt: s.startedAt,
    questionStartedAt: s.finishedAt,
    index: s.total,
    attempts: s.attempts,
    finishedAt: s.finishedAt,
  };
}

export function exportHistory(sessions: StoredSession[]): string {
  return JSON.stringify({ app: 'ccat-prep', version: EXPORT_VERSION, exportedAt: new Date().toISOString(), sessions }, null, 2);
}

/** Merges an export into the current history (by id; existing sessions win). Throws on invalid files. */
export function importHistory(json: string, current: StoredSession[]): { sessions: StoredSession[]; added: number } {
  const data = JSON.parse(json) as { app?: string; sessions?: unknown };
  if (data.app !== 'ccat-prep' || !Array.isArray(data.sessions)) throw new Error('This is not a CCAT Prep history export.');
  const known = new Set(current.map((s) => s.id));
  const incoming = data.sessions.filter(isStoredSession).filter((s) => !known.has(s.id));
  return { sessions: [...current, ...incoming].sort((a, b) => a.startedAt - b.startedAt), added: incoming.length };
}
