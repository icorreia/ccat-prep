import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { SECONDS_PER_QUESTION } from '../engine/testBuilder';
import { DIFFICULTIES, type Category, type Difficulty } from '../engine/types';
import { GENERATORS } from '../generators';
import { useSession, type Scope } from '../store/session';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'verbal', label: 'Verbal' },
  { id: 'math-logic', label: 'Math & logic' },
  { id: 'spatial', label: 'Spatial' },
];
const COUNTS = [10, 20, 30];

/** "all", "category:verbal" or "type:number-series" ↔ Scope */
const encode = (s: Scope) => (s.kind === 'all' ? 'all' : s.kind === 'category' ? `category:${s.category}` : `type:${s.type}`);
function decode(value: string | null): Scope {
  if (value?.startsWith('category:')) return { kind: 'category', category: value.slice(9) as Category };
  if (value?.startsWith('type:') && GENERATORS.some((g) => g.type === value.slice(5))) return { kind: 'type', type: value.slice(5) };
  return { kind: 'all' };
}

/** Drills and speed training. Settings can come from the URL, e.g. /practice?scope=type:ratio&timing=speed. */
export function Practice() {
  const [params] = useSearchParams();
  const { start } = useSession();
  const navigate = useNavigate();
  const [scope, setScope] = useState(() => encode(decode(params.get('scope'))));
  const [count, setCount] = useState(() => (COUNTS.includes(Number(params.get('count'))) ? Number(params.get('count')) : 10));
  const [level, setLevel] = useState<string>(() => params.get('level') ?? 'ramp');
  const [speed, setSpeed] = useState(() => params.get('timing') === 'speed');

  const begin = () => {
    start({
      kind: 'practice',
      scope: decode(scope),
      count,
      level: level === 'ramp' ? 'ramp' : (Number(level) as Difficulty),
      speed,
    });
    navigate('/test');
  };

  return (
    <section>
      <h1>Practice</h1>
      <p className="muted">Drill one area, or train your pace with an {SECONDS_PER_QUESTION}-second limit per question.</p>
      <div className="form">
        <label>
          Questions from
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">All types (CCAT mix)</option>
            <optgroup label="Category">
              {CATEGORIES.map((c) => (
                <option key={c.id} value={`category:${c.id}`}>
                  {c.label}
                </option>
              ))}
            </optgroup>
            {CATEGORIES.map((c) => (
              <optgroup key={c.id} label={c.label}>
                {GENERATORS.filter((g) => g.category === c.id).map((g) => (
                  <option key={g.type} value={`type:${g.type}`}>
                    {g.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Number of questions
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Difficulty
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="ramp">Easy → hard (like the test)</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                Level {d}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Timing</legend>
          <label className="inline">
            <input type="radio" name="timing" checked={!speed} onChange={() => setSpeed(false)} /> Untimed
          </label>
          <label className="inline">
            <input type="radio" name="timing" checked={speed} onChange={() => setSpeed(true)} /> Speed: {SECONDS_PER_QUESTION} s per
            question, then it moves on
          </label>
        </fieldset>
      </div>
      <div className="runner-actions">
        <button type="button" className="primary" onClick={begin}>
          Start
        </button>
      </div>
    </section>
  );
}
