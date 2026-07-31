import { z } from "zod";

import { AUDIT_ACTIONS, PERMISSIONS, Role, UserStatus } from "./authentication.enums";

export const roleSchema = z.nativeEnum(Role);
export const userStatusSchema = z.nativeEnum(UserStatus);
export const permissionSchema = z.enum(PERMISSIONS);
export const auditActionSchema = z.enum(AUDIT_ACTIONS);

/** Source of truth for the `users` collection document shape. */
export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  displayName: z.string().optional(),
  role: roleSchema,
  status: userStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

/**
 * Decoded shape of the Firebase Auth custom claims + ID token payload used
 * by guards throughout the platform. `permissions` is an optional allow-list
 * of extra grants beyond the role's default matrix (see `rbac.ts`).
 */
export const authClaimsSchema = z.object({
  uid: z.string().min(1),
  role: roleSchema,
  permissions: z.array(permissionSchema).optional(),
});

export type AuthClaims = z.infer<typeof authClaimsSchema>;

/** Source of truth for the `auditLogs` collection document shape. */
export const auditLogSchema = z.object({
  id: z.string().min(1),
  action: auditActionSchema,
  actorId: z.string().min(1),
  actorRole: roleSchema,
  targetId: z.string().optional(),
  targetType: z.string().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

/** Input shape accepted when recording a new audit log (id/createdAt are assigned by the repository). */
export const createAuditLogInputSchema = auditLogSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogInputSchema>;
