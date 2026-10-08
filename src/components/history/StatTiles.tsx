import type { Summary } from '../../engine/historyStats';

const one = (x: number | null) => (x === null ? '—' : Number.isInteger(x) ? String(x) : x.toFixed(1));

export function StatTiles({ summary }: { summary: Summary }) {
  const change = summary.change;
  return (
    <div className="tiles">
      <Tile label="Personal best" value={one(summary.best)} />
      <Tile label="Last score" value={one(summary.last)} />
      <Tile label="Average, last 5" value={one(summary.recentAvg)} />
      <Tile label="Full tests taken" value={String(summary.tests)} />
      <Tile
        label="vs previous 5"
        value={change === null ? '—' : `${change > 0 ? '▲ +' : change < 0 ? '▼ ' : ''}${one(change)}`}
        hint={change === null ? 'after 6 tests' : undefined}
      />
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="tile">
      <div className="tile-value">{value}</div>
      <div className="tile-label">
        {label}
        {hint && <span className="muted"> · {hint}</span>}
      </div>
    </div>
  );
}
