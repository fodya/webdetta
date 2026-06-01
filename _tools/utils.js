import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(toolsDir, "..");

const getJSDoc = (node, sourceFile) => {
  const text = sourceFile.getFullText();
  for (let current = node; current; current = current.parent) {
    for (
      const range of ts.getLeadingCommentRanges(text, current.getFullStart()) ??
        []
    ) {
      const comment = text.slice(range.pos, range.end);
      if (comment.startsWith("/**")) return { comment, pos: range.pos };
    }
    if (ts.isSourceFile(current)) break;
  }
  return null;
};

const findLocalDecl = (sourceFile, name) => {
  let found = null;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name
    ) found = node;
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      found = node;
    }
    if (ts.isClassDeclaration(node) && node.name?.text === name) found = node;
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
};

const collectExportedSymbolNodes = (sourceFile) => {
  const symbols = [];
  const add = (name, node) => symbols.push({ name, node });

  sourceFile.forEachChild((node) => {
    const exported = node.modifiers?.some((m) =>
      m.kind === ts.SyntaxKind.ExportKeyword
    );

    if (exported && ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) add(decl.name.text, decl);
      }
      return;
    }

    if (exported && ts.isFunctionDeclaration(node) && node.name) {
      add(node.name.text, node);
      return;
    }

    if (exported && ts.isClassDeclaration(node) && node.name) {
      add(node.name.text, node);
      return;
    }

    if (ts.isExportDeclaration(node) && node.exportClause) {
      if (ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          const name = (el.name ?? el.propertyName).text;
          const local = findLocalDecl(sourceFile, name);
          add(name, local ?? el);
        }
      }
    }
  });

  return symbols;
};

const parseExampleTags = (jsdoc, sourceFile, commentPos) => {
  const examples = [];
  const regex = /@example\s+(\S+)/g;
  let match;
  while ((match = regex.exec(jsdoc)) !== null) {
    const tag = match[1];
    const pos = commentPos + match.index;
    const { line } = sourceFile.getLineAndCharacterOfPosition(pos);
    examples.push({
      sourceLineNumber: line + 1,
      exampleFile: tag.startsWith("./") ? tag.slice(2) : null,
    });
  }
  return examples;
};

const moduleExampleBlocks = (sourceFile) => {
  const text = sourceFile.getFullText();
  const blocks = [];
  const regex = /\/\*\*[\s\S]*?\*\//g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const comment = match[0];
    if (!/@module\b/.test(comment)) continue;
    blocks.push({ comment, pos: match.index });
  }
  return blocks;
};

const readExportSourceFiles = async (pkg, denoJson) => {
  const files = [];
  for (const exportFile of Object.values(denoJson.exports ?? {})) {
    const rel = String(exportFile).replace(/^\.\//, "");
    const filePath = path.join(rootDir, pkg, rel);
    const source = await Deno.readTextFile(filePath);
    files.push({
      rel,
      sourceFile: ts.createSourceFile(
        filePath,
        source,
        ts.ScriptTarget.Latest,
        true,
      ),
    });
  }
  return files;
};

const getPackageDenoJson = async (pkg) => {
  const [entry] = await listPackages([pkg]);
  return entry.denoJson;
};

export async function listExportedSymbols(pkg) {
  const denoJson = await getPackageDenoJson(pkg);
  const entries = [];

  for (
    const { rel, sourceFile } of await readExportSourceFiles(pkg, denoJson)
  ) {
    const base = path.basename(rel);
    entries.push({
      pkg,
      exportFile: rel,
      base,
      kind: "module",
      name: "@module",
    });

    for (const { name } of collectExportedSymbolNodes(sourceFile)) {
      entries.push({ pkg, exportFile: rel, base, kind: "symbol", name });
    }
  }

  return entries;
}

export async function listPackageExamples(pkg) {
  const denoJson = await getPackageDenoJson(pkg);
  const examples = [];

  for (
    const { rel, sourceFile } of await readExportSourceFiles(pkg, denoJson)
  ) {
    for (const { comment, pos } of moduleExampleBlocks(sourceFile)) {
      for (const example of parseExampleTags(comment, sourceFile, pos)) {
        examples.push({ type: "module", sourceFile: rel, ...example });
      }
    }

    for (const { name, node } of collectExportedSymbolNodes(sourceFile)) {
      const jsdoc = getJSDoc(node, sourceFile);
      if (!jsdoc) continue;
      for (
        const example of parseExampleTags(jsdoc.comment, sourceFile, jsdoc.pos)
      ) {
        examples.push({
          type: "symbol",
          sourceFile: rel,
          symbol: name,
          ...example,
        });
      }
    }
  }

  return examples;
}

export async function listPackages(filter = []) {
  const rootDeno = JSON.parse(
    await Deno.readTextFile(path.join(rootDir, "deno.json")),
  );
  const workspace = (rootDeno.workspace ?? []).map((entry) =>
    entry.replace(/^\.\//, "").replace(/\/$/, "")
  );

  const packages = [];
  for (const pkg of workspace) {
    const denoJsonPath = path.join(rootDir, pkg, "deno.json");
    let denoJson;
    try {
      denoJson = JSON.parse(await Deno.readTextFile(denoJsonPath));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`workspace entry ./${pkg} missing deno.json`);
      }
      throw error;
    }

    const expected = `@webdetta/${pkg}`;
    if (denoJson.name !== expected) {
      throw new Error(
        `${denoJsonPath}: expected "name": ${JSON.stringify(expected)}, got ${
          JSON.stringify(denoJson.name)
        }`,
      );
    }

    packages.push({
      pkg,
      dir: `./${pkg}`,
      name: denoJson.name,
      denoJsonPath,
      denoJson,
    });
  }

  packages.sort((a, b) => a.pkg.localeCompare(b.pkg));

  if (!filter.length) return packages;

  const unknown = filter.filter((name) =>
    !packages.some((entry) => entry.pkg === name)
  );
  if (unknown.length) {
    throw new Error(`Unknown package: ${unknown.join(", ")}`);
  }
  return packages.filter((entry) => filter.includes(entry.pkg));
}

export async function getEntrypoints() {
  return (await listPackages()).flatMap(({ name, denoJson }) =>
    Object.keys(denoJson.exports ?? {}).map((mod) =>
      mod === "." ? name : name + mod.slice(1)
    )
  );
}

export function resolve(specifier, referrer) {
  return (specifier.startsWith("./") || specifier.startsWith("../"))
    ? new URL(specifier, referrer).href
    : import.meta.resolve(specifier);
}
