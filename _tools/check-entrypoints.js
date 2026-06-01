// deno-lint-ignore-file no-console

import { walk } from "jsr:@std/fs/walk";
import { dirname, fromFileUrl, join, relative } from "@std/path";
import * as colors from "jsr:@std/fmt/colors";
import ts from "typescript";
import { getEntrypoints, listPackages } from "./utils.js";

const FAIL_FAST = Deno.args.includes("--fail-fast");

let shouldFail = false;

const collectJsSpecifiers = (sourceFile) => {
  const imports = new Set();
  const exports = new Set();
  const normalize = (s) => s.replace(/^\.\//, "");
  sourceFile.forEachChild((node) => {
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      exports.add(normalize(node.moduleSpecifier.text));
    }
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      normalize(node.moduleSpecifier.text).endsWith(".js")
    ) {
      imports.add(normalize(node.moduleSpecifier.text));
    }
  });
  return { imports, exports };
};

const INDEX_FILE_PATHS = (await getEntrypoints())
  .filter((entrypoint) => entrypoint.split("/").length === 2)
  .map((entrypoint) => fromFileUrl(import.meta.resolve(entrypoint)));

const packagesByIndex = new Map();
for (const pkg of await listPackages()) {
  const indexExport = pkg.denoJson.exports?.["."];
  if (!indexExport) continue;
  const indexPath = fromFileUrl(
    new URL(indexExport, new URL(`../${pkg.pkg}/`, import.meta.url)),
  );
  packagesByIndex.set(indexPath, pkg);
}

for (const indexFilePath of INDEX_FILE_PATHS) {
  const pkg = packagesByIndex.get(indexFilePath);
  const directExports = new Set(
    Object.values(pkg?.denoJson.exports ?? {})
      .map((entry) => String(entry).replace(/^\.\//, "")),
  );

  const indexSource = await Deno.readTextFile(indexFilePath);

  const indexSourceFile = ts.createSourceFile(
    indexFilePath,
    indexSource,
    ts.ScriptTarget.Latest,
    true,
  );
  const { imports: indexImportSpecifiers, exports: indexExportSpecifiers } =
    collectJsSpecifiers(indexSourceFile);
  const reachableSpecifiers = new Set(indexImportSpecifiers);
  const followSpecifiers = new Set([
    ...indexImportSpecifiers,
    ...indexExportSpecifiers,
  ]);
  for (const entrySpecifier of followSpecifiers) {
    const entryPath = join(dirname(indexFilePath), entrySpecifier);
    try {
      const entrySource = await Deno.readTextFile(entryPath);
      const entryFile = ts.createSourceFile(
        entryPath,
        entrySource,
        ts.ScriptTarget.Latest,
        true,
      );
      for (const specifier of collectJsSpecifiers(entryFile).imports) {
        reachableSpecifiers.add(specifier);
      }
    } catch {
      // ignore missing entry targets
    }
  }

  for await (
    const { path: filePath } of walk(dirname(indexFilePath), {
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
        /index\.(js|ts)$/,
      ],
    })
  ) {
    const relativeSpecifier = relative(dirname(indexFilePath), filePath)
      .replaceAll("\\", "/");

    if (directExports.has(relativeSpecifier)) continue;
    if (indexExportSpecifiers.has(relativeSpecifier)) continue;
    if (reachableSpecifiers.has(relativeSpecifier)) continue;
    console.warn(
      `${
        colors.yellow("Warn")
      } ${indexFilePath} does not export '${relativeSpecifier}'.`,
    );
    shouldFail = true;
    if (FAIL_FAST) Deno.exit(1);
  }
}

if (shouldFail) Deno.exit(1);

console.log("ok");
