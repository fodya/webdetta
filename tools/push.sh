#!/usr/bin/env bash
set -e

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"
cd "$root"

if [ -f "$root/tools/check.sh" ]; then
  bash "$root/tools/check.sh" || exit 1
fi

scripts_bin="$(cd "$root/../webdetta-scripts/bin" && pwd)"
exec bash "$scripts_bin/push-package.sh" "$root" "$@"
