/**
 * Builds the default set of realcss style methods from a theme config.
 *
 * @module
 */

/** A method that, given user arguments, returns a partial style object. */
export type MethodFn = (...args: unknown[]) => Record<string, unknown>;

/** Map of named style methods. */
export type MethodsMap = Record<string, MethodFn>;

/** Resolver function converting a raw value into a CSS-ready value. */
export type MethodsResolver = (v: unknown) => unknown;

/** Single entry of a methods config: resolver, map, tuple, or undefined. */
export type MethodConfigEntry =
  | MethodsResolver
  | Record<string, unknown>
  | readonly unknown[]
  | undefined;

/** Theme configuration consumed by {@link Methods}. */
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

/** Record of named resolvers produced by {@link Methods}. */
export type MethodsResolvers = Record<string, MethodsResolver>;

/** Builds default realcss methods + resolvers from a theme config. */
export function Methods(cfg: MethodsConfig): {
  methods: MethodsMap;
  resolve: MethodsResolvers;
};
