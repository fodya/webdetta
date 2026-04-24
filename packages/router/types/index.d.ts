/**
 * Client-side routing. A single {@link Router} factory produces a router with
 * hash/history/custom driver, a ready-to-mount DOM `node`, and optional scroll
 * restoration between route swaps. The module-level {@link Router.Ctx} carries
 * the active router during page renders.
 *
 * @example
 * ```js
 * import { Router } from '@webdetta/core/router';
 *
 * const router = Router({
 *   mode: 'history',
 *   routes: {
 *     home: ['/',          Home],
 *     user: ['/user/:id',  User],
 *   },
 * });
 * document.body.append(router.node);
 * router.navigate('user', { id: '42' });
 * ```
 *
 * @module
 */
import type { SyncContext } from '../../context/types/sync.d.ts';
import type {
  ParsedRoute,
  RouteMap,
  RouteMatch,
  RouteParams,
  RouterDriver,
} from './base.d.ts';

export type {
  ParsedRoute,
  RouteDefinition,
  RouteMap,
  RouteMatch,
  RouteParams,
  RouterDriver,
  RouterLocation,
} from './base.d.ts';

/** Parses a pathname against a route pattern, returning the params or `null`. */
export function parsePath(routepath: string, pathname: string | undefined): RouteParams | null;

/** Builds a pathname from a route pattern and parameters. */
export function makePath(routepath: string, params: RouteParams): string;

/** Builds an href for a route pattern and parameters. */
export function routeHref(routepath: string, params?: RouteParams): string;

/** Mode selector for {@link Router}. */
export type RouterMode = 'hash' | 'history' | RouterDriver;

/** Options for {@link Router}. */
export interface RouterOptions<V = unknown> {
  /** Route map: `{ key: [pathPattern, value] }`. */
  routes: RouteMap<V>;
  /** Driver selector or a custom driver object. */
  mode: RouterMode;
  /** Optional path prefix (only used when `mode === 'history'`). */
  prefix?: string;
}

/** Options for a scoped {@link RouterAction}. */
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

/** A router instance created via {@link Router}. */
export interface Router<V = unknown> {
  /** Parsed routes keyed by their keys. */
  routes: Record<string, ParsedRoute<V>>;
  /** Current route match. */
  current(): RouteMatch<V>;
  /** Subscribes to route matches; handler fires immediately with current. Returns unsubscribe. */
  onChange(handler: (route: RouteMatch<V>) => void): () => void;
  /**
   * Invokes `callback` when the active key becomes `routeKey` (first notification if it
   * already matches, or after a transition onto it). If `routeKey` is omitted, uses
   * {@link Router#current}().key at subscribe time. Returns unsubscribe.
   */
  onEnter(
    callback: (route: RouteMatch<V>) => void | Promise<void>,
  ): () => void;
  onEnter(
    routeKey: string,
    callback: (route: RouteMatch<V>) => void | Promise<void>,
  ): () => void;
  /**
   * Invokes `callback` when leaving `routeKey`. If `routeKey` is omitted, uses current
   * key at subscribe time. Returns unsubscribe.
   */
  onLeave(
    callback: (route: RouteMatch<V>) => void | Promise<void>,
  ): () => void;
  onLeave(
    routeKey: string,
    callback: (route: RouteMatch<V>) => void | Promise<void>,
  ): () => void;
  /**
   * Same condition as {@link Router#onEnter} for the captured `routeKey` (first paint on
   * that key or transition onto it). If `routeKey` is omitted, uses current key at
   * subscribe time. Returns unsubscribe.
   */
  onReturn(
    callback: (route: RouteMatch<V>) => void | Promise<void>,
  ): () => void;
  onReturn(
    routeKey: string,
    callback: (route: RouteMatch<V>) => void | Promise<void>,
  ): () => void;
  /** Navigates history by a relative delta. */
  go(delta: number): void;
  /** Pushes a new URL for the given route key and parameters. */
  navigate(key: string, params?: RouteParams): void;
  /** Replaces the current URL with the given route. */
  replace(key: string, params?: RouteParams): void;
  /** Builds a URL for a route key and parameters. */
  href(key: string, params?: RouteParams): string;
  /** Detaches the router from its driver (teardown). */
  detach(): void;
  /** Creates a scoped {@link RouterAction}. */
  action(options?: RouterActionOptions): RouterAction;
  /** Anchor DOM node; insert into the page, route contents attach as siblings after it. */
  node: Text;
}

/** Creates a router. Attaches to the selected driver immediately. */
export function Router<V = unknown>(options: RouterOptions<V>): Router<V>;

export namespace Router {
  /** Module-level sync context carrying the active router during page renders. */
  const Ctx: SyncContext<Router<unknown> | undefined>;
}
