import type { AuthClaims } from "@the-ride/types";

/**
 * The signed-in user's identity plus their role/permission claims — the
 * shared shape every app's `AuthProvider` exposes, regardless of which
 * backend supplied it. See docs/authentication.md.
 */
export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  claims: AuthClaims;
}

/**
 * Dependency-injected auth backend (Sprint 5, Part 2) — mirrors the
 * `ThemeProvider`'s `storage`/`getSystemTheme` injection pattern
 * (`packages/hooks/src/theme/ThemeProvider.tsx`) so this package never
 * depends on `firebase`/`@the-ride/firebase` directly. Each app constructs
 * a real adapter (`@the-ride/firebase/client`'s `createFirebaseAuthAdapter`)
 * and passes it in; that keeps `@the-ride/hooks` framework/backend-agnostic
 * and free of platform-specific (web vs. Expo) persistence code.
 */
export interface AuthAdapter {
  /**
   * Subscribes to session changes, including token refreshes (not just
   * sign-in/out) — so a server-side role change picked up on the next
   * natural token refresh doesn't require a full re-login. Returns an
   * unsubscribe function.
   */
  observeSession(callback: (session: SessionUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  session: SessionUser | null;
  status: AuthStatus;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
