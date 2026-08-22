import { driverFirestore } from "@/lib/firebase-client";
import { subscribeMyTransactions, subscribeMyWallet } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import type { Transaction, Wallet } from "@the-ride/types";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { StatusBadge, type StatusTone } from "@/components/StatusBadge";
import { spacing } from "@/theme/tokens";

const TRANSACTION_TONE: Record<string, StatusTone> = {
  credit: "success",
  debit: "danger",
  payout: "danger",
  adjustment: "neutral",
  commission: "neutral",
};

/** CLAYBA Driver V2 — Wallet tab, ported from the passenger web wallet page's exact real subscriptions (subscribeMyWallet/subscribeMyTransactions) — same backend, same balance, no parallel financial system. */
export default function WalletScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    if (!session) return;
    return subscribeMyWallet(driverFirestore, session.uid, setWallet, () => setWallet(null));
  }, [session]);

  useEffect(() => {
    if (!wallet) {
      setTransactions(wallet === null ? [] : null);
      return;
    }
    return subscribeMyTransactions(driverFirestore, wallet.id, setTransactions, () =>
      setTransactions([]),
    );
  }, [wallet]);

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("driverSpace.nav.wallet")}</AppText>

      <AppCard variant="elevated" style={styles.balanceCard}>
        <AppText variant="caption" tone="muted">
          {t("wallet.balance")}
        </AppText>
        <AppText variant="display">
          {wallet ? `${wallet.currency} ${wallet.balance.toFixed(2)}` : "—"}
        </AppText>
        {wallet === null && (
          <AppText variant="caption" tone="muted">
            {t("wallet.noWallet")}
          </AppText>
        )}
      </AppCard>

      <AppText variant="subheading">{t("wallet.transactions")}</AppText>

      {transactions === null ? (
        <LoadingState label={t("common.loading")} />
      ) : transactions.length === 0 ? (
        <EmptyState glyph="▭" title={t("wallet.noTransactions")} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AppCard style={styles.row}>
              <View style={styles.rowMain}>
                <AppText variant="body">
                  {item.description ?? t(`wallet.transactionType.${item.type}`)}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {item.createdAt.toLocaleString()}
                </AppText>
              </View>
              <View style={styles.rowEnd}>
                <StatusBadge
                  label={t(`wallet.transactionType.${item.type}`)}
                  tone={TRANSACTION_TONE[item.type] ?? "neutral"}
                />
                <AppText variant="subheading">
                  {item.amount >= 0 ? "+" : ""}
                  {item.currency} {item.amount.toFixed(2)}
                </AppText>
              </View>
            </AppCard>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  balanceCard: { gap: spacing.xs },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowEnd: { alignItems: "flex-end", gap: 4 },
});
