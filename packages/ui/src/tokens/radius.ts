/** Sprint UI 1.0: larger, softer corners — `lg`/`xl` match `packages/config/tailwind/base.ts`'s `borderRadius.lg`/`.xl`. */
export const radius = {
  none: 0,
  sm: 8,
  md: 14,
  lg: 16, // 1rem — matches Tailwind's `rounded-lg`
  xl: 28,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
