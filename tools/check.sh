#!/usr/bin/env bash
set -e

cd "$(git rev-parse --show-toplevel)"

bash tools/check-types.sh
npx eslint .
npm test
