import path from "node:path";
import { copy } from "@std/fs";
import { listPackages, rootDir } from "./utils.js";

const root = new URL("..", import.meta.url);
const distDir = path.join(rootDir, "dist");

const SKIP_NAMES = new Set(["dist", "tests", "examples"]);
const COPY_AFTER_BUILD = "deno.json";
const TS_SELF_TYPES = /@ts-self-types/;

const addTsSelfTypes = async (pkgDistDir) => {
  for await (const entry of Deno.readDir(pkgDistDir)) {
    if (!entry.isFile || !entry.name.endsWith(".js")) continue;

    const dtsName = entry.name.replace(/\.js$/, ".d.ts");
    try {
      await Deno.stat(path.join(pkgDistDir, dtsName));
    } catch {
      continue;
    }

    const jsPath = path.join(pkgDistDir, entry.name);
    const content = await Deno.readTextFile(jsPath);
    if (TS_SELF_TYPES.test(content)) continue;

    const directive = `/* @ts-self-types="./${dtsName}" */\n`;
    await Deno.writeTextFile(jsPath, directive + content);
  }
};

const build = async (pkg) => {
  const pkgDir = path.join(rootDir, pkg);
  const pkgDistDir = path.join(distDir, pkg);

  await Deno.mkdir(pkgDistDir, { recursive: true });

  for await (const entry of Deno.readDir(pkgDir)) {
    if (SKIP_NAMES.has(entry.name) || entry.name === COPY_AFTER_BUILD) continue;
    const src = path.join(pkgDir, entry.name);
    const dest = path.join(pkgDistDir, entry.name);
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
          include: [path.join(pkgDistDir, "*.js")],
          exclude: [path.join(pkgDistDir, "_*.js")],
          compilerOptions: { rootDir: pkgDistDir, paths: {} },
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

  await addTsSelfTypes(pkgDistDir);

  const denoJson = path.join(pkgDir, COPY_AFTER_BUILD);
  try {
    await Deno.stat(denoJson);
    await Deno.copyFile(denoJson, path.join(pkgDistDir, COPY_AFTER_BUILD));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
};

await Deno.remove(distDir, { recursive: true }).catch(() => {});
await Deno.mkdir(distDir, { recursive: true });

const packages = await listPackages();
await Promise.all(packages.map(({ pkg }) => build(pkg)));

await Deno.copyFile(
  path.join(rootDir, COPY_AFTER_BUILD),
  path.join(distDir, COPY_AFTER_BUILD),
);
