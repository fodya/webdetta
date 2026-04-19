/// <reference lib="dom" />
import type { Operator, ElementItem } from './base.js';
import type {
  IfNode,
  createList,
  createSlot,
  createDynamic,
} from './dynamic.js';

export { Context } from '../../context/types/sync.js';
export type { Operator, OperatorFunc, ElementItem, Stringifiable, HookName } from './base.js';
export type { IfNode, ListItemsSource, ListKeyFn, ListRenderFn } from './dynamic.js';

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
