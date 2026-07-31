"use client";

import { I18nProvider, type Locale } from "@the-ride/hooks";
import type { ReactNode } from "react";

const webStorage = {
  getItem: (key: string) => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
};

export interface RideI18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

/** Web composition of `@the-ride/hooks`' platform-agnostic `I18nProvider`, persisting the chosen locale to `localStorage`. */
export function RideI18nProvider({ children, defaultLocale = "en" }: RideI18nProviderProps) {
  return (
    <I18nProvider defaultLocale={defaultLocale} storage={webStorage}>
      {children}
    </I18nProvider>
  );
}

export { useTranslation } from "@the-ride/hooks";
