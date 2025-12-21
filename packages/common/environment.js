let globals;
try { globals = globalThis; }
catch (e) { globals = this; }

const get = (...path) => {
  let obj = globals;
  for (const k of path) {
    if (typeof obj != 'object' || obj == null) return null;
    obj = obj[k];
  }
  return obj;
}

export const runtime = (
  get('window', 'document') != null
  ? 'browser' :

  get('process', 'versions', 'node') != null
  ? 'node' :

  get('self', 'constructor', 'name') === 'DedicatedWorkerGlobalScope'
  ? 'webworker' :

  // https://github.com/jsdom/jsdom/issues/1537#issuecomment-229405327
  get('window', 'name') === 'nodejs' ||
  ['Node.js', 'jsdom']
    .some(d => String(get('navigator', 'userAgent') ?? '').includes(d))
  ? 'jsdom' :

  get('Deno', 'version', 'deno') != null
  ? 'deno' :

  // https://bun.sh/guides/util/detect-bun
  get('process', 'versions', 'bun') != null
  ? 'bun' :

  undefined
);

export const isMobile = (() => {
  const list = [
    'Android', 'webOS', 'iPhone', 'iPad', 'iPod',
    'BlackBerry', 'Windows Phone', 'Opera Mini', 'IEMobile'
  ];
  return list.some(d => String(get('navigator', 'userAgent') ?? '').includes(d));
})();
