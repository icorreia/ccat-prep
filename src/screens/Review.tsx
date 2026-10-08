import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toSession } from '../store/history';
import { useHistory } from '../store/historyContext';
import { QuestionView } from '../components/QuestionView';
import { ReportQuestion } from '../components/ReportQuestion';
import { isFinished, type Session } from '../engine/session';
import { SLOW_MS } from '../engine/historyStats';
import type { Attempt } from '../engine/types';
import { useSession } from '../store/session';

type Status = 'correct' | 'wrong' | 'skipped' | 'unreached';
const FILTERS: { id: Status | 'all' | 'missed'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'missed', label: 'Missed' },
  { id: 'wrong', label: 'Wrong' },
  { id: 'skipped', label: 'Skipped' },
  { id: 'unreached', label: 'Not reached' },
];
const STATUS_LABELS: Record<Status, string> = { correct: 'Correct', wrong: 'Wrong', skipped: 'Skipped', unreached: 'Not reached' };

const statusOf = (a: Attempt | undefined): Status =>
  !a ? 'unreached' : a.choiceIndex === null ? 'skipped' : a.correct ? 'correct' : 'wrong';

/** Every question of a finished session with your answer, the correct one and the explanation. */
export function ReviewList({ session }: { session: Session }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('missed');
  const rows = session.questions.map((question, i) => {
    const attempt = session.attempts.find((a) => a.position === i);
    return { question, attempt, status: statusOf(attempt), position: i };
  });
  const count = (id: (typeof FILTERS)[number]['id']) =>
    rows.filter((r) => id === 'all' || (id === 'missed' ? r.status !== 'correct' : r.status === id)).length;
  const shown = rows.filter((r) => filter === 'all' || (filter === 'missed' ? r.status !== 'correct' : r.status === filter));

  return (
    <>
      <div className="toolbar" role="tablist" aria-label="Filter questions">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'primary' : ''} onClick={() => setFilter(f.id)}>
            {f.label} ({count(f.id)})
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="muted">Nothing here.</p>}
      {shown.map(({ question, attempt, status, position }) => (
        <div key={question.id} className="card">
          <div className="review-head">
            <strong>Question {position + 1}</strong>
            <span className={`badge ${status}`}>{STATUS_LABELS[status]}</span>
            {attempt && <span className="muted small">{(attempt.timeMs / 1000).toFixed(1)} s</span>}
            {attempt && attempt.timeMs > SLOW_MS && <span className="badge slow">Over {SLOW_MS / 1000} s</span>}
            <span className="muted small">level {question.difficulty}</span>
          </div>
          <QuestionView question={question} selected={attempt?.choiceIndex ?? null} reveal />
          <ReportQuestion question={question} />
        </div>
      ))}
    </>
  );
}

/** Review of a past session from History. */
export function PastReview() {
  const { id } = useParams();
  const { sessions } = useHistory();
  const stored = sessions.find((s) => s.id === id);
  const session = stored && toSession(stored);
  if (!session) {
    return (
      <section>
        <h1>Review not available</h1>
        <p className="muted">This session isn't in your history, or its questions weren't kept.</p>
        <Link to="/history">Back to history</Link>
      </section>
    );
  }
  return (
    <section>
      <h1>Review</h1>
      <p className="muted">
        {stored.label} · {new Date(stored.startedAt).toLocaleString()} · <Link to="/history">Back to history</Link>
      </p>
      <ReviewList session={session} />
    </section>
  );
}

export function Review() {
  const { session } = useSession();
  if (!session || !isFinished(session)) {
    return (
      <section>
        <h1>Nothing to review</h1>
        <p className="muted">Finish a test first.</p>
        <Link to="/">Back to start</Link>
      </section>
    );
  }
  return (
    <section>
      <h1>Review</h1>
      <p className="muted">
        Your answer is outlined in red when wrong; the correct answer is outlined in green. <Link to="/results">Back to results</Link>
      </p>
      <ReviewList session={session} />
    </section>
  );
}
