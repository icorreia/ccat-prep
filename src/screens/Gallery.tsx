import { useMemo, useState } from 'react';
import { generateQuestion } from '../engine/question';
import { randomSeed } from '../engine/rng';
import type { Difficulty } from '../engine/types';
import { GENERATORS, getGenerator } from '../generators';
import { QuestionView } from '../components/QuestionView';

const COUNT = 5;

/** Browse generated questions by type and level: a review tool, not part of the test. */
export function Gallery() {
  const [type, setType] = useState(GENERATORS[0]!.type);
  const generator = getGenerator(type);
  const [level, setLevel] = useState<Difficulty>(generator.levels[0]!);
  const [batch, setBatch] = useState(randomSeed);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const effectiveLevel = generator.levels.includes(level) ? level : generator.levels[0]!;
  const questions = useMemo(
    () => Array.from({ length: COUNT }, (_, i) => generateQuestion(generator, effectiveLevel, (batch + i) >>> 0)),
    [generator, effectiveLevel, batch],
  );

  return (
    <section>
      <h1>Question gallery</h1>
      <p className="muted">Pick a type and level, then answer to see the explanation.</p>
      <div className="toolbar">
        <label>
          Type{' '}
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {GENERATORS.map((g) => (
              <option key={g.type} value={g.type}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Level{' '}
          <select value={effectiveLevel} onChange={(e) => setLevel(Number(e.target.value) as Difficulty)}>
            {generator.levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setBatch(randomSeed())}>
          New questions
        </button>
      </div>
      {questions.map((q) => (
        <div key={q.id} className="card">
          <QuestionView
            question={q}
            selected={answers[q.id] ?? null}
            reveal={q.id in answers}
            onSelect={(i) => setAnswers((a) => (q.id in a ? a : { ...a, [q.id]: i }))}
          />
          <p className="muted small">{q.id}</p>
        </div>
      ))}
    </section>
  );
}
