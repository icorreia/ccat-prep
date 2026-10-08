import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { ScoreTrend } from '../components/history/ScoreTrend';
import { SessionLog } from '../components/history/SessionLog';
import { StatTiles } from '../components/history/StatTiles';
import { summarize } from '../engine/historyStats';
import { exportHistory } from '../store/history';
import { useHistory } from '../store/historyContext';

export function History() {
  const { sessions, importJson } = useHistory();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const download = () => {
    const blob = new Blob([exportHistory(sessions)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ccat-prep-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const added = importJson(await file.text());
      setMessage(`Imported ${added} new session${added === 1 ? '' : 's'}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  if (sessions.length === 0) {
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
      <StatTiles summary={summarize(sessions)} />

      <h2>Score trend</h2>
      <ScoreTrend sessions={sessions} />

      <h2>Sessions</h2>
      <SessionLog sessions={sessions} />

      <h2>Backup</h2>
      <p className="muted small">History lives in this browser only. Export it to keep a copy or move it to another device.</p>
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
