/** 4px base grid. Semantic aliases for both Tailwind config and native `StyleSheet` use. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96,
} as const;

export type SpacingToken = keyof typeof spacing;
