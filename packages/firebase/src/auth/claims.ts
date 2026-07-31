import { authClaimsSchema, type AuthClaims, type Permission, type Role } from "@the-ride/types";

/**
 * Shape written to the Firebase Auth custom claims on a user's ID token.
 * Kept intentionally identical to `AuthClaims` (minus `uid`, which Firebase
 * already puts on the token separately) so `parseAuthClaims` below is a
 * pure reshape, not a translation.
 */
export interface CustomClaims {
  role: Role;
  permissions?: Permission[];
}

export function buildCustomClaims(role: Role, permissions?: Permission[]): CustomClaims {
  return permissions ? { role, permissions } : { role };
}

/**
 * Normalizes a decoded Firebase ID token (admin `DecodedIdToken` or client
 * `IdTokenResult.claims`, both of which are structurally `{ uid, ...customClaims }`-shaped)
 * into the `AuthClaims` type every guard in this package consumes.
 */
export function parseAuthClaims(decoded: { uid: string; role?: unknown; permissions?: unknown }): AuthClaims {
  return authClaimsSchema.parse({
    uid: decoded.uid,
    role: decoded.role,
    permissions: decoded.permissions,
  });
}
