export const copyText = text => navigator.clipboard.writeText(text);

const a = document.createElement("a");
document.head.appendChild(a);
a.style = "display: none";
export const saveBlob = (filename, blob) => {
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const fileToDatauri = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

export const datauriToBlob = datauri => fetch(datauri).then(res => res.blob());

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
