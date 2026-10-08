import type { Key } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { rollingAverage, scoreOf } from '../../engine/historyStats';
import type { StoredSession } from '../../store/history';

interface Point {
  n: number;
  date: string;
  score: number;
  avg: number;
  crossover: boolean;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: Point;
  r: number;
}

/** Circles for full tests, diamonds for Crossover tests (shape, not colour, carries the difference). */
function ScoreDot({ cx, cy, payload, r }: DotProps) {
  if (cx === undefined || cy === undefined) return null;
  const ring = { fill: 'var(--series-1)', stroke: 'var(--surface)', strokeWidth: 2 };
  if (!payload?.crossover) return <circle cx={cx} cy={cy} r={r} {...ring} />;
  const d = r * 1.4;
  return <path d={`M${cx},${cy - d}L${cx + d},${cy}L${cx},${cy + d}L${cx - d},${cy}Z`} {...ring} />;
}

function TrendTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const p = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
  if (!p) return null;
  return (
    <div className="chart-tooltip">
      <div className="muted small">
        Test {p.n} · {p.date}
        {p.crossover && ' · Crossover'}
      </div>
      <div>
        <span className="swatch series-1" /> Score <strong>{p.score}</strong>
      </div>
      <div>
        <span className="swatch series-2" /> 5-test average <strong>{p.avg.toFixed(1)}</strong>
      </div>
    </div>
  );
}

const renderDot =
  (r: number) =>
  ({ key, cx, cy, payload }: { key?: Key | null; cx?: number; cy?: number; payload?: Point }) => <ScoreDot key={key ?? undefined} cx={cx} cy={cy} payload={payload} r={r} />;

/** Raw score per full test, its 5-test rolling average, and a personal-best line. */
export function ScoreTrend({ sessions }: { sessions: StoredSession[] }) {
  const tests = sessions.filter((s) => s.mode === 'test');
  if (tests.length < 2) return <p className="muted">Take {2 - tests.length} more full test{tests.length ? '' : 's'} to see your trend.</p>;

  const scores = tests.map(scoreOf);
  const avg = rollingAverage(scores);
  const data: Point[] = tests.map((s, i) => ({
    n: i + 1,
    date: new Date(s.startedAt).toLocaleDateString(),
    score: scores[i]!,
    avg: avg[i]!,
    crossover: !!s.crossover,
  }));
  const best = Math.max(...scores);

  return (
    <figure className="chart">
      <div className="chart-legend" aria-hidden>
        <span>
          <span className="swatch series-1" /> Score
        </span>
        <span>
          <span className="swatch series-2" /> 5-test average
        </span>
        <span>
          <span className="swatch reference" /> Personal best
        </span>
        {data.some((p) => p.crossover) && (
          <span>
            <span className="swatch diamond" /> Crossover test
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 20, right: 16, bottom: 4, left: -16 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="n" tickLine={false} axisLine={{ stroke: 'var(--border)' }} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <YAxis domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <ReferenceLine y={best} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: `Best ${best}`, position: 'insideBottomLeft', offset: 8, fill: 'var(--muted)', fontSize: 12 }} />
          <Tooltip content={TrendTooltip} cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }} />
          <Line type="monotone" dataKey="avg" stroke="var(--series-2)" strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={renderDot(4)}
            activeDot={renderDot(6)}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <figcaption className="muted small">Full tests only, oldest to newest. The session log below has the same numbers as a table.</figcaption>
    </figure>
  );
}
