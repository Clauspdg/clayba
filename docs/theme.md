# Theme (Sprint 2)

## Tokens — one source of truth, two representations

`packages/ui/src/tokens/` is the canonical definition of every design
token (Part 2):

| File | Contains |
| --- | --- |
| `colors.ts` | `brand` (matches Sprint 0's `#0F62FE`), `neutral` scale, `success`/`warning`/`danger`/`info`, plus `themes.light`/`themes.dark` semantic sets for native `StyleSheet` use |
| `spacing.ts` | 4px-grid semantic scale (`xs`…`4xl`) |
| `radius.ts` | `sm`/`md`/`lg`/`xl`/`full` (`md` = Sprint 0's `0.75rem`) |
| `typography.ts` | Font family (system stack — see Part 10), size scale, weights, line-heights |
| `shadows.ts` | `elevation.{none,sm,md,lg,xl}`, each with **both** a CSS `box-shadow` string and an RN shadow-style object |
| `animation.ts` | Durations, easing curves, transition presets |
| `breakpoints.ts` | Re-exports `BREAKPOINTS` from `@the-ride/utils` (the real source) |
| `icons.ts` | Curated `lucide-react` icon registry |

`packages/config/tailwind/base.ts` mirrors the color/radius/shadow/font
values into Tailwind's `theme.extend` — see the comment at the top of that
file for why it's a mirror rather than an import (avoiding a workspace
dependency cycle between `@the-ride/ui` and `@the-ride/config`).
`apps/driver-app` and `apps/passenger-app` each carry their own small
mirrored `src/theme/tokens.ts` for the same structural reason (Radix/
lucide-react in `@the-ride/ui`'s barrel aren't native-safe) — see
[ui-architecture.md](./ui-architecture.md).

## Light / dark / brand

- **Brand** is the *constant* layer — `brand.DEFAULT` (`#0F62FE`) doesn't
  change between light and dark mode. It's the identity color.
- **Light/dark** are the *adaptive* layer — background/surface/text/border
  colors that flip. On web this is handled entirely by Tailwind's
  `darkMode: "class"` (already configured in Sprint 0) plus `dark:`
  variant classes throughout `packages/ui`'s components — no JS branching
  needed for color, just CSS. On native, components read
  `useTheme().resolvedTheme` and pick from `colors.neutral0`/
  `colors.neutral950` etc. directly (no CSS classes exist in RN).

## `ThemeProvider` (`@the-ride/hooks`)

Platform-agnostic: `mode` is `"light" | "dark" | "system"`,
`resolvedTheme` is always `"light" | "dark"`. Two things are injected
per-platform rather than hardcoded:

- **`storage`** — `{ getItem, setItem }`, backed by `localStorage` on web
  (`RideThemeProvider` in `packages/ui`) or `AsyncStorage` on native
  (wired directly in each app's `_layout.tsx`).
- **`getSystemTheme`** — defaults to a web `matchMedia` check; native apps
  pass one backed by `Appearance.getColorScheme()`.

`onResolvedThemeChange` lets the web wrapper toggle
`document.documentElement.classList` when the resolved theme changes —
native components don't need this since they re-render directly off
`useTheme()`.

## `ThemeSwitcher` component

A three-way (light/dark/system) segmented control
(`packages/ui/src/components/theme-switcher`) wired directly to
`useTheme()`. Every visible label is a required prop (`lightLabel`,
`darkLabel`, `systemLabel`) — see
[internationalization.md](./internationalization.md).

## Related Docs

- [Design System](./design-system.md)
- [UI Architecture](./ui-architecture.md)
- [Responsive](./responsive.md)
