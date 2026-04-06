import { S, cached } from './utils.js';
import { objectPick } from './object.js';

const regexAZ = /[A-Z]/g;
export const kebab = cached(s =>
  s.replaceAll(regexAZ, c => '-' + c.toLowerCase())
);

export const copyText = async text => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
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

  document.documentElement.append(div);
  const keys = style instanceof CSSStyleDeclaration ? style : Object.keys(style);
  for (const k of ['width', 'height']) div.style[k] = '';
  for (const k of keys) div.style[k] = style[k];
  div.textContent = text;
  // const zoom = +style.zoom || 1;
  const { scrollHeight: height, scrollWidth: width } = div;
  div.remove();
  return { width, height };
}
export const autogrowInput = ({
  element,
  text,
  multiline,
  whiteSpace='pre-wrap'
}) => {
  const keys = S`
    letter-spacing padding margin font font-family word-break white-space
    display perspective-origin transform-origin
  `;
  keys.push(multiline ? 'width' : 'height');
  const style = objectPick(getComputedStyle(element), keys);
  style.whiteSpace = whiteSpace;
  const measurement = measureText(text + (multiline ? '.' : ''), style);
  if (multiline) element.style.height = measurement.height + 'px';
  else element.style.width = measurement.width + 'px';
  element.style.overflow = 'hidden';
}

export const saveBlob = (filename, blob) => {
  const link = saveBlob.a ??= document.createElement("a");
  link.style = "display: none";

  document.documentElement.append(link);
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const importAsset = (tagName, attrs) => new Promise((resolve) => {
  const el = document.createElement(tagName);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.head.append(el);
  el.onload = () => (resolve(el), el.remove());
  el.onerror = () => (resolve(null), el.remove());
});

export const colorToHex = (colorStr) => {
  const canvasCtx = colorToHex.ctx ??= document.createElement('canvas').getContext('2d')
  canvasCtx.fillStyle = colorStr;
  return canvasCtx.fillStyle;
}

export const forceReflow = elem => { elem.offsetHeight; }

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

export const isEventInside = (event, target) => {
  return event.composedPath().includes(target);
}

export const L = new Promise(resolve => {
  globalThis?.window?.addEventListener('load', resolve);
});
export const DCL = new Promise(resolve => {
  globalThis?.window?.addEventListener('DOMContentLoaded', resolve);
});
