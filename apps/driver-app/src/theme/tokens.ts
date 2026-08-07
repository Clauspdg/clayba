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
 */
export const colors = {
  brand: "#CB562C",
  brandForeground: "#FFFFFF",
  brandLight: "#E4A34E",
  accent: "#BA966E",
  neutral0: "#FFFFFF",
  neutral50: "#FAF9F7",
  neutral100: "#F3F1EE",
  neutral200: "#E7E3DD",
  neutral400: "#A69C8E",
  neutral500: "#7D7468",
  neutral700: "#56564E",
  neutral900: "#262420",
  neutral950: "#171512",
  danger: "#DC2626",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 9999,
} as const;
