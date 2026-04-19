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

export type TagFn = (...args: ElementItem[]) => Node;

export interface ElNamespaceBase {
  readonly ref: Operator;
  parse(...args: unknown[]): Element[];
  append<T extends Node>(node: T, ...args: ElementItem[]): T;
  remove(node: Node): void;
  if(cond: unknown | (() => unknown), ...args: ElementItem[]): IfNode;
  readonly list: typeof createList;
  readonly slot: typeof createSlot;
  readonly dynamic: typeof createDynamic;
  readonly attr: Operator;
  readonly hook: Operator;
  readonly on: Operator;
  readonly class: Operator;
  readonly style: Operator;
  readonly prop: Operator;
  readonly NS_SVG: ElNamespace;
  readonly NS_MATH: ElNamespace;
}

export type ElNamespace = ElNamespaceBase & Record<string, any>;

export const el: ElNamespace;
