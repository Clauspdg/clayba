/**
 * Single source of truth for color (Sprint UI 1.0 — "THE RIDE" brand
 * migration, replacing the Sprint 2 placeholder blue). `brand.DEFAULT` /
 * `brand.foreground` match the values in `packages/config/tailwind/base.ts`
 * — that file is Tailwind's CSS-generation-time mirror of this exact
 * palette, kept in sync by hand (see that file's own comment for why it
 * can't just import this one).
 *
 * Palette source: the official brand reference (warm terracotta orange +
 * gold + tan on a warm charcoal neutral scale, replacing the old cool-gray
 * scale) — see docs/design-system.md.
 *
 * Web consumes these via Tailwind utility classes (see
 * `packages/config/tailwind/base.ts`, which extends `theme.colors` with
 * this exact palette) plus the `dark:` variant for theme switching.
 * Native apps have no Tailwind, so `themes.light` / `themes.dark` below
 * give driver-app/passenger-app the same semantic colors as plain hex
 * values to use directly in `StyleSheet` (mirrored by hand into each
 * native app's own `src/theme/tokens.ts` — see that file's comment).
 */
export const brand = {
  50: "#FBEEE7",
  100: "#F6DAC9",
  200: "#EEBB9A",
  300: "#E4A34E",
  400: "#D97D3D",
  500: "#CB562C",
  600: "#B34823",
  700: "#93391C",
  800: "#742D16",
  900: "#542012",
  DEFAULT: "#CB562C",
  foreground: "#FFFFFF",
} as const;

/** Secondary brand accent (warm tan/gold) — subtle tints, illustration backgrounds, secondary highlights. Not a status color. */
export const accent = {
  50: "#FAF4EC",
  100: "#F0E2CC",
  200: "#E4CBA3",
  300: "#D3AF7C",
  400: "#C5A17A",
  500: "#BA966E",
  600: "#9C7C59",
  700: "#7D6247",
  800: "#5E4A36",
  900: "#3F3124",
  DEFAULT: "#BA966E",
  foreground: "#2A2015",
} as const;

/** Warm neutral scale (replaces the old cool blue-gray) — anchored on the brand charcoal `#56564E`. */
export const neutral = {
  0: "#FFFFFF",
  50: "#FAF9F7",
  100: "#F3F1EE",
  200: "#E7E3DD",
  300: "#D3CCC2",
  400: "#A69C8E",
  500: "#7D7468",
  600: "#5F584D",
  700: "#56564E",
  800: "#3A372F",
  900: "#262420",
  950: "#171512",
} as const;

/**
 * CLAYBA brand assets integration — the "deep navy" background the
 * approved CLAYBA reference assets (logo lockups, app icons, splash
 * screens) are presented on. Sampled directly from the approved
 * `assets/brand/reference/clayba-symbol-original-concept-reference.png`
 * asset, not invented. Used for icon/splash backgrounds specifically —
 * NOT a replacement for the existing warm-charcoal `neutral.950` dark UI
 * theme, which this migration doesn't touch.
 */
export const navy = { DEFAULT: "#0B1A2D", foreground: "#FFFFFF" } as const;

export const success = { DEFAULT: "#16A34A", foreground: "#FFFFFF" } as const;
export const warning = { DEFAULT: "#D97706", foreground: "#FFFFFF" } as const;
export const danger = { DEFAULT: "#DC2626", foreground: "#FFFFFF" } as const;
export const info = { DEFAULT: "#0891B2", foreground: "#FFFFFF" } as const;

export const colors = { brand, accent, neutral, navy, success, warning, danger, info } as const;

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
