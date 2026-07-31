import { ROLE_HIERARCHY, ROLE_PERMISSIONS, type Permission, type Role } from "@the-ride/types";

/**
 * Framework-agnostic RBAC resolution. Every guard in
 * `@the-ride/firebase/auth` (and any future middleware/Cloud Function) must
 * route through these functions rather than re-implementing permission
 * checks, so there is exactly one place that understands the role/permission
 * matrix (`ROLE_PERMISSIONS` in `@the-ride/types`).
 */

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: Role, permission: Permission, extraGrants: Permission[] = []): boolean {
  return getPermissionsForRole(role).includes(permission) || extraGrants.includes(permission);
}

export function hasAnyPermission(role: Role, permissions: Permission[], extraGrants: Permission[] = []): boolean {
  return permissions.some((permission) => hasPermission(role, permission, extraGrants));
}

export function hasAllPermissions(role: Role, permissions: Permission[], extraGrants: Permission[] = []): boolean {
  return permissions.every((permission) => hasPermission(role, permission, extraGrants));
}

export function hasRole(role: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(role);
}

/**
 * Compares roles by their `ROLE_HIERARCHY` rank. Used for "can actor manage
 * a user with this role" style checks — NOT for permission inheritance
 * (each role's permissions are authored explicitly in `ROLE_PERMISSIONS`).
 */
export function isAtLeastRole(role: Role, minimumRole: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}
