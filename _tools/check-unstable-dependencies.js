// deno-lint-ignore-file no-console

import { createGraph } from "@deno/graph";
import { partition } from "jsr:@std/collections/partition";
import { getEntrypoints, listPackages, resolve } from "./utils.js";

const entrypoints = await getEntrypoints();
const unstablePackageNames = (await listPackages())
  .filter(({ denoJson }) => denoJson.version.startsWith("0."))
  .map(({ name }) => name);

const [unstableEntrypoints, stableEntrypoints] = partition(
  entrypoints,
  (entrypoint) =>
    unstablePackageNames.some((name) => entrypoint.startsWith(name)) ||
    entrypoint.includes("unstable-"),
);

const unstableSpecifiers = unstableEntrypoints.map((entrypoint) =>
  import.meta.resolve(entrypoint)
);
const stableSpecifiers = stableEntrypoints.map((entrypoint) =>
  import.meta.resolve(entrypoint)
);

let hasError = false;
const graph = await createGraph(stableSpecifiers, { resolve });
for (const module of graph.modules) {
  if (module.dependencies === undefined) continue;
  for (const dependency of module.dependencies) {
    if (dependency.code === undefined) continue;
    const { specifier } = dependency.code;
    if (!specifier || !unstableSpecifiers.includes(specifier)) continue;
    console.error(
      `Stable module ${module.specifier} imports unstable module: ${specifier}`,
    );
    hasError = true;
  }
}

if (hasError) Deno.exit(1);

console.log("ok");
