import type { Router, RouteMap } from './base.d.ts';

export * from './base.d.ts';
export * from './action.d.ts';

export interface PathnameRouterOptions {
  prefix?: string;
}

export function PathnameRouter<V = unknown>(
  routes: RouteMap<V>,
  options?: PathnameRouterOptions,
): Router<V>;

export function HashRouter<V = unknown>(routes: RouteMap<V>): Router<V>;
