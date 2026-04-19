#!/usr/bin/env -S deno run -A
import 'npm:zx/globals';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
cd(root);

await $`deno run -A tasks/check-types.js`;
await $`deno check packages/`;
await $`deno run -A tasks/test.js`;
