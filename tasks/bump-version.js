#!/usr/bin/env -S deno run -A
import 'npm:zx/globals';

const p = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'deno.json');
const pkg = JSON.parse(await fs.readFile(p, 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
pkg.version = `${major}.${minor}.${patch + 1}`;
await fs.writeFile(p, JSON.stringify(pkg, null, 2) + '\n');
console.log(pkg.version);
