export const I18N = (fallbackLang, translations) => {
  let lang;

  const definition = (key, lang) => {
    let obj = translations;
    for (const k of key.split('.')) obj = obj?.[k];
    return obj;
  }

  const translate = (...args) => {
    if (Array.isArray(args[0].raw)) args = [String.raw(...args)];

    if (args.length == 0) throw new Error('Arguments must not be empty.');
    const key = args[0];
    const def = definition(lang, key) ?? definition(fallbackLang, key);
    if (!def) throw new Error(`Translation not found for key: ${key}.`);

    return args.length == 1
      ? def
      : def(...args.slice(1));
  }

  return Object.assign(translate, {
    lang(v) { if (v) lang = v; return lang; },
  })
}
