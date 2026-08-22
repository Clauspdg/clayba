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
import { useAuth, useTranslation } from "@the-ride/hooks";
import { DriverAvailabilityStatus, TripStatus, type RideOffer, type Trip } from "@the-ride/types";
import { getOnlineEligibility, type OnlineBlockReason } from "@the-ride/utils";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { DriverAvatar } from "@/components/DriverAvatar";
import { Screen } from "@/components/Screen";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { spacing } from "@/theme/tokens";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * CLAYBA Driver V2 — Go Online state machine (brief section 5, P0). The
 * previous implementation went straight `offline -> available` in one
 * Firestore write. firestore.rules' `isOwnAvailabilityToggle()` only
 * permits `offline -> online` and `online -> available` as two SEPARATE
 * writes — that one-step write was a genuine permission-denied rejection
 * on every real attempt, and because the old code had no `catch` block at
 * all, the rejection was silently swallowed: the button just reset to
 * "Go Online" with zero explanation. This matches the reference,
 * already-correct implementation in apps/web/src/app/(driver)/driver/page.tsx's
 * `handleGoOnline`, not a new mechanism.
 */
type GoOnlineStage =
  "idle" | "requesting_permission" | "getting_location" | "going_online" | "error";

function greetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "driverSpace.home.greetingMorning";
  if (hour < 18) return "driverSpace.home.greetingAfternoon";
  return "driverSpace.home.greetingEvening";
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { driver, vehicle } = useDriverSession();
  const { summary } = useDriverEarningsSummary(session?.uid);
  const [offers, setOffers] = useState<RideOffer[] | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null | undefined>(undefined);
  const [tripHistory, setTripHistory] = useState<Trip[] | null>(null);
  const [stage, setStage] = useState<GoOnlineStage>("idle");
  const [stageError, setStageError] = useState<string | null>(null);
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
  const busy = stage !== "idle" && stage !== "error";

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

  async function handleGoOffline() {
    if (!driver || busy) return;
    setStage("going_online"); // reused as the generic "writing" busy stage
    setStageError(null);
    try {
      await setOwnAvailabilityStatus(driverFirestore, driver.id, DriverAvailabilityStatus.OFFLINE);
      setStage("idle");
    } catch (err) {
      setStageError(err instanceof Error ? err.message : t("common.error"));
      setStage("error");
    }
  }

  async function handleGoOnline() {
    if (!driver || busy || (eligibility && !eligibility.eligible)) return;
    setLocationNotice(null);
    setStageError(null);
    try {
      setStage("requesting_permission");
      const permission = await requestDriverLocationPermission();

      if (permission !== "granted") {
        // Real, disclosed limitation (brief section 11): dispatch excludes
        // any driver without a `lastKnownLocation`, so going online
        // without it succeeds but the driver won't actually be offered
        // rides. Still a real two-step Firestore write, just without a
        // location payload on the first one.
        setStage("going_online");
        await setOwnAvailabilityStatus(driverFirestore, driver.id, DriverAvailabilityStatus.ONLINE);
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
        setStage("idle");
        return;
      }

      setStage("getting_location");
      const position = await Location.getCurrentPositionAsync({});

      setStage("going_online");
      await setOwnAvailabilityStatus(driverFirestore, driver.id, DriverAvailabilityStatus.ONLINE, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      await setOwnAvailabilityStatus(
        driverFirestore,
        driver.id,
        DriverAvailabilityStatus.AVAILABLE,
      );
      setStage("idle");
    } catch (err) {
      setStageError(err instanceof Error ? err.message : t("common.error"));
      setStage("error");
    }
  }

  const goingOnlineLabel: Partial<Record<GoOnlineStage, string>> = {
    requesting_permission: t("driverHome.stageRequestingPermission"),
    getting_location: t("driverHome.stageGettingLocation"),
    going_online: t("driverHome.stageGoingOnline"),
  };

  if (driver === undefined) {
    return (
      <Screen style={styles.center}>
        <AppText variant="body">{t("common.loading")}</AppText>
      </Screen>
    );
  }

  if (driver === null) {
    return (
      <Screen style={styles.center}>
        <AppText variant="subheading" style={styles.centerText}>
          {t("driverHome.accessUnavailableTitle")}
        </AppText>
        <AppText variant="body" tone="muted" style={styles.centerText}>
          {t("driverHome.accessUnavailableBody")}
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <DriverAvatar
          photoURL={driver.documents.find((doc) => doc.type === "profile_photo")?.url}
          name={session?.displayName ?? session?.email}
        />
        <View>
          <AppText variant="caption" tone="muted">
            {t(greetingKey())}
          </AppText>
          <AppText variant="subheading">{session?.displayName ?? session?.email ?? "—"}</AppText>
        </View>
      </View>

      <AppCard variant="elevated" style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <AppText variant="subheading">
            {isOnline ? t("driverHome.onlineTitle") : t("driverHome.title")}
          </AppText>
          <StatusBadge
            label={t(`driverHome.status.${availabilityStatus}`)}
            tone={isOnline ? "success" : "neutral"}
          />
        </View>
        <AppText variant="body" tone="muted">
          {isOnline ? t("driverHome.onlineHint") : t("driverHome.offlineHint")}
        </AppText>

        {stage !== "idle" && stage !== "error" && goingOnlineLabel[stage] && (
          <AppText variant="caption" tone="brand">
            {goingOnlineLabel[stage]}
          </AppText>
        )}
        {stage === "error" && stageError && (
          <AppText variant="caption" tone="danger">
            {stageError}
          </AppText>
        )}
        {locationNotice && (
          <AppText variant="caption" tone="warning">
            {locationNotice}
          </AppText>
        )}
        {!isOnline && eligibility && !eligibility.eligible && (
          <View style={styles.blockList}>
            {eligibility.reasons.map((reason) => (
              <AppText key={reason} variant="caption" tone="danger">
                {t(blockReasonKey[reason])}
              </AppText>
            ))}
          </View>
        )}

        <AppButton
          label={
            busy
              ? (goingOnlineLabel[stage] ?? t("common.loading"))
              : isOnline
                ? t("driverHome.goOffline")
                : t("driverHome.goOnline")
          }
          size="lg"
          variant={isOnline ? "outline" : "primary"}
          isLoading={busy}
          disabled={!isOnline && eligibility ? !eligibility.eligible : false}
          onPress={() => void (isOnline ? handleGoOffline() : handleGoOnline())}
          style={styles.goOnlineButton}
        />
      </AppCard>

      <AppText variant="subheading">{t("driverSpace.home.todayOverviewTitle")}</AppText>
      <View style={styles.statsRow}>
        <StatCard
          label={t("driverSpace.home.todayEarningsLabel")}
          value={summary ? `$${summary.today.toFixed(2)}` : "—"}
        />
        <StatCard
          label={t("driverSpace.home.completedTodayLabel")}
          value={completedToday !== null ? String(completedToday) : "—"}
        />
      </View>
      {driver.rating > 0 && (
        <View style={styles.statsRow}>
          <StatCard
            label={t("driverSpace.home.ratingLabel")}
            value={`★ ${driver.rating.toFixed(1)}`}
          />
          {vehicle && (
            <StatCard
              label={t("driverSpace.home.vehicleCardTitle")}
              value={`${vehicle.make} ${vehicle.model}`}
            />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.lg },
  centerText: { textAlign: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusCard: { gap: spacing.sm },
  statusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  blockList: { gap: 2 },
  goOnlineButton: { marginTop: spacing.xs },
  statsRow: { flexDirection: "row", gap: spacing.sm },
});
