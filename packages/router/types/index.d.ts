import type { Router, RouteMap } from './base.js';

export * from './base.js';
export * from './action.js';

export interface PathnameRouterOptions {
  prefix?: string;
}

export function PathnameRouter<V = unknown>(
  routes: RouteMap<V>,
  options?: PathnameRouterOptions,
): Router<V>;

export function HashRouter<V = unknown>(routes: RouteMap<V>): Router<V>;
