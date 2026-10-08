import { useState, type FormEvent } from 'react';
import { recentAverageAt } from '../../engine/historyStats';
import type { CalibrationEntry } from '../../store/calibration';
import type { StoredSession } from '../../store/history';

/** Gaps within this many points are noise between two 50-question tests. */
const CLOSE = 3;

/** Today as "2026-10-08" in local time (toISOString would give the UTC date). */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/** "2026-10-08" as local midnight, so the day doesn't shift with the time zone. */
const parseDay = (day: string) => new Date(`${day}T00:00`).getTime();

function verdict(gap: number) {
  if (Math.abs(gap) <= CLOSE) return 'close to the official test';
  return gap > 0 ? `${gap.toFixed(1)} higher than the official test: its questions may be easier than the real ones` : `${Math.abs(gap).toFixed(1)} lower than the official test: its questions may be harder than the real ones`;
}

/** Official practice-test scores, compared with the in-app average at the time. */
export function Calibration({ sessions, entries, save }: { sessions: StoredSession[]; entries: CalibrationEntry[]; save: (next: CalibrationEntry[]) => void }) {
  const [score, setScore] = useState('');
  const [day, setDay] = useState(today);

  const add = (e: FormEvent) => {
    e.preventDefault();
    const entry = { id: crypto.randomUUID(), takenAt: parseDay(day), score: Number(score) };
    save([...entries, entry].sort((a, b) => a.takenAt - b.takenAt));
    setScore('');
  };

  return (
    <>
      <p className="muted small">
        Took the free official practice test from Criteria or Crossover? Enter its raw score to see whether the app scores you higher or lower than the real thing.
      </p>
      <form className="toolbar" onSubmit={add}>
        <label>
          Official score{' '}
          <input type="number" min={0} max={50} step={1} required value={score} onChange={(e) => setScore(e.target.value)} className="score-input" />
          <span className="muted"> / 50</span>
        </label>
        <label>
          Taken on <input type="date" required max={today()} value={day} onChange={(e) => setDay(e.target.value)} />
        </label>
        <button type="submit">Add score</button>
      </form>
      {entries.length > 0 && (
        <ul className="calibration">
          {[...entries].reverse().map((entry) => {
            const app = recentAverageAt(sessions, entry.takenAt + 86_400_000);
            return (
              <li key={entry.id}>
                <strong>{entry.score} / 50</strong> on {new Date(entry.takenAt).toLocaleDateString()}
                {' · '}
                {app === null ? (
                  <span className="muted">no full tests in the app by then to compare with</span>
                ) : (
                  <>
                    app average then {app.toFixed(1)}, which is {verdict(app - entry.score)}
                  </>
                )}{' '}
                <button type="button" className="link" onClick={() => save(entries.filter((e) => e.id !== entry.id))}>
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
