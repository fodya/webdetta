#!/usr/bin/env -S deno run -A
import 'npm:zx/globals';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const packagesDir = path.join(root, 'packages');
const outputFile = path.join(root, 'llms.txt');

const names = (await fs.readdir(packagesDir))
  .filter((n) => fs.statSync(path.join(packagesDir, n)).isDirectory())
  .sort();

const merged = [];

for (const pkg of names) {
  const llmsFile = path.join(packagesDir, pkg, 'docs', 'llms.txt');
  if (!fs.existsSync(llmsFile)) continue;

  const lines = (await fs.readFile(llmsFile, 'utf8')).split(/\r?\n/);
  const rewritten = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    let rl = line.replace(/\]\(([^)]+)\)/g, (_, t) => {
      if (!t.startsWith('.')) return `](${t})`;
      const abs = path.resolve(path.dirname(llmsFile), t);
      const rel = path.relative(root, abs).replaceAll(path.sep, '/');
      return `](${rel.startsWith('.') ? rel : `./${rel}`})`;
    });
    if (rl.startsWith('- [') && rl.includes('): ')) {
      rl = `${rl.split('): ', 1)[0]})`;
    }
    rewritten.push(rl);
  }

  if (!rewritten.length) continue;
  merged.push(`# ${pkg}`, '', ...rewritten, '');
}

await fs.writeFile(outputFile, merged.join('\n').trim() + (merged.length ? '\n' : ''));
