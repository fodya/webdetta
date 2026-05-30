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
