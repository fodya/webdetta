/**
 * Client-side routing. A single {@link Router} factory produces a router with
 * hash/history/custom driver, a ready-to-mount DOM `node`, and optional scroll
 * restoration between route swaps. The module-level {@link Router.Ctx} carries
 * the active router during page renders.
 *
 * @example
 * ```js
 * import { el } from '@webdetta/core/realdom';
 * import { Router } from '@webdetta/core/router';
 *
 * const Home = () => el.Div('Home');
 * const User = (p) => el.Div('User ', p.id);
 * const router = Router({
 *   mode: 'history',
 *   routes: {
 *     home: ['/', Home],
 *     user: ['/user/:id', User],
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

export function parsePath(routepath: string, pathname: string | undefined): RouteParams | null;
export function makePath(routepath: string, params: RouteParams): string;
export function routeHref(routepath: string, params?: RouteParams): string;

export type RouterMode = 'hash' | 'history' | RouterDriver;

export interface RouterOptions<V = unknown> {
  routes: RouteMap<V>;
  mode: RouterMode;
  /** History mode only. */
  prefix?: string;
}

/** {@link Router#action} options. */
export interface RouterActionOptions {
  key?: string;
  val?: () => unknown;
  endOnRouteChange?: boolean;
  onBegin?: () => void;
  onEnd?: () => void;
}

export interface RouterAction {
  begin(): void;
  end(): void;
  destroy(): void;
}

export interface Router<V = unknown> {
  routes: Record<string, ParsedRoute<V>>;
  current(): RouteMatch<V>;
  onChange(handler: (route: RouteMatch<V>) => void): () => void;
  onEnter(callback: (route: RouteMatch<V>) => void | Promise<void>): () => void;
  onEnter(routeKey: string, callback: (route: RouteMatch<V>) => void | Promise<void>): () => void;
  onLeave(callback: (route: RouteMatch<V>) => void | Promise<void>): () => void;
  onLeave(routeKey: string, callback: (route: RouteMatch<V>) => void | Promise<void>): () => void;
  onReturn(callback: (route: RouteMatch<V>) => void | Promise<void>): () => void;
  onReturn(routeKey: string, callback: (route: RouteMatch<V>) => void | Promise<void>): () => void;
  go(delta: number): void;
  navigate(key: string, params?: RouteParams): void;
  replace(key: string, params?: RouteParams): void;
  href(key: string, params?: RouteParams): string;
  detach(): void;
  action(options?: RouterActionOptions): RouterAction;
  /** Mount anchor; views insert after this node. */
  node: Text;
}

export function Router<V = unknown>(options: RouterOptions<V>): Router<V>;

export namespace Router {
  /** Active router during `Router.Ctx.run`. */
  const Ctx: SyncContext<Router<unknown> | undefined>;
}
