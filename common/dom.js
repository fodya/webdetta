/**
 * @module
 */
import { objectPick } from "@webdetta/common/object";
import { fileToDatauri } from "@webdetta/convert";

/** @type {Promise<Event | void>} */
export const windowLoaded = new Promise((resolve) => {
  globalThis?.window?.addEventListener("load", resolve);
});

/** @type {Promise<Event | void>} */
export const contentLoaded = new Promise((resolve) => {
  globalThis?.window?.addEventListener("DOMContentLoaded", resolve);
});

/**
 * @param {string} name
 * @returns {string}
 */
export const toAttributeName = (name) => {
  let res = "";
  for (let i = 0; i < name.length; i++) {
    const c = name[i];
    res += c >= "A" && c <= "Z" ? (i === 0 ? "" : "-") + c.toLowerCase() : c;
  }
  return res;
};

/**
 * @param {string} name
 * @returns {string}
 */
export const toCssPropertyName = (name) => {
  let res = "";
  for (let i = 0; i < name.length; i++) {
    const c = name[i];
    res += c >= "A" && c <= "Z" ? "-" + c.toLowerCase() : c;
  }
  return res;
};

/**
 * @param {string} color
 * @returns {void}
 */
export const setThemeColor = (color) => {
  const c = String(color ?? "").trim();
  if (!c) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", c);
};

/**
 * @param {string} text
 * @returns {Promise<void>}
 */
export const copyText = async (text) => {
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

    document.execCommand("copy");
    node.remove();
  }
};

/**
 * @typedef {Partial<CSSStyleDeclaration> | CSSStyleDeclaration} TextStyle
 */

/**
 * @param {string} text
 * @param {TextStyle} [style]
 * @returns {{ width: number; height: number }}
 */
export const measureText = (text, style = {}) => {
  const div = measureText.div ??= document.createElement("div");
  Object.assign(div.style, {
    position: "fixed",
    left: "-99999px",
    top: "-99999px",
    visibility: "hidden",
    pointerEvents: "none",
  });

  const keys = style instanceof CSSStyleDeclaration
    ? style
    : Object.keys(style);
  for (const k of ["width", "height"]) delete div.style[k];
  for (const k of keys) div.style[k] = style[k];
  div.textContent = text;

  document.body.append(div);
  const rect = div.getBoundingClientRect();
  div.remove();
  return { width: rect.width, height: rect.height };
};

/**
 * @param {Object} options
 * @param {string} options.text
 * @param {HTMLElement} options.element
 * @param {Partial<CSSStyleDeclaration>} [options.style]
 * @param {boolean} [options.multiline]
 * @returns {void}
 */
export const autogrowInput = ({
  text,
  element,
  style = {},
  multiline = false,
}) => {
  const keys = [
    "letter-spacing",
    "padding",
    "margin",
    "font",
    "font-family",
    "word-break",
    "white-space",
    "display",
    "perspective-origin",
    "transform-origin",
  ];
  keys.push(multiline ? "width" : "height");

  const measurement = measureText(text + (multiline ? "." : ""), {
    ...objectPick(getComputedStyle(element), keys),
    ...style,
  });

  const result = multiline ? "height" : "width";
  element.style[result] = measurement[result] + "px";
};

/**
 * @param {string} filename
 * @param {Blob} blob
 * @returns {Promise<void>}
 */
export const downloadBlob = async (filename, blob) => {
  const link = downloadBlob.link ??= document.createElement("a");
  link.style = "display: none";
  document.body.append(link);

  const ua = navigator?.userAgent || "";
  const useDatauri = typeof URL?.createObjectURL !== "function" ||
    /iPad|iPhone|iPod/.test(ua) && !/\bcrios\b/i.test(ua);

  const url = useDatauri
    ? await fileToDatauri(blob)
    : URL.createObjectURL(blob);
  link.href = url;
  link.target = "_blank";
  link.download = filename;
  link.click();
  if (!useDatauri) {
    await Promise.resolve();
    URL.revokeObjectURL(url);
  }
};

/**
 * @param {string} colorStr
 * @returns {string}
 */
export const colorToHex = (colorStr) => {
  const ctx = colorToHex.ctx ??= document.createElement("canvas").getContext(
    "2d",
  );
  ctx.fillStyle = colorStr;
  return ctx.fillStyle;
};

/**
 * @typedef {Object} ObjectFitOptions
 * @property {number} containerWidth
 * @property {number} containerHeight
 * @property {number} width
 * @property {number} height
 * @property {number} [aspectRatio]
 * @property {"contain" | "cover"} [mode]
 */

/**
 * @param {ObjectFitOptions} options
 * @returns {number}
 */
export const objectFit = ({
  containerWidth,
  containerHeight,
  width,
  height,
  aspectRatio,
  mode = "contain",
}) => {
  if (containerWidth <= 0 || containerHeight <= 0) return 1;

  const base = width > 0 ? width : height > 0 ? height : 0;
  if (!(base > 0)) return 1;

  const baseW = aspectRatio ? (width > 0 ? base : base * aspectRatio) : width;

  const baseH = aspectRatio ? (width > 0 ? base / aspectRatio : base) : height;

  const sW = containerWidth / baseW;
  const sH = containerHeight / baseH;

  return mode === "cover" ? Math.max(sW, sH) : Math.min(sW, sH);
};

const overflowRegex = /(auto|scroll|overlay)/;

/**
 * @param {Node | null | undefined} node
 * @returns {Element}
 */
export const getScrollContainer = (node) => {
  while (node && node !== document.body) {
    if (node.nodeType === 1) {
      const s = getComputedStyle(node);
      if (
        overflowRegex.test(s.overflowY) && node.scrollHeight > node.clientHeight
      ) return node;
      if (
        overflowRegex.test(s.overflowX) && node.scrollWidth > node.clientWidth
      ) return node;
    }
    node = node.parentNode;
  }
  return document.scrollingElement ?? document.documentElement;
};

/**
 * @param {Node | null | undefined} node
 * @returns {number}
 */
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

/**
 * @param {Element} container
 * @returns {void}
 */
export const preventPinchZoom = (container) => {
  const handler = (event) => event.preventDefault();
  container.addEventListener("gesturestart", handler, { passive: false });
  container.addEventListener("gesturechange", handler, { passive: false });
  container.addEventListener("gestureend", handler, { passive: false });
  container.addEventListener("touchmove", (event) => {
    if (event.scale !== undefined && event.scale !== 1) handler(event);
    if (event.touches && event.touches.length > 1) handler(event);
  }, { passive: false });
};
