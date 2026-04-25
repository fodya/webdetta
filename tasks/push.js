#!/usr/bin/env -S deno run -A
import 'zx/globals';
import process from 'node:process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
cd(root);

await $`deno run -A tasks/check.js`;
await $`deno run -A tasks/bump-version.js`;

const scriptsBin = path.resolve(root, '..', 'webdetta-scripts', 'bin', 'push-package.sh');
await $`bash ${scriptsBin} ${root} ${process.argv.slice(2)}`;
