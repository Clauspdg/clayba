import { PERMISSIONS, type Permission, Role } from "./authentication.enums";

export const USERS_COLLECTION = "users";
export const AUDIT_LOGS_COLLECTION = "auditLogs";

/**
 * Relative rank used only for "can actor manage a user with this role"
 * style comparisons (e.g. only Admin+ may assign roles). This is NOT a
 * permission-inheritance hierarchy — each role's actual grants come from
 * `ROLE_PERMISSIONS` below, which is authored explicitly per role.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.PASSENGER]: 0,
  [Role.DRIVER]: 0,
  [Role.SUPPORT]: 1,
  [Role.MODERATOR]: 1,
  [Role.DISPATCHER]: 2,
  [Role.ADMIN]: 3,
  [Role.SUPER_ADMIN]: 4,
};

const ALL_PERMISSIONS: Permission[] = [...PERMISSIONS];

/**
 * Centralized role -> permission matrix. This is the single source of truth
 * consumed by `packages/utils/src/authentication/rbac.ts`. Keep
 * `docs/rbac.md` in sync whenever this changes.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.PASSENGER]: ["trip.create", "trip.cancel", "trip.read", "wallet.read", "rating.read"],
  [Role.DRIVER]: [
    "trip.read",
    "trip.update",
    "wallet.read",
    "vehicle.read",
    "vehicle.update",
    "driver.read",
    "rating.read",
    "emergency.read",
  ],
  [Role.DISPATCHER]: [
    "trip.read",
    "trip.assign",
    "trip.update",
    "driver.read",
    "vehicle.read",
    "emergency.read",
    "emergency.respond",
  ],
  [Role.SUPPORT]: [
    "support.read",
    "support.assign",
    "support.resolve",
    "user.read",
    "trip.read",
    "reports.read",
    "emergency.read",
  ],
  [Role.MODERATOR]: ["rating.read", "rating.moderate", "review.moderate", "reports.read", "reports.review", "user.read", "driver.read"],
  [Role.ADMIN]: [
    "trip.read",
    "trip.assign",
    "driver.read",
    "driver.update",
    "driver.approve",
    "driver.reject",
    "driver.activate",
    "driver.suspend",
    "driver.reactivate",
    "driver.warn",
    "driver.terminate",
    "vehicle.read",
    "vehicle.update",
    "vehicle.approve",
    "payment.read",
    "payment.refund",
    "wallet.read",
    "wallet.adjust",
    "commission.read",
    "commission.update",
    "user.read",
    "user.update",
    "settings.read",
    "settings.update",
    "support.read",
    "support.assign",
    "support.resolve",
    "reports.read",
    "reports.review",
    "analytics.view",
    "audit.read",
    "rating.read",
    "rating.moderate",
    "review.moderate",
    "notification.send",
    "emergency.read",
    "emergency.respond",
  ],
  [Role.SUPER_ADMIN]: ALL_PERMISSIONS,
};
