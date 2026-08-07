/**
 * Elevation tokens. Web and React Native express shadows completely
 * differently (a single CSS `box-shadow` string vs. four/five separate
 * style properties), so each level carries both representations.
 */
export interface ElevationLevel {
  /** CSS `box-shadow` value for web. */
  web: string;
  /** React Native shadow + Android `elevation` style properties. */
  native: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

/** Sprint UI 1.0: softer, more diffused "premium" shadows on a warm shadow tint (`#262420`, the new neutral-900) instead of flat black. Web values match `packages/config/tailwind/base.ts`'s `boxShadow.elevation1-4`. */
export const elevation: Record<"none" | "sm" | "md" | "lg" | "xl", ElevationLevel> = {
  none: {
    web: "none",
    native: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
  sm: {
    web: "0 2px 8px -2px rgb(38 36 32 / 0.06)",
    native: {
      shadowColor: "#262420",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  },
  md: {
    web: "0 8px 24px -4px rgb(38 36 32 / 0.10), 0 2px 8px -2px rgb(38 36 32 / 0.06)",
    native: {
      shadowColor: "#262420",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
  },
  lg: {
    web: "0 16px 40px -8px rgb(38 36 32 / 0.14), 0 4px 12px -4px rgb(38 36 32 / 0.08)",
    native: {
      shadowColor: "#262420",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 7,
    },
  },
  xl: {
    web: "0 24px 64px -12px rgb(38 36 32 / 0.18), 0 8px 20px -8px rgb(38 36 32 / 0.10)",
    native: {
      shadowColor: "#262420",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 32,
      elevation: 12,
    },
  },
};

export type ElevationToken = keyof typeof elevation;
