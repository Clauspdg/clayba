/** Durations in ms, easing as CSS cubic-bezier strings (also valid for RN `Easing.bezier`). */
export const duration = {
  fast: 120,
  normal: 200,
  slow: 320,
} as const;

export const easing = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  decelerate: "cubic-bezier(0, 0, 0.2, 1)",
  accelerate: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

/** Named CSS transition presets for web components (`transition: var(--x)`-free — used directly as class values via Tailwind arbitrary properties or inline style). */
export const transition = {
  fast: `all ${duration.fast}ms ${easing.standard}`,
  normal: `all ${duration.normal}ms ${easing.standard}`,
  slow: `all ${duration.slow}ms ${easing.standard}`,
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
