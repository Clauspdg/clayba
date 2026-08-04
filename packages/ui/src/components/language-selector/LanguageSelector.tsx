"use client";

import { useState } from "react";
import { LOCALES, LOCALE_LABELS, useTranslation } from "@the-ride/hooks";

import { Icon } from "../icon/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/Popover";
import { cn } from "../../utils/cn";

export interface LanguageSelectorProps {
  /** Accessible name for the trigger button and popover, e.g. t("common.selectLanguage") — not rendered as visible text. */
  label: string;
}

/**
 * Compact locale trigger ("FR"/"EN") that opens a small dropdown with
 * Français/English (UI/UX polish sprint, point 2) — mirrors `ThemeSwitcher`'s
 * exact pattern (same trigger height, radius, popover size/placement,
 * animation) instead of the old always-expanded `Select` showing a visible
 * "Choisir la langue" label and the full language name. Same `label` prop
 * as before, now used purely as the accessible name rather than rendered
 * text, so every call site (`AdminHeader`, `PassengerHeader`, `SiteHeader`)
 * needed no changes.
 */
export function LanguageSelector({ label }: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="duration-fast focus-visible:ring-brand inline-flex h-10 min-w-[52px] shrink-0 items-center justify-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {locale}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1.5" role="menu" aria-label={label}>
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            role="menuitemradio"
            aria-checked={locale === code}
            onClick={() => {
              setLocale(code);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
              locale === code && "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200",
            )}
          >
            <span className="flex-1 text-left">{LOCALE_LABELS[code]}</span>
            {locale === code && <Icon name="check" size={14} className="shrink-0" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
