import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Calibration } from '../components/history/Calibration';
import { PacingChart } from '../components/history/PacingChart';
import { PointsBreakdown } from '../components/history/PointsBreakdown';
import { ScoreTrend } from '../components/history/ScoreTrend';
import { SessionLog } from '../components/history/SessionLog';
import { StatTiles } from '../components/history/StatTiles';
import { TypeTable } from '../components/history/TypeTable';
import { summarize } from '../engine/historyStats';
import { importCalibration, loadCalibration, writeCalibration, type CalibrationEntry } from '../store/calibration';
import { exportHistory, type StoredSession } from '../store/history';
import { useHistory } from '../store/historyContext';

const MODES = [
  { id: 'all', label: 'All sessions' },
  { id: 'test', label: 'Full tests' },
  { id: 'drill', label: 'Drills' },
  { id: 'speed', label: 'Speed training' },
] as const;

const RANGES = [
  { days: 0, label: 'All time' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
] as const;

type Mode = (typeof MODES)[number]['id'];

function applyFilters(sessions: StoredSession[], mode: Mode, days: number, now: number) {
  const since = days ? now - days * 86_400_000 : -Infinity;
  return sessions.filter((s) => (mode === 'all' || s.mode === mode) && s.startedAt >= since);
}

export function History() {
  const { sessions: all, importJson } = useHistory();
  const [mode, setMode] = useState<Mode>('all');
  const [days, setDays] = useState(0);
  const [now] = useState(Date.now);
  const sessions = useMemo(() => applyFilters(all, mode, days, now), [all, mode, days, now]);
  const [calibration, setCalibration] = useState(loadCalibration);
  const saveCalibration = (next: CalibrationEntry[]) => {
    writeCalibration(next);
    setCalibration(next);
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const download = () => {
    const blob = new Blob([exportHistory(all, calibration)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ccat-prep-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const json = await file.text();
      const added = importJson(json);
      const scores = importCalibration(json, calibration);
      if (scores.added) saveCalibration(scores.entries);
      setMessage(
        `Imported ${added} new session${added === 1 ? '' : 's'}` + (scores.added ? ` and ${scores.added} official score${scores.added === 1 ? '' : 's'}.` : '.'),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  if (all.length === 0) {
    return (
      <section>
        <h1>History</h1>
        <p className="muted">
          Nothing yet. <Link to="/">Take a full test</Link> or <Link to="/practice">practise</Link>, and your results will appear here.
        </p>
        <ImportButton fileInput={fileInput} onFile={upload} />
        {message && <p role="status">{message}</p>}
      </section>
    );
  }

  return (
    <section>
      <h1>History</h1>
      <div className="toolbar filters">
        <label>
          Show{' '}
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          From{' '}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {RANGES.map((r) => (
              <option key={r.days} value={r.days}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        {sessions.length < all.length && (
          <span className="muted small">
            {sessions.length} of {all.length} sessions
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="muted">No sessions match these filters.</p>
      ) : (
        <>
          {mode === 'all' || mode === 'test' ? (
            <>
              <StatTiles summary={summarize(sessions)} />

              <h2>Score trend</h2>
              <ScoreTrend sessions={sessions} />

              <h2>Where points go</h2>
              <PointsBreakdown sessions={sessions} />
            </>
          ) : (
            <p className="muted small">Scores, the trend and where points go cover full tests only, so they're hidden for this filter.</p>
          )}

          <h2>Pacing</h2>
          <PacingChart sessions={sessions} />

          <h2>Question types</h2>
          <TypeTable sessions={sessions} />

          <h2>Sessions</h2>
          <SessionLog sessions={sessions} />
        </>
      )}

      <h2>Official practice test</h2>
      <Calibration sessions={all} entries={calibration} save={saveCalibration} />

      <h2>Backup</h2>
      <p className="muted small">History and official scores live in this browser only. Export them to keep a copy or move them to another device.</p>
      <div className="toolbar">
        <button type="button" onClick={download}>
          Export JSON
        </button>
        <ImportButton fileInput={fileInput} onFile={upload} />
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}

function ImportButton({ fileInput, onFile }: { fileInput: React.RefObject<HTMLInputElement | null>; onFile: (f: File | undefined) => void }) {
  return (
    <>
      <button type="button" onClick={() => fileInput.current?.click()}>
        Import JSON
      </button>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </>
  );
}
