import type { AuthClaims, Permission } from "@the-ride/types";
import { hasPermission } from "@the-ride/utils";

import { requireAuth } from "./auth.guard";
import { ForbiddenError } from "./errors";

/** Asserts the caller is authenticated AND holds `permission` (via role grant or explicit override). */
export function requirePermission(claims: AuthClaims | null | undefined, permission: Permission): AuthClaims {
  const authClaims = requireAuth(claims);
  if (!hasPermission(authClaims.role, permission, authClaims.permissions)) {
    throw new ForbiddenError(`Missing permission: ${permission}.`);
  }
  return authClaims;
}
