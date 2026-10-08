# Handover: CCAT Prep

Status as of 2026-10-08. **The approved plan is in [`docs/PLAN.md`](docs/PLAN.md)** (copied from `~/.claude/plans/i-want-to-apply-sharded-squirrel.md`); read it first. Work is split into small **stacked PRs** in `icorreia/ccat-prep` (public). Each PR targets the one below it, and GitHub retargets it automatically when the lower one is merged with a merge commit.

## Done

| PR | Branch | Content |
| --- | --- | --- |
| #1 ✅ merged | `pr/01-scaffold` | Vite 8, React 19, Router 8, TS 7 type-checking with the TS 6 shim for ESLint (`docs/typescript.md`), CI |
| #2 ✅ merged | `pr/02a-blueprint` | `docs/item-blueprint.md`: 17 question types with their anchors |
| #3 | `pr/02b-engine` | RNG, question model, distractors, scoring |
| #4 | `pr/03a-series-average` | number series and averages, shared generator tests, `npm run samples` |
| #5 | `pr/03b-percent-fraction` | percentages and fractions |
| #6 | `pr/03c-ratio-word` | ratios and word problems |
| #7 | `pr/04-table-reading` | tables and charts, `QuestionView`, `/gallery` |
| #8 | `pr/05-logic` | syllogisms (model checker) and ordering (solver) |
| #9 | `pr/06-vocabulary` | synonyms, antonyms and analogies (`src/data/words.ts`, `analogies.ts`) |
| #10 | `pr/07-sentences-detail` | sentence completion and attention to detail |
| #11 | `pr/08-spatial-series` | figure model and SVG renderer, shape series |
| #12 | `pr/09-matrix-odd` | 3×3 matrix and odd-one-out (fairness check) |
| #13 | `pr/10-full-test` | test builder, timed `/test`, `/results` |
| #14 | `pr/11-review` | `/review` with filters |
| #15 | `pr/12-drills-speed` | `/practice`: drills and 18-second speed training, URL presets |

PRs #3 to #15 are open and waiting for review, from the bottom up. Each passes lint, typecheck, tests and build in CI.

## In progress: PR 13/15, History part 1 (branch `pr/13-history`, **pushed as WIP, no PR yet**)

Committed and pushed as a work-in-progress commit:
- `src/store/history.ts` + tests:
  - localStorage key `ccat-prep:history:v1`, with every access in try/catch;
  - stores the full questions; when storage is full, questions are dropped from the oldest sessions first;
  - JSON export and import.
- `src/store/historyContext.tsx`: `HistoryProvider` and `useHistory`, synced across tabs.
- `src/store/session.tsx`: saves each finished session to history; `describeConfig()` labels sessions.
- `src/engine/historyStats.ts` + tests: `summarize` (best, last, average of the last 5, change against the previous 5, full tests only) and `rollingAverage`.
- `src/components/history/`:
  - `StatTiles`;
  - `ScoreTrend` (Recharts 3.10, palette `--series-1` and `--series-2` validated with the dataviz skill);
  - `SessionLog`.
- `src/screens/History.tsx`, which is lazy-loaded because Recharts is large, plus export and import buttons.
- `/review/:id` (`PastReview` in `src/screens/Review.tsx`), and a History link in the header.

Checked so far:
- 253 tests pass; lint, typecheck and build are clean.
- In the browser, with 14 seeded sessions, the tiles, chart, tooltip and log rendered correctly.

**Unfinished:**
1. I was checking a real session in the browser: start → quit → History → **Review** link → `/review/:id`. That last step hasn't been checked yet.
2. Since the last browser check, I changed the "Best" label to `insideTopLeft` and made the session log compact (`nowrap`, "—" when questions weren't kept). Check both visually.
3. Remove `HANDOVER.md` and `docs/PLAN.md` from this branch (or move them to their own PR), then `gh pr create --base pr/12-drills-speed --head pr/13-history`. Use `gh api -X PATCH repos/icorreia/ccat-prep/pulls/N -F body=@file` to edit PR bodies, because `gh pr edit` fails with a Projects-classic error.

## Remaining (from the plan)

**PR 14: History part 2**
- A "where points go" stacked bar per test (correct, wrong, unanswered).
- A pacing chart: average time per question position (1–50) against the 18-second line.
- A question-type table: attempts, accuracy, median time on correct answers and trend, sortable, with the weakest types highlighted and a **Drill** button linking to `/practice?scope=type:<type>` (PR 12 already supports this).
- Filters by mode and date range.
- A field to enter your score from the official practice test (calibration).

**PR 15: Crossover mode and extras**
- **Crossover mode:** more questions at levels 4–5, and a time limit that tightens as recent scores improve (15 down to 12 minutes). Mark these tests with a distinct marker in `ScoreTrend`.
- **A "report this question" button:** saves flagged question ids, which can be exported.
- **A strategy page:** guessing (no penalty for wrong answers), when to skip, and mental-math shortcuts.

## Known limitations and open questions (raised in the PRs)

- **Sentence bank:** only 39 sentences (PR #10), so they will start repeating. Grow it by hand.
- **Odd-one-out:** figures can't mix shape types the way Criteria's public sample does (PR #12).
- **Back button:** leaving `/test` with the browser's Back button isn't blocked; it would need a data router.
- **Word tiers:** the difficulty tiers in `words.ts` were assigned by hand.

## Workflow notes

- **Checks:** `npm run lint && npm run typecheck && npm test && npm run build`, then `npm run samples` after changing a generator.
- **Dev server:** `npx vite --port 5173`. Stop it with `pkill -f "[v]ite --port 5173"`. The brackets matter, or pkill kills its own shell.
- **Browser automation:** click buttons by coordinates. Ref clicks on the Start button sometimes don't register.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, and PR bodies end with the Claude Code line.
- **User preferences:** small PRs; propose any plan change and wait for approval before applying it; the goal is the highest raw score, so no percentiles.
