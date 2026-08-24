/**
 * Native-safe design tokens, mirroring `packages/ui/src/tokens/colors.ts`.
 *
 * These are NOT imported from `@the-ride/ui` because that package's
 * component barrel pulls in Radix UI and `lucide-react` — both assume a
 * DOM environment and are not safe to bundle into a React Native/Metro
 * app. Duplicating this small, rarely-changing set of values is the
 * pragmatic trade-off documented in docs/ui-architecture.md, rather than
 * introducing a new cross-platform UI architecture (e.g. react-native-web)
 * mid-sprint.
 *
 * Same semantic, theme-aware palette as `apps/driver-app/src/theme/tokens.ts`
 * — one CLAYBA design system shared across both native apps, not a second
 * one invented for Passenger. Components should read colors from
 * `getPalette(resolvedTheme)` (via `usePalette()`), not from the raw scale
 * directly, so every screen shares one real light/dark contract.
 */
export const colors = {
  brand: "#CB562C",
  brandLight: "#E4A34E",
  brandForeground: "#FFFFFF",
  accent: "#BA966E",
  /** CLAYBA Navy — the app icon/splash hero color, distinct from the dark-mode surface scale below. Welcome-screen decorative use only. */
  navy: "#071B31",
  neutral0: "#FFFFFF",
  neutral50: "#FAF9F7",
  neutral100: "#F3F1EE",
  neutral200: "#E7E3DD",
  neutral400: "#A69C8E",
  neutral500: "#7D7468",
  neutral700: "#56564E",
  neutral900: "#262420",
  neutral950: "#171512",
  // Dark-theme-only surfaces — a true near-black/graphite scale (not the
  // warm-brown scale, which reads as "beige inverted" rather than a
  // premium dark UI).
  graphite900: "#090B0D",
  graphite800: "#14171A",
  graphite700: "#1C2024",
  graphite600: "#262B30",
  success: "#1F9254",
  successBg: "#0F2A1C",
  successBgLight: "#E7F6ED",
  warning: "#C77A1E",
  warningBg: "#3A2A0F",
  warningBgLight: "#FCF1DF",
  danger: "#DC2626",
  dangerBg: "#3A1414",
  dangerBgLight: "#FDECEA",
} as const;

export type ThemeName = "light" | "dark";

export interface Palette {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  primary: string;
  primaryPressed: string;
  primaryForeground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
}

const lightPalette: Palette = {
  background: "#F6F7F8",
  surface: colors.neutral0,
  surfaceElevated: colors.neutral0,
  border: colors.neutral200,
  primary: colors.brand,
  primaryPressed: "#B34924",
  primaryForeground: colors.brandForeground,
  textPrimary: colors.neutral900,
  textSecondary: colors.neutral700,
  textMuted: colors.neutral500,
  success: "#15803D",
  successBg: colors.successBgLight,
  warning: "#A15C0F",
  warningBg: colors.warningBgLight,
  danger: colors.danger,
  dangerBg: colors.dangerBgLight,
};

const darkPalette: Palette = {
  background: colors.graphite900,
  surface: colors.graphite800,
  surfaceElevated: colors.graphite700,
  border: colors.graphite600,
  primary: colors.brandLight,
  primaryPressed: "#D6A93E",
  primaryForeground: colors.graphite900,
  textPrimary: colors.neutral0,
  textSecondary: "#CFC7BA",
  textMuted: colors.neutral400,
  success: "#4ADE80",
  successBg: colors.successBg,
  warning: "#F0A93E",
  warningBg: colors.warningBg,
  danger: "#F87171",
  dangerBg: colors.dangerBg,
};

export function getPalette(theme: ThemeName): Palette {
  return theme === "dark" ? darkPalette : lightPalette;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const typography = {
  /** Big balance/fare numbers. */
  displaySize: 34,
  /** Screen title (e.g. a tab's top-of-screen heading). */
  titleSize: 30,
  /** Section heading within a screen. */
  headingSize: 21,
  subheadingSize: 17,
  bodySize: 15,
  captionSize: 13,
} as const;

/** Cross-platform elevation — `elevation` (Android) is unitless, `shadow*` (iOS) needs real values; both point at the same visual weight per level. */
export const elevation = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

export const buttonHeight = { md: 48, lg: 56 } as const;
export const iconSize = { sm: 16, md: 20, lg: 24, xl: 32 } as const;
