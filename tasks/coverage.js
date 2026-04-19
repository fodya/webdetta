#!/usr/bin/env -S deno run -A
import 'npm:zx/globals';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
cd(root);

await fs.remove('.coverage');

const modules = process.argv.slice(2);
let targets;
if (modules.length === 0) {
  targets = ['packages'];
} else {
  for (const m of modules) {
    if (!fs.existsSync(`packages/${m}`)) {
      console.error(`Unknown module: ${m}`);
      process.exit(1);
    }
  }
  targets = modules.map((m) => `packages/${m}`);
}

await $`deno test -A --parallel --no-check --coverage=.coverage ${targets}`.quiet();
