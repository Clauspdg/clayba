import type { AuthClaims } from "@the-ride/types";

import { UnauthorizedError } from "./errors";

/**
 * Base guard: asserts a request/context carries verified auth claims at
 * all. `requireRole` and `requirePermission` both call this first.
 */
export function requireAuth(claims: AuthClaims | null | undefined): AuthClaims {
  if (!claims) {
    throw new UnauthorizedError();
  }
  return claims;
}
