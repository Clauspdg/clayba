# Mobile App Boot Architecture (CLAYBA Driver P0.2)

## Why this exists

`playba-driver-v0.1.0.apk` shipped with `EXPO_PUBLIC_FIREBASE_*` undefined
in the release build (see the P0 report) — fixed by configuring those as
real EAS project environment variables. `clayba-driver-v0.1.1.apk`, built
with that fix, was installed and tested on a **real physical Android
device** and still showed a blank white screen on launch. The config was
real; the boot _architecture_ was still wrong.

## Root cause (evidence-based, not yet logcat-confirmed)

`apps/driver-app/src/app/_layout.tsx` used to statically
`import { driverAuthAdapter, ... } from "@/lib/firebase-client"` at the
top of the file. That module statically imports
`@the-ride/firebase/client/native-persistence`, which itself statically
imports `getReactNativePersistence` from `@firebase/auth`, resolved
through that package's `"react-native"` `package.json` export condition.
`native-persistence.ts`'s own comment says this resolution was verified
by requesting **Metro's dev-server bundle** directly — never confirmed
against a real `eas build`/`expo export` release bundle, which can
resolve package `exports` conditions differently.

If any module in that static chain throws while being evaluated — wrong
export condition pulling in a browser-only Firebase Auth entry point that
touches a DOM global Hermes doesn't have, an AsyncStorage native-module
timing issue under the New Architecture (`newArchEnabled: true`), etc. —
the failure happens **before React renders a single frame**. No error
boundary can catch a crash inside a static `import` statement; boundaries
only catch errors thrown by code that actually runs.

This is a real, plausible, code-evidenced hypothesis. It has **not** been
confirmed by `adb logcat` against a real device yet — see the P0.2 final
report for what's actually been verified versus what's still inferred.

## Architecture: before → after

**Before**: `_layout.tsx` statically imported `@the-ride/hooks` and
`@/lib/firebase-client` at module scope. `RootLayout` synchronously called
`ThemeProvider`/`I18nProvider` (each of which is safe on its own — see
below) wrapping an error boundary and a Firebase-error check — but the
error boundary and the check were both _inside_ those providers, so a
crash during the static import chain, or during either provider's own
synchronous work, had nothing above it to catch it.

**After**: `_layout.tsx`'s first render uses **only React Native core
primitives** (`View`, `Text`, `ActivityIndicator`, `Pressable` from
`react-native` directly — no `@the-ride/*` package, no AsyncStorage, no
Firebase). Nothing risky is imported statically. A `useEffect` — which by
definition only runs _after_ that first frame has committed — then
dynamically `import()`s `@the-ride/hooks`, `@/lib/firebase-client`, and
everything else, inside a `try/catch`. Metro's dynamic-`import()` support
defers the actual `require()` (and therefore that module's top-level
evaluation) until the `import()` call executes at runtime, not at bundle
parse time — so a crash anywhere in that chain now happens inside code
this file controls and can catch, surfacing as a real "CLAYBA Driver
couldn't start" screen instead of a blank one. Once everything resolves
successfully, the real provider tree (`ThemeProvider` → `I18nProvider` →
`AuthProvider` → `Stack`) mounts.

`ThemeProvider`/`I18nProvider` (`packages/hooks`) were independently
audited and are _not_ implicated: both render `children` synchronously on
first render using default/local state, only touching `AsyncStorage` (via
an injected adapter) inside a non-blocking `useEffect`. They were moved
behind the dynamic-import gate anyway, purely so nothing at all sits above
the boot error boundary.

## Splash screen lifecycle

`expo-splash-screen` was not previously installed — the native splash
relied entirely on Expo's default auto-hide-on-first-mount behavior, with
no explicit control over the handoff between "native splash visible" and
"JS has actually painted something." Now installed and wired:
`SplashScreen.preventAutoHideAsync()` runs at module scope (before
`RootLayout` is even defined, per the package's own documented usage
pattern); `SplashScreen.hideAsync()` runs in a `useEffect` tied to
`BootingView`'s own first commit — the earliest point at which something
real is guaranteed to be behind it.

## Boot sequence (current)

```
Native launch
  → native splash (app.json: navy #0B1A2D + symbol, now via the
    expo-splash-screen config plugin)
  → RootLayout's first render (zero external deps) commits
  → SplashScreen.hideAsync() — "CLAYBA Driver / Starting..." + stage list
  → dynamic import() of hooks/firebase-client/router/etc. (try/catch'd)
  → Firebase init result checked (driverFirebaseInitError)
  → success → mount ThemeProvider/I18nProvider/AuthProvider/Stack
  → index.tsx: session status resolves (or times out after 6s) → /home or /welcome
  → failure at any stage → visible "CLAYBA Driver couldn't start" screen, Retry button
```

No stage can block the first frame; no failure is silent.
