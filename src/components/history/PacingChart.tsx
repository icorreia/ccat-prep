import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { BUDGET_MS, pacingByPosition, slowQuestions, SLOW_MS, type PacePoint } from '../../engine/historyStats';
import { GENERATORS } from '../../generators';
import type { StoredSession } from '../../store/history';

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const typeLabel = (type: string) => GENERATORS.find((g) => g.type === type)?.label ?? type;

function PaceTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const p = active ? (payload?.[0]?.payload as PacePoint | undefined) : undefined;
  if (!p) return null;
  return (
    <div className="chart-tooltip">
      <div className="muted small">
        Question {p.position} · {p.samples} answer{p.samples === 1 ? '' : 's'}
      </div>
      <div>
        <span className="swatch series-1" /> Average <strong>{seconds(p.avgMs)}</strong>
      </div>
    </div>
  );
}

/** Average time at each question position against the 18-second budget, plus the questions that ate the clock. */
export function PacingChart({ sessions }: { sessions: StoredSession[] }) {
  const data = pacingByPosition(sessions).map((p) => ({ ...p, avgSec: p.avgMs / 1000 }));
  if (data.length === 0) return <p className="muted">Take a full test or a speed session to see your pacing.</p>;

  const top = Math.ceil(Math.max(...data.map((p) => p.avgSec), BUDGET_MS / 1000) / 10) * 10;
  const yTicks = Array.from({ length: top / 10 + 1 }, (_, i) => i * 10);
  const slow = slowQuestions(sessions);

  return (
    <figure className="chart">
      <div className="chart-legend" aria-hidden>
        <span>
          <span className="swatch series-1" /> Average time
        </span>
        <span>
          <span className="swatch reference" /> 18 s budget
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 20, right: 16, bottom: 4, left: -16 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="position"
            type="number"
            domain={[1, Math.max(50, data.at(-1)!.position)]}
            ticks={[1, 10, 20, 30, 40, 50]}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
          />
          <YAxis domain={[0, top]} ticks={yTicks} unit=" s" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <ReferenceLine y={BUDGET_MS / 1000} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: '18 s', position: 'insideBottomRight', offset: 8, fill: 'var(--muted)', fontSize: 12 }} />
          <Tooltip content={PaceTooltip} cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="avgSec"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <figcaption className="muted small">
        Full tests and speed sessions; untimed drills are left out. Above the line you're spending more than the real test allows.
      </figcaption>
      <p className="slow-note">
        {slow.slow === 0 ? (
          <>No question took over {SLOW_MS / 1000} s in your last {slow.sessions} timed session{slow.sessions === 1 ? '' : 's'}.</>
        ) : (
          <>
            <strong>
              {slow.slow} question{slow.slow === 1 ? '' : 's'} took over {SLOW_MS / 1000} s
            </strong>{' '}
            in your last {slow.sessions} timed session{slow.sessions === 1 ? '' : 's'}:{' '}
            {slow.types.map((t) => `${typeLabel(t.type)} (${t.count})`).join(', ')}. Skipping these sooner leaves time for easier points.
          </>
        )}
      </p>
    </figure>
  );
}
