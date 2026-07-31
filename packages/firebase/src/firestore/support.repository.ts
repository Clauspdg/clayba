import { SUPPORT_TICKETS_COLLECTION, SupportTicketStatus, supportTicketSchema, type Role, type SupportTicket } from "@the-ride/types";
import type { Firestore, UpdateData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";
import type { AuditLogsRepository } from "./authentication.repository";

export class SupportTicketsRepository extends FirestoreRepository<SupportTicket> {
  constructor(
    db: Firestore,
    private readonly auditLogs: AuditLogsRepository,
  ) {
    super(db, SUPPORT_TICKETS_COLLECTION, createFirestoreConverter(supportTicketSchema));
  }

  async assign(params: { ticketId: string; assigneeId: string; actorId: string; actorRole: Role }): Promise<SupportTicket> {
    const ticket = await this.findById(params.ticketId);
    if (!ticket) {
      throw new Error(`Support ticket "${params.ticketId}" not found.`);
    }

    await this.update(params.ticketId, {
      assignedTo: params.assigneeId,
      status: SupportTicketStatus.ASSIGNED,
      updatedAt: new Date(),
    } as UpdateData<SupportTicket>);

    await this.auditLogs.record({
      action: "support.assigned",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.ticketId,
      targetType: "supportTicket",
      metadata: { assigneeId: params.assigneeId },
    });

    return { ...ticket, assignedTo: params.assigneeId, status: SupportTicketStatus.ASSIGNED };
  }

  /** For a support queue view — oldest open tickets first. Requires a composite index. */
  async listByStatus(status: SupportTicketStatus): Promise<SupportTicket[]> {
    return this.findWhereOrdered("status", "==", status, "createdAt", "asc");
  }
}
