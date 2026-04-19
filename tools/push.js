#!/usr/bin/env -S deno run -A
import 'npm:zx/globals';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
cd(root);

await $`deno run -A tools/check.js`;
await $`deno run -A tools/bump-version.js`;

const scriptsBin = path.resolve(root, '..', 'webdetta-scripts', 'bin', 'push-package.sh');
await $`bash ${scriptsBin} ${root} ${process.argv.slice(2)}`;
