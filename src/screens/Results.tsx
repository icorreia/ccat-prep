import { Link, useNavigate } from 'react-router';
import { formatClock } from '../components/Timer';
import { scoreSession } from '../engine/scoring';
import { isFinished } from '../engine/session';
import type { Category } from '../engine/types';
import { useSession } from '../store/session';

const CATEGORY_LABELS: Record<Category, string> = { verbal: 'Verbal', 'math-logic': 'Math & logic', spatial: 'Spatial' };
const pct = (x: number) => `${Math.round(x * 100)}%`;
const seconds = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`);

export function Results() {
  const { session, startTest } = useSession();
  const navigate = useNavigate();

  if (!session || !isFinished(session)) {
    return (
      <section>
        <h1>No results yet</h1>
        <p className="muted">Finish a test to see your score here.</p>
        <Link to="/">Back to start</Link>
      </section>
    );
  }

  const total = session.questions.length;
  const s = scoreSession(total, session.attempts);
  const used = session.finishedAt! - session.startedAt;
  const answeredTimes = session.attempts.filter((a) => a.choiceIndex !== null).map((a) => a.timeMs);
  const byPosition = Array.from({ length: total }, (_, i) => session.attempts.find((a) => a.position === i));

  return (
    <section>
      <h1>Your score</h1>
      <div className="score">
        <span className="score-value">{s.score}</span>
        <span className="muted"> / {total}</span>
      </div>

      <div className="tiles">
        <Tile label="Answered" value={`${s.answered}`} />
        <Tile label="Wrong" value={`${s.wrong}`} />
        <Tile label="Unanswered" value={`${s.unanswered}`} />
        <Tile label="Accuracy (answered)" value={pct(s.accuracy)} />
        <Tile label="Time used" value={formatClock(used)} />
        <Tile label="Avg time per answer" value={seconds(answeredTimes.length ? answeredTimes.reduce((a, b) => a + b, 0) / answeredTimes.length : null)} />
      </div>

      <h2>By category</h2>
      <table className="stats">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col" className="num">Seen</th>
            <th scope="col" className="num">Correct</th>
            <th scope="col" className="num">Accuracy</th>
            <th scope="col" className="num">Median time (correct)</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => {
            const t = s.byCategory[c];
            return (
              <tr key={c}>
                <th scope="row">{CATEGORY_LABELS[c]}</th>
                <td className="num">{t?.seen ?? 0}</td>
                <td className="num">{t?.correct ?? 0}</td>
                <td className="num">{t ? pct(t.accuracy) : '—'}</td>
                <td className="num">{seconds(t?.medianCorrectMs ?? null)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Question by question</h2>
      <p className="muted small">Bar height is time spent; the line marks the 18-second budget.</p>
      <ol className="strip" aria-label="Result per question">
        {byPosition.map((a, i) => {
          const state = !a ? 'unreached' : a.choiceIndex === null ? 'skipped' : a.correct ? 'correct' : 'wrong';
          const height = a ? Math.min(100, (a.timeMs / 36_000) * 100) : 0;
          return (
            <li key={i} className={state} title={`Q${i + 1}: ${state}${a ? `, ${seconds(a.timeMs)}` : ''}`}>
              <span style={{ height: `${height}%` }} />
            </li>
          );
        })}
      </ol>
      <p className="legend small">
        <span className="correct">■ correct</span> <span className="wrong">■ wrong</span> <span className="skipped">■ skipped</span>{' '}
        <span className="unreached">■ not reached</span>
      </p>

      <div className="runner-actions">
        <Link to="/review">Review answers</Link>
        <button
          type="button"
          className="primary"
          onClick={() => {
            startTest();
            navigate('/test');
          }}
        >
          Take another test
        </button>
      </div>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="tile">
      <div className="tile-value">{value}</div>
      <div className="tile-label">{label}</div>
    </div>
  );
}
