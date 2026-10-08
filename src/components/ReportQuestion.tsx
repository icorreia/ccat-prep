import { useState } from 'react';
import type { Question } from '../engine/types';
import { REPORT_REASONS, type ReportReason } from '../store/reports';
import { useReports } from '../store/reportsContext';

/** "Report" link under a reviewed question: pick a reason, add an optional note, save. */
export function ReportQuestion({ question }: { question: Question }) {
  const { reports, report, withdraw } = useReports();
  const existing = reports.find((r) => r.questionId === question.id);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('wrong-answer');
  const [note, setNote] = useState('');

  if (existing && !open) {
    return (
      <p className="report muted small" role="status">
        Reported: {REPORT_REASONS[existing.reason].toLowerCase()}.{' '}
        <button type="button" className="link" onClick={() => withdraw(question.id)}>
          Undo
        </button>
      </p>
    );
  }

  if (!open) {
    return (
      <p className="report">
        <button type="button" className="link small" onClick={() => setOpen(true)}>
          Report a problem with this question
        </button>
      </p>
    );
  }

  return (
    <form
      className="report toolbar"
      onSubmit={(e) => {
        e.preventDefault();
        report({ questionId: question.id, reason, note: note.trim(), reportedAt: Date.now(), question });
        setOpen(false);
      }}
    >
      <label>
        Problem{' '}
        <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
          {Object.entries(REPORT_REASONS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="report-note">
        Note <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional: what's wrong?" maxLength={500} />
      </label>
      <button type="submit" className="primary">
        Save report
      </button>
      <button type="button" className="link" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}
