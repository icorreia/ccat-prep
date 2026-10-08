import { useState } from 'react';
import { Link } from 'react-router';
import { BUDGET_MS, MIN_ANSWERS_FOR_WEAK, TREND_WINDOW, typeStats, weakestTypes, type TypeStat } from '../../engine/historyStats';
import { GENERATORS } from '../../generators';
import type { StoredSession } from '../../store/history';

type SortKey = 'label' | 'attempts' | 'accuracy' | 'medianCorrectMs' | 'trend';

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'label', label: 'Question type', numeric: false },
  { key: 'attempts', label: 'Attempts', numeric: true },
  { key: 'accuracy', label: 'Accuracy', numeric: true },
  { key: 'medianCorrectMs', label: 'Median time (correct)', numeric: true },
  { key: 'trend', label: 'Trend', numeric: true },
];

const labelOf = (type: string) => GENERATORS.find((g) => g.type === type)?.label ?? type;
const pct = (x: number) => `${Math.round(x * 100)}%`;

interface Row extends TypeStat {
  label: string;
}

/** Nulls (not enough data) always sort last, whatever the direction. */
function compare(a: Row, b: Row, key: SortKey, dir: 1 | -1) {
  const x = a[key];
  const y = b[key];
  if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
  return (typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)) * dir;
}

/** Accuracy and speed per question type, weakest first, each with a link to drill it. */
export function TypeTable({ sessions }: { sessions: StoredSession[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'accuracy', dir: 1 });
  const stats = typeStats(sessions);
  if (stats.length === 0) return <p className="muted">No questions answered yet.</p>;

  const weak = weakestTypes(stats);
  const rows: Row[] = stats.map((t) => ({ ...t, label: labelOf(t.type) })).sort((a, b) => compare(a, b, sort.key, sort.dir));
  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <>
      <div className="table-scroll">
        <table className="stats type-table">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} scope="col" className={c.numeric ? 'num' : undefined} aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
                  <button type="button" className="sort" onClick={() => toggle(c.key)}>
                    {c.label}
                    <span aria-hidden>{sort.key === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</span>
                  </button>
                </th>
              ))}
              <th scope="col">
                <span className="visually-hidden">Drill</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.type} className={weak.has(t.type) ? 'weak' : undefined}>
                <td>
                  {t.label}
                  {weak.has(t.type) && <span className="badge weak">Weak</span>}
                </td>
                <td className="num">{t.attempts}</td>
                <td className="num">{t.accuracy === null ? '—' : pct(t.accuracy)}</td>
                <td className={`num${t.medianCorrectMs !== null && t.medianCorrectMs > BUDGET_MS ? ' over' : ''}`}>
                  {t.medianCorrectMs === null ? '—' : `${(t.medianCorrectMs / 1000).toFixed(1)} s`}
                </td>
                <td className="num nowrap">{t.trend === null ? '—' : `${t.trend > 0 ? '▲ +' : t.trend < 0 ? '▼ −' : ''}${Math.round(Math.abs(t.trend) * 100)} pts`}</td>
                <td>
                  <Link className="button" to={`/practice?scope=type:${t.type}`}>
                    Drill
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        All sessions, drills included. <strong>Weak</strong> marks the three lowest accuracies among types with at least {MIN_ANSWERS_FOR_WEAK} answers. Median times over 18 s are
        in bold. Trend compares your last {TREND_WINDOW} answers with the {TREND_WINDOW} before them.
      </p>
    </>
  );
}
