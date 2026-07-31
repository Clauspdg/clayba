# UI Architecture (Sprint 2)

## Package layering

Sprint 1 established `types -> utils -> firebase -> api`. Sprint 2 adds
the UI-facing branch on top of the same foundation, with no cycles:

```
utils  (breakpoints — pure constants)
  -> hooks  (ThemeProvider, I18nProvider, useBreakpoint/useOrientation — pure React, zero DOM/RN imports)
       -> ui  (design system: tokens + Radix/Tailwind components; depends on hooks + utils)
            -> apps/web, apps/admin
```

`packages/hooks` is the layer that's genuinely shared across **every**
app, web and native alike — its theme/i18n/responsive code has zero
DOM-specific or React-Native-specific imports, only plugging in a platform
storage adapter via dependency injection (see [theme.md](./theme.md) and
[internationalization.md](./internationalization.md)).

## Why `packages/ui` is web-only

`packages/ui`'s component layer uses Radix UI (`@radix-ui/react-*`) and
`lucide-react` for accessibility and icons. Both assume a DOM environment.
`driver-app`/`passenger-app` (Expo/React Native, bundled by Metro) do
**not** import `@the-ride/ui` — doing so would pull the entire barrel,
including those DOM-dependent packages, into a Metro bundle that has no
`document`/`window` and a completely different host-component set (`View`/
`Text` instead of `div`/`span`).

Building true cross-platform components (via `react-native-web`,
`NativeWind`, or a headless library like Tamagui) is a real, valid
architecture — but it's a new architectural decision this sprint's brief
explicitly says not to make ("DO NOT modify the architecture"). Instead:

- **Design tokens** (`packages/ui/src/tokens/`) are pure data — no React,
  no DOM. They're the actual "one source of truth" for color/spacing/
  radius/typography/shadows values (Part 2).
- Each native app has a **small local set of primitives**
  (`src/components/{Screen,AppText,AppButton,AppTextField,AppCard}.tsx`)
  built directly on React Native's own `View`/`Text`/`Pressable`/
  `TextInput`, styled via `StyleSheet` using a **mirrored, minimal token
  file** (`src/theme/tokens.ts` — brand color, a handful of neutrals,
  spacing, radius). Mirroring ~15 constants across two files is a small,
  deliberate, low-maintenance trade-off, clearly commented at the top of
  each `tokens.ts`, versus building new cross-platform tooling. It is
  **not** shared between `driver-app` and `passenger-app` either, for the
  same reason: there's no existing shared native package to put it in, and
  creating one is itself an architecture decision out of scope here.
- What genuinely IS shared with native, with zero duplication: `useTheme`,
  `useTranslation`, `useBreakpoint`, `useOrientation` — all from
  `@the-ride/hooks`, imported identically by web and native.

If a future sprint wants literal component-level sharing, the natural next
step is `react-native-web` behind a platform-extension split
(`Button.tsx` for web, `Button.native.tsx` for native, both under one
`@the-ride/ui` export) — that's a real architecture change and belongs in
its own sprint, not smuggled into this one.

## Provider composition

Both Next.js apps use one shared composition, `RideProviders`
(`packages/ui/src/providers/RideProviders.tsx`), instead of duplicating
the nesting order in each app's root layout:

```
RideThemeProvider -> RideI18nProvider -> ToastProvider -> TooltipProvider -> children
```

`RideThemeProvider`/`RideI18nProvider` are web-specific compositions of
the platform-agnostic providers in `@the-ride/hooks`, wiring up
`localStorage` persistence and (for theme) toggling the `dark` class on
`<html>` that Tailwind's `darkMode: "class"` config expects.

Native apps compose the same underlying `@the-ride/hooks` providers
directly in `_layout.tsx`, with `AsyncStorage` in place of `localStorage`
and `Appearance.getColorScheme()` in place of `matchMedia` for system
theme detection.

## Admin auth/role-gating (placeholder)

Part 6 asks for "Authentication" and "Role Protection" as part of the
dashboard shell, but this sprint explicitly forbids backend changes and
business logic. What exists:

- `apps/admin/src/lib/auth-context.tsx` — an `AdminAuthProvider` holding a
  **hardcoded placeholder user** (`Role.ADMIN`, from Sprint 1's
  `@the-ride/types`). There is no real session, no Firebase call.
- `apps/admin/src/components/RoleGuard.tsx` — checks that placeholder
  user's role against Sprint 1's real `hasRole()` (`@the-ride/utils`) and
  `Role` enum. The *mechanism* is real and reusable; the *data* is a stub.
- `/login` renders a real form with `preventDefault()` on submit — no
  network call.

Wiring this to `@the-ride/firebase/auth`'s `verifyIdToken`/session cookies
is a natural next step once a sprint is scoped to build real admin CRUD —
at that point this is a data-source swap inside `auth-context.tsx`, not a
UI rewrite.

## Route-group conflict avoidance

Both `apps/web`'s landing page and `apps/admin`'s dashboard home page stay
at their app's `src/app/page.tsx` rather than moving into a route group
(`(marketing)`/`(dashboard)`) that would otherwise also want a `page.tsx`
at the same URL — Next.js treats two `page.tsx` files resolving to the
same path as a build error. Route groups are used for the *other* pages in
each app, which don't collide.

## Related Docs

- [Design System](./design-system.md)
- [Theme](./theme.md)
- [Responsive](./responsive.md)
- [Internationalization](./internationalization.md)
- [Navigation](./navigation.md)
- [Architecture (Sprint 1)](./architecture-sprint1.md)
