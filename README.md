# ccat-prep

A local practice simulator for the Criteria Cognitive Aptitude Test (CCAT): 50 questions, 15 minutes, no calculator, no going back.

Questions are generated procedurally, so every test is new. The app runs entirely in the browser, and progress is stored in `localStorage`.

## Getting started

Requires Node 24 (see `.nvmrc`).

```sh
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Type-check and build to `dist/`      |
| `npm run typecheck` | Type-check only (TypeScript 7)       |
| `npm run lint`      | ESLint                               |
| `npm test`          | Run the Vitest suite once            |
| `npm run samples`   | Regenerate `samples/<type>.md` (add `-- <type>` for one) |

CI runs lint, typecheck, tests and build on every PR.

## TypeScript

Type-checking uses TypeScript 7, while ESLint uses a TypeScript 6 compatibility package until typescript-eslint supports 7. See [docs/typescript.md](docs/typescript.md) for why, and for the upgrade steps (`npm run ts:upgrade-check`).

## How questions are designed

[docs/item-blueprint.md](docs/item-blueprint.md) defines every question type: what it looks like, how its difficulty is measured, which mistakes its wrong answers target, and reference questions at increasing difficulty. Generators are built and reviewed against it.

## Status

Under construction. Work lands as a series of small stacked PRs: engine, then generators by category, then the test modes, then history.
