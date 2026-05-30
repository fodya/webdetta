import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(toolsDir, "..");

/** Workspace packages: `./<pkg>/deno.json` with `"name": "@webdetta/<pkg>"`. */
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

export function getPackagesDenoJsons() {
  return listPackages();
}

export async function getEntrypoints() {
  return (await getPackagesDenoJsons()).flatMap(({ name, denoJson }) =>
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
