import { getGlobalSettings, subscribeVehicleCategories } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import type { PlatformSettings, VehicleCategory } from "@the-ride/types";
import { calculateFare, estimateEtaSeconds, haversineDistanceMeters } from "@the-ride/utils";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppStatusView } from "@/components/AppStatusView";
import { AppText } from "@/components/AppText";
import { AppVehicleCategoryCard } from "@/components/AppVehicleCategoryCard";
import { Screen } from "@/components/Screen";
import { passengerFirestore } from "@/lib/firebase-client";
import { getMapProvider } from "@/lib/map-provider";
import { useBookingStore } from "@/stores/booking-store";
import { spacing } from "@/theme/tokens";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Real vehicle categories and platform fare settings — `subscribeVehicleCategories`/
 * `getGlobalSettings` (`@the-ride/firebase/client`), the same admin-managed
 * data the web booking flow reads. `calculateFare()` (`@the-ride/utils`) is
 * the same pricing engine every other CLAYBA surface uses — no hardcoded
 * prices, no parallel pricing logic.
 */
export default function VehicleSelectionScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { pickup, destination, stops, vehicleCategoryId, setVehicleCategoryId, setEstimate } =
    useBookingStore();

  const [routeStatus, setRouteStatus] = useState<LoadStatus>("loading");
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [categories, setCategories] = useState<VehicleCategory[] | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
        // No live route provider available — fall back to a straight-line
        // estimate so the flow still works end to end.
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

  useEffect(() => {
    if (!session) return;
    const unsubscribe = subscribeVehicleCategories(passengerFirestore, setCategories, (message) =>
      setLoadError(message),
    );
    void getGlobalSettings(passengerFirestore)
      .then(setSettings)
      .catch(() => undefined);
    return unsubscribe;
  }, [session]);

  if (!pickup || !destination) {
    return (
      <AppStatusView
        state="error"
        title={t("booking.missingLocationsTitle")}
        description={t("booking.missingLocationsBody")}
      />
    );
  }

  if (loadError) {
    return <AppStatusView state="error" title={t("common.error")} description={loadError} />;
  }

  const isLoading = routeStatus === "loading" || categories === null || settings === null;

  const eligibleCategories = (categories ?? []).filter(
    (category) => category.maximumPassengers >= 1,
  );

  const fares =
    settings && !isLoading
      ? eligibleCategories.map((category) => ({
          category,
          fare: calculateFare({ distanceMeters, durationSeconds, category, settings }),
        }))
      : [];

  function handleContinue() {
    const selected = fares.find((f) => f.category.id === vehicleCategoryId);
    if (!selected) return;
    setEstimate({ distanceMeters, durationSeconds }, selected.fare);
    router.push("/booking/confirm");
  }

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("booking.chooseVehicleTitle")}</AppText>

      {isLoading && <AppStatusView state="loading" title={t("booking.calculatingRoute")} />}

      {!isLoading && (
        <>
          <View style={styles.routeSummary}>
            <AppText variant="body" tone="muted">
              {t("booking.estimatedDistance", { km: (distanceMeters / 1000).toFixed(1) })}
            </AppText>
            <AppText variant="body" tone="muted">
              {t("booking.estimatedDuration", { minutes: Math.round(durationSeconds / 60) })}
            </AppText>
          </View>

          {fares.length === 0 ? (
            <AppStatusView
              state="empty"
              title={t("booking.noCategoriesForPassengerCount", { count: 1 })}
            />
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {fares.map(({ category, fare }) => (
                <AppVehicleCategoryCard
                  key={category.id}
                  category={category}
                  fareTotal={fare.total}
                  currency={fare.currency}
                  selected={vehicleCategoryId === category.id}
                  onPress={() => setVehicleCategoryId(category.id, category)}
                />
              ))}
            </ScrollView>
          )}

          <AppButton
            label={t("common.continue")}
            disabled={!vehicleCategoryId}
            onPress={handleContinue}
          />
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
