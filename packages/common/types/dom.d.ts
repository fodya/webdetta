/**
 * DOM-specific utility functions: text measurement, color conversion,
 * clipboard, blob download, autogrow inputs, and document-lifecycle promises.
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

/** Computes a zoom scale that fits `width`/`height` inside the container while preserving aspect ratio. */
export function constrainedZoomValue(options: {
  containerWidth: number;
  containerHeight: number;
  width: number;
  height: number;
  aspectRatio?: number;
}): number;

/** Resolves when the window `load` event fires (or immediately if already loaded). */
export const L: Promise<Event | void>;
/** Resolves when `DOMContentLoaded` fires (or immediately if already fired). */
export const DCL: Promise<Event | void>;
