#!/usr/bin/env bash
# Verify every exported .js has a matching .d.ts and stub in types/.
# Packages containing types/TODO* are skipped.

set -u
fail=0

for dir in packages/*/; do
  pkg=$(basename "$dir")
  types="${dir}types"
  if ls "$types"/TODO* >/dev/null 2>&1; then continue; fi
  if [ ! -d "$types" ]; then
    echo "MISSING types dir: $types"
    fail=1
    continue
  fi
  for js in "$dir"*.js; do
    [ -f "$js" ] || continue
    name=$(basename "$js" .js)
    dts="$types/$name.d.ts"
    stub="$types/$name.js"
    if [ ! -f "$dts" ]; then
      echo "MISSING .d.ts: $dts"
      fail=1
    fi
    if [ ! -f "$stub" ]; then
      echo "MISSING stub: $stub"
      fail=1
    elif ! grep -q '@ts-self-types' "$stub"; then
      echo "MISSING @ts-self-types directive: $stub"
      fail=1
    fi
  done
done

if [ "$fail" -ne 0 ]; then
  echo "types check failed"
  exit 1
fi
echo "types check passed"
