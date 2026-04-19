/**
 * Router path helpers: parsing and building route patterns. Used internally by
 * {@link Router} and exported for consumers that need raw path utilities.
 *
 * @module
 */

/** Path parameters extracted from a matched route. */
export type RouteParams = Record<string, string | undefined>;

/** Location object consumed by a {@link RouterDriver}. */
export interface RouterLocation {
  pathname: string;
  search: string;
  hash?: string;
  [key: string]: unknown;
}

/** A single route definition: the path pattern paired with its associated value. */
export type RouteDefinition<V = unknown> = [path: string, value: V];

/** Mapping of route keys to route definitions. */
export type RouteMap<V = unknown> = Record<string, RouteDefinition<V>>;

/** Parsed route shape used internally. */
export interface ParsedRoute<V = unknown> {
  key: string;
  path: string;
  value: V;
}

/** Result of matching a location against a {@link RouteMap}. */
export interface RouteMatch<V = unknown> {
  key: string | null;
  path: string | null;
  value: V | null;
  params: RouteParams;
  location: RouterLocation;
}

/** Pluggable driver that reads and writes the current location. */
export interface RouterDriver {
  attach(handler: () => void): void;
  detach(handler: () => void): void;
  get(): RouterLocation;
  set(update: { url: string; replace: boolean }): void;
  go(delta: number): void;
}

/** Parses a pathname against a route pattern, returning the params or `null`. */
export function parsePath(routepath: string, pathname: string | undefined): RouteParams | null;

/** Builds a pathname from a route pattern and parameters. */
export function makePath(routepath: string, params: RouteParams): string;

/** Builds an href for a route pattern and parameters. */
export function routeHref(routepath: string, params?: RouteParams): string;
