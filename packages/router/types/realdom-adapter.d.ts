/// <reference lib="dom" />
import type { SyncContext } from '../../context/types/sync.js';
import type { Router } from './base.js';

export interface RouterRealdomOptions<V = unknown> {
  router: Router<V>;
}

export interface RouterRealdomResult<V = unknown> {
  container: Element;
  router: Router<V>;
}

declare const RouterRealdom: {
  <V = unknown>(opts: RouterRealdomOptions<V>): RouterRealdomResult<V>;
  ctx: SyncContext<Router | undefined>;
};

export default RouterRealdom;
