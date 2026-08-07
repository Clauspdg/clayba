import { Role, type AuthClaims } from "@the-ride/types";
import {
  applyActionCode as firebaseApplyActionCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";

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
  photoURL: string | null;
  emailVerified: boolean;
  claims: AuthClaims;
}

export interface ClientAuthAdapter {
  observeSession(callback: (session: ClientSessionUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  signUp(email: string, password: string, displayName?: string): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(code: string, newPassword: string): Promise<void>;
  sendEmailVerification(): Promise<void>;
  applyActionCode(code: string): Promise<void>;
  reloadUser(): Promise<void>;
  updateDisplayName(displayName: string): Promise<void>;
  updatePhotoURL(photoURL: string): Promise<void>;
}

async function toSessionUser(user: User): Promise<ClientSessionUser> {
  const tokenResult = await user.getIdTokenResult();
  // A brand-new sign-up has no custom claims yet — the role custom claim is
  // only ever set server-side (`assignUserRole`, via a Cloud Functions auth
  // trigger this project doesn't deploy yet — see docs/authentication.md).
  // Defaulting a role-less token to the least-privileged role (Passenger)
  // is a safe, fail-closed stopgap: it never grants access a real claim
  // wouldn't, and every new web sign-up genuinely starts as a passenger —
  // "becoming a driver" is a Firestore application process layered on top,
  // not a role a client could legitimately self-assign anyway.
  const claims = parseAuthClaims({
    uid: user.uid,
    role: tokenResult.claims.role ?? Role.PASSENGER,
    permissions: tokenResult.claims.permissions,
  });
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    claims,
  };
}

/**
 * Builds the Firebase-backed auth adapter every app passes into
 * `@the-ride/hooks`'s `<AuthProvider adapter={...}>` (Sprint 5, Part 2;
 * extended for self-service sign-up/password-reset/email-verification in
 * Web Phase W1, Part 3). Uses `onIdTokenChanged` rather than
 * `onAuthStateChanged` so a server-side role change (`assignUserRole` +
 * `revokeUserSessions`) is picked up on the next natural token refresh
 * without requiring a full re-login.
 */
export function createFirebaseAuthAdapter(auth: Auth): ClientAuthAdapter {
  return {
    observeSession(callback) {
      return onIdTokenChanged(auth, async (user) => {
        if (!user) {
          callback(null);
          return;
        }
        callback(await toSessionUser(user));
      });
    },
    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signOut() {
      await firebaseSignOut(auth);
    },
    async signUp(email, password, displayName) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }
      await firebaseSendEmailVerification(credential.user);
    },
    async sendPasswordReset(email) {
      await sendPasswordResetEmail(auth, email);
    },
    async confirmPasswordReset(code, newPassword) {
      await firebaseConfirmPasswordReset(auth, code, newPassword);
    },
    async sendEmailVerification() {
      if (!auth.currentUser) throw new Error("No signed-in user to send a verification email to.");
      await firebaseSendEmailVerification(auth.currentUser);
    },
    async applyActionCode(code) {
      await firebaseApplyActionCode(auth, code);
      await reemitCurrentUser(auth);
    },
    async reloadUser() {
      await reemitCurrentUser(auth);
    },
    async updateDisplayName(displayName) {
      if (!auth.currentUser) throw new Error("No signed-in user to update.");
      await updateProfile(auth.currentUser, { displayName });
      await reemitCurrentUser(auth);
    },
    async updatePhotoURL(photoURL) {
      if (!auth.currentUser) throw new Error("No signed-in user to update.");
      await updateProfile(auth.currentUser, { photoURL });
      await reemitCurrentUser(auth);
    },
  };
}

/**
 * `User.reload()` refreshes `auth.currentUser` in place but does NOT itself
 * fire `onIdTokenChanged` (the ID token payload hasn't changed) — so a
 * plain `.reload()` after e.g. `updateDisplayName` would leave the React
 * session state stale until the next natural token refresh. Forcing a
 * token refresh (`getIdToken(true)`) does trigger the listener, which is
 * what `observeSession`'s callers actually want from "reload".
 */
async function reemitCurrentUser(auth: Auth): Promise<void> {
  if (!auth.currentUser) return;
  await auth.currentUser.reload();
  await auth.currentUser.getIdToken(true);
}
