/**
 * Reactive DOM control flow: conditional branches (`if/elif/else`), keyed
 * lists, slots and dynamic subtrees that react to dependency changes.
 *
 * @module
 */
import type { ElementItem } from './base.d.ts';

/** Source of items for a keyed list: array, key/value iterable, or record. */
export type ListItemsSource<T> =
  | readonly T[]
  | Iterable<[unknown, T]>
  | Record<string, T>;

/** Derives a stable key for an item in a keyed list. */
export type ListKeyFn<T> = (
  item: T,
  index: number,
  all: ListItemsSource<T>
) => unknown;

/** Renders an item in a keyed list. */
export type ListRenderFn<T> = (
  item: T,
  index: number,
  all: ListItemsSource<T>,
  key: unknown
) => ElementItem;

/** Creates a reactive keyed list anchored at a text node. */
export function createList<T>(
  itemsFn: (() => ListItemsSource<T>) | ListItemsSource<T>,
  renderItem: ListRenderFn<T>,
  keyFn?: ListKeyFn<T>
): Text;

/** Creates a reactive slot anchored at a text node. */
export function createSlot(content: ElementItem | (() => ElementItem)): Text;

/** Anchor node for a reactive `if` block, extended with `elif`/`else` chaining. */
export interface IfNode extends Text {
  /** Adds an `else if` branch. */
  elif(cond: unknown | (() => unknown), ...args: ElementItem[]): IfNode;
  /** Adds an `else` branch. */
  else(...args: ElementItem[]): IfNode;
}

/** Creates an empty {@link IfNode} to be populated with branches. */
export function createIf(): IfNode;

/** Creates a reactive subtree derived from dependencies. */
export function createDynamic<D>(
  deps: () => D,
  func: (dep: D) => ElementItem
): Text;
