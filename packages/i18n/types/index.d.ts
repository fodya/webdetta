/**
 * Minimal internationalization helper for translating UI strings.
 *
 * @example
 * ```js
 * import { I18N } from '@webdetta/core/i18n';
 *
 * const t = I18N({
 *   fallbackLang: 'en',
 *   translations: {
 *     en: { hello: 'Hello, {0}' },
 *     fr: { hello: 'Bonjour, {0}' },
 *   },
 * });
 * t.lang('fr');
 * t('hello', 'world'); // 'Bonjour, world'
 * ```
 *
 * @module
 */

/** Configuration for an {@link I18N} instance. */
export type I18NOptions = {
  /** Language used when the current language has no translation for a key. */
  fallbackLang: string;
  /** Nested translation map: `{ [lang]: { [key]: value } }`. */
  translations: Record<string, any>;
  /** Handler invoked when a key is missing in both the current and fallback language. */
  onNotFound?: (key: string) => any;
};

/** Callable translator: look up a key (with positional args) or use as a tagged template. */
export type I18NInstance = {
  (key: string, ...args: any[]): any;
  (strings: TemplateStringsArray, ...args: any[]): any;
  /** Gets or sets the current language. */
  lang(v?: string): string | undefined;
};

/** Creates a new {@link I18NInstance} from the given options. */
export const I18N: (options: I18NOptions) => I18NInstance;
