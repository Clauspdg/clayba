"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { DEFAULT_LOCALE, type Locale, type TranslationDictionary } from "./translations.types";

const DICTIONARIES: Record<Locale, TranslationDictionary> = { en, fr };

function resolveKey(dictionary: TranslationDictionary, key: string): string | undefined {
  let current: string | TranslationDictionary | undefined = dictionary;
  for (const part of key.split(".")) {
    if (typeof current !== "object" || current === null) return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) => (token in params ? String(params[token]) : match));
}

/** Same platform-agnostic persistence pattern as `ThemeStorageAdapter`. */
export interface I18nStorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
}

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: ReactNode;
  /** @default "en" */
  defaultLocale?: Locale;
  /** @default "ride-locale" */
  storageKey?: string;
  storage?: I18nStorageAdapter;
}

export function I18nProvider({ children, defaultLocale = DEFAULT_LOCALE, storageKey = "ride-locale", storage }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!storage) return;
      const stored = await storage.getItem(storageKey);
      if (!cancelled && (stored === "en" || stored === "fr")) {
        setLocaleState(stored);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [storage, storageKey]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    void storage?.setItem(storageKey, next);
  };

  const t = useMemo(() => {
    const dictionary = DICTIONARIES[locale];
    const fallback = DICTIONARIES[DEFAULT_LOCALE];
    return (key: string, params?: Record<string, string | number>) => interpolate(resolveKey(dictionary, key) ?? resolveKey(fallback, key) ?? key, params);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
