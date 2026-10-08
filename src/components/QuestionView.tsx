import type { Question, Visual } from '../engine/types';
import { Figure } from '../spatial/Figure';
import { DataTableView } from './DataTableView';

function VisualView({ visual }: { visual: Visual }) {
  const panels = visual.kind === 'series' ? visual.panels : visual.cells;
  return (
    <ol className={visual.kind} aria-label={visual.kind === 'series' ? 'Series' : 'Matrix'}>
      {panels.map((panel, i) => (
        <li key={i} className="panel">
          {panel ? <Figure figure={panel} /> : <span className="missing" aria-label="Missing figure">?</span>}
        </li>
      ))}
    </ol>
  );
}

const LETTERS = 'ABCDE';

/** The typical mistakes behind the wrong choices: yours first, then the others. */
function Traps({ question, selected }: { question: Question; selected: number | null }) {
  const traps = question.choices
    .map((choice, i) => ({ i, why: choice.why }))
    .filter((t): t is { i: number; why: string } => !!t.why && t.i !== question.answerIndex);
  if (traps.length === 0) return null;
  const yours = traps.find((t) => t.i === selected);
  const others = traps.filter((t) => t !== yours);
  return (
    <div className="traps">
      {yours && (
        <p>
          <strong>You chose {LETTERS[yours.i]}:</strong> {yours.why}
        </p>
      )}
      {others.length > 0 && (
        <>
          <p className="traps-title">{yours ? 'Other traps' : 'Traps in the wrong answers'}</p>
          <ul>
            {others.map((t) => (
              <li key={t.i}>
                <strong>{LETTERS[t.i]}:</strong> {t.why}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

interface Props {
  question: Question;
  /** Index of the chosen answer, if any. */
  selected?: number | null;
  onSelect?: (index: number) => void;
  /** Mark the correct and wrong choices and show the explanation. */
  reveal?: boolean;
}

export function QuestionView({ question, selected = null, onSelect, reveal = false }: Props) {
  return (
    <article className="question">
      {question.table && <DataTableView table={question.table} />}
      {question.visual && <VisualView visual={question.visual} />}
      <p className="prompt">{question.prompt}</p>
      <ol className={`choices${question.choices[0]?.kind === 'figure' ? ' figure-choices' : ''}`}>
        {question.choices.map((choice, i) => {
          const state = reveal
            ? i === question.answerIndex
              ? 'correct'
              : i === selected
                ? 'wrong'
                : ''
            : i === selected
              ? 'selected'
              : '';
          return (
            <li key={i}>
              <button
                type="button"
                className={`choice ${state}`}
                onClick={() => onSelect?.(i)}
                disabled={!onSelect}
                aria-pressed={i === selected}
              >
                <span className="letter">{LETTERS[i]}</span>
                {choice.kind === 'figure' ? <Figure figure={choice.figure} size={72} /> : <span>{choice.text}</span>}
              </button>
            </li>
          );
        })}
      </ol>
      {reveal && <p className="explanation">{question.explanation}</p>}
      {reveal && <Traps question={question} selected={selected} />}
    </article>
  );
}
