import path from "node:path";
import { copy } from "@std/fs";
import { listPackages, rootDir } from "./utils.js";

const root = new URL("..", import.meta.url);
const workspaceDistDir = path.join(rootDir, "dist");

const SKIP_NAMES = new Set(["dist", "tests", "examples"]);
const COPY_AFTER_BUILD = "deno.json";

const build = async (pkg) => {
  const pkgDir = path.join(rootDir, pkg);
  const distDir = path.join(workspaceDistDir, pkg);

  await Deno.mkdir(distDir, { recursive: true });

  for await (const entry of Deno.readDir(pkgDir)) {
    if (SKIP_NAMES.has(entry.name) || entry.name === COPY_AFTER_BUILD) continue;
    const src = path.join(pkgDir, entry.name);
    const dest = path.join(distDir, entry.name);
    if (entry.isDirectory) await copy(src, dest, { overwrite: true });
    else if (entry.isFile) await Deno.copyFile(src, dest);
  }

  const configPath = await Deno.makeTempFile({
    prefix: "tsconfig-",
    suffix: ".json",
  });
  try {
    await Deno.writeTextFile(
      configPath,
      JSON.stringify(
        {
          extends: path.join(rootDir, "tsconfig.types.json"),
          include: [path.join(distDir, "*.js")],
          exclude: [path.join(distDir, "_*.js")],
          compilerOptions: { rootDir: distDir, paths: {} },
        },
        null,
        2,
      ),
    );

    const status = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--no-config",
        "-A",
        "npm:typescript@5.8.3/bin/tsc",
        "-p",
        configPath,
      ],
      cwd: new URL(`${pkg}/`, root),
      stdout: "inherit",
      stderr: "inherit",
    }).spawn().status;

    if (status.code) {
      throw new Error(`tsc failed for ${pkg} (exit ${status.code})`);
    }
  } finally {
    await Deno.remove(configPath);
  }

  const denoJson = path.join(pkgDir, COPY_AFTER_BUILD);
  try {
    await Deno.stat(denoJson);
    await Deno.copyFile(denoJson, path.join(distDir, COPY_AFTER_BUILD));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
};

await Deno.remove(workspaceDistDir, { recursive: true }).catch(() => {});
await Deno.mkdir(workspaceDistDir, { recursive: true });

const packages = await listPackages();
await Promise.all(packages.map(({ pkg }) => build(pkg)));

await Deno.copyFile(
  path.join(rootDir, COPY_AFTER_BUILD),
  path.join(workspaceDistDir, COPY_AFTER_BUILD),
);
