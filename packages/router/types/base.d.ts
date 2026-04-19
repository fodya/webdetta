export type RouteParams = Record<string, string | undefined>;

export interface RouterLocation {
  pathname: string;
  search: string;
  hash?: string;
  [key: string]: unknown;
}

export type RouteDefinition<V = unknown> = [path: string, value: V];

export type RouteMap<V = unknown> = Record<string, RouteDefinition<V>>;

export interface RouteMatch<V = unknown> {
  key: string | null;
  path: string | null;
  value: V | null;
  params: RouteParams;
  location: RouterLocation;
}

export interface RouterDriver {
  attach(handler: () => void): void;
  detach(handler: () => void): void;
  get(): RouterLocation;
  set(update: { url: string; replace: boolean }): void;
  go(delta: number): void;
}

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
  attach(): void;
  detach(): void;
  listen(handler: (route: RouteMatch<V>) => void): () => void;
  routes: Record<string, { key: string; path: string; value: V }>;
  current(): RouteMatch<V>;
  href(key: string, params?: RouteParams): string;
  go(delta: number): void;
  navigate(key: string, params?: RouteParams): void;
  replace(key: string, params?: RouteParams): void;
  action(options?: RouterActionOptions): RouterAction;
}

export function parsePath(routepath: string, pathname: string | undefined): RouteParams | null;
export function makePath(routepath: string, params: RouteParams): string;
export function routeHref(routepath: string, params?: RouteParams): string;

declare function Router<V = unknown>(routes: RouteMap<V>, driver: RouterDriver): Router<V>;
export default Router;
