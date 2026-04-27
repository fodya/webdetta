// @ts-self-types="./types/dom.d.ts"
import { arr } from './utils.js';
import { objectPick } from './utils.js';
import { fileToDatauri } from '../convert/index.js';
import { cached } from "../execution/index.js";

export const L = new Promise(resolve => {
  globalThis?.window?.addEventListener('load', resolve);
});
export const DCL = new Promise(resolve => {
  globalThis?.window?.addEventListener('DOMContentLoaded', resolve);
});

export const kebab = cached(s => {
  let res = '';
  for (const c of s) res += c >= 'A' && c <= 'Z' ? '-' + c.toLowerCase() : c;
  return res;
});

export const setThemeColor = (color) => {
  const c = String(color ?? '').trim();
  if (!c) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', c);
};

export const copyText = async text => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const node = document.createElement("textarea");
    node.value = text;

    node.style.top = "0";
    node.style.left = "0";
    node.style.position = "fixed";

    document.body.appendChild(node);
    node.focus();
    node.select();

    document.execCommand('copy');
    node.remove();
  }
}

export const measureText = (text, style={}) => {
  const div = measureText.div ??= document.createElement('div');
  Object.assign(div.style, {
    position: 'fixed',
    left: '-99999px',
    top: '-99999px',
    visibility: 'hidden',
    pointerEvents: 'none'
  });
  
  const keys = style instanceof CSSStyleDeclaration ? style : Object.keys(style);
  for (const k of ['width', 'height']) delete div.style[k];
  for (const k of keys) div.style[k] = style[k];
  div.textContent = text;
  
  document.body.append(div);
  const rect = div.getBoundingClientRect();
  div.remove();
  return { width: rect.width, height: rect.height };
}

export const autogrowInput = ({ text, element, style={}, multiline=false }) => {
  const keys = arr`
    letter-spacing padding margin font font-family word-break white-space
    display perspective-origin transform-origin
  `;
  keys.push(multiline ? 'width' : 'height');

  const measurement = measureText(text + (multiline ? '.' : ''), {
    ...objectPick(getComputedStyle(element), keys),
    ...style
  });

  const result = multiline ? 'height' : 'width';
  element.style[result] = measurement[result] + 'px';
}

export const downloadBlob = async (filename, blob) => {
  const link = downloadBlob.link ??= document.createElement("a");
  link.style = "display: none";
  document.body.append(link);

  const ua = navigator?.userAgent || '';
  const useDatauri = (
    typeof URL?.createObjectURL !== 'function' ||
    /iPad|iPhone|iPod/.test(ua) && !/\bcrios\b/i.test(ua)
  );
  
  const url = useDatauri
    ? await fileToDatauri(blob)
    : URL.createObjectURL(blob);
  link.href = url;
  link.target = '_blank';
  link.download = filename;
  link.click();
  if (!useDatauri) {
    await Promise.resolve();
    URL.revokeObjectURL(url);
  }
};

export const colorToHex = (colorStr) => {
  const ctx = colorToHex.ctx ??= document.createElement('canvas').getContext('2d')
  ctx.fillStyle = colorStr;
  return ctx.fillStyle;
}

/**
 * Uniform scale so a rectangle fits or fills an outer box (same idea as CSS `object-fit: contain | cover`).
 * Typical use: keep content at its natural layout size and set `element.style.zoom` to the factor so the
 * visual footprint matches the frame. Same number also works as `transform: scale(...)` from the center,
 * or to multiply width/height when you size in JS instead of zoom.
 *
 * With `aspectRatio` (width ÷ height), only one of `width` / `height` needs to be positive; the other side is derived.
 * Returns `1` when the container has non-positive size or no positive content size can be inferred.
 *
 * @param options
 * @param options.containerWidth Outer box width in pixels.
 * @param options.containerHeight Outer box height in pixels.
 * @param options.width Content width; pair with `height` or with `aspectRatio` and one side.
 * @param options.height Content height.
 * @param options.aspectRatio Optional width÷height when one dimension is inferred.
 * @param options.mode `contain` — entire content stays inside the box; `cover` — box is fully covered (often with overflow hidden on the frame).
 * @returns Positive scale factor.
 *
 * @example
 * // Frame from layout; preview keeps intrinsic 1600×900 — shrink with zoom (contain)
 * const frame = wrapper.getBoundingClientRect();
 * const scale = objectFit({
 *   containerWidth: frame.width,
 *   containerHeight: frame.height,
 *   width: 1600,
 *   height: 900,
 * });
 * preview.style.zoom = String(scale);
 *
 * @example
 * // Only width known; 16:9 — cover square frame, clip overflow on wrapper
 * const frame = wrapper.getBoundingClientRect();
 * const scale = objectFit({
 *   containerWidth: frame.width,
 *   containerHeight: frame.height,
 *   width: 1920,
 *   height: 0,
 *   aspectRatio: 16 / 9,
 *   mode: 'cover',
 * });
 * preview.style.zoom = String(scale);
 */
export const objectFit = ({
  containerWidth,
  containerHeight,
  width,
  height,
  aspectRatio,
  mode = 'contain',
}) => {
  if (containerWidth <= 0 || containerHeight <= 0) return 1;

  const base = width > 0 ? width : height > 0 ? height : 0;
  if (!(base > 0)) return 1;

  const baseW = aspectRatio
    ? (width > 0 ? base : base * aspectRatio)
    : width;

  const baseH = aspectRatio
    ? (width > 0 ? base / aspectRatio : base)
    : height;

  const sW = containerWidth / baseW;
  const sH = containerHeight / baseH;

  return mode === 'cover'
    ? Math.max(sW, sH)
    : Math.min(sW, sH);
};

const overflowRegex = /(auto|scroll|overlay)/;
export const getScrollContainer = (node) => {
  while (node && node !== document.body) {
    if (node.nodeType === 1) {
      const s = getComputedStyle(node);
      if (overflowRegex.test(s.overflowY) && node.scrollHeight > node.clientHeight) return node;
      if (overflowRegex.test(s.overflowX) && node.scrollWidth > node.clientWidth) return node;
    }
    node = node.parentNode;
  }
  return document.scrollingElement ?? document.documentElement;
};

export const getZIndex = (node) => {
  while (node && node !== document.body) {
    if (node.nodeType === 1) {
      const z = +getComputedStyle(node).zIndex;
      if (!Number.isNaN(z)) return z;
    }
    node = node.parentNode;
  }
  return 0;
};

export const preventPinchZoom = (container) => {
  const handler = (event) => event.preventDefault();
  container.addEventListener('gesturestart', handler, { passive: false });
  container.addEventListener('gesturechange', handler, { passive: false });
  container.addEventListener('gestureend', handler, { passive: false });
  container.addEventListener('touchmove', (event) => {
    if (event.scale !== undefined && event.scale !== 1) handler(event);
    if (event.touches && event.touches.length > 1) handler(event);
  }, { passive: false });
}