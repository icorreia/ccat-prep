import type { Question } from '../engine/types';
import { DataTableView } from './DataTableView';

const LETTERS = 'ABCDE';

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
      <p className="prompt">{question.prompt}</p>
      <ol className="choices">
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
                <span>{choice.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {reveal && <p className="explanation">{question.explanation}</p>}
    </article>
  );
}
