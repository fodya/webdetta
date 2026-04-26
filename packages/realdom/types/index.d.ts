/**
 * Lightweight DOM manipulation library. Exposes {@link el} — a proxy that
 * produces DOM elements via any tag name, with operators for attributes,
 * events, classes, styles, hooks, and reactive control flow.
 *
 * @example
 * ```js
 * import { el } from '@webdetta/core/realdom';
 * import { r } from '@webdetta/core/reactivity';
 *
 * const items = r.val([{ id: 1, title: 'Buy milk', done: false }]);
 *
 * const toggle = (id) => items(items().map((x) =>
 *   x.id === id ? { ...x, done: !x.done } : x
 * ));
 *
 * const view = el.Section(
 *   el.H2('Tasks'),
 *   el.list(items, (row) =>
 *     el.Label(
 *       el.Input(
 *         el.attr.type('checkbox'),
 *         el.prop.checked(() => row.done),
 *         el.on.change(() => toggle(row.id)),
 *       ),
 *       el.Span(el.class.done(() => row.done), row.title),
 *     )
 *   , (row) => row.id
 *   ),
 * );
 *
 * document.body.append(view);
 * ```
 *
 * @module
 */
import type { Operator, ElementItem } from './base.d.ts';
import type {
  IfNode,
  createList,
  createPick,
  createSlot,
  createDynamic,
} from './dynamic.d.ts';

export { Context } from '../../context/types/sync.d.ts';
export type { Operator, OperatorFunc, ElementItem, DeferredElementItem, HookName } from './base.d.ts';
export type { IfNode, ListItemsSource, ListKeyFn, ListRenderFn } from './dynamic.d.ts';

/** Function that creates a DOM element for a specific tag name. */
export type TagFn = (...args: ElementItem[]) => Node;

/**
 * Maps each PascalCase builder name on {@link ElNamespace} (`Div`, `Button`, …)
 * to the DOM interface for the element that call produces (`HTMLDivElement`, …).
 */
type ElTagElementTypes = {
  [K in keyof HTMLElementTagNameMap as Capitalize<K & string>]: HTMLElementTagNameMap[K];
};

/** The `el` namespace: core members plus PascalCase tag keys → {@link TagFn}. */
export type ElNamespace = {
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
  /**
   * Keyed list: mounts {@link ListRenderFn} output only where row key `===`
   * `callFn(selectedKey)`. See {@link createPick}.
   */
  readonly pick: typeof createPick;
  /** Creates a reactive slot node. */
  readonly slot: typeof createSlot;
  /** Creates a reactive dynamic subtree node. */
  readonly dynamic: typeof createDynamic;
  /** Deferred child: evaluated when processed by the tree builder. */
  readonly lazy: (fn: () => ElementItem) => ElementItem;
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
} & {
  [P in keyof ElTagElementTypes]: (...args: ElementItem[]) => ElTagElementTypes[P];
};

/** The shared {@link ElNamespace} instance. */
export const el: ElNamespace;
