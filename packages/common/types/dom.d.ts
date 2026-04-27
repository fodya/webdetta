/**
 * DOM helpers: text measurement, colors, clipboard, downloads, autogrow inputs,
 * document lifecycle promises, scroll/z-index walks, and `objectFit`-style scale factors.
 *
 * @module
 */

/** Converts a camelCase or PascalCase identifier to kebab-case. */
export function kebab(s: string): string;

/** Copies the given `text` to the system clipboard. */
export function copyText(text: string): Promise<void>;

/** Subset of `CSSStyleDeclaration` accepted by text measurement helpers. */
export type TextStyle = Partial<CSSStyleDeclaration> | CSSStyleDeclaration;

/** Measures the rendered width and height of `text` using the given font `style`. */
export function measureText(
  text: string,
  style?: TextStyle
): { width: number; height: number };

/** Resizes `element` to fit the measured size of `text`, optionally multiline. */
export function autogrowInput(options: {
  text: string;
  element: HTMLElement;
  style?: Partial<CSSStyleDeclaration>;
  multiline?: boolean;
}): void;

/** Triggers a browser download for the given `blob` using `filename`. */
export function downloadBlob(filename: string, blob: Blob): Promise<void>;

/** Normalizes any CSS color string to its `#rrggbb` hex form. */
export function colorToHex(colorStr: string): string;

/** `contain`: whole content stays inside the box. `cover`: box is fully filled (often with overflow hidden). */
export type ObjectFitMode = "contain" | "cover";

/** Box and content sizes in pixels for {@link objectFit}. */
export type ObjectFitOptions = {
  /** Outer box width (e.g. from `getBoundingClientRect()`). */
  containerWidth: number;
  /** Outer box height. */
  containerHeight: number;
  /** Content width; use `> 0` when deriving the other side with `aspectRatio`. */
  width: number;
  /** Content height; use `> 0` when deriving the other side with `aspectRatio`. */
  height: number;
  /** Width ÷ height when only one of `width` / `height` is positive. */
  aspectRatio?: number;
  /** @default "contain" */
  mode?: ObjectFitMode;
};

/**
 * Uniform scale like CSS `object-fit` for a rectangle in a frame. Main use: `element.style.zoom = String(scale)`
 * so intrinsic-sized content visually fits or fills the container; same factor works for `transform: scale(...)`
 * or explicit width/height math. Returns `1` when the container or inferred content size is unusable.
 */
export function objectFit(options: ObjectFitOptions): number;

/**
 * Walks ancestors of `node` and returns the nearest element that is scrollable
 * (overflow `auto`/`scroll`/`overlay` and content exceeds client size).
 * Falls back to `document.scrollingElement` / `document.documentElement`.
 */
export function getScrollContainer(node: Node | null | undefined): Element;

/**
 * Walks ancestors of `node` and returns the nearest numeric `z-index` value.
 * Returns `0` if none is found.
 */
export function getZIndex(node: Node | null | undefined): number;

/** Resolves when the window `load` event fires (or immediately if already loaded). */
export const L: Promise<Event | void>;
/** Resolves when `DOMContentLoaded` fires (or immediately if already fired). */
export const DCL: Promise<Event | void>;
