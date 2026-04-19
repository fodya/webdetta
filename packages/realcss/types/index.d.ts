/**
 * Runtime CSS engine with a persistent cell DSL that materializes style rules
 * lazily and flushes them into a `<style>` sheet via realdom on mount.
 *
 * Grammar (v2 — breaking: `v` is not callable; use `v.Plain(...)`):
 * ```
 * v                                            // root
 * v.<method>                                   // start MethodChain
 * MethodChain.<method>                         // getter: O(1) fork
 * MethodChain(...args)                         // flush pending → O(k) new chain
 * v.Select(selector, ...Cell[])                // mod operator
 * v.Query(query, ...Cell[])                    // mod operator
 * v.Important(...Cell[])                       // mod operator
 * v.Inline(...Cell[])                          // mod operator
 * v.Plain(style | () => style)                 // object cell
 * v.Transition(param, ...Cell[])               // synth
 * v.Animation(param, keyframes)                // synth
 * ```
 *
 * Persistent cons-lists back every chain: previous chains are NEVER mutated,
 * getter fork allocates one cons (O(1)), and call drains pending into steps
 * (O(k) where `k` = pending length). Materialization is O(n) in the total
 * leaf-step count and cached via `WeakMap<step, WeakMap<ctx, StyleRule>>`.
 *
 * @example
 * ```js
 * import { Visuals } from '@webdetta/core/realcss';
 * import { el } from '@webdetta/core/realdom';
 *
 * const v = Visuals({ unit: [1, 'rem'] });
 *
 * el.Div(v.tc('red').p(1));                            // chain
 * el.Div(v.Select('&:hover', v.Important(v.tc('red'))));
 * el.Div(v.Plain({ color: 'red' }));              // raw object
 * el.Div(v.Plain(() => ({ color: signal() })));   // reactive
 * ```
 *
 * @module
 */
import type { MethodsConfig, MethodsMap } from './methods.d.ts';

export { Methods } from './methods.d.ts';
export type {
  MethodsConfig,
  MethodsMap,
  MethodFn,
  MethodsResolver,
  MethodsResolvers,
  MethodConfigEntry,
} from './methods.d.ts';

/** Persistent singly-linked list, head = most-recently-prepended item. */
export interface Cons<T> {
  readonly head: T;
  readonly tail: Cons<T> | null;
}

/** Single method invocation captured in a chain. */
export interface MethodStep {
  readonly kind: 'method';
  readonly name: string;
  readonly method: (...args: unknown[]) => Record<string, unknown>;
  readonly args: unknown[];
}

/** Materialized ctx propagated down the cell tree. */
export interface Ctx {
  readonly selector: string;
  readonly query: string;
  readonly important: boolean;
  readonly inline: boolean;
}

/** Materialized CSS rule with identity-stable cache slot. */
export interface StyleRule {
  readonly step: unknown;
  readonly ctx: Ctx;
  classname: string;
  style: Record<string, unknown> | null;
  cls: string;
  css: string | null;
  additionalCss: string | null;
  inline: boolean;
  rebuild(): void;
}

/** `<style>`-backed sheet that owns materialized rules. */
export interface StyleSheet {
  readonly style: HTMLStyleElement;
  processedNodes: Map<string, StyleRule>;
  insertNode(rule: StyleRule): void;
  /** Clears `<style>`, rebuilds every cached rule in place, re-inserts. */
  recalculate(): void;
}

/** Service handle exposed as `v._` on the root. */
export interface VisualsService {
  recalculate(): void;
  readonly styleSheet: StyleSheet;
  readonly mount: (cell: Cell) => unknown;
}

/** Object cell produced by `v.Plain(...)`. */
export interface ObjectCell {
  readonly kind: 'object';
  readonly obj: Record<string, unknown> | (() => Record<string, unknown>);
  readonly [key: symbol]: unknown;
}

/** Mod cell produced by `v.Select / v.Query / v.Important / v.Inline`. */
export interface ModCell {
  readonly kind: 'mod';
  readonly mod: {
    readonly selector?: string | ((parent: string) => string);
    readonly query?: string;
    readonly important?: boolean;
    readonly inline?: boolean;
  };
  readonly children: readonly Cell[];
  readonly [key: symbol]: unknown;
}

/** Emitted materialization task (reactivity decided lazily via `isStepReactive`). */
export interface RuleTask {
  readonly step: unknown;
  readonly ctx: Ctx;
}

/** Synth cell produced by `v.Transition / v.Animation`. */
export interface SynthCell {
  readonly kind: 'synth';
  readonly emitFn: (ctx: Ctx, out: RuleTask[]) => void;
  readonly [key: symbol]: unknown;
}

/** Any cell that can be emitted into the rule stream and mounted. */
export type Cell = MethodChain | ObjectCell | ModCell | SynthCell;

/**
 * Persistent method chain. Getters fork with `cons(name, pending)`; call
 * drains pending into a new chain. Previous chains are never mutated.
 */
export interface MethodChain<M extends MethodsMap = MethodsMap> {
  (...args: unknown[]): MethodChainWithMethods<M>;
  readonly kind: 'chain';
  readonly steps: Cons<MethodStep> | null;
  readonly pending: Cons<string> | null;
  readonly [key: symbol]: unknown;
}
export type MethodChainWithMethods<M extends MethodsMap> =
  MethodChain<M> & { readonly [K in keyof M]: MethodChainWithMethods<M> };

/** Root `v`. NOT callable; only getters for methods and operator props. */
export interface Root<M extends MethodsMap = MethodsMap> {
  readonly _: VisualsService;

  Plain(style: Record<string, unknown> | (() => Record<string, unknown>)): ObjectCell;

  Select(selector: string | ((parent: string) => string), ...children: Cell[]): ModCell;
  Query(query: string, ...children: Cell[]): ModCell;
  Important(...children: Cell[]): ModCell;
  Inline(...children: Cell[]): ModCell;

  Transition(param: string | (() => string), ...children: Cell[]): SynthCell;
  Animation(
    param: string | (() => string),
    keyframes: Record<string, Cell | Cell[]>,
  ): SynthCell;
}
export type RootWithMethods<M extends MethodsMap> =
  Root<M> & { readonly [K in keyof M]: MethodChainWithMethods<M> };

/**
 * Creates a realcss root: appends a `<style>` to `document.head`, sets up the
 * sheet, and returns the root `v`. Mount any cell via realdom; call
 * `v._.recalculate()` to rebuild all cached rules after config changes.
 */
export function Visuals<M extends MethodsMap = MethodsMap>(
  cfg: MethodsConfig,
): RootWithMethods<M>;
