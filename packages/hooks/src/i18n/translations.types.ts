export type Locale = "en" | "fr";
export const LOCALES: Locale[] = ["en", "fr"];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

/** Deeply nested string dictionary — keys are dot-path addressed by `t()`. */
export type TranslationDictionary = { [key: string]: string | TranslationDictionary };
