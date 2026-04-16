const ansi = (code, text) => `\x1b[${code}m${text}\x1b[0m`;
const brightCyan = text => ansi(96, text);
const cyan = text => ansi(36, text);
const green = text => ansi(32, text);
const red = text => ansi(31, text);
const white = text => ansi(37, text);

const ansiRe = new RegExp(`${String.fromCharCode(0x1b)}\\[[\\d;]*m`, 'g');
const text = (await new Response(process.stdin).text()).replace(ansiRe, '');
if (!text.trim()) {
  console.error("test-reporter: empty stdin (deno test produced no output)");
  process.exit(1);
}

const lines = { nodes: [], errors: [], failures: [] }
let mode = 'nodes';
for (const line of text.split('\n').map(d => d.trim())) {
  if (!line) continue;
  if (line == 'FAILURES') mode = 'failures';
  if (line == 'ERRORS') mode = 'errors';
  lines[mode].push(line);
}

let passed = 0, failed = 0;
const footer = text.split('\n').map(d => d.trim()).reverse()
  .find(d => /\d+ passed/.test(d) && /\d+ failed/.test(d)) ?? '';
const ms = [...footer.matchAll(/(\d+)/g)].map(m => +m[1]).at(-1);

const nodeResult = text => {
  text = text.replace(/[()]/g, '');
  const [word, time] = text.split(' ');
  const unit = time.replaceAll(/\d/g, '');
  const ms = Number(time.replace(unit, '')) * ({ ms: 1, s: 1000 })[unit];
  if (!Number.isFinite(ms)) return '';
  const success = word.toLowerCase() == 'ok';
  if (success) passed++; else failed++;
  return success ? green(`[OK:${ms}ms]`) : red(`[ERR:${ms}ms]`);
}
const nodes = lines.nodes.map((line, i) => {
  const [filepath, rest] = line.split(/\s*=>\s*/, 2);
  if (!rest) return null;
  const [pkg, file] = filepath.replace('./packages/', '').split('/tests/');
  const parts = rest.split(/\s*\.\.\.\s*/);

  if (i > 0) {
    const curr = line.split('...').length;
    const prev = lines.nodes[i - 1].split(' ... ').length;
    if (curr < prev) return null;
  }

  return { pkg, file, parts };
}).filter(Boolean).filter((node, _, all) => {
  const { pkg, file, parts } = node;
  if (parts.length !== 2) return true;
  const suiteName = parts[0];
  const hasChildren = all.some(other =>
    other !== node &&
    other.pkg === pkg &&
    other.file === file &&
    other.parts.length > 2 &&
    other.parts[0] === suiteName
  );
  return !hasChildren;
}).map(({ pkg, file, parts }) => {
  return [
    brightCyan('webdetta/' + pkg),
    cyan(file),
    ...parts.slice(0, -2),
    [nodeResult(parts.at(-1)), parts.at(-2)].filter(Boolean).join(' ')
  ];
});

const group = (arr) => {
  const res = {};
  for (const parts of arr) {
    let root = res;
    for (const part of parts) {
      root = root[part] ??= {};
    }
  }
  return res;
}
const printTree = (tree, depth) => {
  const indent = ''.padStart(depth * 2, ' ');
  for (const [key, val] of Object.entries(tree)) {
    console.log(indent + key);
    printTree(val, depth + 1);
  }
}

const nodesTree = group(nodes);
printTree(nodesTree, 0);

const errorMap = rows => {
  const map = new Map();
  const regex = /^(.+?)\s*=>\s+/;
  for (let i = 0; i < rows.length;) {
    const row = rows[i];
    if (!regex.test(row)) { i++; continue; }
    
    const body = [];
    for (i++; i < rows.length && !regex.test(rows[i]); i++) body.push(rows[i]);
    if (!body.length) continue;
    
    const [message = "", ...stackLines] = body;
    map.set(row, { message, stack: stackLines.join("\n").trim() });
  }
  return map;
};
const errors = errorMap(lines.errors);

console.log();
if (errors.size == 0) {
  console.log(`${green(`[OK:${ms}ms]`)} ${passed} passed`);
  process.exit(0);
}

console.log("---");
for (const [row, err] of errors.entries()) {
  const testPath = row.split(/\s*=>\s*/, 2)[0];
  const parts = testPath.split(/\s*\.\.\.\s*/).map(d => d.trim()).filter(Boolean);
  const [_, pkg, file] = (
    (err.stack ?? '').match(/file:\/\/.*?\/packages\/([^/]+)\/tests\/([^:]+)/) ||
    (err.stack ?? '').match(/file:\/\/.*?\/packages\/([^/]+)\/([^:]+)/)
  );
  console.log([brightCyan(pkg), cyan(file), ...parts].join(' > '));
  if (err?.message) console.log(red(err.message));
  if (err?.stack) console.log(white(err.stack));
  console.log("---");
}
console.log(`${red(`[ERR:${ms}ms]`)} ${passed} passed | ${red(`${failed} failed`)}`);
process.exit(1);
