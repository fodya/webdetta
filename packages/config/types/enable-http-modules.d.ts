export type ResolveContext = {
  conditions: readonly string[];
  importAttributes?: Record<string, string>;
  parentURL?: string;
};

export type ResolveResult = {
  url: string;
  format?: string | null;
  shortCircuit?: boolean;
  importAttributes?: Record<string, string>;
};

export type LoadContext = {
  conditions: readonly string[];
  format?: string | null;
  importAttributes?: Record<string, string>;
};

export type LoadResult = {
  format: string;
  source: string | ArrayBuffer | Uint8Array;
  shortCircuit?: boolean;
};

export function resolve(
  specifier: string,
  context: ResolveContext,
  defaultResolve: (specifier: string, context: ResolveContext, next?: unknown) => ResolveResult | Promise<ResolveResult>
): Promise<ResolveResult>;

export function load(
  url: string,
  context: LoadContext,
  defaultLoad: (url: string, context: LoadContext, next?: unknown) => LoadResult | Promise<LoadResult>
): LoadResult | Promise<LoadResult>;
