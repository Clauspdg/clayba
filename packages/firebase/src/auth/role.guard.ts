import type { AuthClaims, Role } from "@the-ride/types";
import { hasRole } from "@the-ride/utils";

import { requireAuth } from "./auth.guard";
import { ForbiddenError } from "./errors";

/** Asserts the caller is authenticated AND holds one of `allowedRoles`. */
export function requireRole(claims: AuthClaims | null | undefined, allowedRoles: Role[]): AuthClaims {
  const authClaims = requireAuth(claims);
  if (!hasRole(authClaims.role, allowedRoles)) {
    throw new ForbiddenError(`Requires one of roles: ${allowedRoles.join(", ")}.`);
  }
  return authClaims;
}
