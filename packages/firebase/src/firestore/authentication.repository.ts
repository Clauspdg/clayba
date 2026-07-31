import {
  AUDIT_LOGS_COLLECTION,
  auditLogSchema,
  USERS_COLLECTION,
  userSchema,
  type AuditLog,
  type CreateAuditLogInput,
  type User,
} from "@the-ride/types";
import { buildAuditLogEntry } from "@the-ride/utils";
import type { Firestore } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";

export class UsersRepository extends FirestoreRepository<User> {
  constructor(db: Firestore) {
    super(db, USERS_COLLECTION, createFirestoreConverter(userSchema));
  }

  async findByEmail(email: string): Promise<User | null> {
    const results = await this.findWhere("email", "==", email);
    return results[0] ?? null;
  }
}

/**
 * Every sensitive operation in the platform (driver approvals, refunds,
 * role changes, settings edits, ...) must call `record()` — see
 * `docs/security.md` for the full list of audited actions.
 */
export class AuditLogsRepository extends FirestoreRepository<AuditLog> {
  constructor(db: Firestore) {
    super(db, AUDIT_LOGS_COLLECTION, createFirestoreConverter(auditLogSchema));
  }

  async record(entry: CreateAuditLogInput): Promise<AuditLog> {
    const validated = buildAuditLogEntry(entry);
    const id = this.newId();
    const fullEntry = auditLogSchema.parse({ ...validated, id, createdAt: new Date() });
    return this.create(id, fullEntry);
  }

  /** Most recent first — for a target's audit timeline (e.g. a driver's history). Requires a composite index. */
  async listForTarget(targetId: string): Promise<AuditLog[]> {
    return this.findWhereOrdered("targetId", "==", targetId, "createdAt", "desc");
  }

  /** Most recent first — for "everything this admin has done". Requires a composite index. */
  async listForActor(actorId: string): Promise<AuditLog[]> {
    return this.findWhereOrdered("actorId", "==", actorId, "createdAt", "desc");
  }
}
