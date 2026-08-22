import { driverFirestore } from "@/lib/firebase-client";
import { useDriverSession } from "@/features/drivers/useDriverSession";
import { subscribeDriverTripHistory } from "@the-ride/firebase/client";
import { useTranslation } from "@the-ride/hooks";
import { TripStatus, type Trip } from "@the-ride/types";
import { FlatList, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { StatusBadge } from "@/components/StatusBadge";
import { useState, useEffect } from "react";
import { spacing } from "@/theme/tokens";

/** CLAYBA Driver V2 — Rides tab (real `subscribeDriverTripHistory`, same function the web Trip History page uses; completed/cancelled only, most recent first). */
export default function RidesScreen() {
  const { t } = useTranslation();
  const { driver } = useDriverSession();
  const [trips, setTrips] = useState<Trip[] | null>(null);

  useEffect(() => {
    if (!driver) return;
    return subscribeDriverTripHistory(driverFirestore, driver.id, setTrips, () => setTrips([]));
  }, [driver]);

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("driverSpace.nav.trips")}</AppText>

      {trips === null ? (
        <LoadingState label={t("common.loading")} />
      ) : trips.length === 0 ? (
        <EmptyState
          glyph="≡"
          title={t("driverSpace.trips.emptyTitle")}
          body={t("driverSpace.trips.emptyBody")}
        />
      ) : (
        <FlatList
          data={trips}
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
                    ? `${item.finalFareBreakdown.total.toFixed(2)} ${item.finalFareBreakdown.currency}`
                    : item.fareAmount !== undefined
                      ? `$${item.fareAmount.toFixed(2)}`
                      : "—"}
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
  container: { gap: spacing.lg },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  row: { gap: 6 },
  rowFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
});
