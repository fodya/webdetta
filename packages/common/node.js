import { fileURLToPath } from 'url';
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export const tmpDir = prefix =>
  mkdtemp(path.join(tmpdir(), prefix + '-'));

export const __dirname = (importMetaUrl) =>
  path.dirname(fileURLToPath(importMetaUrl));
