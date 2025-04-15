import { register } from "node:module";
register(import.meta.url, { parentURL: import.meta.url });

export async function resolve(specifier, context, defaultResolve) {
  return (
    !['/', './', '../'].some(c => specifier.startsWith(c))
    ? defaultResolve(specifier, { parentURL: import.meta.url })
    : defaultResolve(specifier, context, defaultResolve)
  );
}

export function load(url, context, defaultLoad) {
  return (
    ['http://', 'https://'].some(c => url.startsWith(c))
    ? fetch(url).then(res => res.text()).then(text => ({
      format: 'module',
      source: text,
      shortCircuit: true
    }))
    : defaultLoad(url, context, defaultLoad)
  );
}
