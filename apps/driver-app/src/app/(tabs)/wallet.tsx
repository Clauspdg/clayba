import { Ionicons } from "@expo/vector-icons";
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
import { formatMoney } from "@/lib/currency";
import { usePalette } from "@/theme/usePalette";
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
  const { t, locale } = useTranslation();
  const palette = usePalette();
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
      <AppText variant="title">{t("driverSpace.nav.wallet")}</AppText>

      <AppCard variant="elevated" style={styles.balanceCard}>
        {wallet ? (
          <>
            <AppText variant="caption" tone="muted">
              {t("driverHome.walletAvailableBalance")}
            </AppText>
            <AppText variant="display">
              {formatMoney(wallet.balance, wallet.currency, locale)}
            </AppText>
          </>
        ) : wallet === null ? (
          <View style={styles.inactiveRow}>
            <View style={[styles.walletIcon, { backgroundColor: palette.surfaceElevated }]}>
              <Ionicons name="wallet-outline" size={20} color={palette.textMuted} />
            </View>
            <View style={styles.inactiveText}>
              <AppText variant="subheading">{t("driverSpace.nav.wallet")}</AppText>
              <AppText variant="caption" tone="brand">
                {t("driverHome.walletNotActivated")}
              </AppText>
              <AppText variant="caption" tone="muted">
                {t("driverHome.walletNotActivatedBody")}
              </AppText>
            </View>
          </View>
        ) : (
          <AppText variant="display">—</AppText>
        )}
      </AppCard>

      <AppText variant="heading">{t("wallet.transactions")}</AppText>

      {transactions === null ? (
        <LoadingState label={t("common.loading")} />
      ) : transactions.length === 0 ? (
        <EmptyState icon="receipt-outline" title={t("wallet.noTransactions")} />
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
                  {formatMoney(item.amount, item.currency, locale)}
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
  inactiveRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveText: { flex: 1, gap: 2 },
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
