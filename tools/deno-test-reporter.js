import { XMLParser } from "fast-xml-parser";

const green = s => `\x1b[32m${s}\x1b[0m`;
const red = s => `\x1b[31m${s}\x1b[0m`;
const brightCyan = s => `\x1b[96m${s}\x1b[0m`;
const cyan = s => `\x1b[36m${s}\x1b[0m`;
const white = s => `\x1b[37m${s}\x1b[0m`;

const asArray = v => [v].flat();
const makeNode = () => ({ children: new Map(), test: null });

const xml = await new Response(process.stdin).text();
const { testsuites } = new XMLParser({ ignoreAttributes: false }).parse(xml);
const suites = asArray(testsuites.testsuite);

let passed = 0;
let failed = 0;
const failures = [];

const root = makeNode();
for (const { test: t } of suites.flatMap(s => asArray(s.testcase).map(test => ({ test })))) {
  let node = root;
  for (const part of t["@_name"].split(" > ")) {
    node = (node.children.get(part) ?? (node.children.set(part, makeNode()), node.children.get(part)));
  }
  node.test = t;
}

const groupFile = Object.fromEntries(
  suites
    .filter(s => s["@_name"].startsWith("./"))
    .flatMap(s => asArray(s.testcase).map(t => [t["@_name"].split(" > ")[0], s["@_name"]]))
);

const parsePath = file => {
  const m = file.match(/^\.\/packages\/([^/]+)\/(.+)$/);
  return m ? { pkg: `webdetta/${m[1]}`, rel: m[2] } : { pkg: file, rel: file };
};

const byFile = Object.groupBy(
  [...root.children].filter(([name]) => name in groupFile),
  ([name]) => groupFile[name]
);

const byPkg = Object.groupBy(
  Object.entries(byFile),
  ([file]) => parsePath(file).pkg
);

const print = (node, name, depth, path) => {
  const pad = "  ".repeat(depth);
  if (node.children.size > 0) {
    console.log(`${pad}${name}`);
    for (const [k, v] of node.children) print(v, k, depth + 1, [...path, name]);
  } else if (node.test) {
    const ms = Math.round(parseFloat(node.test["@_time"] || 0) * 1000);
    if (node.test.failure) {
      failed++;
      console.log(`${pad}${red(`[ERR:${ms}ms]`)} ${name}`);
      failures.push({ path: [...path, name], test: node.test });
    } else {
      passed++;
      console.log(`${pad}${green(`[OK:${ms}ms]`)} ${name}`);
    }
  }
};

for (const [pkg, files] of Object.entries(byPkg)) {
  console.log(brightCyan(pkg));
  for (const [file, entries] of files) {
    const { rel } = parsePath(file);
    console.log(`  ${cyan(rel)}`);
    for (const [name, node] of entries) print(node, name, 2, [pkg, rel]);
  }
}

if (failures.length > 0) {
  console.log();
  console.log("---");
  for (const { path, test } of failures) {
    const label = path.map((p, i) =>
      i === 0 ? brightCyan(p) : i === 1 ? cyan(p) : p
    ).join(" . ");
    console.log(label);
    const raw = typeof test.failure === "string" ? test.failure : test.failure?.["#text"] ?? "";
    const [message, ...stack] = raw.split("\n");
    if (message) console.log(red(message));
    if (stack.length) console.log(white(stack.join("\n")));
    console.log("---");
  }
}

const ms = Math.round(parseFloat(testsuites["@_time"] || 0) * 1000);

console.log();
if (failed > 0) {
  console.log(`${red(`[ERR:${ms}ms]`)} ${passed} passed | ${red(`${failed} failed`)}`);
  process.exit(1);
} else {
  console.log(`${green(`[OK:${ms}ms]`)} ${passed} passed`);
}
