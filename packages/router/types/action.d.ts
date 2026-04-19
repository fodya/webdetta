import type { Router, RouterAction, RouterActionOptions } from './base.d.ts';

export function routerAction<V = unknown>(
  router: Router<V>,
  options?: RouterActionOptions,
): RouterAction;
