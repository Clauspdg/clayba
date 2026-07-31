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

export const elevation: Record<"none" | "sm" | "md" | "lg" | "xl", ElevationLevel> = {
  none: {
    web: "none",
    native: { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  },
  sm: {
    web: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    native: { shadowColor: "#000000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  },
  md: {
    web: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    native: { shadowColor: "#000000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  },
  lg: {
    web: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    native: { shadowColor: "#000000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 },
  },
  xl: {
    web: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    native: { shadowColor: "#000000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  },
};

export type ElevationToken = keyof typeof elevation;
