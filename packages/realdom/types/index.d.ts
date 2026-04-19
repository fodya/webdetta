/**
 * Lightweight DOM manipulation library. Exposes {@link el} — a proxy that
 * produces DOM elements via any tag name, with operators for attributes,
 * events, classes, styles, hooks, and reactive control flow.
 *
 * @example
 * ```js
 * import { el } from '@webdetta/core/realdom';
 *
 * const button = el.Button(
 *   el.on.click(() => console.log('clicked')),
 *   'Press me',
 * );
 * document.body.append(button);
 * ```
 *
 * @module
 */
import type { Operator, ElementItem } from './base.d.ts';
import type {
  IfNode,
  createList,
  createSlot,
  createDynamic,
} from './dynamic.d.ts';

export { Context } from '../../context/types/sync.d.ts';
export type { Operator, OperatorFunc, ElementItem, Stringifiable, HookName } from './base.d.ts';
export type { IfNode, ListItemsSource, ListKeyFn, ListRenderFn } from './dynamic.d.ts';

/** Function that creates a DOM element for a specific tag name. */
export type TagFn = (...args: ElementItem[]) => Node;

/** Core members of the {@link el} namespace. */
export interface ElNamespaceBase {
  /** Operator that captures a reference to a created node. */
  readonly ref: Operator;
  /** Parses an HTML/XML string into an array of elements. */
  parse(...args: unknown[]): Element[];
  /** Appends children to `node`. */
  append<T extends Node>(node: T, ...args: ElementItem[]): T;
  /** Removes `node` and fires remove hooks. */
  remove(node: Node): void;
  /** Creates an {@link IfNode}: a reactive conditional block. */
  if(cond: unknown | (() => unknown), ...args: ElementItem[]): IfNode;
  /** Creates a reactive keyed list node. */
  readonly list: typeof createList;
  /** Creates a reactive slot node. */
  readonly slot: typeof createSlot;
  /** Creates a reactive dynamic subtree node. */
  readonly dynamic: typeof createDynamic;
  /** Operator for setting attributes. */
  readonly attr: Operator;
  /** Operator for registering lifecycle hooks. */
  readonly hook: Operator;
  /** Operator for binding event listeners. */
  readonly on: Operator;
  /** Operator for toggling classes. */
  readonly class: Operator;
  /** Operator for setting inline styles. */
  readonly style: Operator;
  /** Operator for setting properties directly. */
  readonly prop: Operator;
  /** Sub-namespace bound to the SVG namespace. */
  readonly NS_SVG: ElNamespace;
  /** Sub-namespace bound to the MathML namespace. */
  readonly NS_MATH: ElNamespace;
}

/** The `el` namespace: core members plus arbitrary tag names resolving to tag factories. */
export type ElNamespace = ElNamespaceBase & Record<string, any>;

/** The shared {@link ElNamespace} instance. */
export const el: ElNamespace;
