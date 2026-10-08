import { Rng } from './rng';
import type { Choice, Difficulty, Draft, Generator, Question } from './types';

export const DEFAULT_CHOICE_COUNT = 5;

/** How many drafts to try before giving up on hitting the target difficulty. */
export const MAX_ATTEMPTS = 500;

export const text = (value: string | number): Choice => ({ kind: 'text', text: String(value) });

/** Two choices with the same key would look identical to the test-taker. */
export function choiceKey(choice: Choice): string {
  return `${choice.kind}:${choice.text.trim().toLowerCase()}`;
}

export const questionId = (type: string, difficulty: Difficulty, seed: number) =>
  `${type}:${difficulty}:${seed}`;

/**
 * Turns a draft into a question: drops distractors that duplicate the answer or each other,
 * keeps the first `choiceCount - 1` (generators list them most-plausible first), and shuffles.
 * Returns null when the draft has too few distinct distractors.
 */
export function finalize(
  generator: Generator,
  difficulty: Difficulty,
  seed: number,
  draft: Draft,
  rng: Rng,
): Question | null {
  const choiceCount = draft.choiceCount ?? DEFAULT_CHOICE_COUNT;
  const seen = new Set([choiceKey(draft.answer)]);
  const distractors: Choice[] = [];
  for (const d of draft.distractors) {
    const key = choiceKey(d);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(d);
    if (distractors.length === choiceCount - 1) break;
  }
  if (distractors.length < choiceCount - 1) return null;

  const choices = rng.shuffle([draft.answer, ...distractors]);
  return {
    id: questionId(generator.type, difficulty, seed),
    type: generator.type,
    category: generator.category,
    difficulty,
    seed,
    prompt: draft.prompt,
    ...(draft.table && { table: draft.table }),
    choices,
    answerIndex: choices.indexOf(draft.answer),
    explanation: draft.explanation,
    features: draft.features,
  };
}

/**
 * Generates a question whose *measured* difficulty equals `target`.
 * Deterministic: the same (generator, target, seed) always yields the same question.
 */
export function generateQuestion(generator: Generator, target: Difficulty, seed: number): Question {
  const rng = new Rng(seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const draft = generator.draft(rng, target);
    if (generator.score(draft.features) !== target) continue;
    const question = finalize(generator, target, seed, draft, rng);
    if (question) return question;
  }
  throw new Error(
    `${generator.type}: no level-${target} question after ${MAX_ATTEMPTS} drafts (seed ${seed})`,
  );
}

/** Rebuilds a question from its id, e.g. for Review and History. */
export function rebuildQuestion(generator: Generator, id: string): Question {
  const [type, level, seed] = id.split(':');
  if (type !== generator.type) throw new Error(`Question ${id} is not a ${generator.type} question`);
  return generateQuestion(generator, Number(level) as Difficulty, Number(seed));
}
