/**
 * Helper that constructs a scoped {@link RouterAction} for a given
 * {@link Router}.
 *
 * @module
 */
import type { Router, RouterAction, RouterActionOptions } from './base.d.ts';

/** Creates a router-scoped action whose lifetime follows the current route match. */
export function routerAction<V = unknown>(
  router: Router<V>,
  options?: RouterActionOptions,
): RouterAction;
