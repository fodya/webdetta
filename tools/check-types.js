#!/usr/bin/env -S deno run -A
// Verify every .js listed as a deno.json export has a matching .d.ts and an
// @ts-self-types directive pointing at it.
import 'npm:zx/globals';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
cd(root);

const pkg = JSON.parse(await fs.readFile('deno.json', 'utf8'));
let fail = false;

for (const entry of Object.values(pkg.exports ?? {})) {
  const js = String(entry).replace(/^\.\//, '');
  if (!fs.existsSync(js)) {
    console.log(`MISSING entry: ${js}`);
    fail = true;
    continue;
  }
  const pkgDir = path.dirname(js);
  const name = path.basename(js, '.js');
  const dts = `${pkgDir}/types/${name}.d.ts`;

  if (!fs.existsSync(dts)) {
    console.log(`MISSING .d.ts: ${dts}`);
    fail = true;
  }
  const src = await fs.readFile(js, 'utf8');
  if (!src.includes('@ts-self-types')) {
    console.log(`MISSING @ts-self-types directive: ${js}`);
    fail = true;
  }
}

if (fail) {
  console.log('types check failed');
  process.exit(1);
}
console.log('types check passed');
