import { describe, expect, it } from 'vitest';
import { GENERATORS } from '../generators';
import { isFinished, reduce, remainingMs, startSession } from './session';
import { buildTest } from './testBuilder';

const test = buildTest(GENERATORS, 3);
const start = () => startSession(test.questions.slice(0, 3), 60_000, 1_000);

describe('session', () => {
  it('records answers with timing and moves forward', () => {
    let s = start();
    const q = s.questions[0]!;
    s = reduce(s, { type: 'answer', choiceIndex: q.answerIndex, now: 6_000 });
    expect(s.index).toBe(1);
    expect(s.attempts[0]).toMatchObject({ position: 0, correct: true, timeMs: 5_000, choiceIndex: q.answerIndex });
  });

  it('records skips as unanswered', () => {
    const s = reduce(start(), { type: 'skip', now: 2_000 });
    expect(s.attempts[0]).toMatchObject({ choiceIndex: null, correct: false, timeMs: 1_000 });
  });

  it('finishes after the last question', () => {
    let s = start();
    for (let i = 0; i < 3; i++) s = reduce(s, { type: 'skip', now: 2_000 + i });
    expect(isFinished(s)).toBe(true);
    expect(s.finishedAt).toBe(2_002);
  });

  it('times out: the current question counts as seen, the rest as never reached', () => {
    let s = reduce(start(), { type: 'skip', now: 2_000 });
    s = reduce(s, { type: 'timeout', now: 99_000 });
    expect(isFinished(s)).toBe(true);
    expect(s.attempts).toHaveLength(2);
    expect(s.finishedAt).toBe(61_000); // clamped to the limit
  });

  it('treats an answer after time is up as a timeout', () => {
    const s = reduce(start(), { type: 'answer', choiceIndex: 0, now: 70_000 });
    expect(isFinished(s)).toBe(true);
    expect(s.attempts[0]!.choiceIndex).toBeNull();
  });

  it('ignores actions after finishing', () => {
    const done = reduce(start(), { type: 'quit', now: 5_000 });
    expect(reduce(done, { type: 'answer', choiceIndex: 0, now: 6_000 })).toBe(done);
  });

  it('reports remaining time', () => {
    expect(remainingMs(start(), 31_000)).toBe(30_000);
    expect(remainingMs(start(), 100_000)).toBe(0);
  });
});
