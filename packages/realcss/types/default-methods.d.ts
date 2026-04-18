/// <reference lib="dom" />
import type { MethodsMap } from './index.js';

export type MethodsResolver = (v: unknown) => unknown;

export type MethodConfigEntry =
  | MethodsResolver
  | Record<string, unknown>
  | readonly unknown[]
  | undefined;

export interface MethodsConfig {
  unit: readonly [number, string];
  size?: MethodConfigEntry;
  color?: MethodConfigEntry;
  textSize?: MethodConfigEntry;
  lineHeight?: MethodConfigEntry;
  shadow?: MethodConfigEntry;
  fontFamily?: MethodConfigEntry;
  fontWeight?: MethodConfigEntry;
  [key: string]: MethodConfigEntry;
}

export type MethodsResolvers = Record<string, MethodsResolver>;

export function Methods(cfg: MethodsConfig): {
  methods: MethodsMap;
  resolve: MethodsResolvers;
};
