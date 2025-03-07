import { toFn } from './utils.js';
const DEBUG = 0;

const regexAZ = /[A-Z]/g;
const kebabCache = {};
export const kebab = s => kebabCache[s] ??= s.replaceAll(regexAZ, c => '-' + c.toLowerCase());

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
  pointerEvents: 'none',
  ...(DEBUG ? {
    zIndex: 9999,
    visibility: 'visible',
    top: 0,
    left: 0,
    background: 'white',
  } : {})
});
export const measureText = (text, style={}) => {
  document.documentElement.append(dummyDiv);
  const keys = style instanceof CSSStyleDeclaration ? style : Object.keys(style);
  for (const k of ['width', 'height']) dummyDiv.style[k] = '';
  for (const k of keys) dummyDiv.style[k] = style[k];
  dummyDiv.textContent = text;
  const zoom = +style.zoom || 1;
  const { scrollHeight: height, scrollWidth: width } = dummyDiv;
  dummyDiv.remove();
  return { width, height };
}

const dummyAnchor = document.createElement("a");
dummyAnchor.style = "display: none";
export const saveBlob = (filename, blob) => {
  document.documentElement.append(dummyAnchor);
  const url = window.URL.createObjectURL(blob);
  dummyAnchor.href = url;
  dummyAnchor.download = filename;
  dummyAnchor.click();
  window.URL.revokeObjectURL(url);
};

export const blobToDatauri = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});
export const fileToDatauri = blobToDatauri;

export const datauriToBlob = datauri => fetch(datauri).then(res => res.blob());

export const jsonToFormdata = (json, formData=new FormData(), parentKey='') => {
  const isObject = json && typeof json === 'object' && !(json instanceof File);
  const isArray = Array.isArray(json);
  if (isObject) for (const key of Object.keys(json)) {
    const fullKey = parentKey ? `${parentKey}[${key}]` : key;
    jsonToFormdata(json[key], formData, isArray ? parentKey : fullKey);
  }
  else formData.append(parentKey, json);
  return formData;
}

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
}) => {
  containerWidth = toFn(containerWidth);
  containerHeight = toFn(containerHeight);
  width = toFn(width);
  const update = () => {
    const ar = containerWidth() / containerHeight();
    const zoom = containerWidth() / width();
    container.style.zoom =
      !aspectRatio ? zoom :
      ar > aspectRatio ? Math.min(zoom, zoom * aspectRatio / ar) :
      zoom < 1 || ar < aspectRatio ? zoom :
      1;
    container.style.width = width() + 'px';
  }
  window.addEventListener('resize', update);
  window.addEventListener('DOMContentLoaded', update);
}

export const isEventInside = (event, target) => {
  return event.composedPath().includes(target);
}

export const L = new Promise(r => window.addEventListener('load', r));
export const DCL = new Promise(r => window.addEventListener('DOMContentLoaded', r));
