/**
 * Brand typeface: Poppins (Sprint UI 1.0 — see docs/design-system.md).
 * Web apps load the real font via `next/font/google` (see each app's root
 * layout) and expose it as the `--font-poppins` CSS variable that
 * `packages/config/tailwind/base.ts`'s `fontFamily.sans` references first,
 * falling back to the system stack below. Native apps load it via
 * `expo-font`/`@expo-google-fonts/poppins` (see each app's root layout)
 * and reference the family name directly — see `PoppinsFontFamily` below.
 */
export const fontFamily = {
  sans: "'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

/** Native (Expo) font family names, once `@expo-google-fonts/poppins` is loaded via `useFonts()`. */
export const nativeFontFamily = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
