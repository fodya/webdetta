// deno-lint-ignore-file no-console

import { walk } from "jsr:@std/fs/walk";
import { dirname, fromFileUrl, relative } from "@std/path";
import * as colors from "jsr:@std/fmt/colors";
import ts from "typescript";
import { getEntrypoints, getPackagesDenoJsons } from "./utils.js";

const FAIL_FAST = Deno.args.includes("--fail-fast");

let shouldFail = false;

const MOD_FILE_PATHS = (await getEntrypoints())
  .filter((entrypoint) => entrypoint.split("/").length === 2)
  .map((entrypoint) => fromFileUrl(import.meta.resolve(entrypoint)));

const packagesByMod = new Map();
for (const pkg of await getPackagesDenoJsons()) {
  const modExport = pkg.denoJson.exports?.["."];
  if (!modExport) continue;
  const modPath = fromFileUrl(
    new URL(modExport, new URL(`../${pkg.pkg}/`, import.meta.url)),
  );
  packagesByMod.set(modPath, pkg);
}

for (const modFilePath of MOD_FILE_PATHS) {
  const pkg = packagesByMod.get(modFilePath);
  const directExports = new Set(
    Object.values(pkg?.denoJson.exports ?? {})
      .map((entry) => String(entry).replace(/^\.\//, "")),
  );

  const modSource = await Deno.readTextFile(modFilePath);
  const modSourceFile = ts.createSourceFile(
    modFilePath,
    modSource,
    ts.ScriptTarget.Latest,
    true,
  );
  const modExportSpecifiers = new Set();
  modSourceFile.forEachChild((node) => {
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      modExportSpecifiers.add(node.moduleSpecifier.text);
    }
  });

  for await (
    const { path: filePath } of walk(dirname(modFilePath), {
      exts: [".js", ".ts"],
      includeDirs: false,
      maxDepth: 1,
      skip: [
        /unstable/,
        /_test\.(js|ts)$/,
        /_bench\.(js|ts)$/,
        /\.d\.ts$/,
        /(\/|\\)tests(\/|\\)/,
        /(\/|\\)_/,
        /mod\.(js|ts)$/,
      ],
    })
  ) {
    const relativeSpecifier = relative(modFilePath, filePath).slice(1)
      .replaceAll("\\", "/");

    if (directExports.has(relativeSpecifier)) continue;

    if (!modExportSpecifiers.has(relativeSpecifier)) {
      console.warn(
        `${
          colors.yellow("Warn")
        } ${modFilePath} does not export '${relativeSpecifier}'.`,
      );
      shouldFail = true;
      if (FAIL_FAST) Deno.exit(1);
    }
  }
}

if (shouldFail) Deno.exit(1);

console.log("ok");
