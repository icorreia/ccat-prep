import { Link, useNavigate } from 'react-router';
import { formatClock } from '../components/Timer';
import { crossoverSettings, EASY_AVG, HARD_AVG } from '../engine/crossover';
import { summarize } from '../engine/historyStats';
import { useHistory } from '../store/historyContext';
import { useSession, type SessionConfig } from '../store/session';

export function Home() {
  const { start } = useSession();
  const { sessions } = useHistory();
  const navigate = useNavigate();
  const recentAvg = summarize(sessions).recentAvg;
  const crossover = crossoverSettings(recentAvg);
  const begin = (config: SessionConfig) => {
    start(config);
    navigate('/test');
  };

  return (
    <section>
      <h1>CCAT practice</h1>
      <p>
        50 questions · 15 minutes · no calculator · no going back. Verbal, math &amp; logic and spatial questions are
        mixed together and get harder as you go. Wrong answers cost nothing, so answer everything you can.
      </p>
      <div className="runner-actions">
        <button type="button" className="primary" onClick={() => begin({ kind: 'test' })}>
          Start full test
        </button>
        <Link to="/practice">Practice drills</Link>
        <Link to="/practice?timing=speed">Speed training</Link>
      </div>
      <p className="muted small">
        Keep scratch paper and a pen nearby, like on the real test. New to the CCAT? Read the <Link to="/strategy">strategy</Link> first.
      </p>

      <h2>Crossover mode</h2>
      <p>
        Train harder than the real test: the same 50-question mix, but every question is pushed up the difficulty scale and the clock
        is shorter. Both tighten as your scores improve, from 15 minutes at an average of {EASY_AVG} or below to 12 minutes at {HARD_AVG}.
      </p>
      <div className="runner-actions">
        <button type="button" onClick={() => begin({ kind: 'test', crossover: true })}>
          Start Crossover test
        </button>
        <span className="muted small">
          Now: <strong>{formatClock(crossover.timeLimitMs)}</strong>, questions <strong>+{crossover.levelShift}</strong> level
          {crossover.levelShift === 1 ? '' : 's'} harder
          {recentAvg === null ? ' (no full tests yet)' : ` (your last-5 average is ${recentAvg.toFixed(1)})`}.
        </span>
      </div>
    </section>
  );
}
