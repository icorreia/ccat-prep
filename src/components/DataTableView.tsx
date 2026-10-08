import type { DataTable } from '../engine/types';

/** Renders a question's dataset as a table or, for single-column data, a labelled bar chart. */
export function DataTableView({ table }: { table: DataTable }) {
  if (table.display === 'bar' && table.columns.length === 1) return <BarChart table={table} />;
  return (
    <figure className="data-table">
      <figcaption>{table.title}</figcaption>
      <table>
        <thead>
          <tr>
            <th scope="col">{table.rowHeader}</th>
            {table.columns.map((c) => (
              <th scope="col" key={c} className="num">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              {r.values.map((v, i) => (
                <td key={i} className="num">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

const W = 360;
const H = 200;
const PAD = { top: 20, bottom: 28, side: 8 };

function BarChart({ table }: { table: DataTable }) {
  const values = table.rows.map((r) => r.values[0]!);
  const max = Math.max(...values);
  const slot = (W - PAD.side * 2) / values.length;
  const barWidth = slot * 0.6;
  const plotHeight = H - PAD.top - PAD.bottom;
  return (
    <figure className="data-chart">
      <figcaption>
        {table.title} ({table.columns[0]})
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${table.title}: ${table.rows.map((r) => `${r.label} ${r.values[0]}`).join(', ')}`}>
        <line x1={PAD.side} x2={W - PAD.side} y1={H - PAD.bottom} y2={H - PAD.bottom} className="axis" />
        {table.rows.map((r, i) => {
          const v = r.values[0]!;
          const h = (v / max) * plotHeight;
          const x = PAD.side + i * slot + (slot - barWidth) / 2;
          const y = H - PAD.bottom - h;
          return (
            <g key={r.label}>
              <rect x={x} y={y} width={barWidth} height={h} rx={3} className="bar" />
              <text x={x + barWidth / 2} y={y - 6} className="bar-value">
                {v}
              </text>
              <text x={x + barWidth / 2} y={H - PAD.bottom + 18} className="bar-label">
                {r.label.slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
