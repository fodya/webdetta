/**
 * JavaScript runtime and browser environment detection.
 *
 * Detects the current runtime (browser, node, webworker, jsdom, deno, bun),
 * the browser vendor when applicable, and whether the browser is mobile.
 *
 * @module
 */

/** Detected JavaScript runtime, or `undefined` if unknown. */
export type Runtime = 'browser' | 'node' | 'webworker' | 'jsdom' | 'deno' | 'bun' | undefined;

/** The detected runtime of the current execution environment. */
export const runtime: Runtime;
/** True when running in an environment that has a DOM (browser, webworker, jsdom). */
export const isClientRuntime: boolean;
/** True when running in a server-like runtime (node, deno, bun). */
export const isServerRuntime: boolean;

/** Detected browser vendor, or `undefined` outside of a browser. */
export type BrowserKind = 'edge' | 'opera' | 'samsung' | 'firefox' | 'chrome' | 'safari' | undefined;

/** The detected browser vendor. */
export const browser: BrowserKind;
/** True when the detected browser is running on a mobile device. */
export const isMobileBrowser: boolean;
