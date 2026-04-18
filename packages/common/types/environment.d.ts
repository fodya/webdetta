export type Runtime = 'browser' | 'node' | 'webworker' | 'jsdom' | 'deno' | 'bun' | undefined;
export const runtime: Runtime;
export const isClientRuntime: boolean;
export const isServerRuntime: boolean;

export type BrowserKind = 'edge' | 'opera' | 'samsung' | 'firefox' | 'chrome' | 'safari' | undefined;
export const browser: BrowserKind;
export const isMobileBrowser: boolean;
