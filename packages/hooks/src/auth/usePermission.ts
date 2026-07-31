import type { Permission, Role } from "@the-ride/types";
import { hasAllPermissions, hasAnyPermission, hasPermission, hasRole } from "@the-ride/utils";

import { useAuth } from "./AuthProvider";

/** The signed-in user's role, or `null` if signed out. */
export function useRole(): Role | null {
  return useAuth().session?.claims.role ?? null;
}

/** Whether the signed-in user's role grants `permission` (via `@the-ride/utils`'s RBAC matrix, plus any extra per-user grants on the token). */
export function usePermission(permission: Permission): boolean {
  const { session } = useAuth();
  if (!session) return false;
  return hasPermission(session.claims.role, permission, session.claims.permissions ?? []);
}

export function useAnyPermission(permissions: Permission[]): boolean {
  const { session } = useAuth();
  if (!session) return false;
  return hasAnyPermission(session.claims.role, permissions, session.claims.permissions ?? []);
}

export function useAllPermissions(permissions: Permission[]): boolean {
  const { session } = useAuth();
  if (!session) return false;
  return hasAllPermissions(session.claims.role, permissions, session.claims.permissions ?? []);
}

/** Whether the signed-in user's role is one of `allowedRoles` — for route guards (e.g. only admins/dispatchers/support may reach the admin dashboard). */
export function useHasRole(allowedRoles: Role[]): boolean {
  const role = useRole();
  if (!role) return false;
  return hasRole(role, allowedRoles);
}
