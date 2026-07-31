"use client";

import { LOCALES, LOCALE_LABELS, useTranslation } from "@the-ride/hooks";

import { Select } from "../select/Select";

export interface LanguageSelectorProps {
  /** Accessible label for the field, e.g. t("common.selectLanguage"). */
  label: string;
}

export function LanguageSelector({ label }: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();

  return (
    <Select
      label={label}
      value={locale}
      onValueChange={(next) => setLocale(next as (typeof LOCALES)[number])}
      options={LOCALES.map((code) => ({ value: code, label: LOCALE_LABELS[code] }))}
    />
  );
}
