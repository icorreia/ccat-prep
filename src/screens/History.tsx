import { Link } from 'react-router';
import { ScoreTrend } from '../components/history/ScoreTrend';
import { StatTiles } from '../components/history/StatTiles';
import { summarize } from '../engine/historyStats';
import { useHistory } from '../store/historyContext';

export function History() {
  const { sessions } = useHistory();

  if (sessions.length === 0) {
    return (
      <section>
        <h1>History</h1>
        <p className="muted">
          Nothing yet. <Link to="/">Take a full test</Link> or <Link to="/practice">practise</Link>, and your results will appear here.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>History</h1>
      <StatTiles summary={summarize(sessions)} />

      <h2>Score trend</h2>
      <ScoreTrend sessions={sessions} />
    </section>
  );
}
