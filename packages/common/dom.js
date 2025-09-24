import { toFn, objectPick, S, cached } from './utils.js';

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

const dummyDiv = document.createElement('div');
Object.assign(dummyDiv.style, {
  position: 'fixed',
  left: '-99999px',
  top: '-99999px',
  visibility: 'hidden',
  pointerEvents: 'none'
});
export const measureText = (text, style={}) => {
  document.documentElement.append(dummyDiv);
  const keys = style instanceof CSSStyleDeclaration ? style : Object.keys(style);
  for (const k of ['width', 'height']) dummyDiv.style[k] = '';
  for (const k of keys) dummyDiv.style[k] = style[k];
  dummyDiv.textContent = text;
  // const zoom = +style.zoom || 1;
  const { scrollHeight: height, scrollWidth: width } = dummyDiv;
  dummyDiv.remove();
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

const dummyAnchor = document.createElement("a");
dummyAnchor.style = "display: none";
export const saveBlob = (filename, blob) => {
  document.documentElement.append(dummyAnchor);
  const url = URL.createObjectURL(blob);
  dummyAnchor.href = url;
  dummyAnchor.download = filename;
  dummyAnchor.click();
  URL.revokeObjectURL(url);
};

export const importAsset = (tagName, attrs) => new Promise((resolve) => {
  const el = document.createElement(tagName);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.head.append(el);
  el.onload = () => (resolve(el), el.remove());
  el.onerror = () => (resolve(null), el.remove());
});

const canvasCtx = document.createElement('canvas').getContext('2d');
export const colorToHex = (colorStr) => {
  canvasCtx.fillStyle = colorStr;
  return canvasCtx.fillStyle;
}

export const forceReflow = elem => { elem.offsetHeight; }

export const setLayoutWidth = ({
  width,
  container=document.body,
  containerWidth=()=>window.innerWidth,
  containerHeight=()=>window.innerHeight,
  aspectRatio=null,
  method="zoom"
}) => {
  containerWidth = toFn(containerWidth);
  containerHeight = toFn(containerHeight);
  width = toFn(width);
  const update = () => {
    const ar = containerWidth() / containerHeight();
    const zoom = containerWidth() / width();
    const zoomValue =
      !aspectRatio ? zoom :
      ar > aspectRatio ? Math.min(zoom, zoom * aspectRatio / ar) :
      zoom < 1 || ar < aspectRatio ? zoom :
      1;
    
    container.style.width = width() + 'px';
    if (method == 'zoom') {
      container.style.zoom = zoomValue;
    }
    if (method == 'scale') {
      container.style.transform = `scale(${zoomValue})`;
      container.style.transformOrigin = `0 0`;
    }
  }
  window.addEventListener('resize', update);
  window.addEventListener('DOMContentLoaded', update);
}

export const isEventInside = (event, target) => {
  return event.composedPath().includes(target);
}

export const L = new Promise(r => window.addEventListener('load', r));
export const DCL = new Promise(r => window.addEventListener('DOMContentLoaded', r));
