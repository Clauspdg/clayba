/**
 * Platform roles. Stored on the `users` collection and mirrored into the
 * Firebase Auth custom claims (see `@the-ride/firebase/auth`) so security
 * rules and server-side guards can both authorize against the same value.
 */
export enum Role {
  PASSENGER = "passenger",
  DRIVER = "driver",
  DISPATCHER = "dispatcher",
  SUPPORT = "support",
  MODERATOR = "moderator",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export const ROLES = Object.values(Role);

export enum UserStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

/**
 * Canonical, centralized permission list. Every permission-gated operation
 * in the platform must reference one of these strings rather than a
 * hand-rolled literal, so `packages/utils/src/authentication/rbac.ts` and
 * `firestore.rules` stay in sync with a single source of truth.
 */
export const PERMISSIONS = [
  "trip.create",
  "trip.read",
  "trip.update",
  "trip.cancel",
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
  "payment.capture",
  "wallet.read",
  "wallet.adjust",
  "commission.read",
  "commission.update",
  "user.read",
  "user.update",
  "user.delete",
  "user.role.assign",
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const AUDIT_ACTIONS = [
  "driver.approved",
  "driver.rejected",
  "driver.activated",
  "driver.suspended",
  "driver.reactivated",
  "driver.warned",
  "driver.terminated",
  "vehicle.approved",
  "trip.cancelled",
  "payment.refunded",
  "wallet.adjusted",
  "role.changed",
  "settings.updated",
  "user.deleted",
  "support.assigned",
  "report.resolved",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
