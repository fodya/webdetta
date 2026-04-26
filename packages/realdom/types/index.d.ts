/**
 * Lightweight DOM manipulation library. Exposes {@link el} — a proxy that
 * produces DOM elements via any tag name, with operators for attributes,
 * events, classes, styles, hooks, control-flow helpers, and small browser
 * observer wrappers (`el.observe`).
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

/**
 * ### Handlers + one options object (`el.on`, `el.observe.*`)
 *
 * These APIs accept **any number of callback functions first**, then **at most one**
 * trailing plain object. That object is forwarded to the matching browser API, except
 * for the optional **`target`** field documented on each options type: it selects which
 * DOM node receives listeners or is observed, and is stripped before calling the browser
 * (it is not a valid `addEventListener` / `IntersectionObserver` / `MutationObserver`
 * option).
 *
 * ---
 *
 * Optional last argument to `el.on`, passed together with handler functions.
 * Any field supported by `addEventListener` is forwarded unchanged, except:
 *
 * - **`target`**: which element should receive the listener. Defaults to the element
 *   returned by the surrounding `el.Div` / `el.Button` / … call. This property is **not**
 *   forwarded to the browser.
 *
 * @example
 * ```js
 * const field = el.Input();
 * const status = el.Span('idle');
 * el.Div(
 *   field,
 *   status,
 *   el.on.input(
 *     () => validate(field.value),
 *     { target: field, capture: true },
 *   ),
 * );
 * ```
 */
export type OnBindingOptions = AddEventListenerOptions & {
  target?: EventTarget;
};

/**
 * Optional last argument to {@link ObserveNamespace.intersection}, passed after callback
 * functions. Accepts the same fields as `IntersectionObserverInit`, plus:
 *
 * - **`target`**: which element should be observed. Defaults to the element returned by
 *   the surrounding `el.*` call. This property is **not** forwarded to the browser.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
 *
 * @example
 * ```js
 * const card = el.Div('Promo text');
 * el.Div(
 *   card,
 *   el.observe.intersection(
 *     (entries) => {
 *       for (const e of entries) {
 *         if (!e.isIntersecting) continue;
 *         fetch('/api/promo/details').then((r) => r.text()).then((html) => {
 *           card.append(el.Div(html));
 *         });
 *       }
 *     },
 *     { threshold: 0.25 },
 *   ),
 * );
 * ```
 */
export type IntersectionBindingOptions = IntersectionObserverInit & {
  target?: Element;
};

/**
 * Optional last argument to {@link ObserveNamespace.mutation}, passed after callback
 * functions. Accepts the same fields as `MutationObserverInit`, plus:
 *
 * - **`target`**: which node should be passed to `MutationObserver.observe`. Defaults to
 *   the element returned by the surrounding `el.*` call. This property is **not**
 *   forwarded to the browser.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 *
 * @example
 * ```js
 * const list = el.Ul(el.Li('one'), el.Li('two'));
 * const summary = el.Div('Items: 2');
 * el.Div(
 *   summary,
 *   list,
 *   el.observe.mutation(
 *     () => {
 *       summary.textContent = `Items: ${list.querySelectorAll('li').length}`;
 *     },
 *     { target: list, subtree: true, childList: true },
 *   ),
 * );
 * ```
 */
export type MutationBindingOptions = MutationObserverInit & {
  target?: Node;
};

/**
 * Observers under {@link ElNamespace.observe}. Same trailing-argument shape as
 * {@link ElNamespace.on}: callbacks first, then one optional options bag.
 *
 * @example
 * ```js
 * const card = el.Article('Billing');
 * el.Div(
 *   card,
 *   el.observe.intersection(
 *     (entries, obs) => {
 *       for (const e of entries) {
 *         card.classList.toggle('is-visible', e.isIntersecting);
 *       }
 *     },
 *     { root: document.querySelector('#scroll'), rootMargin: '0px 0px -20% 0px', threshold: 0 },
 *   ),
 * );
 * ```
 *
 * @example
 * ```js
 * const field = el.Input();
 * el.Label(
 *   'Username',
 *   field,
 *   el.observe.mutation(
 *     () => validateUsername(field.value),
 *     { attributes: true, attributeFilter: ['value', 'class'] },
 *   ),
 * );
 * ```
 */
export interface ObserveNamespace {
  /**
   * Registers one `IntersectionObserver` **per callback**. Each callback receives
   * `(entries, observer)` exactly like the native constructor.
   *
   * When the subtree built by the surrounding `el.*` call is removed, observers disconnect.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
   */
  readonly intersection: Operator;

  /**
   * Registers one `MutationObserver` **per callback**. Each callback receives
   * `(mutationList, observer)` exactly like the native constructor.
   *
   * The trailing options object (without `target`) is passed to `observe(root, options)`.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
   */
  readonly mutation: Operator;
}

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
  /**
   * Binds DOM events on the built element. Handlers are listed first; the last argument
   * may be an {@link OnBindingOptions} object (including optional `target`).
   */
  readonly on: Operator;
  /**
   * Viewport and DOM-tree observers. See {@link ObserveNamespace} and
   * {@link IntersectionBindingOptions} / {@link MutationBindingOptions}.
   */
  readonly observe: ObserveNamespace;
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
