import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { pointsBreakdown, type Breakdown } from '../../engine/historyStats';
import type { StoredSession } from '../../store/history';

/** Bars stay readable up to about this many tests; older ones are in the session log. */
const MAX_TESTS = 20;

interface Point extends Breakdown {
  n: number;
  date: string;
}

function BreakdownTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const p = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
  if (!p) return null;
  return (
    <div className="chart-tooltip">
      <div className="muted small">
        Test {p.n} · {p.date}
      </div>
      <div>
        <span className="swatch series-1" /> Correct <strong>{p.correct}</strong>
      </div>
      <div>
        <span className="swatch series-2" /> Wrong <strong>{p.wrong}</strong>
      </div>
      <div>
        <span className="swatch neutral" /> Unanswered <strong>{p.unanswered}</strong>
      </div>
    </div>
  );
}

/** Correct, wrong and unanswered per full test: are points lost to accuracy or to speed? */
export function PointsBreakdown({ sessions }: { sessions: StoredSession[] }) {
  const tests = sessions.filter((s) => s.mode === 'test');
  if (tests.length === 0) return <p className="muted">Take a full test to see where your points go.</p>;

  const data: Point[] = pointsBreakdown(tests)
    .map((b, i) => ({ ...b, n: i + 1, date: new Date(tests[i]!.startedAt).toLocaleDateString() }))
    .slice(-MAX_TESTS);
  const last = data.at(-1)!;

  return (
    <figure className="chart">
      <div className="chart-legend" aria-hidden>
        <span>
          <span className="swatch series-1" /> Correct
        </span>
        <span>
          <span className="swatch series-2" /> Wrong
        </span>
        <span>
          <span className="swatch neutral" /> Unanswered
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -16 }} maxBarSize={28} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="n" tickLine={false} axisLine={{ stroke: 'var(--border)' }} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <YAxis domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <Tooltip content={BreakdownTooltip} cursor={{ fill: 'var(--border)', opacity: 0.5 }} />
          <Bar dataKey="correct" stackId="points" fill="var(--series-1)" stroke="var(--bg)" strokeWidth={2} isAnimationActive={false} />
          <Bar dataKey="wrong" stackId="points" fill="var(--series-2)" stroke="var(--bg)" strokeWidth={2} isAnimationActive={false} />
          <Bar dataKey="unanswered" stackId="points" fill="var(--series-neutral)" stroke="var(--bg)" strokeWidth={2} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <figcaption className="muted small">
        Last test: {last.correct} correct, {last.wrong} wrong, {last.unanswered} unanswered. Unanswered questions mean time ran out; wrong
        ones mean accuracy. {data.length < tests.length && `Showing the last ${MAX_TESTS} full tests.`}
      </figcaption>
    </figure>
  );
}
