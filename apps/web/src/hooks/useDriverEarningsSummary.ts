"use client";

import { webFirestore } from "@/lib/firebase-client";
import { subscribeMyTransactions, subscribeMyWallet } from "@the-ride/firebase/client";
import { TransactionType, type Transaction, type Wallet } from "@the-ride/types";
import { useEffect, useMemo, useState } from "react";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export interface DriverEarningsSummary {
  today: number;
  week: number;
  month: number;
  total: number;
}

/**
 * DRIVER COMMAND CENTER — extracted from `driver/earnings/page.tsx`'s
 * previously-inline computation so the Driver Home page can show the same
 * "today's earnings" figure without a second, parallel financial
 * computation (the brief's own "ne pas inventer un système financier
 * parallèle" rule). Real `wallets`/`transactions` data only — a driver with
 * no wallet yet gets `wallet: null` and `summary: null`, not a fabricated
 * $0.
 */
export function useDriverEarningsSummary(userId: string | undefined): {
  wallet: Wallet | null | undefined;
  summary: DriverEarningsSummary | null;
} {
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    return subscribeMyWallet(webFirestore, userId, setWallet, () => setWallet(null));
  }, [userId]);

  useEffect(() => {
    if (!wallet) {
      setTransactions(wallet === null ? [] : null);
      return;
    }
    return subscribeMyTransactions(webFirestore, wallet.id, setTransactions, () =>
      setTransactions([]),
    );
  }, [wallet]);

  const summary = useMemo(() => {
    if (!transactions) return null;
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const payouts = transactions.filter((tx) => tx.type === TransactionType.PAYOUT);
    const sumSince = (since: Date) =>
      payouts.filter((tx) => tx.createdAt >= since).reduce((s, tx) => s + tx.amount, 0);
    return {
      today: sumSince(dayStart),
      week: sumSince(weekStart),
      month: sumSince(monthStart),
      total: payouts.reduce((s, tx) => s + tx.amount, 0),
    };
  }, [transactions]);

  return { wallet, summary };
}
