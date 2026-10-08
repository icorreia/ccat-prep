import { Link } from 'react-router';
import { formatClock } from '../Timer';
import { scoreOf } from '../../engine/historyStats';
import type { StoredSession } from '../../store/history';

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Every saved session, newest first, with a link to its review. */
export function SessionLog({ sessions }: { sessions: StoredSession[] }) {
  return (
    <div className="table-scroll">
      <table className="stats">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Session</th>
            <th scope="col" className="num">Score</th>
            <th scope="col" className="num">Answered</th>
            <th scope="col" className="num">Accuracy</th>
            <th scope="col" className="num">Time</th>
            <th scope="col">
              <span className="visually-hidden">Review</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {[...sessions].reverse().map((s) => {
            const answered = s.attempts.filter((a) => a.choiceIndex !== null).length;
            const score = scoreOf(s);
            return (
              <tr key={s.id}>
                <td className="nowrap">{new Date(s.startedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>{s.label}</td>
                <td className="num nowrap">
                  <strong>{score}</strong> / {s.total}
                </td>
                <td className="num">{answered}</td>
                <td className="num">{answered ? pct(score / answered) : '—'}</td>
                <td className="num">{formatClock(s.finishedAt - s.startedAt)}</td>
                <td>
                  {s.questions ? (
                    <Link to={`/review/${s.id}`}>Review</Link>
                  ) : (
                    <span className="muted" title="Questions were dropped to save space, or came from an import without them">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
