// deno-lint-ignore-file no-console

import { createGraph } from "@deno/graph";
import { parse } from "@std/semver";
import { getPackagesDenoJsons, resolve } from "./utils.js";

const packages = await getPackagesDenoJsons();
const ENTRYPOINTS = Object.fromEntries(
  packages.map(({ pkg, denoJson }) => [
    pkg,
    Object.values(denoJson.exports ?? {}).map((entry) =>
      String(entry).replace(/^\.\//, "")
    ),
  ]),
);

const root = new URL("../", import.meta.url).href;
const deps = {};

function getPackageNameFromUrl(url) {
  return url.replace(root, "").split("/")[0];
}

async function getStability(pkg) {
  const config = await import(`../${pkg}/deno.json`, {
    with: { type: "json" },
  });
  const version = parse(config.default.version);
  return version.major > 0 ? "Stable" : "Unstable";
}

async function check(pkg, paths) {
  const depSet = new Set();
  for (const path of paths) {
    const entrypoint = new URL(`../${pkg}/${path}`, import.meta.url).href;
    const graph = await createGraph(entrypoint, { resolve });

    for (
      const dep of new Set(
        getPackageDepsFromSpecifier(pkg, graph, entrypoint),
      )
    ) {
      depSet.add(dep);
    }
  }
  depSet.delete(pkg);
  return { name: pkg, set: depSet, state: await getStability(pkg) };
}

function getPackageDepsFromSpecifier(
  base,
  graph,
  specifier,
  seen = new Set(),
) {
  const mod = graph.modules.find((item) => item.specifier === specifier);
  if (!mod) return new Set();
  const { dependencies } = mod;
  const pkg = getPackageNameFromUrl(specifier);
  const result = new Set([pkg]);
  seen.add(specifier);
  if (dependencies && pkg === base) {
    for (const { code, type } of dependencies) {
      const depSpecifier = code?.specifier ?? type?.specifier;
      if (!depSpecifier || seen.has(depSpecifier)) continue;
      for (
        const dep of getPackageDepsFromSpecifier(
          base,
          graph,
          depSpecifier,
          seen,
        )
      ) {
        result.add(dep);
      }
    }
  }
  return result;
}

for (const [mod, entrypoints] of Object.entries(ENTRYPOINTS)) {
  deps[mod] = await check(mod, entrypoints);
}

function checkCircularDeps(pkg, ancestors = []) {
  const currentDeps = [...ancestors, pkg];
  if (ancestors.includes(pkg)) return currentDeps;
  const dep = deps[pkg];
  if (!dep) return;
  for (const mod of dep.set) {
    const res = checkCircularDeps(mod, currentDeps);
    if (res) return res;
  }
}

if (Deno.args.includes("--graph")) {
  const graphviz = (await import("graphviz")).default;
  const lines = ["digraph webdetta_deps {"];
  for (const mod of Object.keys(deps)) {
    const info = deps[mod];
    const style = info.state === "Stable"
      ? "[shape=circle fixedsize=1 height=1 style=filled fillcolor=lightgreen]"
      : "[shape=circle fixedsize=1 height=1]";
    lines.push(`  "${mod}" ${style};`);
    for (const dep of info.set) {
      lines.push(`  "${mod}" -> "${dep}";`);
    }
  }
  lines.push("}");
  const svg = await graphviz.graphviz.dot(lines.join("\n"), "svg");
  console.log("Writing dependency graph to .github/dependency_graph.svg");
  await Deno.writeTextFile(".github/dependency_graph.svg", svg);
} else {
  console.log(`${Object.keys(deps).length} packages checked.`);
  for (const mod of Object.keys(deps)) {
    const res = checkCircularDeps(mod);
    if (res) {
      console.log(`Circular dependencies found: ${res.join(" -> ")}`);
      Deno.exit(1);
    }
  }
  console.log("No circular dependencies found.");
}
