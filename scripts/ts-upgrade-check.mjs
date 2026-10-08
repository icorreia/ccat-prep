// Reports whether the latest typescript-eslint supports the latest TypeScript,
// i.e. whether the TS6 compatibility shim can be removed (see docs/typescript.md).
import { execFileSync } from 'node:child_process';

const npmView = (...args) =>
  execFileSync('npm', ['view', ...args], { encoding: 'utf8' }).trim();

const parse = (v) => v.split('.').map(Number);
const lessThan = (a, b) => {
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0);
  }
  return false;
};

const tsLatest = npmView('typescript', 'version');
const tseslintLatest = npmView('typescript-eslint', 'version');
const peerRange = npmView(`typescript-eslint@${tseslintLatest}`, 'peerDependencies.typescript');
const upperBound = peerRange.match(/<\s*([\d.]+)/)?.[1];

console.log(`typescript (latest):        ${tsLatest}`);
console.log(`typescript-eslint (latest): ${tseslintLatest}, supports typescript "${peerRange}"`);

if (!upperBound || lessThan(parse(tsLatest), parse(upperBound))) {
  console.log(`\nREADY: typescript ${tsLatest} is supported. Follow "Upgrading" in docs/typescript.md.`);
} else {
  console.log(`\nNOT YET: typescript ${tsLatest} is outside the supported range. Keep the shim.`);
  process.exitCode = 1;
}
