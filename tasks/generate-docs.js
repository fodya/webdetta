#!/usr/bin/env -S deno run -A
import 'npm:zx/globals';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const packagesDir = path.join(root, 'packages');
const outputFile = path.join(root, 'llms.txt');

const names = (await fs.readdir(packagesDir))
  .filter((n) => fs.statSync(path.join(packagesDir, n)).isDirectory())
  .sort();

const merged = [
  'Canonical API surface lives in TypeScript declaration files under each package.',
  '',
];

for (const pkg of names) {
  const typesIndex = path.join(packagesDir, pkg, 'types', 'index.d.ts');
  if (!fs.existsSync(typesIndex)) continue;
  merged.push(`# ${pkg}`, '', `- [types](./packages/${pkg}/types/index.d.ts)`, '');
}

await fs.writeFile(outputFile, merged.join('\n').trim() + '\n');
