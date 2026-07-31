/** `md` matches the `borderRadius.lg` value already set in `packages/config/tailwind/base.ts` since Sprint 0. */
export const radius = {
  none: 0,
  sm: 4,
  md: 12, // 0.75rem
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
