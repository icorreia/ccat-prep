import { because, figureChoice } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';
import { FILLS, figureKey, shapeName, type FigureSpec } from '../../spatial/figure';

/** The rule four figures share, with its base difficulty. */
export const RULES = { fill: 1, shape: 2, parity: 3, sidesMatchCount: 4, arrowToDot: 5 } as const;
export type RuleId = keyof typeof RULES;

const polygon = (sides: number, rest: Partial<FigureSpec> = {}): FigureSpec => ({
  shape: 'polygon',
  sides,
  fill: 'empty',
  rotation: 0,
  count: 1,
  ...rest,
});

/** Arrow rotation that points at each corner (0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left). */
const POINTS_AT = [315, 45, 135, 225];

interface Set5 {
  rule: RuleId;
  members: FigureSpec[];
  odd: FigureSpec;
  explanation: string;
}

function build(rng: Rng, rule: RuleId): Set5 {
  const anyFill = () => rng.pick(FILLS);
  switch (rule) {
    case 'fill': {
      const [shared, other] = rng.sample(FILLS, 2) as [FigureSpec['fill'], FigureSpec['fill']];
      const shapes = rng.sample([3, 4, 5, 6], 4);
      const members = shapes.map((s) => polygon(s, { fill: shared, count: rng.int(1, 3) }));
      return { rule, members, odd: polygon(rng.pick([3, 4, 5, 6]), { fill: other, count: rng.int(1, 3) }), explanation: `Four figures are ${shared}; the odd one is ${other}.` };
    }
    case 'shape': {
      const sides = rng.int(4, 6);
      const members = Array.from({ length: 4 }, () => polygon(sides, { fill: anyFill(), count: rng.int(1, 3) }));
      return {
        rule,
        members,
        odd: polygon(sides + rng.pick([-1, 1]), { fill: anyFill(), count: rng.int(1, 3) }),
        explanation: `Four figures are made of ${shapeName(polygon(sides))}s; the odd one uses a shape with a different number of sides.`,
      };
    }
    case 'parity': {
      const even = rng.chance(0.5);
      const pool = even ? [2, 4, 6] : [1, 3, 5];
      const members = Array.from({ length: 4 }, () => polygon(rng.int(3, 6), { fill: anyFill(), count: rng.pick(pool) }));
      return {
        rule,
        members,
        odd: polygon(rng.int(3, 6), { fill: anyFill(), count: rng.pick(even ? [1, 3, 5] : [2, 4, 6]) }),
        explanation: `Four figures have an ${even ? 'even' : 'odd'} number of shapes; the odd one has an ${even ? 'odd' : 'even'} number.`,
      };
    }
    case 'sidesMatchCount': {
      const members = rng.sample([3, 4, 5, 6], 4).map((n) => polygon(n, { fill: anyFill(), count: n }));
      const sides = rng.int(3, 6);
      const count = rng.pick([3, 4, 5, 6].filter((n) => n !== sides));
      return {
        rule,
        members,
        odd: polygon(sides, { fill: anyFill(), count }),
        explanation: `In four figures, the number of shapes equals each shape's number of sides (e.g. 4 squares); the odd one has ${count} ${shapeName(polygon(sides))}s.`,
      };
    }
    case 'arrowToDot': {
      const arrow = (corner: number, dot: number): FigureSpec => ({ shape: 'arrow', fill: anyFill(), rotation: POINTS_AT[corner]!, count: 1, dot });
      const members = rng.shuffle([0, 1, 2, 3]).map((c) => arrow(c, c));
      const corner = rng.int(0, 3);
      return {
        rule,
        members,
        odd: arrow(corner, (corner + rng.int(1, 3)) % 4),
        explanation: 'In four figures the arrow points at the corner with the dot; in the odd one it does not.',
      };
    }
  }
}

/** Simple visual traits that could make a figure stand out at a glance. */
const TRAITS = {
  fill: (f: FigureSpec) => f.fill,
  shape: (f: FigureSpec) => shapeName(f),
  count: (f: FigureSpec) => String(f.count),
  dot: (f: FigureSpec) => String(f.dot !== undefined),
};
type Trait = keyof typeof TRAITS;

/** Traits each rule is about; any other trait must not single out a figure. */
const RULE_TRAITS: Record<RuleId, Trait[]> = {
  fill: ['fill'],
  shape: ['shape'],
  parity: ['count'],
  sidesMatchCount: ['shape', 'count'],
  arrowToDot: [],
};

/**
 * The set is fair when all five look different, no trait the rule is about singles out a
 * different figure (a second defensible answer), and no unrelated trait singles out any figure
 * at all (a shortcut: spotting the only striped figure shouldn't solve a level-5 item).
 */
export function isFair(set: Set5): boolean {
  const all = [...set.members, set.odd];
  if (new Set(all.map(figureKey)).size !== 5) return false;
  return (Object.keys(TRAITS) as Trait[]).every((trait) => {
    const values = all.map(TRAITS[trait]);
    const unique = (i: number) => values.filter((v) => v === values[i]).length === 1;
    const loneMembers = [0, 1, 2, 3].filter(unique);
    // A member alone on a trait while everyone else matches is a second defensible answer.
    if (loneMembers.length === 1 && !unique(4)) return false;
    // The answer may only stand out on the traits its rule is about.
    return !unique(4) || RULE_TRAITS[set.rule].includes(trait);
  });
}

/** Why a member isn't the odd one: it follows the rule like the others. */
export function memberNote(rule: RuleId, f: FigureSpec): string {
  switch (rule) {
    case 'fill':
      return `It's ${f.fill}, like three of the others.`;
    case 'shape':
      return `It's made of ${shapeName(f)}s, like three of the others.`;
    case 'parity':
      return `${f.count} shape${f.count === 1 ? '' : 's'}: an ${f.count % 2 === 0 ? 'even' : 'odd'} number, like three of the others.`;
    case 'sidesMatchCount':
      return `${f.count} ${shapeName(f)}s: the number of shapes matches the number of sides, like three of the others.`;
    case 'arrowToDot':
      return 'The arrow points at the corner with the dot, like in three of the others.';
  }
}

export const oddOneOut: Generator = {
  type: 'odd-one-out',
  category: 'spatial',
  label: 'Odd one out',
  levels: [1, 2, 3, 4, 5],

  draft(rng, level): Draft {
    const rule = (Object.keys(RULES) as RuleId[]).find((r) => RULES[r] === level)!;
    const set = build(rng, rule);
    return {
      prompt: 'Which figure does not belong with the others?',
      answer: figureChoice(set.odd),
      distractors: set.members.map((m) => because(figureChoice(m), memberNote(set.rule, m))),
      explanation: set.explanation,
      features: { rule: RULES[set.rule], fair: isFair(set) ? 1 : 0 },
    };
  },

  score: (f) => (f.fair ? ((f.rule ?? 1) as Difficulty) : null),
};
