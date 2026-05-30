# Architecture Guide

## File Structure

### `_tools`

Internal CI and development checks (lint, circular deps).

### `<package>`

Each top-level folder is a JSR package (`@webdetta/<package>`).

### `<package>/deno.json`

Package name, version, exports.

### `<package>/mod.js`

Default entry (`.` export). Subpath exports live in separate files (e.g.
`sync.js`, `async.js`).

## Layout

```
webdetta-new/
├── deno.json
├── _tools/
├── <package>/
│   ├── deno.json
│   └── mod.js
└── .github/
```

Tests (when added): `<package>/tests/*.test.js`.
