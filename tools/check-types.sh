#!/usr/bin/env bash
# Verify every .js listed as a deno.json export has a matching .d.ts and an
# @ts-self-types directive pointing at it.

set -u
fail=0

cd "$(dirname "$0")/.."

mapfile -t entries < <(
  deno eval '
    const p = JSON.parse(await Deno.readTextFile("deno.json"));
    for (const v of Object.values(p.exports ?? {})) console.log(v);
  '
)

for js in "${entries[@]}"; do
  js="${js#./}"
  [ -f "$js" ] || { echo "MISSING entry: $js"; fail=1; continue; }

  pkg_dir="$(dirname "$js")"
  name="$(basename "$js" .js)"
  dts="$pkg_dir/types/$name.d.ts"

  if [ ! -f "$dts" ]; then
    echo "MISSING .d.ts: $dts"
    fail=1
  fi
  if ! grep -q '@ts-self-types' "$js"; then
    echo "MISSING @ts-self-types directive: $js"
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "types check failed"
  exit 1
fi
echo "types check passed"
