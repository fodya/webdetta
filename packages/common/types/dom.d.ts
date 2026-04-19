export function kebab(s: string): string;

export function copyText(text: string): Promise<void>;

export type TextStyle = Partial<CSSStyleDeclaration> | CSSStyleDeclaration;

export function measureText(
  text: string,
  style?: TextStyle
): { width: number; height: number };

export function autogrowInput(options: {
  text: string;
  element: HTMLElement;
  style?: Partial<CSSStyleDeclaration>;
  multiline?: boolean;
}): void;

export function downloadBlob(filename: string, blob: Blob): Promise<void>;

export function colorToHex(colorStr: string): string;

export function constrainedZoomValue(options: {
  containerWidth: number;
  containerHeight: number;
  width: number;
  height: number;
  aspectRatio?: number;
}): number;

export const L: Promise<Event | void>;
export const DCL: Promise<Event | void>;
