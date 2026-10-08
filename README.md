# ccat-prep

A local practice simulator for the Criteria Cognitive Aptitude Test (CCAT): 50 questions, 15 minutes, no calculator, no going back.

Questions are generated procedurally, so every test is new. The app runs entirely in the browser, and progress is stored in `localStorage`.

## Getting started

Requires Node 22+ (see `.nvmrc`).

```sh
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Type-check and build to `dist/`      |
| `npm run typecheck` | Type-check only                      |
| `npm run lint`      | ESLint                               |
| `npm test`          | Run the Vitest suite once            |

CI runs lint, typecheck, tests and build on every PR.

## Status

Under construction. Work lands as a series of small stacked PRs: engine, then generators by category, then the test modes, then history.
