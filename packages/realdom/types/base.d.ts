import type { BuilderFn } from '../../builder/types/index.d.ts';

export type Stringifiable =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => Stringifiable);

export function toString(...args: unknown[]): string;

export type Operator = BuilderFn;

export type OperatorFunc = (
  node: Node,
  names: string[],
  args: unknown[]
) => void | (() => void);

export type HookName = 'beforeAppend' | 'afterAppend' | 'beforeRemove' | 'afterRemove';

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

export function processItem(
  item: ElementItem,
  processOperator: (op: Operator) => void,
  processNode: (node: Node) => void,
  flattenFragments?: boolean
): void;

export interface ElementFn {
  (ns: string | null, tag: string, ...args: ElementItem[]): Node;
  from(arg: Node | string | number | (() => Stringifiable)): Node;
  registerHook(node: Node, hook: HookName, handler: () => void): void;
  append<T extends Node>(node: T, item: ElementItem | ElementItem[]): T;
  appendBefore(node: Node, sibling: ElementItem): void;
  appendAfter(node: Node, sibling: ElementItem): void;
  remove(node: Node): void;
}

export const Element: ElementFn;

export interface OperatorFactory {
  (func: OperatorFunc, options?: { track?: boolean }): Operator;
  isOperator(f: unknown): boolean;
  apply(node: Node, operator: Operator): unknown;
}

export const Operator: OperatorFactory;
