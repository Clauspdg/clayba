import { z } from "zod";

import { firestoreDateSchema } from "../common/firestore-date.schema";
import { TransactionType, WalletOwnerType } from "./wallet.enums";

export const walletOwnerTypeSchema = z.nativeEnum(WalletOwnerType);
export const transactionTypeSchema = z.nativeEnum(TransactionType);

/**
 * Source of truth for the `wallets` collection document shape. A driver's
 * wallet is keyed by their uid and auto-provisioned at their first
 * settled ride. `balance` may go negative: that is commission a driver
 * still owes the platform from cash rides (see docs/payments.md).
 */
export const walletSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  ownerType: walletOwnerTypeSchema,
  balance: z.number(),
  currency: z.string().length(3).default("USD"),
  createdAt: firestoreDateSchema,
  updatedAt: firestoreDateSchema,
});

export type Wallet = z.infer<typeof walletSchema>;

/**
 * Source of truth for the `transactions` collection document shape — the
 * ledger every wallet balance change is paired with, in the same
 * Firestore transaction. `ownerId` mirrors the wallet's owner so
 * `firestore.rules` can let drivers read their own ledger without a join.
 */
export const transactionSchema = z.object({
  id: z.string().min(1),
  walletId: z.string().min(1),
  ownerId: z.string().min(1).optional(),
  type: transactionTypeSchema,
  amount: z.number(),
  currency: z.string().length(3).default("USD"),
  referenceId: z.string().optional(),
  description: z.string().optional(),
  createdAt: firestoreDateSchema,
});

export type Transaction = z.infer<typeof transactionSchema>;

/** Source of truth for the `commissions` collection document shape. */
export const commissionSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  driverId: z.string().min(1),
  rate: z.number().min(0).max(1),
  amount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  createdAt: firestoreDateSchema,
});

export type Commission = z.infer<typeof commissionSchema>;
