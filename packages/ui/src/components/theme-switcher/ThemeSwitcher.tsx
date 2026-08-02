"use client";

import { useState } from "react";
import { useTheme, type ThemeMode } from "@the-ride/hooks";

import { Icon } from "../icon/Icon";
import { IconButton } from "../icon-button/IconButton";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/Popover";
import type { IconName } from "../../tokens/icons";
import { cn } from "../../utils/cn";

const OPTIONS: { mode: ThemeMode; icon: IconName }[] = [
  { mode: "light", icon: "sun" },
  { mode: "dark", icon: "moon" },
  { mode: "system", icon: "monitor" },
];

const TRIGGER_ICON: Record<ThemeMode, IconName> = { light: "sun", dark: "moon", system: "monitor" };

export interface ThemeSwitcherProps {
  lightLabel: string;
  darkLabel: string;
  systemLabel: string;
}

/**
 * Single icon button that opens a small dropdown with Light/Dark/System
 * (UI/UX polish sprint) — replaces the earlier three-button segmented
 * control. Same props/call sites as before (`AdminHeader`,
 * `PassengerHeader`, `SiteHeader`, the passenger settings page) so nothing
 * around it needed to change; this is a drop-in internal swap.
 */
export function ThemeSwitcher({ lightLabel, darkLabel, systemLabel }: ThemeSwitcherProps) {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const labels: Record<ThemeMode, string> = {
    light: lightLabel,
    dark: darkLabel,
    system: systemLabel,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton label={labels[mode]} size="md">
          <Icon name={TRIGGER_ICON[mode]} size={18} />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1.5" role="menu" aria-label={labels[mode]}>
        {OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            role="menuitemradio"
            aria-checked={mode === option.mode}
            onClick={() => {
              setMode(option.mode);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
              mode === option.mode &&
                "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200",
            )}
          >
            <Icon name={option.icon} size={16} className="shrink-0" />
            <span className="flex-1 text-left">{labels[option.mode]}</span>
            {mode === option.mode && <Icon name="check" size={14} className="shrink-0" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
