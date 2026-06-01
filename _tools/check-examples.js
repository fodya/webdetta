// deno-lint-ignore-file no-console

import path from "node:path";
import * as colors from "jsr:@std/fmt/colors";
import { Table } from "jsr:@cliffy/table";
import {
  listExportedSymbols,
  listPackageExamples,
  listPackages,
  rootDir,
} from "./utils.js";

const exampleRowKey = (pkg, sourceFile, type, symbol) =>
  `${pkg}\0${sourceFile}\0${type === "module" ? "@module" : symbol}`;

const runCache = new Map();

const runExample = async (pkg, exampleFile) => {
  const key = `${pkg}:${exampleFile ?? ""}`;
  if (runCache.has(key)) return runCache.get(key);

  if (!exampleFile) {
    runCache.set(key, false);
    return false;
  }

  const filePath = path.join(rootDir, pkg, exampleFile);
  try {
    await Deno.stat(filePath);
  } catch {
    runCache.set(key, false);
    return false;
  }

  const status = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", filePath],
    cwd: rootDir,
    stdout: "null",
    stderr: "null",
  }).spawn().status;

  runCache.set(key, status.success);
  return status.success;
};

const statsByRow = new Map();

for (const { pkg } of await listPackages()) {
  const examples = await listPackageExamples(pkg);

  for (const example of examples) {
    const key = exampleRowKey(
      pkg,
      example.sourceFile,
      example.type,
      example.symbol,
    );
    const stats = statsByRow.get(key) ?? { total: 0, success: 0, fail: 0 };
    stats.total++;
    if (await runExample(pkg, example.exampleFile)) stats.success++;
    else stats.fail++;
    statsByRow.set(key, stats);
  }
}

const rows = [];

for (const { pkg } of await listPackages()) {
  for (const entry of await listExportedSymbols(pkg)) {
    const key = exampleRowKey(pkg, entry.exportFile, entry.kind, entry.name);
    const stats = statsByRow.get(key) ?? { total: 0, success: 0, fail: 0 };
    rows.push({
      module: pkg,
      item: `${entry.base} / ${entry.name}`,
      ...stats,
    });
  }
}

rows.sort((a, b) =>
  a.module.localeCompare(b.module) ||
  a.item.localeCompare(b.item)
);

const formatTotal = (count) =>
  count > 0 ? colors.blue(String(count)) : colors.red("missing");

const formatSuccess = (count, total) =>
  total > 0
    ? (count > 0 ? colors.blue(String(count)) : String(count))
    : String(0);

const formatFail = (count, total) =>
  total > 0
    ? (count > 0 ? colors.red(String(count)) : String(count))
    : String(0);

const table = new Table()
  .header(["Package", "Item", "Total", "Success", "Fail"].map(colors.bold))
  .body(rows.map((row) => [
    row.module,
    row.item,
    formatTotal(row.total),
    formatSuccess(row.success, row.total),
    formatFail(row.fail, row.total),
  ]))
  .border(true)
  .toString();

let separators = 0;
console.log(
  table
    .split("\n")
    .filter((line) => !/^├.*┤$/.test(line) || separators++ === 0)
    .join("\n"),
);

const missing = rows.filter((row) => row.total === 0);
const failed = rows.filter((row) => row.fail > 0);

if (missing.length) {
  const packages = [...new Set(missing.map((row) => row.module))].sort().join(
    ", ",
  );
  console.error(
    `\nMissing ${missing.length} examples in packages: ${packages}`,
  );
}

if (failed.length) {
  console.error(
    `\nFailed ${failed.reduce((sum, row) => sum + row.fail, 0)} examples`,
  );
}

if (missing.length || failed.length) Deno.exit(1);

console.log("ok");
