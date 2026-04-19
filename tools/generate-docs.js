#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');
const outputFile = path.join(rootDir, 'llms.txt');

const packageNames = fs
  .readdirSync(packagesDir)
  .filter((name) => fs.statSync(path.join(packagesDir, name)).isDirectory())
  .sort();

const merged = [];

for (const pkg of packageNames) {
  const llmsFile = path.join(packagesDir, pkg, 'docs', 'llms.txt');
  if (!fs.existsSync(llmsFile)) continue;

  const lines = fs.readFileSync(llmsFile, 'utf8').split(/\r?\n/);
  const rewritten = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    let rewrittenLine = line.replace(/\]\(([^)]+)\)/g, (_, target) => {
        if (!target.startsWith('.')) return `](${target})`;
        const absoluteTarget = path.resolve(path.dirname(llmsFile), target);
        const relativeTarget = path.relative(rootDir, absoluteTarget).replaceAll(path.sep, '/');
        return `](${relativeTarget.startsWith('.') ? relativeTarget : `./${relativeTarget}`})`;
      });
    if (rewrittenLine.startsWith('- [') && rewrittenLine.includes('): ')) {
      rewrittenLine = `${rewrittenLine.split('): ', 1)[0]})`;
    }
    rewritten.push(rewrittenLine);
  }

  if (!rewritten.length) continue;
  merged.push(`# ${pkg}`, '', ...rewritten, '');
}

fs.writeFileSync(outputFile, merged.join('\n').trim() + (merged.length ? '\n' : ''));
