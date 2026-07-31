import { DEFAULT_PLATFORM_SETTINGS, DEFAULT_VEHICLE_CATEGORIES } from "@the-ride/types";
import { useTranslation } from "@the-ride/hooks";
import { calculateFare, estimateEtaSeconds, haversineDistanceMeters } from "@the-ride/utils";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppStatusView } from "@/components/AppStatusView";
import { AppText } from "@/components/AppText";
import { AppVehicleCategoryCard } from "@/components/AppVehicleCategoryCard";
import { Screen } from "@/components/Screen";
import { getMapProvider } from "@/lib/map-provider";
import { useBookingStore } from "@/stores/booking-store";
import { spacing } from "@/theme/tokens";

/**
 * There's no live settings fetch this sprint (no authenticated session
 * yet, see docs/ride-request.md), so this reads the same
 * `DEFAULT_PLATFORM_SETTINGS` a fresh environment would seed instead of a
 * locally-hardcoded copy.
 */
const DEFAULT_FARE_SETTINGS = {
  bookingFee: DEFAULT_PLATFORM_SETTINGS.bookingFee,
  serviceFeeRate: DEFAULT_PLATFORM_SETTINGS.serviceFeeRate,
  commissionRate: DEFAULT_PLATFORM_SETTINGS.commissionRate,
  taxRate: DEFAULT_PLATFORM_SETTINGS.taxRate,
  surgeMultiplier: DEFAULT_PLATFORM_SETTINGS.surgeMultiplierDefault,
  currency: DEFAULT_PLATFORM_SETTINGS.currency,
};

type RouteStatus = "loading" | "ready" | "error";

export default function VehicleSelectionScreen() {
  const { t } = useTranslation();
  const { pickup, destination, stops, vehicleCategoryId, setVehicleCategoryId, setEstimate } = useBookingStore();

  const [routeStatus, setRouteStatus] = useState<RouteStatus>("loading");
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  useEffect(() => {
    if (!pickup || !destination) return;

    let cancelled = false;
    async function loadRoute() {
      try {
        const route = await getMapProvider().getRoute(pickup!, destination!, stops);
        if (cancelled) return;
        setDistanceMeters(route.distanceMeters);
        setDurationSeconds(route.durationSeconds);
        setRouteStatus("ready");
      } catch {
        // No live map provider configured in this environment — fall back to a
        // straight-line estimate so the flow still works end to end. See docs/maps.md.
        if (cancelled) return;
        const meters = haversineDistanceMeters(pickup!, destination!);
        setDistanceMeters(meters);
        setDurationSeconds(estimateEtaSeconds(meters));
        setRouteStatus("ready");
      }
    }

    void loadRoute();
    return () => {
      cancelled = true;
    };
  }, [pickup, destination, stops]);

  if (!pickup || !destination) {
    return <AppStatusView state="error" title={t("booking.missingLocationsTitle")} description={t("booking.missingLocationsBody")} />;
  }

  const categories = DEFAULT_VEHICLE_CATEGORIES;
  const fares = categories.map((category) => ({
    category,
    fare: calculateFare({ distanceMeters, durationSeconds, category, settings: DEFAULT_FARE_SETTINGS }),
  }));

  function handleContinue() {
    const selected = fares.find((f) => f.category.id === vehicleCategoryId);
    if (!selected) return;
    setEstimate({ distanceMeters, durationSeconds }, selected.fare);
    router.push("/booking/confirm");
  }

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("booking.chooseVehicleTitle")}</AppText>

      {routeStatus === "loading" && <AppStatusView state="loading" title={t("booking.calculatingRoute")} />}

      {routeStatus === "ready" && (
        <>
          <View style={styles.routeSummary}>
            <AppText variant="muted">{t("booking.estimatedDistance", { km: (distanceMeters / 1000).toFixed(1) })}</AppText>
            <AppText variant="muted">{t("booking.estimatedDuration", { minutes: Math.round(durationSeconds / 60) })}</AppText>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {fares.map(({ category, fare }) => (
              <AppVehicleCategoryCard
                key={category.id}
                category={{ ...category, isActive: true, createdAt: new Date(), updatedAt: new Date() }}
                fareTotal={fare.total}
                currency={fare.currency}
                selected={vehicleCategoryId === category.id}
                onPress={() => setVehicleCategoryId(category.id)}
              />
            ))}
          </ScrollView>

          <AppButton label={t("common.continue")} disabled={!vehicleCategoryId} onPress={handleContinue} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  routeSummary: { flexDirection: "row", gap: spacing.lg },
  list: { gap: spacing.sm, paddingBottom: spacing.md },
});
