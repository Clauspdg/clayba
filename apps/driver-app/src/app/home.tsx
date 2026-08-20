import { driverFirestore } from "@/lib/firebase-client";
import { useDriverSession } from "@/features/drivers/useDriverSession";
import { useDriverEarningsSummary } from "@/features/wallet/useDriverEarningsSummary";
import { requestDriverLocationPermission } from "@/lib/location-tracking";
import {
  subscribeCurrentDriverTrip,
  subscribeDriverTripHistory,
  subscribeMyRideOffers,
} from "@the-ride/firebase/client";
import { setOwnAvailabilityStatus } from "@the-ride/firebase/client";
import { useTranslation } from "@the-ride/hooks";
import { DriverAvailabilityStatus, TripStatus, type RideOffer, type Trip } from "@the-ride/types";
import { getOnlineEligibility, type OnlineBlockReason } from "@the-ride/utils";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/theme/tokens";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * CLAYBA P2 — Driver Home, wired to the real backend (replaces the local
 * Zustand simulation that used to live here — see `driver-store.ts`'s old
 * doc comment). Reuses exactly the client functions the web Driver Home
 * already proved live: `setOwnAvailabilityStatus`, `subscribeMyRideOffers`,
 * `subscribeCurrentDriverTrip`, `subscribeDriverTripHistory`,
 * `useDriverEarningsSummary`. No new backend logic.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const { session, driver, vehicle } = useDriverSession();
  const { summary } = useDriverEarningsSummary(session?.uid);
  const [offers, setOffers] = useState<RideOffer[] | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null | undefined>(undefined);
  const [tripHistory, setTripHistory] = useState<Trip[] | null>(null);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!driver) return;
    return subscribeMyRideOffers(driverFirestore, driver.id, setOffers, () => setOffers([]));
  }, [driver]);

  useEffect(() => {
    if (!driver) return;
    return subscribeCurrentDriverTrip(driverFirestore, driver.id, setCurrentTrip, () =>
      setCurrentTrip(null),
    );
  }, [driver]);

  useEffect(() => {
    if (!driver) return;
    return subscribeDriverTripHistory(driverFirestore, driver.id, setTripHistory, () =>
      setTripHistory([]),
    );
  }, [driver]);

  // Real dispatch offer arrived — navigate to the real offer screen.
  useEffect(() => {
    if (offers && offers.length > 0) {
      router.push({ pathname: "/offer", params: { offerId: offers[0]!.id } });
    }
  }, [offers]);

  // A trip already assigned/in progress — the driver belongs on Active Ride, not Home.
  useEffect(() => {
    if (currentTrip) router.replace("/active-ride");
  }, [currentTrip]);

  const completedToday = useMemo(() => {
    if (!tripHistory) return null;
    const dayStart = startOfToday();
    return tripHistory.filter(
      (trip) =>
        trip.status === TripStatus.COMPLETED && trip.completedAt && trip.completedAt >= dayStart,
    ).length;
  }, [tripHistory]);

  const availabilityStatus = driver?.availabilityStatus ?? DriverAvailabilityStatus.OFFLINE;
  const isOnline = availabilityStatus !== DriverAvailabilityStatus.OFFLINE;

  const eligibility = useMemo(
    () => (driver ? getOnlineEligibility(driver, vehicle ?? null) : null),
    [driver, vehicle],
  );
  const blockReasonKey: Record<OnlineBlockReason, string> = {
    suspended: "driverSpace.onlineBlocked.suspended",
    inactive: "driverSpace.onlineBlocked.inactive",
    no_vehicle: "driverSpace.onlineBlocked.noVehicle",
    vehicle_not_approved: "driverSpace.onlineBlocked.vehicleNotApproved",
    document_expired: "driverSpace.onlineBlocked.documentExpired",
  };

  async function toggleOnline() {
    if (!driver || togglingOnline || (!isOnline && eligibility && !eligibility.eligible)) return;
    setTogglingOnline(true);
    setLocationNotice(null);
    try {
      if (isOnline) {
        await setOwnAvailabilityStatus(
          driverFirestore,
          driver.id,
          DriverAvailabilityStatus.OFFLINE,
        );
      } else {
        // CLAYBA P2, section 11 — real GPS permission requested the first
        // time the driver goes online, exactly once per toggle, never
        // silently skipped. `DispatchService.buildMatchingCandidates`
        // excludes any driver without `lastKnownLocation`, so going
        // online without it succeeds but the driver won't actually be
        // offered rides — the honest notice below says so.
        const permission = await requestDriverLocationPermission();
        if (permission === "granted") {
          const position = await Location.getCurrentPositionAsync({});
          await setOwnAvailabilityStatus(
            driverFirestore,
            driver.id,
            DriverAvailabilityStatus.AVAILABLE,
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          );
        } else {
          await setOwnAvailabilityStatus(
            driverFirestore,
            driver.id,
            DriverAvailabilityStatus.AVAILABLE,
          );
          setLocationNotice(
            permission === "gps_disabled"
              ? t("driverHome.locationDisabled")
              : t("driverHome.locationDenied"),
          );
        }
      }
    } finally {
      setTogglingOnline(false);
    }
  }

  if (!driver) {
    return (
      <Screen style={styles.center}>
        <AppText variant="body">{t("common.loading")}</AppText>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("driverHome.title")}</AppText>

      <AppCard style={styles.statusCard}>
        <AppText variant="subheading">{t(`driverHome.status.${availabilityStatus}`)}</AppText>
        <AppText variant="muted">
          {isOnline ? t("driverHome.onlineHint") : t("driverHome.offlineHint")}
        </AppText>
        {locationNotice && (
          <AppText variant="muted" style={styles.warning}>
            {locationNotice}
          </AppText>
        )}
        {!isOnline && eligibility && !eligibility.eligible && (
          <View>
            {eligibility.reasons.map((reason) => (
              <AppText key={reason} variant="muted" style={styles.warning}>
                {t(blockReasonKey[reason])}
              </AppText>
            ))}
          </View>
        )}
      </AppCard>

      <View style={styles.statsRow}>
        <AppCard style={styles.statCard}>
          <AppText variant="muted">{t("driverSpace.home.todayEarningsLabel")}</AppText>
          <AppText variant="subheading">{summary ? `$${summary.today.toFixed(2)}` : "—"}</AppText>
        </AppCard>
        <AppCard style={styles.statCard}>
          <AppText variant="muted">{t("driverSpace.home.completedTodayLabel")}</AppText>
          <AppText variant="subheading">{completedToday ?? "—"}</AppText>
        </AppCard>
      </View>

      <View style={styles.actions}>
        <AppButton
          label={isOnline ? t("driverHome.goOffline") : t("driverHome.goOnline")}
          variant={isOnline ? "outline" : "primary"}
          isLoading={togglingOnline}
          disabled={!isOnline && eligibility ? !eligibility.eligible : false}
          onPress={() => void toggleOnline()}
        />
        <AppButton
          label={t("driverSpace.nav.trips")}
          variant="outline"
          onPress={() => router.push("/history")}
        />
        <AppButton
          label={t("profile.title")}
          variant="outline"
          onPress={() => router.push("/profile")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  center: { alignItems: "center", justifyContent: "center" },
  statusCard: { gap: 4 },
  warning: { color: colors.danger },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: { flex: 1, gap: 4 },
  actions: { gap: spacing.sm, marginTop: "auto" },
});
