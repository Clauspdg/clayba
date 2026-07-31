"use client";

import { ThemeProvider, type ThemeMode } from "@the-ride/hooks";
import type { ReactNode } from "react";

const webStorage = {
  getItem: (key: string) => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
};

function applyThemeClass(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export interface RideThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

/** Web composition of `@the-ride/hooks`' platform-agnostic `ThemeProvider`: persists to `localStorage` and toggles the `dark` class Tailwind's `darkMode: "class"` config expects. */
export function RideThemeProvider({ children, defaultMode = "system" }: RideThemeProviderProps) {
  return (
    <ThemeProvider defaultMode={defaultMode} storage={webStorage} onResolvedThemeChange={applyThemeClass}>
      {children}
    </ThemeProvider>
  );
}

export { useTheme } from "@the-ride/hooks";
