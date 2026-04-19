import type { Router, RouterAction, RouterActionOptions } from './base.js';

export function routerAction<V = unknown>(
  router: Router<V>,
  options?: RouterActionOptions,
): RouterAction;
