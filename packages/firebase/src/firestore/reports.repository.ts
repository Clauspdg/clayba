import { REPORTS_COLLECTION, ReportStatus, reportSchema, type Report, type Role } from "@the-ride/types";
import type { Firestore, UpdateData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";
import type { AuditLogsRepository } from "./authentication.repository";

export class ReportsRepository extends FirestoreRepository<Report> {
  constructor(
    db: Firestore,
    private readonly auditLogs: AuditLogsRepository,
  ) {
    super(db, REPORTS_COLLECTION, createFirestoreConverter(reportSchema));
  }

  async resolve(params: { reportId: string; resolution: string; actorId: string; actorRole: Role }): Promise<Report> {
    const report = await this.findById(params.reportId);
    if (!report) {
      throw new Error(`Report "${params.reportId}" not found.`);
    }

    await this.update(params.reportId, {
      status: ReportStatus.RESOLVED,
      resolution: params.resolution,
      resolvedBy: params.actorId,
      updatedAt: new Date(),
    } as UpdateData<Report>);

    await this.auditLogs.record({
      action: "report.resolved",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.reportId,
      targetType: "report",
      reason: params.resolution,
    });

    return { ...report, status: ReportStatus.RESOLVED, resolution: params.resolution, resolvedBy: params.actorId };
  }
}
