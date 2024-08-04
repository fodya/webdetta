export default (
  typeof window?.document != null
  ? 'browser' :

  process?.versions?.node != null
  ? 'node' :

  // https://github.com/jsdom/jsdom/issues/1537#issuecomment-229405327
  window?.name === 'nodejs' ||
  (navigator?.userAgent ?? '').includes('Node.js') ||
  (navigator?.userAgent ?? '').includes('jsdom')
  ? 'jsdom' :

  Deno?.version?.deno != null
  ? 'deno' :

  // https://bun.sh/guides/util/detect-bun
  process?.versions?.bun != null
  ? 'bun' :

  undefined
);
