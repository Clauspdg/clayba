import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Persistence } from "firebase/auth";
// @firebase/auth exports `getReactNativePersistence` only behind its
// package.json "react-native" export condition (see `dist/rn/index.rn.d.ts`)
// — Expo SDK 52's `expo/tsconfig.base` still uses classic `moduleResolution:
// "node"`, which ignores conditional exports entirely, so `tsc` can't see
// this export even though Metro (which *does* apply the "react-native"
// condition) resolves it correctly at runtime and bundle time. Verified by
// requesting this file's Metro bundle directly — see docs/authentication.md.
// @ts-expect-error — see comment above; not resolvable under classic "node" moduleResolution, but real at runtime.
import { getReactNativePersistence } from "@firebase/auth";

/**
 * React Native session persistence (Sprint 5, Part 2) — isolated in its own
 * module so `apps/web`/`apps/admin` (which never import this file) don't
 * need `@react-native-async-storage/async-storage` as a dependency. Only
 * `apps/driver-app`/`apps/passenger-app` call this, passing the result into
 * `getClientAuth()`.
 */
export function getExpoAuthPersistence(): Persistence {
  return getReactNativePersistence(AsyncStorage) as Persistence;
}
