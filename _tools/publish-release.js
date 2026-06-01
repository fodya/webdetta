#!/usr/bin/env -S deno run -A
// deno-lint-ignore-file no-console

import "zx";
import { rootDir } from "./utils.js";

cd(rootDir);

const dryRun = Deno.args.includes("--dry-run");

const now = new Date();
const title = [
  now.getUTCFullYear(),
  String(now.getUTCMonth() + 1).padStart(2, "0"),
  String(now.getUTCDate()).padStart(2, "0"),
].join(".");
const tag = `release-${title}`;

const releases = await Deno.readTextFile("Releases.md");
const [, latest] = releases.split(/^### /m);
const body = latest ? `### ${latest}`.trim() : `Release ${title}`;

console.log(`tag: ${tag}\n\n${body}\n`);

if (dryRun) Deno.exit(0);

await $`git push origin main`;
await $`gh release create ${tag} --target main --title ${tag} --notes ${body}`;
console.log(`released ${tag}, workspace_publish will deploy to JSR`);
