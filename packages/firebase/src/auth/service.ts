import type { AuthClaims, Role } from "@the-ride/types";

import { getAdminAuth } from "../admin/app";
import { buildCustomClaims, parseAuthClaims } from "./claims";

/**
 * Server-only. Verifies a client-supplied Firebase ID token and returns the
 * normalized `AuthClaims` guards expect. Throws if the token is invalid or
 * expired (see Firebase Admin SDK's own error codes).
 */
export async function verifyIdToken(idToken: string): Promise<AuthClaims> {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  return parseAuthClaims(decoded);
}

/**
 * Sets a user's role via Firebase Auth custom claims. This is the only
 * sanctioned way to change a user's role — never write `role` directly to
 * the `users` Firestore document without also calling this, or the token
 * claims and Firestore record will drift out of sync.
 */
export async function assignUserRole(uid: string, role: Role): Promise<void> {
  await getAdminAuth().setCustomUserClaims(uid, buildCustomClaims(role));
}

/** Forces the user to re-authenticate everywhere (e.g. after a suspension or role change). */
export async function revokeUserSessions(uid: string): Promise<void> {
  await getAdminAuth().revokeRefreshTokens(uid);
}
