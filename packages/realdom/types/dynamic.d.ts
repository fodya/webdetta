import type { ElementItem } from './base.d.ts';

export type ListItemsSource<T> =
  | readonly T[]
  | Iterable<[unknown, T]>
  | Record<string, T>;

export type ListKeyFn<T> = (
  item: T,
  index: number,
  all: ListItemsSource<T>
) => unknown;

export type ListRenderFn<T> = (
  item: T,
  index: number,
  all: ListItemsSource<T>,
  key: unknown
) => ElementItem;

export function createList<T>(
  itemsFn: (() => ListItemsSource<T>) | ListItemsSource<T>,
  renderItem: ListRenderFn<T>,
  keyFn?: ListKeyFn<T>
): Text;

export function createSlot(content: ElementItem | (() => ElementItem)): Text;

export interface IfNode extends Text {
  elif(cond: unknown | (() => unknown), ...args: ElementItem[]): IfNode;
  else(...args: ElementItem[]): IfNode;
}

export function createIf(): IfNode;

export function createDynamic<D>(
  deps: () => D,
  func: (dep: D) => ElementItem
): Text;
