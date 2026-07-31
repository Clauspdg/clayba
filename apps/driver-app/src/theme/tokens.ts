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
  brand: "#0F62FE",
  brandForeground: "#FFFFFF",
  neutral0: "#FFFFFF",
  neutral50: "#F9FAFB",
  neutral100: "#F3F4F6",
  neutral200: "#E5E7EB",
  neutral400: "#9CA3AF",
  neutral500: "#6B7280",
  neutral700: "#374151",
  neutral900: "#111827",
  neutral950: "#030712",
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
  sm: 4,
  md: 12,
  lg: 16,
  full: 9999,
} as const;
