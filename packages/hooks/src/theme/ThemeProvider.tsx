"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { ResolvedTheme, ThemeContextValue, ThemeMode, ThemeStorageAdapter } from "./theme.types";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function defaultGetSystemTheme(): ResolvedTheme {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** @default "system" */
  defaultMode?: ThemeMode;
  /** @default "ride-theme-mode" */
  storageKey?: string;
  storage?: ThemeStorageAdapter;
  /**
   * How to resolve "system" mode. Defaults to a web `matchMedia` check
   * (falls back to "light" where unavailable). Native apps should pass
   * something backed by React Native's `Appearance.getColorScheme()`.
   */
  getSystemTheme?: () => ResolvedTheme;
  /** e.g. toggling `document.documentElement.classList` on web. */
  onResolvedThemeChange?: (theme: ResolvedTheme) => void;
}

export function ThemeProvider({
  children,
  defaultMode = "system",
  storageKey = "ride-theme-mode",
  storage,
  getSystemTheme = defaultGetSystemTheme,
  onResolvedThemeChange,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!storage) return;
      const stored = await storage.getItem(storageKey);
      if (!cancelled && (stored === "light" || stored === "dark" || stored === "system")) {
        setModeState(stored);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [storage, storageKey]);

  const resolvedTheme = useMemo<ResolvedTheme>(() => (mode === "system" ? getSystemTheme() : mode), [mode, getSystemTheme]);

  useEffect(() => {
    onResolvedThemeChange?.(resolvedTheme);
  }, [resolvedTheme, onResolvedThemeChange]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    void storage?.setItem(storageKey, next);
  };

  const value = useMemo<ThemeContextValue>(() => ({ mode, resolvedTheme, setMode }), [mode, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
