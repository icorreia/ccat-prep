import { text } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Difficulty, Draft, Generator } from '../../engine/types';

/** What is being compared, with its base difficulty. */
export const KINDS = { codes: 2, addresses: 3, records: 3, longRecords: 4 } as const;
export type Kind = keyof typeof KINDS;

const STREETS = ['Elm Street', 'Harbor Road', 'Maple Avenue', 'Pine Lane', 'Oakwood Drive', 'Lakeview Court', 'Willow Way', 'Cedar Boulevard'];
const SURNAMES = ['Kowalski', 'Lindqvist', 'Okafor', 'Moreau', 'Haddad', 'Fernandes', 'Nakamura', 'Ostrowski', 'Delacroix', 'Abernathy'];
const CITIES = ['Springfield', 'Riverton', 'Lakewood', 'Fairhaven', 'Brookfield', 'Westbury'];

const digits = (rng: Rng, n: number) => Array.from({ length: n }, () => rng.int(0, 9)).join('');

function original(rng: Rng, kind: Kind, short: boolean): string {
  switch (kind) {
    case 'codes':
      return digits(rng, short ? 3 : rng.int(4, 5));
    case 'addresses':
      return `${rng.int(10, 4999)} ${rng.pick(STREETS)}, Apt ${rng.int(1, 30)}${rng.pick(['A', 'B', 'C'])}`;
    case 'records':
      return `${rng.pick(SURNAMES)}, ${rng.pick('ABCDEJMRT'.split(''))}. ${digits(rng, 2)}-${digits(rng, 4)}`;
    case 'longRecords':
      return `${rng.pick(SURNAMES)}, ${rng.pick('ABCDEJMRT'.split(''))}. · ${rng.int(100, 9999)} ${rng.pick(STREETS)}, ${rng.pick(CITIES)} · ${digits(rng, 3)}-${digits(rng, 3)}-${digits(rng, 4)}`;
  }
}

/** Letters that are easy to misread for each other. */
const LOOKALIKES: Record<string, string> = { a: 'o', o: 'a', e: 'c', c: 'e', i: 'l', l: 'i', n: 'm', m: 'n', u: 'v', v: 'u', h: 'b', b: 'h' };

/** Applies one subtle change. Returns the new string and a description of the change. */
export function mutate(rng: Rng, s: string): [string, string] {
  const positions = (pred: (ch: string, i: number) => boolean) => [...s].map((ch, i) => (pred(ch, i) ? i : -1)).filter((i) => i >= 0);
  const options: (() => [string, string] | null)[] = [
    () => {
      // Swap two neighbouring digits.
      const idx = positions((ch, i) => /\d/.test(ch) && /\d/.test(s[i + 1] ?? '') && ch !== s[i + 1]);
      if (!idx.length) return null;
      const i = rng.pick(idx);
      return [s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2), `digits ${s[i]}${s[i + 1]} swapped`];
    },
    () => {
      // Change one digit.
      const idx = positions((ch) => /\d/.test(ch));
      if (!idx.length) return null;
      const i = rng.pick(idx);
      const d = String((Number(s[i]) + rng.int(1, 9)) % 10);
      return [s.slice(0, i) + d + s.slice(i + 1), `${s[i]} became ${d}`];
    },
    () => {
      // Replace a letter with a lookalike.
      const idx = positions((ch) => ch in LOOKALIKES);
      if (!idx.length) return null;
      const i = rng.pick(idx);
      return [s.slice(0, i) + LOOKALIKES[s[i]!] + s.slice(i + 1), `"${s[i]}" became "${LOOKALIKES[s[i]!]}"`];
    },
    () => {
      // Drop a letter from a word (e.g. Haddad → Hadad).
      const idx = positions((ch, i) => /[a-z]/.test(ch) && i > 0 && /[a-z]/i.test(s[i - 1]!));
      if (!idx.length) return null;
      const i = rng.pick(idx);
      return [s.slice(0, i) + s.slice(i + 1), `a "${s[i]}" is missing`];
    },
  ];
  for (const option of rng.shuffle(options)) {
    const result = option();
    if (result && result[0] !== s) return result;
  }
  throw new Error(`Could not mutate ${s}`);
}

export interface DetailItem {
  kind: Kind;
  pairs: { left: string; right: string; change?: string }[];
  identical: number;
}

export function buildItem(rng: Rng, kind: Kind, count: number, short: boolean): DetailItem {
  const identical = rng.int(0, count);
  const pairs = rng.shuffle(
    Array.from({ length: count }, (_, i) => {
      const left = original(rng, kind, short);
      if (i < identical) return { left, right: left };
      const [right, change] = mutate(rng, left);
      return { left, right, change };
    }),
  );
  return { kind, pairs, identical };
}

export const detailFeatures = (item: DetailItem) => ({
  kind: KINDS[item.kind],
  pairs: item.pairs.length,
  length: Math.max(...item.pairs.map((p) => p.left.length)),
});

export const attentionToDetail: Generator = {
  type: 'attention-to-detail',
  category: 'verbal',
  label: 'Attention to detail',
  levels: [1, 2, 3, 4, 5],

  draft(rng, level): Draft {
    const kinds = (Object.keys(KINDS) as Kind[]).filter((k) => KINDS[k] === level || KINDS[k] === level - 1);
    const kind = kinds.length ? rng.pick(kinds) : 'codes';
    const count = level === 1 ? 3 : rng.int(level >= 4 ? 4 : 3, 5);
    const item = buildItem(rng, kind, count, level === 1);
    const lines = item.pairs.map((p) => `${p.left}   |   ${p.right}`).join('\n');
    const answer = item.identical;
    return {
      prompt: `How many of the following pairs are exactly identical?\n\n${lines}`,
      answer: text(answer),
      // Only possible counts (0 … number of pairs), nearest to the answer first.
      distractors: Array.from({ length: count + 1 }, (_, n) => n)
        .filter((n) => n !== answer)
        .sort((x, y) => Math.abs(x - answer) - Math.abs(y - answer))
        .map(text),
      choiceCount: Math.min(5, count + 1),
      explanation: item.pairs
        .map((p, i) => `Pair ${i + 1}: ${p.change ? `different (${p.change})` : 'identical'}`)
        .join('. ')
        .concat(`. So ${answer} ${answer === 1 ? 'pair is' : 'pairs are'} identical.`),
      features: detailFeatures(item),
    };
  },

  /** Longer strings to compare and more pairs each add a level; 3 short codes is the easiest. */
  score(f) {
    const kind = f.kind ?? 2;
    if (kind === KINDS.codes && (f.pairs ?? 3) <= 3 && (f.length ?? 4) <= 3) return 1;
    return Math.min(5, kind + ((f.pairs ?? 3) >= 5 ? 1 : 0)) as Difficulty;
  },
};
