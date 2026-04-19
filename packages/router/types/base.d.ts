/**
 * Router core: route maps, match results, drivers, and the generic
 * {@link Router} interface shared by all router variants.
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

/** Options for a scoped router {@link RouterAction}. */
export interface RouterActionOptions {
  key?: string;
  val?: () => unknown;
  endOnRouteChange?: boolean;
  onBegin?: () => void;
  onEnd?: () => void;
}

/** Scoped action whose lifetime is tied to a particular route match. */
export interface RouterAction {
  /** Begins the action (runs `onBegin`). */
  begin(): void;
  /** Ends the action (runs `onEnd`). */
  end(): void;
  /** Ends and fully tears down the action. */
  destroy(): void;
}

/** A router: observes a location driver and dispatches matches to listeners. */
export interface Router<V = unknown> {
  /** Attaches the router to its driver and begins matching. */
  attach(): void;
  /** Detaches the router from its driver. */
  detach(): void;
  /** Subscribes to route matches; returns an unsubscribe function. */
  listen(handler: (route: RouteMatch<V>) => void): () => void;
  /** Parsed routes keyed by their keys. */
  routes: Record<string, { key: string; path: string; value: V }>;
  /** Current route match. */
  current(): RouteMatch<V>;
  /** Builds a URL for a route key and parameters. */
  href(key: string, params?: RouteParams): string;
  /** Navigates history by a relative delta. */
  go(delta: number): void;
  /** Pushes a new URL for the given route key and parameters. */
  navigate(key: string, params?: RouteParams): void;
  /** Replaces the current URL with the given route. */
  replace(key: string, params?: RouteParams): void;
  /** Creates a scoped {@link RouterAction}. */
  action(options?: RouterActionOptions): RouterAction;
}

/** Parses a pathname against a route pattern, returning the params or `null`. */
export function parsePath(routepath: string, pathname: string | undefined): RouteParams | null;
/** Builds a pathname from a route pattern and parameters. */
export function makePath(routepath: string, params: RouteParams): string;
/** Builds an href for a route pattern and parameters. */
export function routeHref(routepath: string, params?: RouteParams): string;

/** Low-level constructor that binds a {@link RouteMap} to a {@link RouterDriver}. */
declare function Router<V = unknown>(routes: RouteMap<V>, driver: RouterDriver): Router<V>;
export default Router;
