/**
 * Internationalization utility for translating UI texts
 * @example ./examples/index.example.js
 * @module
 */
/**
 * @typedef {string | ((...args: unknown[]) => unknown)} TranslationLeaf
 */

/**
 * @typedef {Object.<string, TranslationLeaf | TranslationNode>} TranslationNode
 */

/**
 * @typedef {Object} I18NOptions
 * @property {string} fallbackLang
 * @property {Record<string, TranslationNode>} translations
 * @property {(key: string) => unknown} [onNotFound]
 */

/**
 * @typedef {Object} I18NInstance
 * @property {(key: string, ...args: unknown[]) => unknown} call
 * @property {(strings: TemplateStringsArray, ...args: unknown[]) => unknown} tagged
 * @property {(v?: string) => string | undefined} lang
 */

/**
 * @param {I18NOptions} options
 * @returns {I18NInstance & ((key: string, ...args: unknown[]) => unknown) & ((strings: TemplateStringsArray, ...args: unknown[]) => unknown)}
 * @example ./examples/basic.example.js
 */
export const I18N = ({
  fallbackLang,
  translations,
  onNotFound = (key) => {
    throw new Error(`Translation not found for key: ${key}.`);
  },
}) => {
  let lang;

  const definition = (key, lang) => {
    return [...key.split("."), lang].reduce((obj, k) => obj?.[k], translations);
  };

  const translate = (...args) => {
    if (Array.isArray(args[0].raw)) args = [String.raw(...args)];

    if (args.length == 0) throw new Error("Arguments must not be empty.");
    const key = args[0];
    const def = definition(key, lang) ?? definition(key, fallbackLang);
    if (!def) return onNotFound(key);

    return args.length == 1 ? def : def(...args.slice(1));
  };

  return Object.assign(translate, {
    lang(v) {
      if (v) lang = v;
      return lang;
    },
  });
};
