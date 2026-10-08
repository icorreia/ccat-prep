import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { QuestionView } from '../components/QuestionView';
import { Stopwatch, Timer } from '../components/Timer';
import { isFinished, questionRemainingMs, remainingMs, type Session } from '../engine/session';
import { SECONDS_PER_QUESTION } from '../engine/testBuilder';
import { useSession } from '../store/session';

const KEYS = ['a', 'b', 'c', 'd', 'e'];

/** Speed training: seconds left on this question, and the average so far against the budget. */
function Pace({ session, remainingMs }: { session: Session; remainingMs: number }) {
  const times = session.attempts.map((a) => a.timeMs);
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : null;
  const onPace = avg === null || avg <= SECONDS_PER_QUESTION;
  return (
    <span className="pace">
      {avg !== null && <span className={onPace ? 'on-pace' : 'behind'}>avg {avg.toFixed(1)} s {onPace ? '· on pace' : '· too slow'}</span>}
      <Timer remainingMs={remainingMs} warnBelowMs={5_000} />
    </span>
  );
}

const HIDE_CLOCK_KEY = 'ccat-prep:drill-clock-hidden';

function readHidden() {
  try {
    return localStorage.getItem(HIDE_CLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

/** Untimed drills: time spent so far and the average per answered question, for awareness rather than pressure. */
function DrillClock({ session, now }: { session: Session; now: number }) {
  const [hidden, setHidden] = useState(readHidden);
  const toggle = () => {
    setHidden(!hidden);
    try {
      localStorage.setItem(HIDE_CLOCK_KEY, hidden ? '0' : '1');
    } catch {
      // storage blocked: the choice lasts for this visit
    }
  };
  const times = session.attempts.map((a) => a.timeMs);
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : null;
  return (
    <span className="pace">
      {!hidden && avg !== null && (
        <span className="muted small">
          avg {avg.toFixed(1)} s · target {SECONDS_PER_QUESTION} s
        </span>
      )}
      {hidden ? <span className="muted">Untimed</span> : <Stopwatch elapsedMs={now - session.startedAt} />}
      <button type="button" className="link small" onClick={toggle}>
        {hidden ? 'Show clock' : 'Hide clock'}
      </button>
    </span>
  );
}

export function TestRunner() {
  const { session, dispatch } = useSession();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());
  // The selection belongs to one question, so it clears itself when the question changes.
  const [selection, setSelection] = useState<{ id: string; index: number } | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const finished = session ? isFinished(session) : false;
  const remaining = session ? remainingMs(session, now) : 0;
  const questionRemaining = session ? questionRemainingMs(session, now) : Infinity;
  const question = session?.questions[session.index];
  const selected = question && selection?.id === question.id ? selection.index : null;
  const select = (index: number) => question && setSelection({ id: question.id, index });

  // Clock: re-render a few times a second; end the test when time runs out.
  useEffect(() => {
    if (!session || finished) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [session, finished]);

  useEffect(() => {
    if (session && !finished && remaining === 0) dispatch({ type: 'timeout', now: Date.now() });
  }, [session, finished, remaining, dispatch]);

  // Speed training: move on when the per-question clock runs out.
  useEffect(() => {
    if (session && !finished && questionRemaining === 0) dispatch({ type: 'questionTimeout', now: Date.now() });
  }, [session, finished, questionRemaining, dispatch]);

  useEffect(() => {
    if (finished) navigate('/results', { replace: true });
  }, [finished, navigate]);

  const submit = () => {
    if (selected === null) return;
    dispatch({ type: 'answer', choiceIndex: selected, now: Date.now() });
  };
  const skip = () => dispatch({ type: 'skip', now: Date.now() });

  // Keyboard: A–E or 1–5 to choose, Enter to submit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!question || e.target instanceof HTMLSelectElement) return;
      const key = e.key.toLowerCase();
      const index = KEYS.includes(key) ? KEYS.indexOf(key) : Number(key) - 1;
      if (index >= 0 && index < question.choices.length) setSelection({ id: question.id, index });
      if (key === 'enter' && selected !== null) {
        e.preventDefault();
        dispatch({ type: 'answer', choiceIndex: selected, now: Date.now() });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, selected, dispatch]);

  if (!session) return <Navigate to="/" replace />;
  if (finished || !question) return null;

  return (
    <section className="runner">
      <div className="runner-bar">
        <span>
          Question <strong>{session.index + 1}</strong> of {session.questions.length}
        </span>
        {session.timeLimitMs !== null && <Timer remainingMs={remaining} />}
        {session.perQuestionMs !== null && <Pace session={session} remainingMs={questionRemaining} />}
        {session.timeLimitMs === null && session.perQuestionMs === null && <DrillClock session={session} now={now} />}
      </div>
      {session.perQuestionMs !== null && (
        <div className="question-clock" aria-hidden>
          <div style={{ width: `${(questionRemaining / session.perQuestionMs) * 100}%` }} />
        </div>
      )}
      <div className="progress" aria-hidden>
        <div style={{ width: `${(session.index / session.questions.length) * 100}%` }} />
      </div>
      <div className="card">
        <QuestionView key={question.id} question={question} selected={selected} onSelect={select} />
      </div>
      <div className="runner-actions">
        {confirmQuit ? (
          <span className="quit-confirm">
            End the test now? Unanswered questions count as wrong.{' '}
            <button type="button" onClick={() => dispatch({ type: 'quit', now: Date.now() })}>
              End test
            </button>{' '}
            <button type="button" onClick={() => setConfirmQuit(false)}>
              Keep going
            </button>
          </span>
        ) : (
          <button type="button" className="link" onClick={() => setConfirmQuit(true)}>
            Quit
          </button>
        )}
        <span className="spacer" />
        <button type="button" onClick={skip}>
          Skip
        </button>
        <button type="button" className="primary" onClick={submit} disabled={selected === null}>
          Next
        </button>
      </div>
      <p className="muted small">Keys: A–E or 1–5 to choose, Enter for Next. There is no going back.</p>
    </section>
  );
}
