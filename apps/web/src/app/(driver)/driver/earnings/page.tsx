"use client";

import { webFirestore } from "@/lib/firebase-client";
import { useUserExperience } from "@/hooks/useUserExperience";
import { subscribeMyTransactions, subscribeMyWallet } from "@the-ride/firebase/client";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Heading,
  Illustration,
  LoadingState,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { TransactionType, type Transaction, type Wallet } from "@the-ride/types";
import { useEffect, useMemo, useState } from "react";

const TRANSACTION_TONE: Record<TransactionType, "success" | "danger" | "neutral" | "warning"> = {
  [TransactionType.CREDIT]: "success",
  [TransactionType.PAYOUT]: "success",
  [TransactionType.DEBIT]: "danger",
  [TransactionType.COMMISSION]: "danger",
  [TransactionType.ADJUSTMENT]: "warning",
};

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

/**
 * UX-3 sprint (Dedicated Driver Space), Part 9 — real `wallets`/
 * `transactions` data, the same client functions the passenger Wallet page
 * already uses (`ownerId`-scoped, no passenger-specific assumption baked
 * in). No client-side wallet creation, matching that page's own doc
 * comment: a driver with no wallet document yet genuinely has none —
 * shown as an honest empty state, not a fabricated $0 wallet.
 */
export default function DriverEarningsPage() {
  const { t, locale } = useTranslation();
  const { driver } = useUserExperience();
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    if (!driver) return;
    return subscribeMyWallet(webFirestore, driver.userId, setWallet, () => setWallet(null));
  }, [driver]);

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

  const currency = wallet?.currency ?? "USD";
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);

  if (!driver || wallet === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex flex-col gap-6">
        <Heading level={1}>{t("driverSpace.nav.earnings")}</Heading>
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("driverSpace.earnings.noWalletTitle")}
          description={t("driverSpace.earnings.noWalletBody")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={1}>{t("driverSpace.nav.earnings")}</Heading>

      <div className="tablet:grid-cols-4 grid gap-4">
        <SummaryCard
          label={t("driverSpace.earnings.todayLabel")}
          value={summary ? formatMoney(summary.today) : "—"}
        />
        <SummaryCard
          label={t("driverSpace.earnings.weekLabel")}
          value={summary ? formatMoney(summary.week) : "—"}
        />
        <SummaryCard
          label={t("driverSpace.earnings.monthLabel")}
          value={summary ? formatMoney(summary.month) : "—"}
        />
        <SummaryCard
          label={t("driverSpace.earnings.balanceLabel")}
          value={formatMoney(wallet.balance)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("driverSpace.earnings.historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions === null ? (
            <LoadingState title={t("common.loading")} />
          ) : transactions.length === 0 ? (
            <Text tone="muted" size="sm">
              {t("driverSpace.earnings.noTransactions")}
            </Text>
          ) : (
            <ul className="flex flex-col gap-2">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between border-b border-neutral-100 py-2.5 last:border-0 dark:border-neutral-800"
                >
                  <div className="flex flex-col gap-0.5">
                    <Text size="sm" weight="medium">
                      {tx.description || t(`driverSpace.transactionType.${tx.type}`)}
                    </Text>
                    <Text size="xs" tone="muted">
                      {tx.createdAt.toLocaleDateString(locale, { dateStyle: "medium" })}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={TRANSACTION_TONE[tx.type]}>
                      {t(`driverSpace.transactionType.${tx.type}`)}
                    </Badge>
                    <Text size="sm" weight="medium">
                      {formatMoney(tx.amount)}
                    </Text>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <Text size="xs" tone="muted">
          {label}
        </Text>
        <Text size="lg" weight="medium">
          {value}
        </Text>
      </CardContent>
    </Card>
  );
}
