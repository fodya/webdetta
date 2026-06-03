# Architecture Guide

## File Structure

### `_tools`

Internal CI and development checks (lint, circular deps).

### `<package>`

Each top-level folder is a JSR package (`@webdetta/<package>`).

### `<package>/deno.json`

Package name, version, exports.

### `<package>/index.js`

Module default entrypoint.

## Layout

```
webdetta-new/
├── deno.json
├── _tools/
├── <package>/
│   ├── deno.json
│   │   <file>.js
│   └── index.js
└── .github/
```

Tests (when added): `<package>/tests/*.test.js`.

## Cursor Cloud specific instructions

This repo is a **Deno/JSR library monorepo** — there is no long-running app or `deno task dev`. Validation matches CI: lint, format, typecheck/build, and unit tests.

### Runtime

- **Deno 2.x** must be on `PATH` (CI uses `denoland/setup-deno@v2` with no pinned version). If missing: `curl -fsSL https://deno.land/install.sh | sh` (installs to `~/.deno/bin`).
- First runs need network access to `deno.land`, `jsr.io`, and `registry.npmjs.org` (import map uses JSR + npm packages).

### Commands (from root `/workspace`)

| Goal | Command |
|------|---------|
| Full CI gate (PR) | `deno task ok` |
| Lint | `deno task lint` |
| Format check | `deno fmt --check` |
| Build dist + typecheck | `deno task check` |
| All tests | `deno test -A --parallel` |
| Single package tests | `deno test -A ./reactivity` |
| Build publishable `dist/` | `deno task build-dist` |
| Try examples | `deno run -A <package>/examples/*.example.js` |

Optional: `deno task typos` (requires `typos` on PATH; not part of `ok`).

### Services

No database, Docker, or dev server is required. “End-to-end” in this repo means passing `deno task ok` and `deno test -A --parallel`.
