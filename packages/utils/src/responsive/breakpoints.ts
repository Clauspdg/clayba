/**
 * Single source of truth for responsive breakpoints (Sprint 2, Part 2/7).
 * Matches Tailwind's own default scale so `packages/config/tailwind/base.ts`
 * doesn't need to redeclare these — Tailwind's defaults already line up.
 * Consumed directly (no CSS) by `useBreakpoint`/`useOrientation` in
 * `@the-ride/hooks` for React Native, which has no media-query concept.
 */
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 640,
  laptop: 1024,
  desktop: 1280,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/** Resolves the largest breakpoint whose minimum width is <= the given width. */
export function getBreakpointForWidth(width: number): BreakpointName {
  const ordered = (Object.entries(BREAKPOINTS) as [BreakpointName, number][]).sort((a, b) => b[1] - a[1]);
  for (const [name, minWidth] of ordered) {
    if (width >= minWidth) return name;
  }
  return "mobile";
}
