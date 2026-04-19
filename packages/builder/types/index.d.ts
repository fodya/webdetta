export type BuilderTask = {
  names: string[];
  args: unknown[];
};

export type BuilderEffect = (tasks: BuilderTask[], ...args: unknown[]) => unknown;

export interface BuilderFn {
  (...args: unknown[]): BuilderFn;
  readonly [key: string]: BuilderFn;
}

export const Builder: {
  (effect: BuilderEffect, tasks?: BuilderTask[], names?: string[]): BuilderFn;
  readonly symbol: unique symbol;
  isBuilder(f: unknown): boolean;
  launch(f: BuilderFn, ...args: unknown[]): unknown;
};
