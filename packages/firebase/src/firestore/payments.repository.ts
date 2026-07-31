import { PAYMENTS_COLLECTION, PaymentStatus, paymentSchema, type Payment, type Role } from "@the-ride/types";
import type { Firestore, UpdateData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";
import type { AuditLogsRepository } from "./authentication.repository";

export class PaymentsRepository extends FirestoreRepository<Payment> {
  constructor(
    db: Firestore,
    private readonly auditLogs: AuditLogsRepository,
  ) {
    super(db, PAYMENTS_COLLECTION, createFirestoreConverter(paymentSchema));
  }

  async listForPayer(payerId: string): Promise<Payment[]> {
    return this.findWhere("payerId", "==", payerId);
  }

  /** Records a refund. Actual payment-provider capture/refund calls are out of scope this sprint. */
  async refund(params: { paymentId: string; amount: number; actorId: string; actorRole: Role; reason?: string }): Promise<Payment> {
    const payment = await this.findById(params.paymentId);
    if (!payment) {
      throw new Error(`Payment "${params.paymentId}" not found.`);
    }

    const refundedAmount = (payment.refundedAmount ?? 0) + params.amount;
    await this.update(params.paymentId, {
      status: PaymentStatus.REFUNDED,
      refundedAmount,
      updatedAt: new Date(),
    } as UpdateData<Payment>);

    await this.auditLogs.record({
      action: "payment.refunded",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.paymentId,
      targetType: "payment",
      reason: params.reason,
      metadata: { amount: params.amount },
    });

    return { ...payment, status: PaymentStatus.REFUNDED, refundedAmount };
  }
}
