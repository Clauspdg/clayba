import { useAuth, useTranslation } from "@the-ride/hooks";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useDriverEarningsSummary } from "@/features/wallet/useDriverEarningsSummary";
import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

type Period = "today" | "week" | "month";

/** CLAYBA Driver V2 — Earnings tab. Same real wallets/transactions data useDriverEarningsSummary already computes for Home's stat card; nothing invented — a driver with no wallet yet gets an honest empty state, not a fabricated $0. */
export default function EarningsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { session } = useAuth();
  const { wallet, summary } = useDriverEarningsSummary(session?.uid);
  const [period, setPeriod] = useState<Period>("today");

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: t("driverSpace.earnings.todayLabel") },
    { key: "week", label: t("driverSpace.earnings.weekLabel") },
    { key: "month", label: t("driverSpace.earnings.monthLabel") },
  ];

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("driverSpace.nav.earnings")}</AppText>

      {wallet === undefined ? (
        <LoadingState label={t("common.loading")} />
      ) : wallet === null ? (
        <EmptyState
          glyph="$"
          title={t("driverSpace.earnings.noWalletTitle")}
          body={t("driverSpace.earnings.noWalletBody")}
        />
      ) : (
        <>
          <View style={[styles.tabRow, { backgroundColor: palette.surfaceElevated }]}>
            {periods.map((p) => (
              <AppButton
                key={p.key}
                label={p.label}
                size="md"
                variant={period === p.key ? "primary" : "ghost"}
                style={styles.tabButton}
                onPress={() => setPeriod(p.key)}
              />
            ))}
          </View>

          <AppCard variant="elevated" style={styles.totalCard}>
            <AppText variant="caption" tone="muted">
              {periods.find((p) => p.key === period)?.label}
            </AppText>
            <AppText variant="display">
              {wallet.currency} {summary ? summary[period].toFixed(2) : "0.00"}
            </AppText>
          </AppCard>

          <AppCard style={styles.breakdownCard}>
            <BreakdownRow
              label={t("driverSpace.earnings.balanceLabel")}
              value={`${wallet.currency} ${wallet.balance.toFixed(2)}`}
              bold
            />
          </AppCard>
        </>
      )}
    </Screen>
  );
}

function BreakdownRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.breakdownRow}>
      <AppText variant={bold ? "subheading" : "body"} tone={bold ? "default" : "secondary"}>
        {label}
      </AppText>
      <AppText variant={bold ? "subheading" : "body"}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  tabRow: { flexDirection: "row", borderRadius: radius.full, padding: 4, gap: 4 },
  tabButton: { flex: 1, height: 40, paddingHorizontal: spacing.sm },
  totalCard: { gap: spacing.xs },
  breakdownCard: { gap: spacing.sm },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
