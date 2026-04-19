/**
 * Runtime CSS engine: builds style nodes via chainable method stacks and
 * flushes them through pluggable adapters that own a `<style>` sheet.
 *
 * @example
 * ```js
 * import { Adapter } from '@webdetta/core/realcss';
 *
 * const factory = Adapter((sheet, nodes) => {
 *   for (const node of nodes) sheet.insertNode(node);
 * });
 * ```
 *
 * @module
 */

/** A method that, given user arguments, returns a partial style object. */
export type MethodFn = (...args: any[]) => Record<string, unknown>;
/** Map of named style methods. */
export type MethodsMap = Record<string, MethodFn>;

/** A single style node: a selector, its merged style object, and update callbacks. */
export interface StyleNodeInstance {
  selector: string;
  query: string;
  important: boolean;
  inline: boolean;
  classname: string | null;
  css: string | null;
  additionalCss: string | null;
  style: Record<string, unknown>;
  cls: string | null;
  prevCls?: string | null;
  updates: Array<(this: StyleNodeInstance) => void>;
  /** Returns a forked node sharing the same identity but with additional updates. */
  fork(...updates: Array<(this: StyleNodeInstance) => void>): StyleNodeInstance;
  /** Recomputes `css`/`classname` from the current `style` and `updates`. */
  calculate(): void;
}

/** Owns a `<style>` element and a map of processed style nodes. */
export interface StyleSheet {
  /** The `<style>` element managed by this sheet. */
  readonly style: HTMLStyleElement;
  /** Nodes already inserted, keyed by selector. */
  processedNodes: Map<string, StyleNodeInstance>;
  /** Inserts a new node into the sheet. */
  insertNode(node: StyleNodeInstance): void;
  /** Recalculates all processed nodes and updates the sheet text. */
  recalculate(): void;
}

/** Returns a plain-object snapshot of an arbitrary stack value for debugging. */
export function inspect(obj: unknown): unknown;

/** Chainable callable that records method accesses and their arguments. */
export interface Stack<_M extends MethodsMap = MethodsMap> {
  (...args: unknown[]): Stack<_M>;
  readonly [key: string]: Stack<_M>;
}

/** Adapter wrapper: given a sheet and fresh nodes, performs side effects. */
export type AdapterWrapper = (
  styleSheet: StyleSheet,
  nodes: StyleNodeInstance[]
) => unknown;

/** Result of calling an adapter factory: a root {@link Stack} and a recalculate hook. */
export type AdapterResult<M extends MethodsMap> = {
  v: Stack<M>;
  recalculate(): void;
};

/** Factory that builds an adapter instance bound to a set of named methods. */
export type AdapterFactory = <M extends MethodsMap>(opts: {
  methods: M;
}) => AdapterResult<M>;

/** Wraps a sheet-side-effect function into a reusable {@link AdapterFactory}. */
export function Adapter(wrapper: AdapterWrapper): AdapterFactory;
