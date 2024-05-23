export const safe = f => (...args) => {
  try { return f(...args); }
  catch (e) { console.error(e); }
}

export const saveBlob = (() => {
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  return (filename, blob) => {
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
})();

export const fetchImageSize = (url) => new Promise((resolve) => {
  const img = document.createElement('img');
  img.src = url;
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
}).then(img => (
  img
  ? { width: img.naturalWidth, height: img.naturalHeight }
  : { width: 0, height: 0 }
));

export const importSrc = async src => {
  const type = src.endsWith('.css') ? 'css' : 'js';
  let elem;
  if (type == 'js') {
    elem = document.createElement('script');
    elem.src = src;
  }
  if (type == 'css') {
    elem = document.createElement('link');
    elem.rel = 'stylesheet';
    elem.href = src;
  }
  document.head.append(elem);
  return new Promise(r => elem.onload = r);
};
const importedSources = {};
export async function importSources(srcList) {
    for (const src of srcList) {
        const type = src.endsWith('.css') ? 'css' : 'js';
        if (!importedSources[src]) importedSources[src] = await importSource[type](src);
    }
    await new Promise(r => setTimeout(r, 0));
}
