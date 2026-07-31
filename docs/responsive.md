# Responsive System (Sprint 2)

## Breakpoints — one source of truth

`packages/utils/src/responsive/breakpoints.ts`:

```ts
export const BREAKPOINTS = { mobile: 0, tablet: 640, laptop: 1024, desktop: 1280 };
```

Chosen to match Tailwind's own default `sm`/`lg`/`xl` pixel values, so
there's no numeric drift between the CSS breakpoints web actually uses and
the values a native `useBreakpoint()` hook resolves against.

## Web: Tailwind

`packages/config/tailwind/base.ts` adds three named breakpoints
(`tablet`, `laptop`, `desktop`) to `theme.extend.screens`, alongside
Tailwind's own defaults (`sm`/`md`/`lg`/`xl`/`2xl`, still available).
Responsive layout is expressed the ordinary Tailwind way throughout
`apps/web` and `apps/admin` — e.g. the dashboard's placeholder cards:

```tsx
<div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
```

This alone covers **Desktop / Laptop / Tablet / Mobile** from Part 7.

## Native: `useBreakpoint` / `useOrientation`

React Native has no media queries, so `@the-ride/hooks` exposes two hooks
mirroring the same breakpoint set:

```ts
const breakpoint = useBreakpoint();          // web: tracks window.innerWidth automatically
const breakpoint = useBreakpoint(width);     // native: pass useWindowDimensions().width explicitly

const orientation = useOrientation();        // "portrait" | "landscape"
```

Both default to tracking the web `window` object with zero setup; on
native, the consuming screen passes React Native's own
`useWindowDimensions()` value in, following the same dependency-injection
pattern as `ThemeProvider`'s `storage`/`getSystemTheme` (see
[theme.md](./theme.md)) — `packages/hooks` never imports `react-native`
directly, keeping it safe to import from web too.

This covers **Landscape / Portrait** from Part 7. Neither mobile app's
screens currently branch on orientation — Part 3/4's screens are simple
enough (forms, lists) that the OS's own default portrait layout suffices;
`useOrientation` is available for whichever screen needs it once richer
layouts (e.g. a future map view) are built.

## Related Docs

- [Design System](./design-system.md)
- [UI Architecture](./ui-architecture.md)
- [Theme](./theme.md)
