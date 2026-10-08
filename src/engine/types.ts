import type { Rng } from './rng';

/** The three areas Criteria reports scores for. Logic items are part of math & logic. */
export type Category = 'verbal' | 'math-logic' | 'spatial';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3, 4, 5];

/** Measured difficulty features, e.g. `{ operations: 2, maxOperand: 48 }`. See docs/item-blueprint.md. */
export type Features = Record<string, number>;

/** Figure choices arrive with the spatial generators. */
export type Choice = { kind: 'text'; text: string };

export interface Question {
  /** `${type}:${difficulty}:${seed}`; enough to rebuild the question. */
  id: string;
  type: string;
  category: Category;
  difficulty: Difficulty;
  seed: number;
  prompt: string;
  choices: Choice[];
  answerIndex: number;
  explanation: string;
  features: Features;
}

/** What a generator produces before choices are shuffled and the question is finalised. */
export interface Draft {
  prompt: string;
  answer: Choice;
  distractors: Choice[];
  explanation: string;
  features: Features;
  /** Total number of choices shown; defaults to 5 (3 for True/False/Uncertain items). */
  choiceCount?: number;
}

export interface Generator {
  type: string;
  category: Category;
  label: string;
  /** Levels this generator can produce. */
  levels: readonly Difficulty[];
  /** Builds one candidate draft. `target` lets the generator bias its parameters toward a level. */
  draft(rng: Rng, target: Difficulty): Draft;
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
