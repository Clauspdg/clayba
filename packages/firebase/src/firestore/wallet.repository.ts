import {
  COMMISSIONS_COLLECTION,
  TRANSACTIONS_COLLECTION,
  TransactionType,
  WALLETS_COLLECTION,
  commissionSchema,
  transactionSchema,
  walletSchema,
  type Commission,
  type Role,
  type Transaction,
  type Wallet,
} from "@the-ride/types";
import type { Firestore, UpdateData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";
import type { AuditLogsRepository } from "./authentication.repository";

export class TransactionsRepository extends FirestoreRepository<Transaction> {
  constructor(db: Firestore) {
    super(db, TRANSACTIONS_COLLECTION, createFirestoreConverter(transactionSchema));
  }

  async listForWallet(walletId: string): Promise<Transaction[]> {
    return this.findWhere("walletId", "==", walletId);
  }
}

export class CommissionsRepository extends FirestoreRepository<Commission> {
  constructor(db: Firestore) {
    super(db, COMMISSIONS_COLLECTION, createFirestoreConverter(commissionSchema));
  }

  async listForDriver(driverId: string): Promise<Commission[]> {
    return this.findWhere("driverId", "==", driverId);
  }
}

export class WalletsRepository extends FirestoreRepository<Wallet> {
  constructor(
    db: Firestore,
    private readonly transactions: TransactionsRepository,
    private readonly auditLogs: AuditLogsRepository,
  ) {
    super(db, WALLETS_COLLECTION, createFirestoreConverter(walletSchema));
  }

  async findForOwner(ownerId: string): Promise<Wallet | null> {
    const wallets = await this.findWhere("ownerId", "==", ownerId);
    return wallets[0] ?? null;
  }

  /**
   * Manually adjusts a wallet balance (goodwill credit, correction, chargeback).
   * Always paired with a `transactions` entry and an audit log — never
   * mutate `balance` directly anywhere else.
   */
  async adjust(params: { walletId: string; amount: number; reason: string; actorId: string; actorRole: Role }): Promise<Wallet> {
    const wallet = await this.findById(params.walletId);
    if (!wallet) {
      throw new Error(`Wallet "${params.walletId}" not found.`);
    }

    const balance = wallet.balance + params.amount;
    await this.update(params.walletId, { balance, updatedAt: new Date() } as UpdateData<Wallet>);

    const transactionId = this.transactions.newId();
    await this.transactions.create(transactionId, {
      id: transactionId,
      walletId: params.walletId,
      type: TransactionType.ADJUSTMENT,
      amount: params.amount,
      currency: wallet.currency,
      description: params.reason,
      createdAt: new Date(),
    });

    await this.auditLogs.record({
      action: "wallet.adjusted",
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.walletId,
      targetType: "wallet",
      reason: params.reason,
      metadata: { amount: params.amount },
    });

    return { ...wallet, balance };
  }
}
