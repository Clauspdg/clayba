export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Platform-agnostic persistence hook. Web apps can pass a `localStorage`
 * wrapper; native apps pass an `AsyncStorage` wrapper. Omit entirely for
 * in-memory-only (no persistence).
 */
export interface ThemeStorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}
