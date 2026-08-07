"use client";

import { webFirestore } from "@/lib/firebase-client";
import { subscribeMyTransactions, subscribeMyWallet } from "@the-ride/firebase/client";
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  Heading,
  Illustration,
  LoadingState,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import type { Transaction, Wallet } from "@the-ride/types";
import { useEffect, useState } from "react";

const TRANSACTION_TONE: Record<string, "success" | "danger" | "neutral"> = {
  credit: "success",
  debit: "danger",
  payout: "danger",
  adjustment: "neutral",
  commission: "neutral",
};

function formatDate(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toLocaleString();
  }
  if (value instanceof Date) return value.toLocaleString();
  return "—";
}

export default function WalletPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    if (!session) return;
    return subscribeMyWallet(webFirestore, session.uid, setWallet, () => setWallet(null));
  }, [session]);

  useEffect(() => {
    if (!wallet) {
      setTransactions(wallet === null ? [] : null);
      return;
    }
    return subscribeMyTransactions(webFirestore, wallet.id, setTransactions, () =>
      setTransactions([]),
    );
  }, [wallet]);

  if (wallet === undefined) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("passengerNav.wallet")}</Heading>

      <Card>
        <CardContent className="flex flex-col gap-1 p-6">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("wallet.balance")}
          </span>
          <span className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
            {wallet ? `${wallet.currency} ${wallet.balance.toFixed(2)}` : `$0.00`}
          </span>
          {!wallet && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("wallet.noWallet")}
            </span>
          )}
        </CardContent>
      </Card>

      <Heading level={3}>{t("wallet.transactions")}</Heading>
      {transactions === null ? (
        <LoadingState title={t("common.loading")} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("wallet.noTransactions")}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {transaction.description ?? t(`wallet.transactionType.${transaction.type}`)}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatDate(transaction.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={TRANSACTION_TONE[transaction.type] ?? "neutral"}>
                  {t(`wallet.transactionType.${transaction.type}`)}
                </Badge>
                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                  {transaction.amount >= 0 ? "+" : ""}
                  {transaction.currency} {transaction.amount.toFixed(2)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
