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

const ua = String(get('navigator', 'userAgent') ?? '');
const uaTest = str => ua.includes(str);

export const runtime = (
  get('window', 'document') != null
  ? 'browser' :

  get('process', 'versions', 'node') != null
  ? 'node' :

  get('self', 'constructor', 'name') === 'DedicatedWorkerGlobalScope'
  ? 'webworker' :

  // https://github.com/jsdom/jsdom/issues/1537#issuecomment-229405327
  get('window', 'name') === 'nodejs' || uaTest('Node.js') || uaTest('jsdom')
  ? 'jsdom' :

  get('Deno', 'version', 'deno') != null
  ? 'deno' :

  // https://bun.sh/guides/util/detect-bun
  get('process', 'versions', 'bun') != null
  ? 'bun' :

  undefined
);
export const isClientRuntime = ['browser', 'webworker', 'jsdom'].includes(runtime);
export const isServerRuntime = !isClientRuntime;

export const browser = (
  uaTest('Edg/') ? 'edge' :
  uaTest('OPR/') || uaTest('Opera') ? 'opera' :
  uaTest('SamsungBrowser/') ? 'samsung' :
  uaTest('Firefox/') ? 'firefox' :
  uaTest('Chrome/') || uaTest('CriOS/') ? 'chrome' :
  uaTest('Safari/') ? 'safari' :
  undefined
);
export const isMobileBrowser = [
  'Android', 'webOS', 'iPhone', 'iPad', 'iPod',
  'BlackBerry', 'Windows Phone', 'Opera Mini', 'IEMobile'
].some(uaTest);
