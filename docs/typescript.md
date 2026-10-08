# TypeScript setup

The project runs two TypeScript compilers side by side. This is a temporary arrangement until the lint tooling supports TypeScript 7.

| Package (devDependency) | Resolves to | Used by |
| --- | --- | --- |
| `typescript7` | `npm:typescript@7.x` (the native compiler) | `npm run typecheck` and `npm run build` |
| `typescript` | `npm:@typescript/typescript6@6.0.x` (the official TS 6 compatibility package) | ESLint (typescript-eslint), editors, and anything else that does `import "typescript"` |

## Why

TypeScript 7 is the native (Go) compiler. It is much faster, but it does not ship the JavaScript compiler API that typescript-eslint is built on. typescript-eslint 8.x declares `typescript: ">=4.8.4 <6.1.0"` as a peer dependency, so installing `typescript@7` as `typescript` would break `npm run lint`.

Microsoft's supported workaround is to run the two compilers side by side:

- The project's `typescript` dependency points to `@typescript/typescript6`, which re-exports the TS 6 API. typescript-eslint imports it and passes its version check.
- TypeScript 7 is installed under the alias `typescript7` and does the actual type-checking.

## The `tsc` name collision

Both packages provide a `tsc` command, and npm links the TS 6 one into `node_modules/.bin`. So:

- `npm run typecheck` calls TS 7 by path: `node node_modules/typescript7/bin/tsc -b`.
- A bare `npx tsc` runs **TS 6**. Don't rely on it.
- `npm run typecheck:ts6` runs the TS 6 checker (`tsc6 -b`), which is useful if the two compilers ever disagree.

Editors (the VS Code TypeScript extension) pick up the workspace `typescript` package, which is TS 6. That's fine for IntelliSense, because both compilers accept the same `tsconfig` here.

## When to upgrade

Upgrade once typescript-eslint's peer range includes the TypeScript 7 release you want (for example 7.1). Check with:

```sh
npm run ts:upgrade-check
```

It compares the latest `typescript` with the range the latest `typescript-eslint` supports, then prints `READY` (exit 0) or `NOT YET` (exit 1).

## Upgrading

1. Update typescript-eslint, and switch `typescript` back to the real package:
   ```sh
   npm uninstall typescript typescript7
   npm install -D typescript@7 typescript-eslint@latest
   ```
2. In `package.json`, restore the plain scripts and remove the shim-only ones:
   ```json
   "build": "tsc -b && vite build",
   "typecheck": "tsc -b"
   ```
   Delete `typecheck:ts6` and `ts:upgrade-check`, and delete `scripts/ts-upgrade-check.mjs`.
3. Run `npm run lint && npm run typecheck && npm test && npm run build`.
4. Delete this document, or reduce it to a note on the TypeScript version, and remove the link to it from the README.
