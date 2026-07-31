"use client";

import { useTheme, type ThemeMode } from "@the-ride/hooks";

import { Icon } from "../icon/Icon";
import type { IconName } from "../../tokens/icons";
import { cn } from "../../utils/cn";

const OPTIONS: { mode: ThemeMode; icon: IconName }[] = [
  { mode: "light", icon: "sun" },
  { mode: "dark", icon: "moon" },
  { mode: "system", icon: "monitor" },
];

export interface ThemeSwitcherProps {
  lightLabel: string;
  darkLabel: string;
  systemLabel: string;
}

export function ThemeSwitcher({ lightLabel, darkLabel, systemLabel }: ThemeSwitcherProps) {
  const { mode, setMode } = useTheme();
  const labels: Record<ThemeMode, string> = { light: lightLabel, dark: darkLabel, system: systemLabel };

  return (
    <div role="radiogroup" aria-label={lightLabel} className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          role="radio"
          aria-checked={mode === option.mode}
          aria-label={labels[option.mode]}
          onClick={() => setMode(option.mode)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors dark:text-neutral-400",
            mode === option.mode && "bg-white text-neutral-900 shadow-elevation1 dark:bg-neutral-900 dark:text-neutral-50",
          )}
        >
          <Icon name={option.icon} size={16} />
        </button>
      ))}
    </div>
  );
}
