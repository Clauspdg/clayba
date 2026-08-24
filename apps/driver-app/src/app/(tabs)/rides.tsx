import { driverFirestore } from "@/lib/firebase-client";
import { useDriverSession } from "@/features/drivers/useDriverSession";
import { subscribeDriverTripHistory } from "@the-ride/firebase/client";
import { useTranslation } from "@the-ride/hooks";
import { TripStatus, type Trip } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney } from "@/lib/currency";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

type Filter = "all" | "completed" | "cancelled";

const EMPTY_COPY: Record<Filter, { titleKey: string; bodyKey: string }> = {
  all: { titleKey: "driverHome.ridesEmptyAllTitle", bodyKey: "driverHome.ridesEmptyAllBody" },
  completed: {
    titleKey: "driverHome.ridesEmptyCompletedTitle",
    bodyKey: "driverHome.ridesEmptyCompletedBody",
  },
  cancelled: {
    titleKey: "driverHome.ridesEmptyCancelledTitle",
    bodyKey: "driverHome.ridesEmptyCancelledBody",
  },
};

/**
 * CLAYBA Driver V3 — Rides tab (real `subscribeDriverTripHistory`, same
 * function the web Trip History page uses). Brief section 5: not just an
 * icon on a blank page — a real header, a completed-trip summary, real
 * All/Completed/Cancelled filters, and a premium empty state with a CTA
 * back to Home rather than a dead end.
 */
export default function RidesScreen() {
  const { t, locale } = useTranslation();
  const palette = usePalette();
  const { driver } = useDriverSession();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!driver) return;
    return subscribeDriverTripHistory(driverFirestore, driver.id, setTrips, () => setTrips([]));
  }, [driver]);

  const completedCount = useMemo(
    () => trips?.filter((trip) => trip.status === TripStatus.COMPLETED).length ?? 0,
    [trips],
  );

  const filtered = useMemo(() => {
    if (!trips) return [];
    if (filter === "all") return trips;
    const status = filter === "completed" ? TripStatus.COMPLETED : TripStatus.CANCELLED;
    return trips.filter((trip) => trip.status === status);
  }, [trips, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("driverSpace.tripsFilters.all") },
    { key: "completed", label: t("driverSpace.tripsFilters.completed") },
    { key: "cancelled", label: t("driverSpace.tripsFilters.cancelled") },
  ];

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">{t("driverHome.navRides")}</AppText>
        {trips !== null && (
          <AppText variant="body" tone="muted">
            {completedCount} {t("driverSpace.tripsFilters.completed").toLowerCase()}
          </AppText>
        )}
      </View>

      {trips === null ? (
        <LoadingState label={t("common.loading")} />
      ) : (
        <>
          <View style={[styles.filterRow, { backgroundColor: palette.surfaceElevated }]}>
            {filters.map((f) => (
              <AppButton
                key={f.key}
                label={f.label}
                size="md"
                variant={filter === f.key ? "primary" : "ghost"}
                style={styles.filterButton}
                onPress={() => setFilter(f.key)}
              />
            ))}
          </View>

          {filtered.length === 0 ? (
            <EmptyState
              icon="car-outline"
              title={t(EMPTY_COPY[filter].titleKey)}
              body={t(EMPTY_COPY[filter].bodyKey)}
              action={{ label: t("driverHome.navHome"), onPress: () => router.replace("/home") }}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <AppCard style={styles.row}>
                  <AppText variant="body">
                    {item.pickup.address ?? t("rideHistory.pickup")} →{" "}
                    {item.dropoff.address ?? t("rideHistory.destination")}
                  </AppText>
                  <View style={styles.rowFooter}>
                    <AppText variant="caption" tone="muted">
                      {item.completedAt ? item.completedAt.toLocaleDateString() : "—"}
                    </AppText>
                    <StatusBadge
                      label={
                        item.status === TripStatus.COMPLETED
                          ? t("driverSpace.tripStatus.completed")
                          : t("driverSpace.tripStatus.cancelled")
                      }
                      tone={item.status === TripStatus.COMPLETED ? "success" : "danger"}
                    />
                    <AppText variant="subheading">
                      {item.finalFareBreakdown
                        ? formatMoney(
                            item.finalFareBreakdown.total,
                            item.finalFareBreakdown.currency,
                            locale,
                          )
                        : item.fareAmount !== undefined
                          ? formatMoney(item.fareAmount, "USD", locale)
                          : "—"}
                    </AppText>
                  </View>
                </AppCard>
              )}
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  header: { gap: 2 },
  filterRow: { flexDirection: "row", borderRadius: radius.full, padding: 4, gap: 4 },
  filterButton: { flex: 1, height: 40, paddingHorizontal: spacing.sm },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  row: { gap: 6 },
  rowFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
});
