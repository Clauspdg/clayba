import { z } from "zod";

import { TransactionType, WalletOwnerType } from "./wallet.enums";

export const walletOwnerTypeSchema = z.nativeEnum(WalletOwnerType);
export const transactionTypeSchema = z.nativeEnum(TransactionType);

/** Source of truth for the `wallets` collection document shape. */
export const walletSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  ownerType: walletOwnerTypeSchema,
  balance: z.number(),
  currency: z.string().length(3).default("USD"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Wallet = z.infer<typeof walletSchema>;

/** Source of truth for the `transactions` collection document shape. */
export const transactionSchema = z.object({
  id: z.string().min(1),
  walletId: z.string().min(1),
  type: transactionTypeSchema,
  amount: z.number(),
  currency: z.string().length(3).default("USD"),
  referenceId: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.date(),
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
  createdAt: z.date(),
});

export type Commission = z.infer<typeof commissionSchema>;
