#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

bash tools/check-types.sh
deno check packages/
bash tools/test.sh
