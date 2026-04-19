#!/usr/bin/env -S deno run -A
import 'npm:zx/globals';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
cd(root);

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

const deno = new Deno.Command('deno', {
  args: ['test', '--parallel', '--no-check', '--reporter=pretty', ...targets],
  stdout: 'piped',
  stderr: 'inherit',
}).spawn();

const reporter = new Deno.Command('deno', {
  args: ['run', '-A', 'tools/test-reporter.js'],
  stdin: 'piped',
  stdout: 'inherit',
  stderr: 'inherit',
}).spawn();

const piping = deno.stdout.pipeTo(reporter.stdin).catch(() => {});
const dStatus = await deno.status;
await piping;
const rStatus = await reporter.status;
process.exit(dStatus.code !== 0 ? dStatus.code : (rStatus.code ?? 0));
