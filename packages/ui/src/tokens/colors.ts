/**
 * Single source of truth for color (Sprint 2, Part 2). `brand.DEFAULT` /
 * `brand.foreground` match the values already set in
 * `packages/config/tailwind/base.ts` since Sprint 0 — this file expands
 * that starting point into a full scale, it doesn't replace it.
 *
 * Web consumes these via Tailwind utility classes (see
 * `packages/config/tailwind/base.ts`, which extends `theme.colors` with
 * this exact palette) plus the `dark:` variant for theme switching.
 * Native apps have no Tailwind, so `themes.light` / `themes.dark` below
 * give driver-app/passenger-app the same semantic colors as plain hex
 * values to use directly in `StyleSheet`.
 */
export const brand = {
  50: "#EFF6FF",
  100: "#DBEAFE",
  200: "#BFDBFE",
  300: "#93C5FD",
  400: "#60A5FA",
  500: "#0F62FE",
  600: "#0D55DB",
  700: "#0A44AF",
  800: "#083585",
  900: "#06265F",
  DEFAULT: "#0F62FE",
  foreground: "#FFFFFF",
} as const;

export const neutral = {
  0: "#FFFFFF",
  50: "#F9FAFB",
  100: "#F3F4F6",
  200: "#E5E7EB",
  300: "#D1D5DB",
  400: "#9CA3AF",
  500: "#6B7280",
  600: "#4B5563",
  700: "#374151",
  800: "#1F2937",
  900: "#111827",
  950: "#030712",
} as const;

export const success = { DEFAULT: "#16A34A", foreground: "#FFFFFF" } as const;
export const warning = { DEFAULT: "#D97706", foreground: "#FFFFFF" } as const;
export const danger = { DEFAULT: "#DC2626", foreground: "#FFFFFF" } as const;
export const info = { DEFAULT: "#0891B2", foreground: "#FFFFFF" } as const;

export const colors = { brand, neutral, success, warning, danger, info } as const;

export interface SemanticColorSet {
  background: string;
  foreground: string;
  surface: string;
  surfaceForeground: string;
  border: string;
  muted: string;
  mutedForeground: string;
}

/** For native `StyleSheet` consumption — pick the set matching the resolved theme. */
export const themes: { light: SemanticColorSet; dark: SemanticColorSet } = {
  light: {
    background: neutral[0],
    foreground: neutral[900],
    surface: neutral[50],
    surfaceForeground: neutral[900],
    border: neutral[200],
    muted: neutral[100],
    mutedForeground: neutral[500],
  },
  dark: {
    background: neutral[950],
    foreground: neutral[50],
    surface: neutral[900],
    surfaceForeground: neutral[50],
    border: neutral[800],
    muted: neutral[800],
    mutedForeground: neutral[400],
  },
};
