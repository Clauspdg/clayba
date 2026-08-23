import { driverFirestore } from "@/lib/firebase-client";
import { useDriverSession } from "@/features/drivers/useDriverSession";
import { subscribeDriverTripHistory } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { TripStatus, type Trip } from "@the-ride/types";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useDriverEarningsSummary } from "@/features/wallet/useDriverEarningsSummary";
import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

type Period = "today" | "week" | "month";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}
function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

/**
 * CLAYBA Driver V3 — Earnings tab. Always renders the full structure
 * (period selector, big total, trip count) even at zero — a brand-new
 * driver account should still look like a complete app, not an error
 * page (brief section 6: "l'écran doit rester intéressant même avec
 * zéro donnée"). No tips/bonuses row: `TransactionType` has no tip/bonus
 * variant in this backend (only credit/debit/payout/adjustment/
 * commission — see packages/types/src/wallet/wallet.enums.ts), so
 * showing one would be fabricated, not real, data.
 */
export default function EarningsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { session } = useAuth();
  const { driver } = useDriverSession();
  const { wallet, summary } = useDriverEarningsSummary(session?.uid);
  const [tripHistory, setTripHistory] = useState<Trip[] | null>(null);
  const [period, setPeriod] = useState<Period>("today");

  useEffect(() => {
    if (!driver) return;
    return subscribeDriverTripHistory(driverFirestore, driver.id, setTripHistory, () =>
      setTripHistory([]),
    );
  }, [driver]);

  const tripCounts = useMemo(() => {
    if (!tripHistory) return null;
    const now = new Date();
    const since: Record<Period, Date> = {
      today: startOfDay(now),
      week: startOfWeek(now),
      month: startOfMonth(now),
    };
    const completed = tripHistory.filter((trip) => trip.status === TripStatus.COMPLETED);
    return {
      today: completed.filter((t) => t.completedAt && t.completedAt >= since.today).length,
      week: completed.filter((t) => t.completedAt && t.completedAt >= since.week).length,
      month: completed.filter((t) => t.completedAt && t.completedAt >= since.month).length,
    };
  }, [tripHistory]);

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: t("driverSpace.earnings.todayLabel") },
    { key: "week", label: t("driverSpace.earnings.weekLabel") },
    { key: "month", label: t("driverSpace.earnings.monthLabel") },
  ];

  const isLoading = wallet === undefined || tripHistory === null;
  const currency = wallet?.currency ?? "$";
  const total = summary ? summary[period] : 0;
  const trips = tripCounts ? tripCounts[period] : 0;
  const hasAnyActivity = summary ? summary.total > 0 : false;

  return (
    <Screen style={styles.container}>
      <AppText variant="title">{t("driverSpace.nav.earnings")}</AppText>

      {isLoading ? (
        <LoadingState label={t("common.loading")} />
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
              {currency} {total.toFixed(2)}
            </AppText>
            <AppText variant="body" tone="muted">
              {t("driverSpace.earnings.tripsCountLabel", { count: trips })}
            </AppText>
          </AppCard>

          {wallet && (
            <AppCard style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <AppText variant="body" tone="secondary">
                  {t("driverSpace.earnings.balanceLabel")}
                </AppText>
                <AppText variant="subheading">
                  {wallet.currency} {wallet.balance.toFixed(2)}
                </AppText>
              </View>
            </AppCard>
          )}

          {!hasAnyActivity && (
            <AppText variant="body" tone="muted" style={styles.zeroState}>
              {t("driverSpace.earnings.zeroStateBody")}
            </AppText>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  tabRow: { flexDirection: "row", borderRadius: radius.full, padding: 4, gap: 4 },
  tabButton: { flex: 1, height: 40, paddingHorizontal: spacing.sm },
  totalCard: { gap: spacing.xs },
  breakdownCard: { gap: spacing.sm },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  zeroState: { textAlign: "center", paddingTop: spacing.md },
});
