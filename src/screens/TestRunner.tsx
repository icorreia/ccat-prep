import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { QuestionView } from '../components/QuestionView';
import { Timer } from '../components/Timer';
import { isFinished, remainingMs } from '../engine/session';
import { useSession } from '../store/session';

const KEYS = ['a', 'b', 'c', 'd', 'e'];

export function TestRunner() {
  const { session, dispatch } = useSession();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const finished = session ? isFinished(session) : false;
  const remaining = session ? remainingMs(session, now) : 0;
  const question = session?.questions[session.index];

  // Clock: re-render a few times a second; end the test when time runs out.
  useEffect(() => {
    if (!session || finished) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [session, finished]);

  useEffect(() => {
    if (session && !finished && remaining === 0) dispatch({ type: 'timeout', now: Date.now() });
  }, [session, finished, remaining, dispatch]);

  useEffect(() => {
    if (finished) navigate('/results', { replace: true });
  }, [finished, navigate]);

  const submit = () => {
    if (selected === null) return;
    dispatch({ type: 'answer', choiceIndex: selected, now: Date.now() });
    setSelected(null);
  };
  const skip = () => {
    dispatch({ type: 'skip', now: Date.now() });
    setSelected(null);
  };

  // Keyboard: A–E or 1–5 to choose, Enter to submit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!question || e.target instanceof HTMLSelectElement) return;
      const key = e.key.toLowerCase();
      const index = KEYS.includes(key) ? KEYS.indexOf(key) : Number(key) - 1;
      if (index >= 0 && index < question.choices.length) setSelected(index);
      if (key === 'enter' && selected !== null) {
        e.preventDefault();
        dispatch({ type: 'answer', choiceIndex: selected, now: Date.now() });
        setSelected(null);
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
        <Timer remainingMs={remaining} />
      </div>
      <div className="progress" aria-hidden>
        <div style={{ width: `${(session.index / session.questions.length) * 100}%` }} />
      </div>
      <div className="card">
        <QuestionView key={question.id} question={question} selected={selected} onSelect={setSelected} />
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
