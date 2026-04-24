#!/usr/bin/env -S deno run -A
import 'npm:zx/globals';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
cd(root);

await $`deno run -A tasks/check.js`;
await $`deno run -A tasks/bump-version.js`;

const scriptsBin = path.resolve(root, '..', 'webdetta-scripts', 'bin', 'push-package.sh');
// zx defaults to piped stdin; interactive commit prompt needs real TTY.
await $`bash ${scriptsBin} ${root} ${process.argv.slice(2)}`.stdio(
  'inherit',
  'inherit',
  'inherit',
);
