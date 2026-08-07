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
  /** Sprint 6, Part 2 ("Upload profile picture") — the Firebase Auth profile photo URL, null until set. */
  photoURL: string | null;
  /** Web Phase W1, Part 3 ("Email Verification"). `false` for backends that never set it (native apps don't currently require verified email). */
  emailVerified: boolean;
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
  /**
   * Optional (Web Phase W1, Part 3) — the admin dashboard and native apps
   * don't self-register/reset-password/verify-email through this adapter
   * (admin users are provisioned server-side; native apps haven't needed
   * this yet), so these are opt-in rather than breaking every existing
   * `AuthAdapter` implementation. `useAuth()`'s wrappers throw a clear
   * error if a caller invokes one an adapter doesn't implement.
   */
  signUp?(email: string, password: string, displayName?: string): Promise<void>;
  sendPasswordReset?(email: string): Promise<void>;
  confirmPasswordReset?(code: string, newPassword: string): Promise<void>;
  sendEmailVerification?(): Promise<void>;
  /** Applies an email-verification action code (the `oobCode` query param on the link Firebase emails). */
  applyActionCode?(code: string): Promise<void>;
  /** Re-fetches the current user's data (e.g. after they verify their email in another tab) and re-emits it via `observeSession`. */
  reloadUser?(): Promise<void>;
  /** Updates the signed-in user's display name (the Profile page's "edit profile"). */
  updateDisplayName?(displayName: string): Promise<void>;
  /** Updates the signed-in user's profile photo URL (Sprint 6, Part 2: "Upload profile picture"). */
  updatePhotoURL?(photoURL: string): Promise<void>;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  session: SessionUser | null;
  status: AuthStatus;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  applyActionCode: (code: string) => Promise<void>;
  reloadUser: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updatePhotoURL: (photoURL: string) => Promise<void>;
}
