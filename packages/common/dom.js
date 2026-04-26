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

export const constrainedZoomValue = ({
  containerWidth,
  containerHeight,
  width,
  height,
  aspectRatio,
}) => {
  const containerAspectRatio = containerWidth / containerHeight;
  const containerZoom = Math.min(...[
    width > 0 ? containerWidth / width : null,
    height > 0 ? containerHeight / height : null
  ].filter(Boolean));

  if (!Number.isFinite(containerZoom)) return 1;
  if (!aspectRatio) return containerZoom;
  
  if (containerAspectRatio > aspectRatio) {
    const heightConstrainedZoom = containerZoom * aspectRatio / containerAspectRatio;
    return Math.min(containerZoom, heightConstrainedZoom);
  }
  if (containerZoom < 1 || containerAspectRatio < aspectRatio) {
    return containerZoom;
  }

  return 1;
}

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