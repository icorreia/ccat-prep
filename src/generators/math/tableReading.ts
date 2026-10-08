import { numericChoices } from '../../engine/distractors';
import { because, text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Choice, DataTable, Difficulty, Draft, Generator } from '../../engine/types';
import { percent } from './format';

/** Question kinds, with their base difficulty. */
export const KINDS = { lookup: 1, extreme: 2, difference: 2, percentChange: 3, combinedGrowth: 4, largestRise: 5 } as const;
export type Kind = keyof typeof KINDS;

interface Problem {
  kind: Kind;
  table: DataTable;
  prompt: string;
  answer: Choice;
  distractors: Choice[];
  explanation: string;
  /** Table cells the solver has to read. */
  cells: number;
  valid: boolean;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May'];
const SUBJECTS = [
  { title: 'Units sold per month', column: 'Units', unit: 'units', amount: 'units', verb: 'sold' },
  { title: 'Website visitors per month', column: 'Visitors (thousands)', unit: 'visitors', amount: 'thousand visitors', verb: 'recorded' },
  { title: 'Support tickets per month', column: 'Tickets', unit: 'tickets', amount: 'tickets', verb: 'received' },
];
const PRODUCTS = [
  ['Product A', 'Product B'],
  ['North store', 'South store'],
  ['Online', 'In store'],
];

type Subject = (typeof SUBJECTS)[number];

const single = (subject: Subject, values: number[], display: DataTable['display']): DataTable => ({
  title: subject.title,
  rowHeader: 'Month',
  columns: [subject.column],
  rows: values.map((v, i) => ({ label: MONTHS[i]!, values: [v] })),
  display,
});

const labelsOf = (table: DataTable) => table.rows.map((r) => r.label);

export function lookup(table: DataTable, row: number, subject: Subject, rng: Rng): Problem {
  const values = table.rows.map((r) => r.values[0]!);
  const answer = values[row]!;
  // Neighbouring rows first: reading the wrong row is the slip this question tests.
  const order = [row - 1, row + 1, ...values.keys()].filter((i) => i >= 0 && i < values.length && i !== row);
  return {
    kind: 'lookup',
    table,
    prompt: `How many ${subject.amount} were ${subject.verb} in ${MONTHS[row]}?`,
    answer: text(answer),
    distractors: numericChoices(
      answer,
      order.map((i) => ({ value: values[i]!, why: `That's the ${MONTHS[i]} figure. Read across the ${MONTHS[row]} row.` })),
      4,
      rng,
      { step: 10 },
    ),
    explanation: `Read the ${MONTHS[row]} row: ${answer}.`,
    cells: 1,
    valid: new Set(values).size === values.length,
  };
}

export function extreme(table: DataTable, most: boolean, subject: Subject): Problem {
  const values = table.rows.map((r) => r.values[0]!);
  const order = values.map((v, i) => [v, i] as const).sort((a, b) => (most ? b[0] - a[0] : a[0] - b[0]));
  const best = order[0]![1];
  const labels = labelsOf(table);
  return {
    kind: 'extreme',
    table,
    prompt: `In which month were the ${most ? 'most' : 'fewest'} ${subject.unit} ${subject.verb}?`,
    answer: text(labels[best]!),
    // Runner-up first: it's the one a quick glance confuses with the answer.
    distractors: order.slice(1).map(([v, i], k) =>
      k === 0
        ? because(text(labels[i]!), `The runner-up, with ${v} against ${values[best]}. Compare the close ones carefully.`)
        : text(labels[i]!),
    ),
    explanation: `${labels[best]} has ${values[best]}, the ${most ? 'highest' : 'lowest'} value; next is ${labels[order[1]![1]]} with ${order[1]![0]}.`,
    cells: values.length,
    valid: order[0]![0] !== order[1]![0],
  };
}

export function difference(table: DataTable, a: number, b: number, subject: Subject, rng: Rng): Problem {
  const [va, vb] = [table.rows[a]!.values[0]!, table.rows[b]!.values[0]!];
  const answer = va - vb;
  return {
    kind: 'difference',
    table,
    prompt: `How many more ${subject.amount} were ${subject.verb} in ${MONTHS[a]} than in ${MONTHS[b]}?`,
    answer: text(answer),
    distractors: numericChoices(
      answer,
      [
        { value: va + vb, why: 'Added the two months instead of subtracting.' },
        { value: va, why: `That's ${MONTHS[a]} alone. Subtract ${MONTHS[b]} (${vb}).` },
        { value: vb, why: `That's ${MONTHS[b]} alone. The question asks for the difference.` },
      ],
      4,
      rng,
      { step: 10 },
    ),
    explanation: `${MONTHS[a]}: ${va}. ${MONTHS[b]}: ${vb}. ${va} − ${vb} = ${answer}.`,
    cells: 2,
    valid: answer > 0,
  };
}

export function percentChange(table: DataTable, from: number, to: number, subject: Subject, rng: Rng): Problem {
  const [vf, vt] = [table.rows[from]!.values[0]!, table.rows[to]!.values[0]!];
  const answer = ((vt - vf) / vf) * 100;
  const valid = Number.isInteger(answer) && answer > 0 && answer <= 100;
  return {
    kind: 'percentChange',
    table,
    prompt: `By what percentage did the number of ${subject.unit} ${subject.verb} increase from ${MONTHS[from]} to ${MONTHS[to]}?`,
    answer: text(percent(answer)),
    distractors: valid
      ? numericChoices(
          answer,
          [
            { value: ((vt - vf) / vt) * 100, why: `Divided by the later value (${vt}). Percentage change is measured from the starting value (${vf}).` },
            { value: vt - vf, why: `That's the increase as a count (${vt - vf}), not a percentage.` },
            answer / 2,
          ],
          4,
          rng,
          { step: 5, format: percent },
        )
      : [],
    explanation: `${vt} − ${vf} = ${vt - vf}. Divided by the starting value: ${vt - vf} ÷ ${vf} = ${answer}%.`,
    cells: 2,
    valid,
  };
}

export function combinedGrowth(table: DataTable, from: number, to: number, rng: Rng): Problem {
  const total = (row: number) => table.rows[row]!.values.reduce((a, b) => a + b, 0);
  const [tf, tt] = [total(from), total(to)];
  const answer = tt - tf;
  const growthA = table.rows[to]!.values[0]! - table.rows[from]!.values[0]!;
  const growthB = table.rows[to]!.values[1]! - table.rows[from]!.values[1]!;
  const [a, b] = table.columns;
  return {
    kind: 'combinedGrowth',
    table,
    prompt: `By how much did the combined total of ${a} and ${b} grow from ${MONTHS[from]} to ${MONTHS[to]}?`,
    answer: text(answer),
    distractors:
      answer > 0
        ? numericChoices(
            answer,
            [
              { value: growthA, why: `That's the growth in ${a} only. Add the growth in ${b} too.` },
              { value: growthB, why: `That's the growth in ${b} only. Add the growth in ${a} too.` },
              { value: tt, why: `That's the ${MONTHS[to]} total, not the growth since ${MONTHS[from]}.` },
              { value: Math.abs(growthA - growthB), why: 'Subtracted one growth from the other; the combined growth adds them.' },
            ],
            4,
            rng,
            { step: 10 },
          )
        : [],
    explanation: `${MONTHS[from]}: ${table.rows[from]!.values.join(' + ')} = ${tf}. ${MONTHS[to]}: ${table.rows[to]!.values.join(' + ')} = ${tt}. Growth: ${tt} − ${tf} = ${answer}.`,
    cells: 4,
    valid: answer > 0 && growthA !== growthB,
  };
}

/** Which month-to-month step had the largest percentage rise? The biggest absolute rise is the trap. */
export function largestRise(table: DataTable): Problem {
  const values = table.rows.map((r) => r.values[0]!);
  const steps = values.slice(1).map((v, i) => ({
    label: `${MONTHS[i]} → ${MONTHS[i + 1]}`,
    rise: v - values[i]!,
    pct: ((v - values[i]!) / values[i]!) * 100,
  }));
  const byPct = [...steps].sort((a, b) => b.pct - a.pct);
  const byRise = [...steps].sort((a, b) => b.rise - a.rise);
  const best = byPct[0]!;
  return {
    kind: 'largestRise',
    table,
    prompt: 'Between which two consecutive months was the percentage increase the largest?',
    answer: text(best.label),
    distractors: [
      because(
        text(byRise[0]!.label),
        `The biggest rise in absolute terms (+${byRise[0]!.rise}), but from a higher starting value, so only ${Math.round(byRise[0]!.pct)}% in percentage terms.`,
      ),
      ...byPct.slice(1).map((s) => text(s.label)),
    ].filter((c) => c.text !== best.label),
    explanation: `Percentage changes: ${steps.map((s) => `${s.label} ${s.pct >= 0 ? '+' : ''}${Math.round(s.pct)}%`).join(', ')}. The largest is ${best.label}${byRise[0] !== best ? `, even though ${byRise[0]!.label} has the biggest rise in absolute terms (${byRise[0]!.rise})` : ''}.`,
    cells: values.length,
    // Needs a clear winner, and the absolute-rise trap must point elsewhere.
    valid: best.pct - byPct[1]!.pct >= 5 && byRise[0] !== best,
  };
}

const tens = (rng: Rng, n: number, min: number, max: number) =>
  Array.from({ length: n }, () => rng.int(min / 10, max / 10) * 10);

function build(rng: Rng, kind: Kind): Problem {
  const subject = rng.pick(SUBJECTS);
  const display = rng.pick(['table', 'bar'] as const);
  switch (kind) {
    case 'lookup':
      return lookup(single(subject, tens(rng, 5, 40, 200), display), rng.int(0, 4), subject, rng);
    case 'extreme':
      return extreme(single(subject, tens(rng, 5, 40, 200), display), rng.chance(0.6), subject);
    case 'difference': {
      const [a, b] = rng.sample([0, 1, 2, 3, 4], 2) as [number, number];
      return difference(single(subject, tens(rng, 5, 40, 200), display), a, b, subject, rng);
    }
    case 'percentChange': {
      const values = tens(rng, 5, 40, 160);
      const [from, to] = rng.sample([0, 1, 2, 3, 4], 2).sort() as [number, number];
      values[from] = rng.pick([40, 50, 60, 80, 100, 120]);
      values[to] = values[from]! * (1 + rng.pick([10, 20, 25, 50, 75, 100]) / 100);
      return percentChange(single(subject, values, display), from, to, subject, rng);
    }
    case 'combinedGrowth': {
      const [a, b] = rng.pick(PRODUCTS) as [string, string];
      const rows = MONTHS.slice(0, 3).map((label) => ({ label, values: tens(rng, 2, 30, 90) }));
      const [from, to] = rng.chance(0.5) ? [0, 1] : rng.chance(0.5) ? [1, 2] : [0, 2];
      const table: DataTable = { title: 'Monthly sales (units)', rowHeader: 'Month', columns: [a, b], rows, display: 'table' };
      return combinedGrowth(table, from, to, rng);
    }
    case 'largestRise':
      return largestRise(single(subject, tens(rng, 5, 30, 200), display));
  }
}

export const tableReading: Generator = {
  type: 'table-reading',
  category: 'math-logic',
  label: 'Tables and charts',
  levels: [1, 2, 3, 4, 5],

  draft(rng, level): Draft {
    const kinds = (Object.keys(KINDS) as Kind[]).filter((k) => KINDS[k] === level);
    const p = build(rng, rng.pick(kinds));
    return {
      prompt: p.prompt,
      table: p.table,
      answer: p.answer,
      distractors: p.distractors,
      explanation: p.explanation,
      features: { kind: KINDS[p.kind], cells: p.cells, valid: p.valid ? 1 : 0 },
      choiceCount: p.kind === 'largestRise' ? 4 : 5,
    };
  },

  score: (f) => (f.valid ? ((f.kind ?? 1) as Difficulty) : null),
};
