# CCAT item blueprint

This document defines what each generated question type must look like. Every generator is built to an entry here and reviewed against it. It uses only public information about the CCAT. The real items are proprietary and are never copied.

## Sources

- **Criteria Corp, candidate prep page** (<https://criteriacorp.com/candidates/ccat-prep>): format, scoring, the average score of 24/50, and one sample question per category (an antonym item, an average item, and a shape odd-one-out item).
- **Criteria Corp, CCAT score report guide** (<https://www.criteriacorp.com/files/Criteria-ScoreReportGuide-CCAT.pdf>): the three measured skills (verbal ability, math & logic, spatial reasoning).
- **Third-party prep guides** (iPrep, PrepTerminal, Test-Guide, JobCannon): question sub-types and the reported category mix. These are unofficial and are treated as approximate.

## Test-level rules

| Rule | Value | Source |
| --- | --- | --- |
| Questions | 50 | Criteria |
| Time limit | 15 minutes (about 18 s per question) | Criteria |
| Calculator | Not allowed. Every item must be solvable with mental math. | Criteria |
| Navigation | One question at a time, no going back | Criteria |
| Penalty for wrong answers | None (raw score = number correct) | Criteria |
| Answer choices | 5 (A–E) by default. True/False/Uncertain items have 3. | Criteria samples |
| Ordering | Categories interleaved, difficulty generally increasing | Third-party |
| Mix | About 17 verbal, 22 math & logic (16–17 math, 5–6 logic), 11 spatial. Varies by ±2 per test. | Third-party (PrepTerminal) |

## Difficulty scale

Difficulty is measured, not guessed. Each type below lists the **features** its generator computes, and a per-type scoring function maps them to a level:

| Level | Meaning | Target time (correct answer) |
| --- | --- | --- |
| 1 | One step, recognisable at a glance | ≤ 8 s |
| 2 | One step with some arithmetic or vocabulary | 8–12 s |
| 3 | Two steps, or a less common word | 12–18 s |
| 4 | Three steps, a trap distractor, or a rare word | 18–30 s |
| 5 | Multi-rule or rare-vocabulary items that most test-takers skip | 30 s + |

The anchors (reference questions) below are original items written in the style of the public samples, three per type at increasing levels. Each generator PR has to show generated items at the same levels next to these anchors.

---

## Math & logic

### `number-series`: complete the series
- **Shape:** 5–7 terms and a `?`. The answer is the next term.
- **Numbers:** integers up to about 200, with no negatives at levels 1–3.
- **Features:** rule family (constant step < alternating < second-order < interleaved < mixed × and +), number of terms, largest term.
- **Distractors:** off by one step, applying the last difference again, the wrong operation (× instead of +).

| Level | Item | Answer |
| --- | --- | --- |
| 1 | 4, 9, 14, 19, ? | 24 |
| 3 | 2, 6, 3, 9, 6, 18, ? | 15 (alternating ×3, −3) |
| 4 | 3, 4, 8, 17, 33, ? | 58 (gaps 1, 4, 9, 16, 25) |

### `word-problem`: short applied arithmetic
- **Shape:** 1–2 sentences: scaling, trains meeting, combined work, round-trip average speed, ages. (Discount problems belong to `percentage`, reverse kind.)
- **Numbers:** they divide cleanly, with at most one two-digit by two-digit multiplication.
- **Features:** number of operations, size of the operands, whether you have to work backwards, unit conversions.
- **Distractors:** working forwards instead of backwards, adding rates instead of their reciprocals, stopping one step early.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | A car travels 150 miles in 3 hours. At the same speed, how far does it travel in 5 hours? | 250 miles |
| 3 | Two trains 300 km apart travel toward each other at 60 km/h and 40 km/h. After how many hours do they meet? | 3 (distractor: 5, from 300 ÷ 60) |
| 4 | Pipe A fills a tank in 6 hours and pipe B in 3 hours. How long do they take together? | 2 hours (distractor: 4.5) |

### `percentage`
- **Features:** percent kind (of / change / reverse / successive), whether the base is a round number, number of steps.
- **Distractors:** dividing by the new value instead of the original, adding successive percentages instead of compounding them.

| Level | Item | Answer |
| --- | --- | --- |
| 1 | What is 25% of 80? | 20 |
| 3 | A price rises from $60 to $75. What is the percentage increase? | 25% (distractor: 20%) |
| 4 | A number is increased by 20% and then decreased by 20%. What is the net change? | −4% (distractor: 0%) |

### `ratio`: ratios and proportions
- **Features:** direct or inverse proportion, whether ratios are chained, total size.
- **Distractors:** treating an inverse proportion as direct, using the wrong part of the ratio, reading C:B as B:C, answering A:C when C:A was asked.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | The ratio of boys to girls is 3:5 and there are 40 students. How many are girls? | 25 |
| 3 | 4 workers finish a job in 6 days. How many days do 3 workers need? | 8 (distractor: 4.5) |
| 4 | A:B = 2:3 and B:C = 4:5. What is A:C? | 8:15 |
| 4 | A:B = 3:4 and B:C = 5:6. What is C:A? | 8:5 (distractor: 5:8) |
| 5 | A:B = 3:4 and C:B = 6:5. What is A:C? | 5:8 (distractor: 9:10, from not flipping C:B) |
| 5 | A:B = 3:4, B:C = 5:6 and A + B + C = 118. What is C? | 48 |

### `average`
- **Features:** forward or reverse (find the missing value), number of values, removal or addition step.
- **Distractors:** averaging the averages, forgetting to multiply by the count.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | What is the average of 6, 10 and 14? | 10 |
| 3 | The average of 4 test scores is 85. What fifth score makes the average 87? | 95 |
| 4 | 5 numbers average 20. One is removed and the rest average 18. What was removed? | 28 |

### `fraction`
- **Features:** operation (of / compare / remainder), size of the denominators, number of fractions.
- **Distractors:** comparing numerators only, using the used fraction instead of the remaining one.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | What is 3/4 of 48? | 36 |
| 3 | Which is largest: 5/8, 3/5, 2/3, 7/12, 4/7? | 2/3 |
| 4 | 1/3 and then another 1/4 of a tank are used, leaving 15 L. What is the tank's capacity? | 36 L |

### `table-reading`: read a small table or bar chart
- **Shape:** 3–5 rows by 2–4 columns of round numbers.
- **Features:** lookup or computation, number of cells involved, percent-change step.
- **Distractors:** the wrong row or column, the absolute change where a percentage is asked.

| Level | Item (quarterly sales: Q1 120, Q2 150, Q3 90, Q4 180) | Answer |
| --- | --- | --- |
| 2 | Which quarter had the highest sales? | Q4 |
| 3 | What was the percentage increase from Q3 to Q4? | 100% |
| 4 | Product A sells 40, 55, 65 and product B sells 35, 60, 50 over 3 months. By how much did combined sales grow from month 1 to month 2? | 40 |

### `syllogism`: True / False / Uncertain
- **Shape:** 2–3 premises and a conclusion. 3 choices.
- **Features:** number of premises, quantifiers used (all / some / no), whether the conclusion needs a chain.
- **Distractors:** fixed (True / False / Uncertain). The trap is the converse or an illegal "some" chain.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | All roses are flowers. All flowers need water. → All roses need water. | True |
| 3 | Some managers are engineers. All engineers are analysts. → Some managers are analysts. | True |
| 4 | All A are B. Some B are C. → Some A are C. | Uncertain |

### `ordering`: rankings and seating
- **Shape:** 3–5 people with 2–4 constraints, generated so that exactly one arrangement fits.
- **Features:** number of entities, number of constraints, deduction depth (solver steps).
- **Distractors:** the other people involved, especially those that one missed constraint would make correct.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | Tom is taller than Ann. Ann is taller than Joe. Who is shortest? | Joe |
| 3 | Ava finished ahead of Ben but behind Cal. Dan finished last. Who finished second? | Ava |
| 4 | Five seats in a row, numbered 1–5. Eve sits in seat 3. Finn sits immediately left of Eve. Ian sits next to Eve. Gus is not in seat 1. Hana takes the remaining seat. Who is in seat 5? | Gus |

---

## Verbal

### `synonym` and `antonym`
- **Shape:** "Choose the word most nearly the same as / OPPOSITE to WORD", 5 one-word choices.
- **Features:** word frequency rank of the target and of the answer, and whether the distractors include a near-synonym (for antonyms) or a near-antonym (for synonyms).
- **Distractors:** the opposite relation (as in Criteria's sample, where *elongate* is the trap for an antonym of *lengthen*), plus unrelated words of similar frequency.

| Type | Level | Item | Answer |
| --- | --- | --- | --- |
| synonym | 1 | BIG | large |
| synonym | 3 | CANDID | frank |
| synonym | 5 | OBDURATE | stubborn |
| antonym | 1 | ANCIENT | modern |
| antonym | 3 | SCARCE | abundant |
| antonym | 5 | LAUD | disparage |

### `analogy`
- **Shape:** "A is to B as C is to ?", 5 choices.
- **Features:** relation type (part:whole, category < tool:function, measure < degree, cause:effect), word frequency.
- **Distractors:** words related to C by a different relation, and words related to B.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | Finger : hand :: toe : ? | foot |
| 3 | Thermometer : temperature :: barometer : ? | pressure |
| 4 | Drizzle : downpour :: breeze : ? | gale |

### `sentence-completion`
- **Shape:** a sentence with 1–2 blanks, 5 choices.
- **Features:** number of blanks, contrast or cause signal words (*although*, *despite*, *so … that*), word frequency.
- **Distractors:** words that fit grammatically but miss the logic signal.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | Despite the heavy rain, the match was not ___. | cancelled |
| 3 | Her explanation was so ___ that even beginners understood it. | lucid |
| 4 | Although the critic was usually ___, she found the film surprisingly ___. | harsh … moving |

### `attention-to-detail`: compare pairs
- **Shape:** "How many of the following pairs are exactly identical?" with 3–5 pairs of codes, addresses or names. The choices are counts.
- **Features:** number of pairs, string length, kind of difference (digit swap, one-letter spelling change, punctuation).
- **Distractors:** neighbouring counts.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | 4821 / 4821 · 7730 / 7703 · 5196 / 5196 · 2048 / 2084 | 2 |
| 3 | 1420 Elm Street, Apt 5B / 1420 Elm Street, Apt 5B · 88 Harbor Rd, Suite 210 / 88 Harbour Rd, Suite 210 · 3071 Pine Ave / 3017 Pine Ave | 1 |
| 4 | Kowalski, J. 55-0912 / Kowalski, J. 55-0912 · Lindqvist, M. 30-7781 / Lindquist, M. 30-7781 · Okafor, T. 12-4406 / Okafor, T. 12-4406 · Moreau, A. 91-3350 / Moreau, A. 91-3530 · Haddad, R. 64-0029 / Hadad, R. 64-0029 | 2 |

---

## Spatial

Spatial items are SVG figures built from a figure spec (shape, sides, fill, rotation, count, position). Their features count the **rules** changing between panels.

### `shape-series`: what comes next
- **Shape:** 4–5 panels and a `?`, with 5 figure choices.
- **Features:** number of simultaneous rules (1–3), whether one of them is a rotation, number of attributes in play.
- **Distractors:** figures that break exactly one rule each.

| Level | Item | Answer |
| --- | --- | --- |
| 2 | A triangle rotates 90° clockwise in each panel. | Triangle at the next rotation |
| 3 | Triangle (filled), square (empty), pentagon (filled), ? | Hexagon, empty |
| 4 | A dot moves clockwise around the corners while the inner shape rotates 45°. | Both rules applied |

### `matrix`: 3×3 grid with a missing cell
- **Features:** number of attributes varying (by row, by column, Latin-square), number of rules.
- **Distractors:** the correct cell with one attribute changed.

| Level | Item | Answer |
| --- | --- | --- |
| 3 | Each row keeps one shape (circle, square, triangle). Each column has 1, 2 or 3 copies. | 3 triangles |
| 4 | As above, plus shading alternates by cell parity. | 3 triangles, with shading by parity |
| 5 | Shape, count and shading each form a Latin square. | The unique completing cell |

### `odd-one-out`
- **Shape:** 5 figures, and one breaks the rule the others share. Criteria's public sample is of this type (each figure has a circle, a triangle and a square, and the odd one replaces the triangle with a second square).
- **Features:** kind of rule (composition, count, symmetry), whether the odd figure is a mirror image of a rotation.
- **Distractors:** the other four figures (the choices are the figures themselves).

| Level | Item | Answer |
| --- | --- | --- |
| 2 | Four rotations of the same arrow and one mirror image | The mirror image |
| 3 | Each figure has 3 shapes with exactly one shaded, except one figure with two shaded | The figure with two shaded |
| 4 | Every figure has an even number of line segments except one | The odd-count figure |

---

## Acceptance checks for each generator PR

1. **Automated (CI):** across 1,000+ seeds per generator, the answer is among the choices, the choices are distinct, numbers are mental-math friendly, and a logic puzzle has exactly one solution.
2. **Feature parity:** generated items at levels 4–5 reach at least the anchors' feature values (steps, operand size, word rarity).
3. **Human review:** `samples/<type>.md` shows 20 generated items next to this type's anchors.
