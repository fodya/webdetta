#!/usr/bin/env -S deno run -A
import { build, emptyDir } from 'jsr:@deno/dnt';
import 'npm:zx/globals';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
cd(root);

const denoJson = JSON.parse(await fs.readFile(path.join(root, 'deno.json'), 'utf8'));

const entryPoints = Object.entries(denoJson.exports).map(([name, p]) => ({
  name: name === '.' ? '.' : name,
  path: p,
}));

const outDir = path.join(root, 'dist', 'npm');
await emptyDir(outDir);

await build({
  entryPoints,
  outDir,
  shims: { deno: true },
  test: false,
  typeCheck: "both",
  declaration: "separate",
  scriptModule: false,
  compilerOptions: {
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    target: 'ES2022',
  },
  package: {
    name: denoJson.name,
    version: denoJson.version,
    license: denoJson.license,
    description: 'Webdetta core packages (npm distribution).',
  },
  async postBuild() {
    await fs.copyFile(path.join(root, 'LICENSE'), path.join(outDir, 'LICENSE'));
    const readme = path.join(root, 'README.md');
    try {
      await fs.copyFile(readme, path.join(outDir, 'README.md'));
    } catch {
      // optional: monorepo ships without root README
    }
  },
});
