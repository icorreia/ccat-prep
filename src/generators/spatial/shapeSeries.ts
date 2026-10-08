import { figureChoice, choiceKey } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';
import { FILLS, shapeName, type FigureSpec } from '../../spatial/figure';

/** A rule changes one attribute by one step per panel. */
export interface Rule {
  id: 'rotate' | 'sides' | 'fill' | 'count' | 'dot';
  /** Apply the rule `times` steps (negative = backwards). */
  apply: (f: FigureSpec, times: number) => FigureSpec;
  describe: (f: FigureSpec) => string;
}

const cycle = <T,>(items: readonly T[], current: T, times: number) =>
  items[(((items.indexOf(current) + times) % items.length) + items.length) % items.length]!;

export const rotate = (step: number): Rule => ({
  id: 'rotate',
  apply: (f, t) => ({ ...f, rotation: f.rotation + step * t }),
  describe: (f) => `the ${shapeName(f)} turns ${Math.abs(step)}° ${step > 0 ? 'clockwise' : 'counter-clockwise'} each step`,
});

export const sides: Rule = {
  id: 'sides',
  apply: (f, t) => ({ ...f, sides: (f.sides ?? 3) + t }),
  describe: () => 'the shape gains one side each step',
};

export const fill: Rule = {
  id: 'fill',
  apply: (f, t) => ({ ...f, fill: cycle(FILLS, f.fill, t) }),
  describe: () => 'the fill cycles empty → striped → solid',
};

export const count: Rule = {
  id: 'count',
  apply: (f, t) => ({ ...f, count: f.count + t }),
  describe: () => 'there is one more shape each step',
};

export const dot: Rule = {
  id: 'dot',
  apply: (f, t) => ({ ...f, dot: ((((f.dot ?? 0) + t) % 4) + 4) % 4 }),
  describe: () => 'the dot moves one corner clockwise each step',
};

export const applyAll = (rules: Rule[], f: FigureSpec, times = 1) => rules.reduce((g, r) => r.apply(g, times), f);

export interface Series {
  rules: Rule[];
  panels: FigureSpec[];
  answer: FigureSpec;
  /** Each breaks exactly one rule, most tempting first. */
  wrong: FigureSpec[];
}

export const PANELS = 4;

export function buildSeries(start: FigureSpec, rules: Rule[]): Series {
  const panels = Array.from({ length: PANELS }, (_, i) => applyAll(rules, start, i));
  const last = panels.at(-1)!;
  const answer = applyAll(rules, last);
  const wrong = rules.flatMap((broken) => {
    const others = rules.filter((r) => r !== broken);
    const base = applyAll(others, last);
    return [base, broken.apply(base, 2), broken.apply(base, -1)]; // not applied, applied twice, backwards
  });
  return { rules, panels, answer, wrong: [last, ...wrong, ...perturbations(answer, rules)] };
}

/** The answer with one attribute the rules don't control changed: right rule, wrong detail. */
export function perturbations(answer: FigureSpec, rules: Rule[]): FigureSpec[] {
  const ruled = new Set(rules.map((r) => r.id));
  const out: FigureSpec[] = [];
  if (!ruled.has('fill')) out.push(...FILLS.filter((x) => x !== answer.fill).map((x) => ({ ...answer, fill: x })));
  if (!ruled.has('count')) out.push({ ...answer, count: answer.count + 1 });
  if (!ruled.has('sides') && answer.shape === 'polygon') out.push({ ...answer, sides: (answer.sides ?? 4) + 1 });
  if (!ruled.has('sides') && !ruled.has('rotate')) out.push({ ...answer, shape: answer.shape === 'circle' ? 'polygon' : 'circle', sides: answer.shape === 'circle' ? 4 : undefined });
  if (answer.shape === 'arrow') out.push({ ...answer, rotation: answer.rotation + 180 });
  if (!ruled.has('dot') && answer.dot === undefined) out.push({ ...answer, dot: 0 });
  return out;
}

export const valid = (f: FigureSpec) => f.count >= 1 && f.count <= 6 && (f.shape !== 'polygon' || ((f.sides ?? 0) >= 3 && (f.sides ?? 0) <= 8));

/** Rule sets, by level. score() checks the measured level; this just aims the draft. */
const RULE_SETS: Record<Difficulty, Rule['id'][][]> = {
  1: [['count'], ['fill'], ['sides'], ['dot']],
  2: [['rotate']],
  3: [['sides', 'fill'], ['count', 'fill'], ['dot', 'fill'], ['count', 'dot'], ['sides', 'dot']],
  4: [['rotate', 'dot'], ['rotate', 'fill'], ['rotate', 'count'], ['count', 'fill', 'dot'], ['sides', 'fill', 'dot']],
  5: [['rotate', 'fill', 'dot'], ['rotate', 'count', 'fill'], ['rotate', 'count', 'dot']],
};

function startFigure(rng: Rng, ruleIds: Rule['id'][]): FigureSpec {
  const shape = ruleIds.includes('sides')
    ? 'polygon'
    : ruleIds.includes('rotate')
      ? rng.pick(['arrow', 'polygon'] as const)
      : rng.pick(['circle', 'arrow', 'polygon'] as const);
  return {
    shape,
    // Rotating triangles is visible at 90°; changing sides starts at 3 so it stays within 8.
    sides: shape === 'polygon' ? (ruleIds.includes('sides') ? 3 : ruleIds.includes('rotate') ? 3 : rng.int(3, 6)) : undefined,
    fill: rng.pick(FILLS),
    rotation: shape === 'arrow' && !ruleIds.includes('rotate') ? rng.pick([0, 90, 180, 270]) : 0,
    count: ruleIds.includes('count') ? rng.int(1, 2) : 1,
    dot: ruleIds.includes('dot') ? rng.int(0, 3) : undefined,
  };
}

function ruleFor(rng: Rng, id: Rule['id'], start: FigureSpec): Rule {
  switch (id) {
    case 'rotate':
      return rotate(start.shape === 'arrow' ? rng.pick([45, 90, -90]) : 90);
    case 'sides':
      return sides;
    case 'fill':
      return fill;
    case 'count':
      return count;
    case 'dot':
      return dot;
  }
}

export const seriesFeatures = (s: Series) => ({
  rules: s.rules.length,
  rotation: s.rules.some((r) => r.id === 'rotate') ? 1 : 0,
});

export const shapeSeries: Generator = {
  type: 'shape-series',
  category: 'spatial',
  label: 'Shape series',
  levels: [1, 2, 3, 4, 5],

  draft(rng, level): Draft {
    const ids = rng.pick(RULE_SETS[level]);
    const start = startFigure(rng, ids);
    const series = buildSeries(start, ids.map((id) => ruleFor(rng, id, start)));
    const ok = [...series.panels, series.answer].every(valid);
    const answerKey = choiceKey(figureChoice(series.answer));
    return {
      prompt: 'Which figure comes next in the series?',
      visual: { kind: 'series', panels: [...series.panels, null] },
      answer: figureChoice(series.answer),
      distractors: series.wrong.filter(valid).map(figureChoice).filter((c) => choiceKey(c) !== answerKey),
      explanation: `The rule${series.rules.length > 1 ? 's are' : ' is'}: ${series.rules.map((r) => r.describe(start)).join('; ')}. Each wrong answer breaks one of ${series.rules.length > 1 ? 'these rules' : 'this rule'}.`,
      features: { ...seriesFeatures(series), valid: ok ? 1 : 0 },
    };
  },

  /** Rules changing at once, +1 when one is a rotation, +1 for juggling two or more. */
  score(f) {
    if (!f.valid) return null;
    const rules = f.rules ?? 1;
    return Math.min(5, rules + (f.rotation ?? 0) + (rules >= 2 ? 1 : 0)) as Difficulty;
  },
};
