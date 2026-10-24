import {
  COMMISSIONS_COLLECTION,
  TRANSACTIONS_COLLECTION,
  TransactionType,
  WALLETS_COLLECTION,
  type WalletOwnerType,
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
   * The one path that moves money into or out of a wallet from ride
   * settlement (docs/payments.md). Balance update and ledger entry are
   * written in a single Firestore transaction, so they can never drift
   * apart; the ledger entry's id is the caller's `idempotencyKey`, so a
   * retried settlement (callable retry, trigger redelivery) is a no-op
   * instead of a double credit. The wallet is keyed by `ownerId` and
   * created on first use — nothing provisions wallets at sign-up.
   */
  async applyLedgerEntry(params: {
    ownerId: string;
    ownerType: WalletOwnerType;
    amount: number;
    type: TransactionType;
    currency: string;
    idempotencyKey: string;
    referenceId?: string;
    description?: string;
  }): Promise<{ applied: boolean; balance: number }> {
    const walletRef = this.ref(params.ownerId);
    const transactionRef = this.transactions.ref(params.idempotencyKey);

    return walletRef.firestore.runTransaction(async (tx) => {
      const [walletSnap, existingEntry] = await Promise.all([
        tx.get(walletRef),
        tx.get(transactionRef),
      ]);
      const wallet = walletSnap.exists ? walletSnap.data() : undefined;
      if (existingEntry.exists) {
        return { applied: false, balance: wallet?.balance ?? 0 };
      }

      const now = new Date();
      const balance = Math.round(((wallet?.balance ?? 0) + params.amount) * 100) / 100;
      if (wallet) {
        tx.update(walletRef, { balance, updatedAt: now } as UpdateData<Wallet>);
      } else {
        tx.set(walletRef, {
          id: params.ownerId,
          ownerId: params.ownerId,
          ownerType: params.ownerType,
          balance,
          currency: params.currency,
          createdAt: now,
          updatedAt: now,
        });
      }
      tx.set(transactionRef, {
        id: params.idempotencyKey,
        walletId: params.ownerId,
        ownerId: params.ownerId,
        type: params.type,
        amount: params.amount,
        currency: params.currency,
        ...(params.referenceId ? { referenceId: params.referenceId } : {}),
        ...(params.description ? { description: params.description } : {}),
        createdAt: now,
      });
      return { applied: true, balance };
    });
  }

  /**
   * Manually adjusts a wallet balance (goodwill credit, correction, chargeback).
   * Always paired with a `transactions` entry and an audit log — never
   * mutate `balance` directly anywhere else.
   */
  async adjust(params: {
    walletId: string;
    amount: number;
    reason: string;
    actorId: string;
    actorRole: Role;
  }): Promise<Wallet> {
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
