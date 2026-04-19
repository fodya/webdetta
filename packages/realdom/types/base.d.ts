/**
 * Low-level realdom building blocks: stringification, operator factories and
 * the `Element` primitive used by the `el` namespace to construct DOM trees.
 *
 * @module
 */
import type { BuilderFn } from '../../builder/types/index.d.ts';

/** Any value that can be converted to a DOM text node. */
export type Stringifiable =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => Stringifiable);

/** Stringifies a list of {@link Stringifiable} values (recursively calling functions). */
export function toString(...args: unknown[]): string;

/** An operator is a builder function that, when applied to a node, performs side effects. */
export type Operator = BuilderFn;

/** Function invoked when an operator is applied to a node; may return a cleanup. */
export type OperatorFunc = (
  node: Node,
  names: string[],
  args: unknown[]
) => void | (() => void);

/** Lifecycle hook names registerable via {@link ElementFn.registerHook}. */
export type HookName = 'beforeAppend' | 'afterAppend' | 'beforeRemove' | 'afterRemove';

/** Any value accepted as a child/operator/attribute item in element builders. */
export type ElementItem =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | Operator
  | (() => Stringifiable)
  | ElementItem[];

/** Walks an element-item tree, dispatching operators and nodes to the provided callbacks. */
export function processItem(
  item: ElementItem,
  processOperator: (op: Operator) => void,
  processNode: (node: Node) => void,
  flattenFragments?: boolean
): void;

/** Core DOM-construction callable: create elements, append items, manage hooks. */
export interface ElementFn {
  /** Creates an element in `ns` (or null namespace) with the given tag name. */
  (ns: string | null, tag: string, ...args: ElementItem[]): Node;
  /** Coerces a value into a DOM node (text nodes for primitives, etc). */
  from(arg: Node | string | number | (() => Stringifiable)): Node;
  /** Registers a lifecycle hook on a node. */
  registerHook(node: Node, hook: HookName, handler: () => void): void;
  /** Appends children to a node. */
  append<T extends Node>(node: T, item: ElementItem | ElementItem[]): T;
  /** Inserts `sibling` before `node`. */
  appendBefore(node: Node, sibling: ElementItem): void;
  /** Inserts `sibling` after `node`. */
  appendAfter(node: Node, sibling: ElementItem): void;
  /** Removes `node` from its parent, firing remove hooks. */
  remove(node: Node): void;
}

/** The shared {@link ElementFn} instance. */
export const Element: ElementFn;

/** Factory for creating {@link Operator}s from `OperatorFunc` callbacks. */
export interface OperatorFactory {
  /** Creates an operator from a function, with optional reactive tracking. */
  (func: OperatorFunc, options?: { track?: boolean }): Operator;
  /** Returns true if `f` is an operator. */
  isOperator(f: unknown): boolean;
  /** Applies an operator to a node, running its recorded tasks. */
  apply(node: Node, operator: Operator): unknown;
}

/** The shared {@link OperatorFactory} instance. */
export const Operator: OperatorFactory;
