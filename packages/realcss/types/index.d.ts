/// <reference lib="dom" />
export type MethodFn = (...args: any[]) => Record<string, unknown>;
export type MethodsMap = Record<string, MethodFn>;

export interface StyleNodeInstance {
  selector: string;
  query: string;
  important: boolean;
  inline: boolean;
  classname: string | null;
  css: string | null;
  additionalCss: string | null;
  style: Record<string, unknown>;
  cls: string | null;
  prevCls?: string | null;
  updates: Array<(this: StyleNodeInstance) => void>;
  fork(...updates: Array<(this: StyleNodeInstance) => void>): StyleNodeInstance;
  calculate(): void;
}

export interface StyleSheet {
  readonly style: HTMLStyleElement;
  processedNodes: Map<string, StyleNodeInstance>;
  insertNode(node: StyleNodeInstance): void;
  recalculate(): void;
}

export function inspect(obj: unknown): unknown;

export interface Stack<_M extends MethodsMap = MethodsMap> {
  (...args: unknown[]): Stack<_M>;
  readonly [key: string]: Stack<_M>;
}

export type AdapterWrapper = (
  styleSheet: StyleSheet,
  nodes: StyleNodeInstance[]
) => unknown;

export type AdapterResult<M extends MethodsMap> = {
  v: Stack<M>;
  recalculate(): void;
};

export type AdapterFactory = <M extends MethodsMap>(opts: {
  methods: M;
}) => AdapterResult<M>;

export function Adapter(wrapper: AdapterWrapper): AdapterFactory;
