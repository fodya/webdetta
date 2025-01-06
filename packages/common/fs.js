import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export const tmpDir = (prefix='tmp') =>
  mkdtemp(path.join(tmpdir(), prefix + '-'));
