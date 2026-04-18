export type IdStore = (value: string) => number;
export function idStore(): IdStore;

export function escape(str: string): string;

export type Selector = string | ((parentSel: string) => string);
export function processNestedSelector(sel?: Selector, parentSel?: string): string;

export function splitSelector(str: string): string[];

export type StyleValue = string | number | boolean | null | undefined;
export type StyleObject = Record<string, StyleValue | (() => StyleValue)>;

export function styleStr(style: StyleObject, important?: boolean): string;

export function processMethodArgs(args: unknown[] | [TemplateStringsArray, ...unknown[]]): string[];

export interface CalculableNode {
  calculate(): void;
  style?: StyleObject;
}
export function combinedStyle(nodes: CalculableNode[]): StyleObject;
