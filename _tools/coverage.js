#!/usr/bin/env -S deno run -A
import "zx";
import { listPackages, rootDir } from "./utils.js";

cd(rootDir);

await fs.remove(".coverage");

const targets = (await listPackages(process.argv.slice(2))).map((entry) =>
  entry.dir
);
await $`deno test -A --parallel --no-check --coverage=.coverage ${targets}`
  .quiet();
