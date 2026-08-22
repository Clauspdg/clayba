import { driverFirestore } from "@/lib/firebase-client";
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
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export interface DriverEarningsSummary {
  today: number;
  week: number;
  month: number;
  total: number;
}

/**
 * CLAYBA P2 — mobile port of `apps/web/src/hooks/useDriverEarningsSummary.ts`,
 * same real `wallets`/`transactions` subscriptions, no parallel financial
 * computation (brief section 24: "ne pas inventer un système financier").
 * A driver with no wallet yet gets `wallet: null`/`summary: null`, not a
 * fabricated $0.
 */
export function useDriverEarningsSummary(userId: string | undefined): {
  wallet: Wallet | null | undefined;
  summary: DriverEarningsSummary | null;
} {
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    return subscribeMyWallet(driverFirestore, userId, setWallet, () => setWallet(null));
  }, [userId]);

  useEffect(() => {
    if (!wallet) {
      setTransactions(wallet === null ? [] : null);
      return;
    }
    return subscribeMyTransactions(driverFirestore, wallet.id, setTransactions, () =>
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
