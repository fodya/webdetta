export type I18NOptions = {
  fallbackLang: string;
  translations: Record<string, any>;
  onNotFound?: (key: string) => any;
};

export type I18NInstance = {
  (key: string, ...args: any[]): any;
  (strings: TemplateStringsArray, ...args: any[]): any;
  lang(v?: string): string | undefined;
};

export const I18N: (options: I18NOptions) => I18NInstance;
