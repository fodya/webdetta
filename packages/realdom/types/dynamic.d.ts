/**
 * Conditional branches, lists, keyed selection, replaceable regions, and subtrees driven by changing inputs.
 *
 * @module
 */
import type { ElementItem } from './base.d.ts';

/**
 * Collection you can map over: plain array, iterable of `[key, item]` pairs, or string-keyed record.
 */
export type ListItemsSource<T> =
  | readonly T[]
  | Iterable<[unknown, T]>
  | Record<string, T>;

/**
 * Produces a stable identifier for a row when diffing lists.
 *
 * @param item Current row value.
 * @param index Position within the collection.
 * @param all Full collection snapshot being rendered.
 */
export type ListKeyFn<T> = (
  item: T,
  index: number,
  all: ListItemsSource<T>
) => unknown;

/**
 * Builds the DOM fragment for one row.
 *
 * @param item Row value.
 * @param index Row index.
 * @param all Entire collection currently rendered.
 * @param key Stable key returned by {@link ListKeyFn} or the default strategy.
 */
export type ListRenderFn<T> = (
  item: T,
  index: number,
  all: ListItemsSource<T>,
  key: unknown
) => ElementItem;

/**
 * Renders every row in `itemsFn`, reusing DOM when keys match previous output.
 *
 * @param itemsFn Current collection or a function returning it whenever inputs change.
 * @param renderItem Builds the subtree for a single row.
 * @param keyFn Optional stable key extractor; defaults to sensible guesses for primitives and `{ id }` objects.
 * @returns Anchor text node the reconciler uses as the list boundary.
 */
export function createList<T>(
  itemsFn: (() => ListItemsSource<T>) | ListItemsSource<T>,
  renderItem: ListRenderFn<T>,
  keyFn?: ListKeyFn<T>
): Text;

/**
 * Renders only the row whose key equals the current selection.
 *
 * @param selectedKey Selected key value, or a function returning it when dependencies change.
 * @param items Collection or supplier evaluated like {@link createList}.
 * @param renderItem Builds the subtree for the matching row.
 * @param keyFn Optional stable key extractor for rows.
 * @returns Anchor text node used as the mount point.
 *
 * @example
 * ```js
 * const selectedId = () => 'b';
 * const tabs = [
 *   { id: 'a', label: 'Alpha' },
 *   { id: 'b', label: 'Bravo' },
 * ];
 * createPick(
 *   selectedId,
 *   () => tabs,
 *   (tab) => el.Div(tab.label),
 *   (tab) => tab.id,
 * );
 * ```
 */
export function createPick<T>(
  selectedKey: unknown | (() => unknown),
  items: (() => ListItemsSource<T>) | ListItemsSource<T>,
  renderItem: ListRenderFn<T>,
  keyFn?: ListKeyFn<T>
): Text;

/**
 * Mount point whose children can be replaced later by calling the returned updater APIs.
 *
 * @param content Initial subtree or a function returning it whenever upstream data changes.
 * @returns Anchor text node representing the slot.
 */
export function createSlot(content: ElementItem | (() => ElementItem)): Text;

/**
 * Conditional branch node chaining `elif` / `else`.
 */
export interface IfNode extends Text {
  /**
   * Adds another branch evaluated when previous branches were falsy.
   *
   * @param cond Boolean or supplier evaluated like the first branch.
   * @param args Content rendered when `cond` is truthy.
   */
  elif(cond: unknown | (() => unknown), ...args: ElementItem[]): IfNode;

  /**
   * Final fallback rendered when every earlier branch was falsy.
   */
  else(...args: ElementItem[]): IfNode;
}

/**
 * Renders the first branch whose condition is truthy.
 */
export function createIf(
  cond: unknown | (() => unknown),
  ...args: ElementItem[]
): IfNode;

/**
 * Rebuilds a subtree whenever `deps()` returns a new value (reference inequality).
 *
 * @param deps Function returning the current dependency bundle.
 * @param func Maps the dependency value to DOM content.
 * @returns Anchor text node for the subtree boundary.
 */
export function createDynamic<D>(
  deps: () => D,
  func: (dep: D) => ElementItem
): Text;
