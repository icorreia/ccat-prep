# CCAT Practice Simulator — Plan

## Context
Remote-job applications often require the Criteria Cognitive Aptitude Test (CCAT): 50 multiple-choice questions in 15 minutes (~18 s each), no calculator, no going back, split across verbal, math & logic, and spatial reasoning, in uneven proportions (see Test builder). Good practice material is mostly paywalled. The goal is a local app that simulates the real test faithfully and generates unlimited fresh questions, so practice never turns into memorizing answers.

Decisions made with the user:
- **Question source:** procedural generators (offline, unlimited, no API cost); verbal items draw from a curated word bank.
- **Platform:** local web app with Vite, React and TypeScript, no backend, with progress saved in `localStorage`.
- **Modes:** full timed test, category drills, review with explanations, progress history, speed training.

The project directory `/home/ivo-correia/DATA/projects/ccat` is empty, so this is a new build. Node v24 is available.

## Stack
- Vite + React 19 + TypeScript, plain CSS with custom properties (light and dark themes)
- React Router 8 for the screens
- Vitest for generator tests
- Recharts for the History charts
- No external UI library. Spatial figures are drawn as inline SVG.

## Project layout
```
src/
  engine/
    rng.ts              # seeded PRNG (mulberry32), pick/shuffle/int helpers
    types.ts            # Question, Choice, Category, Attempt, Session types
    distractors.ts      # plausible wrong answers (off-by-one, wrong op, swapped digits)
    testBuilder.ts      # assembles 50-question tests with real CCAT mix + difficulty ramp
    scoring.ts          # raw score, answered/correct/unanswered, per-category and per-type stats
  generators/
    index.ts            # registry: id -> { category, difficulty range, generate(rng) }
    math/  numberSeries.ts, wordProblems.ts, percentages.ts, ratios.ts,
           averages.ts, tableReading.ts, fractions.ts
    logic/ syllogisms.ts (incl. True/False/Uncertain), ordering.ts (seating/ranking)
    verbal/ analogies.ts, antonyms.ts, synonyms.ts, sentenceCompletion.ts,
            attentionToDetail.ts (compare strings/addresses/numbers)
    spatial/ shapeSeries.ts, matrix3x3.ts, oddOneOut.ts
  data/
    words.ts            # ~400 synonym/antonym pairs, tagged by difficulty
    analogies.ts        # relation-typed word pairs (part:whole, tool:use, degree...)
    sentences.ts        # sentence-completion templates
  spatial/
    Figure.tsx          # SVG renderer for a Figure spec (shape, fill, rotation, count, position)
  store/
    history.ts          # localStorage persistence (versioned schema, try/catch)
  screens/
    Home.tsx, TestRunner.tsx, Results.tsx, Review.tsx, Drills.tsx, History.tsx
  components/
    Timer.tsx, QuestionView.tsx, ChoiceList.tsx, ProgressBar.tsx
    history/ StatTiles.tsx, ScoreTrend.tsx, PointsBreakdown.tsx, PacingChart.tsx,
             TypeTable.tsx, SessionLog.tsx   # Recharts-based dashboard sections
```

## Core design
**Question model:** each question has `{ id, category, type, difficulty 1–5, prompt, figure?, table?, choices[4–5], answerIndex, explanation, seed }`. The generators are pure functions of `(rng, difficulty)`, so any question can be rebuilt from its seed in Review and History without storing its full text.

**Generators**, with explanations derived from the generating parameters:
- *Number series:* arithmetic, geometric, alternating, squares/cubes, Fibonacci-like and interleaved series; difficulty picks the rule complexity.
- *Word problems:* templated scenarios (work rate, speed/distance, price/discount, mixtures) that use numbers which divide cleanly, because the real test allows no calculator.
- *Table/chart reading:* a generated small dataset rendered as a table or bar chart, asking for a difference, a ratio or the largest change.
- *Logic:* syllogisms ("All A are B… → True/False/Uncertain") built from set relations; ordering puzzles produced by a solver that permutes constraints and keeps only those with a unique answer.
- *Verbal:* analogies by relation type, synonyms, antonyms, sentence completion, and attention-to-detail tasks (e.g. "how many of these pairs are identical?").
- *Spatial:* a `Figure` spec plus transformation rules (rotate, add a side, shift position, toggle fill, change count). The series and 3×3 matrix generators apply the rules; distractors break exactly one rule each. Odd-one-out puts one figure that violates the shared rule among several that follow it.

**Distractors:** each generator returns its correct answer plus 3–4 distractors built from common mistakes. Duplicates are removed and the choices shuffled.

**Test builder:** 50 questions in the mix third-party guides report, since Criteria publishes no official split. The default is about 17 verbal, 22 math & logic (roughly 16–17 math plus 5–6 logic) and 11 spatial. Each test varies the counts by ±2 because real test versions differ, and the mix is set in a single config object so it can be retuned. Categories are interleaved rather than grouped into sections, and difficulty ramps from easy to hard.

## Modes
1. **Full test:** 15-minute global timer, one question at a time, no going back, and a skip button that counts the item as wrong (as on the real test). The test auto-submits when time runs out.
2. **Category drills:** choose a category or a specific question type, a count (10/20/30), a difficulty, and timed (~18 s per question) or untimed.
3. **Speed training:** an 18-second countdown per question that auto-advances, with live pacing feedback.
4. **Results and Review:** the goal is the highest raw score possible, so there is no percentile estimate. Results show the raw score out of 50, the number of questions answered, accuracy on the answered questions, time per question and a per-category breakdown. Review then walks through every question with your answer, the correct answer and the explanation.
5. **History:** a separate dashboard page. Only full tests appear in the score charts; drills and speed sessions still feed the per-type and pacing data.
   - *Summary tiles:* personal best, last score, average of the last 5 tests, number of tests taken, and change compared with the previous 5.
   - *Score trend (line chart):* raw score per full test, a rolling 5-test average and a personal-best line. Crossover-mode tests use a distinct marker.
   - *Where points go (stacked bar per test):* correct, wrong and unanswered, which shows whether you are losing points to speed or to accuracy.
   - *Pacing (line chart):* average time at each question position from 1 to 50, against the 18-second budget.
   - *Question-type table:* attempts, accuracy, median time on correct answers and recent trend. Sortable, with the weakest types highlighted and a **Drill** button on each row.
   - *Session log:* date, mode, score, questions answered, accuracy and time used. Each row links to that session's Review.
   - *Filters and backup:* filter by mode and date range, and export or import the history as JSON.

## How generators are built and checked against the real CCAT
Every generator follows the same pipeline: **template + parameter space → candidate item → difficulty features → filters → distractors → explanation.**

**1. Item blueprint (written before any generator code, in PR 2).** `docs/item-blueprint.md` describes each CCAT item type using only public material: Criteria's candidate sample questions, Crossover's CCAT/PCCAT guides, and Criteria's free JobFlare practice app. Each entry records the item's structure, the number of answer choices, the size of the numbers, the number of reasoning steps, and the expected time to solve (most items take 10–25 s). For each type I'll write 3–5 **anchor items** that are paraphrased in the style of the public samples, never copied. These anchors are the reference that the generators get compared against.

**2. Difficulty measured from features, not guessed.** Each generator computes features it can measure, and a scoring function maps them to difficulty 1–5:
- *Math:* number of operations, size of the operands, whether a carry/borrow or a non-integer intermediate step is needed, and the number of conversions (for example % → fraction).
- *Number series:* rule family (constant step < alternating < second-order < interleaved < multiplicative and additive combined) and series length.
- *Logic:* number of entities and constraints, and the depth of deduction the solver needs to reach the answer.
- *Verbal:* how rare a word is (taken from an embedded frequency list), the relation type in analogies (concrete such as part:whole, harder ones such as degree or cause), and how close the distractors are in meaning.
- *Spatial:* number of rules that change at once (1–3), number of attributes in play, and whether there is a rotation step.

**3. Filters that reject bad items.** The answer must be a whole number or a simple fraction. Every step must be mental-math friendly (no multiplying 3-digit by 3-digit numbers). The logic solver must find exactly one solution. The correct answer must not stand out by format (all choices use the same number of digits and units). Verbal pairs must not be ambiguous, which the word bank enforces with an explicit list of acceptable answers.

**4. Distractors built from typical mistakes,** so wrong answers attract the same errors the real test exploits: applying the wrong operation, an off-by-one in a series, the reverse of a percentage, a near-synonym where an antonym is wanted, and a figure that breaks exactly one rule.

**5. Checks against the real test:**
- *Structural:* a feature profile is computed for the anchors and for generated items at each difficulty level. Generated difficulty-4/5 items must reach at least the anchors' levels of steps, operand size and word rarity. This is enforced in tests.
- *Human review:* each generator PR includes `samples/<generator>.md`, with 20 items shown next to the anchors, so you can judge whether they feel like the real test.
- *Timing:* the app records how long you take per item type. If an item type takes you far longer than 18 seconds when you answer correctly, or far less, its difficulty function gets retuned.
- *Score calibration:* your official practice score is compared with your in-app scores (see below).

Example items the generators should produce:
- Series, difficulty 4: `3, 4, 8, 17, 33, ?` (the gaps are consecutive squares, so the next gap is 25) → 58. Distractors: 49 (the next gap misread as 16), 50, 66.
- Word problem, difficulty 3: "A shirt costs $40 after a 20% discount. What was the original price?" → $50. Distractors: $48 (20% added to $40 instead of working back), $32, $60.
- Matrix, difficulty 4: shapes change down each row and the number of shapes increases along each column; each distractor breaks one of the two rules.

## Preparing for a demanding cutoff (Crossover)
The goal is the **highest raw score possible**, not a particular threshold. Crossover does not publish a single cutoff; third-party sites report role-specific minimums (for example 35/50 for software engineering), and candidates who pass retake the test proctored (PCCAT), so the score must be repeatable. Real CCAT items are proprietary, so fidelity can't be guaranteed by copying them. The app approaches it in these ways:

1. **Blueprint from public information.** The question types, the category mix, the difficulty ramp and the 15-minute / 50-question / no-calculator / no-going-back rules all follow the public descriptions of the test. Each generator lists the CCAT item type it models in a `docs/item-blueprint.md` table, so the mapping can be reviewed in a PR.
2. **Train harder than the real test, progressively.** "Crossover mode" draws more items from difficulty 4–5 and shortens the time limit. Both get tighter as your recent scores improve, starting at 15 minutes and going down to 12, so the app keeps pushing you instead of plateauing at a fixed number.
3. **Quality gates on every item** (in CI, across thousands of seeds per generator): exactly one correct answer, distinct distractors, mental-math-friendly numbers, a difficulty that matches the parameters, and a unique solution for each logic puzzle. Each PR also includes a script that prints 20 sample items per generator, so the samples can be read and judged by a human, not only by tests.
4. **Report-a-bad-question button.** Flagged seeds are saved and can be exported, so they can become regression tests.
5. **Calibration against official material.** Take the free official practice test that Criteria or Crossover provides to applicants, record that raw score in the app, and compare it with your in-app raw scores. If the app scores you much higher, raise the difficulty weights.
6. **Training that goes beyond answering questions.** Adaptive drills target your weakest question types. Pacing analytics flag questions where you spent more than 30 seconds. A strategy page covers guessing rules (there is no penalty for wrong answers), when to skip, and mental-math shortcuts.

Known limits: the procedurally generated verbal items are less varied than hand-written ones, so the word bank is versioned and meant to grow. Spatial items are as close as SVG rules allow, but they are not identical to the real figures.

## Repository and PR workflow
- New GitHub repo `icorreia/ccat-prep`, **private** by default. `gh` is already authenticated as `icorreia`.
- `main` is protected by convention: every change goes through a small PR of roughly 200–400 lines, with CI (GitHub Actions running typecheck, test and build) from PR 1 onward.
- PRs are **stacked**: each branch is based on the previous one, so work continues while you review them in order. Once one merges, the next is retargeted to `main`.
- Execution runs in auto mode, starting with PR 1. Any change to this plan is proposed in chat first and applied only after approval.
- Planned PRs:
  1. Scaffold: Vite + React + TS, lint, Vitest, CI workflow, README
  2. `docs/item-blueprint.md` + anchor items + feature/difficulty framework + engine core (rng, types, distractors, scoring) + tests
  3. Math generators: series, word problems, percentages, ratios, averages, fractions
  4. Table/chart reading generator and its renderer
  5. Logic generators: syllogisms, ordering solver
  6. Verbal data and generators: synonyms, antonyms, analogies
  7. Verbal: sentence completion and attention to detail
  8. Spatial `Figure` renderer and shape-series generator
  9. Spatial: 3×3 matrix and odd-one-out
  10. Test builder, plus the TestRunner and Results screens (full timed test)
  11. Review screen with explanations
  12. Drills and speed training
  13. History persistence (`store/history.ts`), JSON export/import, summary tiles, score trend chart, session log
  14. History: points breakdown, pacing chart, question-type table with Drill links, filters, calibration entry
  15. Crossover mode (progressive), report-question button, strategy page

## Verification
- `npm test`: Vitest tests run every generator over 1,000 seeds and check that the answer is among the choices, that choices are unique, that it does not throw, that numbers are integers or clean fractions, and that ordering puzzles have exactly one solution.
- `npm run build` must type-check cleanly, and CI must pass on every PR.
- `npm run samples -- <generator>` prints sample items for review in each generator PR.
- `npm run dev`, then drive the app in the browser: complete a full test (including a timeout auto-submit), check Results and Review, run a drill and a speed session, reload and confirm History persists and every dashboard section renders (with seeded fake sessions for the charts), and check the spatial SVGs and the layout at phone width.
