/**
 * Realdom integration for the router: creates a container element whose
 * children reflect the current route, and exposes a sync {@link SyncContext}
 * for reading the active router from within a tree.
 *
 * @module
 */
import type { SyncContext } from '../../context/types/sync.d.ts';
import type { Router } from './base.d.ts';

/** Options for the router realdom adapter. */
export interface RouterRealdomOptions<V = unknown> {
  router: Router<V>;
}

/** Result: the mounted container element and the associated router. */
export interface RouterRealdomResult<V = unknown> {
  container: Element;
  router: Router<V>;
}

/** Router realdom adapter, callable as a function with a sync-context attached. */
declare const RouterRealdom: {
  <V = unknown>(opts: RouterRealdomOptions<V>): RouterRealdomResult<V>;
  /** Sync context holding the active router inside a rendered tree. */
  ctx: SyncContext<Router | undefined>;
};

export default RouterRealdom;
