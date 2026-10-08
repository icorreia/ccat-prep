import { choiceKey, figureChoice } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';
import { describeFigure, type FigureSpec, type Fill } from '../../spatial/figure';

export type Attribute = 'shape' | 'count' | 'fill';
/** How an attribute is laid out: same along each row, same down each column, or a Latin square. */
export type Arrangement = 'row' | 'column' | 'latin' | 'constant';

type Shape = Pick<FigureSpec, 'shape' | 'sides'>;
const SHAPES: Shape[] = [{ shape: 'circle' }, { shape: 'polygon', sides: 4 }, { shape: 'polygon', sides: 3 }];
const COUNTS = [1, 2, 3];
const FILL_VALUES: Fill[] = ['empty', 'striped', 'solid'];

export type Layout = Record<Attribute, { arrangement: Arrangement; order: number[] }>;

/** Value index (0–2) of an attribute in cell (r, c). */
export function valueIndex({ arrangement, order }: Layout[Attribute], r: number, c: number): number {
  switch (arrangement) {
    case 'row':
      return order[r]!;
    case 'column':
      return order[c]!;
    case 'latin':
      return order[(r + c) % 3]!;
    case 'constant':
      return order[0]!;
  }
}

export function cell(layout: Layout, r: number, c: number): FigureSpec {
  return {
    ...SHAPES[valueIndex(layout.shape, r, c)]!,
    count: COUNTS[valueIndex(layout.count, r, c)]!,
    fill: FILL_VALUES[valueIndex(layout.fill, r, c)]!,
    rotation: 0,
  };
}

export const matrixFeatures = (layout: Layout) => {
  const arrangements = Object.values(layout).map((a) => a.arrangement);
  return {
    varying: arrangements.filter((a) => a !== 'constant').length,
    latin: arrangements.filter((a) => a === 'latin').length,
  };
};

const DESCRIBE: Record<Arrangement, (attr: Attribute) => string> = {
  row: (a) => `each row keeps the same ${a}`,
  column: (a) => `each column keeps the same ${a}`,
  latin: (a) => `each row and each column contains every ${a} once`,
  constant: (a) => `the ${a} never changes`,
};

/** Arrangement sets aimed at each level; score() checks the measured level. */
const PLANS: Record<Difficulty, Arrangement[][]> = {
  1: [['row', 'constant', 'constant'], ['column', 'constant', 'constant']],
  2: [['latin', 'constant', 'constant']],
  3: [['row', 'column', 'constant'], ['column', 'row', 'constant']],
  4: [['row', 'column', 'column'], ['row', 'column', 'latin'], ['latin', 'row', 'constant'], ['column', 'row', 'row']],
  5: [['latin', 'latin', 'row'], ['latin', 'latin', 'latin'], ['row', 'column', 'latin'], ['latin', 'column', 'latin']],
};

export function buildLayout(rng: Rng, plan: Arrangement[]): Layout {
  const [a, b, c] = rng.shuffle(plan) as [Arrangement, Arrangement, Arrangement];
  const order = () => rng.shuffle([0, 1, 2]);
  return { shape: { arrangement: a, order: order() }, count: { arrangement: b, order: order() }, fill: { arrangement: c, order: order() } };
}

export function wrongAnswers(layout: Layout): FigureSpec[] {
  const answer = cell(layout, 2, 2);
  const changed: FigureSpec[] = [];
  for (const s of SHAPES) changed.push({ ...answer, ...s });
  for (const n of COUNTS) changed.push({ ...answer, count: n });
  for (const f of FILL_VALUES) changed.push({ ...answer, fill: f });
  // Copying a neighbour is the classic slip.
  return [cell(layout, 2, 1), cell(layout, 1, 2), ...changed];
}

export const matrix: Generator = {
  type: 'matrix',
  category: 'spatial',
  label: '3×3 matrices',
  levels: [1, 2, 3, 4, 5],

  draft(rng, level): Draft {
    const layout = buildLayout(rng, rng.pick(PLANS[level]));
    const cells = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => cell(layout, r, c)));
    const answer = cells[8]!;
    const answerKey = choiceKey(figureChoice(answer));
    const wrong = wrongAnswers(layout);
    const rules = (Object.entries(layout) as [Attribute, Layout[Attribute]][])
      .filter(([, a]) => a.arrangement !== 'constant')
      .map(([attr, a]) => DESCRIBE[a.arrangement](attr));
    return {
      prompt: 'Which figure completes the grid?',
      visual: { kind: 'matrix', cells: [...cells.slice(0, 8), null] },
      answer: figureChoice(answer),
      distractors: [...wrong.slice(0, 2), ...rng.shuffle(wrong.slice(2))]
        .map(figureChoice)
        .filter((c) => choiceKey(c) !== answerKey),
      explanation: `The rules: ${rules.join('; ')}. So the missing figure is ${describeFigure(answer)}.`,
      features: matrixFeatures(layout),
    };
  },

  /** Varying attributes, +1 per Latin square, +1 for juggling two or more. */
  score(f) {
    const varying = f.varying ?? 1;
    return Math.min(5, Math.max(1, varying + (f.latin ?? 0) + (varying >= 2 ? 1 : 0))) as Difficulty;
  },
};
