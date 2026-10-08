import type { FigureSpec } from '../spatial/figure';
import type { Rng } from './rng';

/** The three areas Criteria reports scores for. Logic items are part of math & logic. */
export type Category = 'verbal' | 'math-logic' | 'spatial';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3, 4, 5];

/** Measured difficulty features, e.g. `{ operations: 2, maxOperand: 48 }`. See docs/item-blueprint.md. */
export type Features = Record<string, number>;

/** A small dataset shown with the question, as a table or a bar chart. */
export interface DataTable {
  title: string;
  /** Header for the row labels, e.g. "Month". */
  rowHeader: string;
  /** One header per value column, e.g. ["Product A", "Product B"]. */
  columns: string[];
  rows: { label: string; values: number[] }[];
  display: 'table' | 'bar';
}

/**
 * An answer choice: a word or number, or a spatial figure. Figure choices also carry `text`
 * (a plain description) for screen readers, samples and logs.
 */
export type Choice = { kind: 'text'; text: string } | { kind: 'figure'; figure: FigureSpec; text: string };

/** Figures shown with a spatial question: a series with a missing panel (null). */
export type Visual = { kind: 'series'; panels: (FigureSpec | null)[] };

export interface Question {
  /** `${type}:${difficulty}:${seed}`; enough to rebuild the question. */
  id: string;
  type: string;
  category: Category;
  difficulty: Difficulty;
  seed: number;
  prompt: string;
  table?: DataTable;
  visual?: Visual;
  choices: Choice[];
  answerIndex: number;
  explanation: string;
  features: Features;
}

/** What a generator produces before choices are shuffled and the question is finalised. */
export interface Draft {
  prompt: string;
  table?: DataTable;
  visual?: Visual;
  answer: Choice;
  distractors: Choice[];
  explanation: string;
  features: Features;
  /** Total number of choices shown; defaults to 5 (3 for True/False/Uncertain items). */
  choiceCount?: number;
  /**
   * Show the choices in this exact order instead of shuffling (e.g. True / False / Uncertain).
   * Must contain the answer; `distractors` and `choiceCount` are then ignored.
   */
  fixedChoices?: Choice[];
}

export interface Generator {
  type: string;
  category: Category;
  label: string;
  /** Levels this generator can produce. */
  levels: readonly Difficulty[];
  /**
   * Builds one candidate draft. `target` lets the generator bias its parameters toward a level.
   * `variant` is a number in [0, 1) fixed for the whole question (it doesn't change between
   * retries), so a generator can commit to a sub-kind or answer and keep the mix balanced.
   */
  draft(rng: Rng, target: Difficulty, variant: number): Draft;
  /** Maps measured features to a difficulty level; null rejects the draft (e.g. it broke a constraint). */
  score(features: Features): Difficulty | null;
}

export interface Attempt {
  questionId: string;
  type: string;
  category: Category;
  /** 0-based position in the session. */
  position: number;
  /** null when skipped or when time ran out on this question. */
  choiceIndex: number | null;
  correct: boolean;
  timeMs: number;
}
