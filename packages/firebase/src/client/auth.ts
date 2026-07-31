import type { AuthClaims } from "@the-ride/types";
import { onIdTokenChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type Auth } from "firebase/auth";

import { parseAuthClaims } from "../auth/claims";

/**
 * Structurally identical to `@the-ride/hooks`'s `SessionUser`/`AuthAdapter`
 * (never imported directly — see that package's `auth.types.ts` for why:
 * `@the-ride/firebase` staying independent of `@the-ride/hooks` avoids a
 * backwards, lower-level-depends-on-higher-level dependency; both already
 * depend on `@the-ride/types` independently, which is where `AuthClaims`
 * actually lives, so the consuming app's structural check against
 * `@the-ride/hooks`'s `SessionUser` just works).
 */
export interface ClientSessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  claims: AuthClaims;
}

export interface ClientAuthAdapter {
  observeSession(callback: (session: ClientSessionUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

/**
 * Builds the Firebase-backed auth adapter every app passes into
 * `@the-ride/hooks`'s `<AuthProvider adapter={...}>` (Sprint 5, Part 2).
 * Uses `onIdTokenChanged` rather than `onAuthStateChanged` so a server-side
 * role change (`assignUserRole` + `revokeUserSessions`) is picked up on the
 * next natural token refresh without requiring a full re-login.
 */
export function createFirebaseAuthAdapter(auth: Auth): ClientAuthAdapter {
  return {
    observeSession(callback) {
      return onIdTokenChanged(auth, async (user) => {
        if (!user) {
          callback(null);
          return;
        }
        const tokenResult = await user.getIdTokenResult();
        const claims = parseAuthClaims({
          uid: user.uid,
          role: tokenResult.claims.role,
          permissions: tokenResult.claims.permissions,
        });
        callback({ uid: user.uid, email: user.email, displayName: user.displayName, claims });
      });
    },
    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signOut() {
      await firebaseSignOut(auth);
    },
  };
}
