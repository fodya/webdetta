// @ts-self-types="./types/index.d.ts"
export const I18N = ({
  fallbackLang,
  translations,
  onNotFound = (key) => {
    throw new Error(`Translation not found for key: ${key}.`);
  }
}) => {
  let lang;

  const definition = (key, lang) => {
    return [...key.split('.'), lang].reduce((obj, k) => obj?.[k], translations);
  }

  const translate = (...args) => {
    if (Array.isArray(args[0].raw)) args = [String.raw(...args)];

    if (args.length == 0) throw new Error('Arguments must not be empty.');
    const key = args[0];
    const def = definition(key, lang) ?? definition(key, fallbackLang);
    if (!def) return onNotFound(key);

    return args.length == 1
      ? def
      : def(...args.slice(1));
  }

  return Object.assign(translate, {
    lang(v) { if (v) lang = v; return lang; },
  })
}
