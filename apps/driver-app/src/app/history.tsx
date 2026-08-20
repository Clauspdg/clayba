import { driverFirestore } from "@/lib/firebase-client";
import { useDriverSession } from "@/features/drivers/useDriverSession";
import { subscribeDriverTripHistory } from "@the-ride/firebase/client";
import { useTranslation } from "@the-ride/hooks";
import { TripStatus, type Trip } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { spacing } from "@/theme/tokens";

/** CLAYBA P2 — Ride History (section 23), real `subscribeDriverTripHistory` — same function the web Trip History page uses, completed/cancelled trips only, most recent first. */
export default function HistoryScreen() {
  const { t } = useTranslation();
  const { driver } = useDriverSession();
  const [trips, setTrips] = useState<Trip[] | null>(null);

  useEffect(() => {
    if (!driver) return;
    return subscribeDriverTripHistory(driverFirestore, driver.id, setTrips, () => setTrips([]));
  }, [driver]);

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <AppButton label={t("common.back")} variant="outline" onPress={() => router.back()} />
        <AppText variant="heading">{t("driverSpace.nav.trips")}</AppText>
      </View>

      {trips === null ? (
        <AppText variant="body">{t("common.loading")}</AppText>
      ) : trips.length === 0 ? (
        <AppText variant="muted">{t("driverSpace.trips.emptyTitle")}</AppText>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AppCard style={styles.row}>
              <AppText variant="body">
                {item.pickup.address ?? t("rideHistory.pickup")} →{" "}
                {item.dropoff.address ?? t("rideHistory.destination")}
              </AppText>
              <View style={styles.rowFooter}>
                <AppText variant="muted">
                  {item.completedAt ? item.completedAt.toLocaleDateString() : "—"}
                </AppText>
                <AppText variant="muted">
                  {item.status === TripStatus.COMPLETED
                    ? t("driverSpace.tripStatus.completed")
                    : t("driverSpace.tripStatus.cancelled")}
                </AppText>
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
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  list: { gap: spacing.sm },
  row: { gap: 6 },
  rowFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
});
