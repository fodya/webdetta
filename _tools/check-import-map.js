// deno-lint-ignore-file no-console

import path from "node:path";
import { listPackages, rootDir } from "./utils.js";

const rootDeno = JSON.parse(
  await Deno.readTextFile(path.join(rootDir, "deno.json")),
);
const imports = rootDeno.imports ?? {};

let failed = false;

for (const { denoJson } of await listPackages()) {
  const dependency = imports[denoJson.name];

  if (!dependency) {
    console.warn(`No import map entry found for ${denoJson.name}`);
    failed = true;
    continue;
  }
  const correctDependency = `jsr:${denoJson.name}@^${denoJson.version}`;
  if (dependency !== correctDependency) {
    console.warn(
      `Invalid import map entry for ${denoJson.name}: ${dependency}`,
    );
    console.warn(`Expected: ${correctDependency}`);
    failed = true;
  }
}

if (failed) Deno.exit(1);

console.log("ok");
