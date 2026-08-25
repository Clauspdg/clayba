import { Ionicons } from "@expo/vector-icons";
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
import { passengerFirestore } from "@/lib/firebase-client";
import { usePalette } from "@/theme/usePalette";
import { spacing } from "@/theme/tokens";

const TRANSACTION_TONE: Record<string, StatusTone> = {
  credit: "success",
  debit: "danger",
  payout: "danger",
  adjustment: "neutral",
  commission: "neutral",
};

/** Wallet — real `subscribeMyWallet`/`subscribeMyTransactions`, same functions CLAYBA Driver's wallet tab uses. Reached from Account's balance card. */
export default function WalletScreen() {
  const { t, locale } = useTranslation();
  const palette = usePalette();
  const { session } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    if (!session) return;
    return subscribeMyWallet(passengerFirestore, session.uid, setWallet, () => setWallet(null));
  }, [session]);

  useEffect(() => {
    if (!wallet) {
      setTransactions(wallet === null ? [] : null);
      return;
    }
    return subscribeMyTransactions(passengerFirestore, wallet.id, setTransactions, () =>
      setTransactions([]),
    );
  }, [wallet]);

  return (
    <Screen style={styles.container}>
      <AppText variant="title">{t("wallet.balance")}</AppText>

      <AppCard variant="elevated" style={styles.balanceCard}>
        {wallet ? (
          <AppText variant="display">
            {formatMoney(wallet.balance, wallet.currency, locale)}
          </AppText>
        ) : wallet === null ? (
          <View style={styles.inactiveRow}>
            <View style={[styles.walletIcon, { backgroundColor: palette.surfaceElevated }]}>
              <Ionicons name="wallet-outline" size={20} color={palette.textMuted} />
            </View>
            <View style={styles.inactiveText}>
              <AppText variant="subheading" tone="brand">
                {t("wallet.notActivated")}
              </AppText>
              <AppText variant="caption" tone="muted">
                {t("wallet.noWallet")}
              </AppText>
            </View>
          </View>
        ) : (
          <LoadingState label={t("common.loading")} />
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
                  {item.createdAt.toLocaleString(locale)}
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
