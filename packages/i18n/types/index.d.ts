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
 *     checkout: {
 *       title: { en: 'Checkout', fr: 'Paiement' },
 *       total: {
 *         en: (amount) => `Total: $${amount}`,
 *         fr: (amount) => `Total : ${amount} €`,
 *       },
 *     },
 *   },
 *   onNotFound: (key) => {
 *     console.warn('missing translation', key);
 *     return key;
 *   },
 * });
 * t.lang('fr');
 *
 * titleNode.textContent = t('checkout.title');
 * totalNode.textContent = t('checkout.total', 42);
 * ```
 *
 * @module
 */

/** Configuration for an {@link I18N} instance. */
export type TranslationLeaf = string | ((...args: unknown[]) => unknown);
export type TranslationNode = {
  [key: string]: TranslationLeaf | TranslationNode;
};

/** Configuration for an {@link I18N} instance. */
export type I18NOptions = {
  /** Language used when the current language has no translation for a key. */
  fallbackLang: string;
  /** Nested translation map: `{ [key]: { [key]: ... { [lang]: value } }`. */
  translations: Record<string, TranslationNode>;
  /** Handler invoked when a key is missing in both the current and fallback language. */
  onNotFound?: (key: string) => unknown;
};

/** Callable translator: look up a key (with positional args) or use as a tagged template. */
export type I18NInstance = {
  (key: string, ...args: unknown[]): unknown;
  (strings: TemplateStringsArray, ...args: unknown[]): unknown;
  /** Gets or sets the current language. */
  lang(v?: string): string | undefined;
};

/** Creates a new {@link I18NInstance} from the given options. */
export const I18N: (options: I18NOptions) => I18NInstance;
