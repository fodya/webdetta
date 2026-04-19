#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ "$#" -eq 0 ]; then
  set -- packages
else
  for module in "$@"; do
    if [ ! -d "packages/$module" ]; then
      echo "Unknown module: $module" >&2
      exit 1
    fi
  done

  set -- "${@/#/packages/}"
fi

deno test \
  --parallel --no-check \
  --reporter=pretty "$@" \
  | deno run tools/test-reporter.js
