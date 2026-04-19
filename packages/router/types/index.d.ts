/**
 * Client-side routing: {@link PathnameRouter} uses the History API, while
 * {@link HashRouter} uses the `#` fragment. Both yield the same
 * {@link Router} interface.
 *
 * @example
 * ```js
 * import { PathnameRouter } from '@webdetta/core/router';
 *
 * const router = PathnameRouter({
 *   home:  ['/',             { title: 'Home'  }],
 *   user:  ['/user/:id',     { title: 'User'  }],
 * });
 * router.attach();
 * router.navigate('user', { id: '42' });
 * ```
 *
 * @module
 */
import type { Router, RouteMap } from './base.d.ts';

export * from './base.d.ts';
export * from './action.d.ts';

/** Options for {@link PathnameRouter}. */
export interface PathnameRouterOptions {
  /** Optional path prefix to strip when matching and add when building URLs. */
  prefix?: string;
}

/** Creates a History-API-based router. */
export function PathnameRouter<V = unknown>(
  routes: RouteMap<V>,
  options?: PathnameRouterOptions,
): Router<V>;

/** Creates a hash-fragment-based router. */
export function HashRouter<V = unknown>(routes: RouteMap<V>): Router<V>;
