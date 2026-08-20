import { driverFirestore, driverFunctions } from "@/lib/firebase-client";
import { useDriverSession } from "@/features/drivers/useDriverSession";
import { watchDriverLocation } from "@/lib/location-tracking";
import {
  advanceTripStatus,
  completeTrip,
  getTripRequest,
  setAvailableAfterTripCompletion,
  subscribeCurrentDriverTrip,
  updateTripDriverLocation,
} from "@the-ride/firebase/client";
import { useTranslation } from "@the-ride/hooks";
import {
  DRIVER_LOCATION_WRITE_THROTTLE_MS,
  TripStatus,
  type Trip,
  type TripRequest,
} from "@the-ride/types";
import { canTransitionTrip } from "@the-ride/utils";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/theme/tokens";

const TRACKED_STATUSES: TripStatus[] = [TripStatus.EN_ROUTE_TO_PICKUP, TripStatus.IN_PROGRESS];

const NEXT_STAGE: Partial<Record<TripStatus, { to: TripStatus; ctaKey: string }>> = {
  [TripStatus.MATCHED]: {
    to: TripStatus.EN_ROUTE_TO_PICKUP,
    ctaKey: "driverSpace.currentRide.navigateToPickupCta",
  },
  [TripStatus.EN_ROUTE_TO_PICKUP]: {
    to: TripStatus.ARRIVED,
    ctaKey: "driverSpace.currentRide.arrivedCta",
  },
  [TripStatus.ARRIVED]: {
    to: TripStatus.IN_PROGRESS,
    ctaKey: "driverSpace.currentRide.startRideCta",
  },
  [TripStatus.IN_PROGRESS]: {
    to: TripStatus.COMPLETED,
    ctaKey: "driverSpace.currentRide.completeCta",
  },
};

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * CLAYBA P2 — Active Ride, the mobile port of the web driver app's
 * `current-ride/page.tsx` (sections 17-22 of the brief). Same real
 * transitions (`advanceTripStatus` for every stage except the last,
 * `completeTrip` — the server-trusted callable — for Complete Ride, same
 * as P1's web fix), same throttled `updateTripDriverLocation` writes
 * while `en_route_to_pickup`/`in_progress`. "Navigate" opens the
 * device's own maps app via a universal deep link (section 18 — no
 * turn-by-turn engine built here) rather than a fake in-app map.
 */
export default function ActiveRideScreen() {
  const { t } = useTranslation();
  const { driver } = useDriverSession();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [request, setRequest] = useState<TripRequest | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [, tick] = useState(0);
  const lastWriteAt = useRef(0);

  useEffect(() => {
    if (!driver) return;
    return subscribeCurrentDriverTrip(driverFirestore, driver.id, setTrip, () => setTrip(null));
  }, [driver]);

  useEffect(() => {
    if (trip === null) router.replace("/home");
  }, [trip]);

  useEffect(() => {
    if (!trip) {
      setRequest(undefined);
      return;
    }
    let cancelled = false;
    getTripRequest(driverFirestore, trip.tripRequestId ?? trip.id)
      .then((r) => !cancelled && setRequest(r))
      .catch(() => !cancelled && setRequest(null));
    return () => {
      cancelled = true;
    };
  }, [trip?.tripRequestId]);

  // Real GPS tracking — active only while en route/in progress, same scope P1 gave the web app.
  useEffect(() => {
    setLocationNotice(null);
    if (!trip || !TRACKED_STATUSES.includes(trip.status)) return;
    const tripId = trip.id;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void watchDriverLocation(
      (reading) => {
        const now = Date.now();
        if (now - lastWriteAt.current < DRIVER_LOCATION_WRITE_THROTTLE_MS) return;
        lastWriteAt.current = now;
        void updateTripDriverLocation(driverFirestore, tripId, reading);
      },
      (state) => {
        if (cancelled) return;
        setLocationNotice(
          state === "gps_disabled"
            ? t("driverHome.locationDisabled")
            : t("driverSpace.currentRide.locationDenied"),
        );
      },
    ).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [trip?.id, trip?.status, t]);

  // Live-ticking clock for trip duration / elapsed time while in progress.
  useEffect(() => {
    if (trip?.status !== TripStatus.IN_PROGRESS) return;
    const interval = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [trip?.status]);

  async function handleNavigate() {
    if (!trip) return;
    const target = trip.status === TripStatus.IN_PROGRESS ? trip.dropoff : trip.pickup;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`;
    await Linking.openURL(url);
  }

  async function handleAdvance() {
    if (!trip || !driver || busy) return;
    const next = NEXT_STAGE[trip.status];
    if (!next || !canTransitionTrip(trip.status, next.to)) return;
    setBusy(true);
    try {
      if (next.to === TripStatus.COMPLETED) {
        await completeTrip(driverFunctions, trip.id);
        try {
          await setAvailableAfterTripCompletion(driverFirestore, driver.id);
        } catch {
          // Real failure freeing the driver back to available — the trip
          // itself already completed successfully, which is the primary
          // outcome; the driver can still self-service via Home if needed.
        }
      } else {
        await advanceTripStatus(driverFirestore, trip.id, next.to);
      }
    } finally {
      setBusy(false);
    }
  }

  if (trip === undefined || (trip && request === undefined)) {
    return (
      <Screen style={styles.center}>
        <AppText variant="body">{t("common.loading")}</AppText>
      </Screen>
    );
  }

  if (!trip) {
    return (
      <Screen style={styles.center}>
        <AppText variant="subheading">{t("driverSpace.currentRide.emptyTitle")}</AppText>
        <AppButton
          label={t("common.back")}
          variant="outline"
          onPress={() => router.replace("/home")}
        />
      </Screen>
    );
  }

  const next = NEXT_STAGE[trip.status];
  const isCompleted = trip.status === TripStatus.COMPLETED;
  const elapsedSeconds = trip.startedAt ? (Date.now() - trip.startedAt.getTime()) / 1000 : 0;

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("driverSpace.nav.currentRide")}</AppText>

      <AppCard style={styles.card}>
        <AppText variant="muted">{t("booking.destinationLabel")}</AppText>
        <AppText variant="subheading">
          {trip.status === TripStatus.IN_PROGRESS
            ? (request?.dropoff.address ?? trip.dropoff.address ?? "—")
            : (request?.pickup.address ?? trip.pickup.address ?? "—")}
        </AppText>

        {trip.status === TripStatus.IN_PROGRESS && (
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <AppText variant="muted">{t("rideHistory.fareMeter.time")}</AppText>
              <AppText variant="subheading">{formatDuration(elapsedSeconds)}</AppText>
            </View>
            <View style={styles.statBlock}>
              <AppText variant="muted">{t("rideHistory.fareMeter.distanceTraveled")}</AppText>
              <AppText variant="subheading">
                {((trip.actualDistanceMeters ?? 0) / 1000).toFixed(2)} km
              </AppText>
            </View>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedBlock}>
            <AppText variant="muted">{t("rideHistory.fareMeter.finalFare")}</AppText>
            <AppText variant="heading">
              {trip.finalFareBreakdown
                ? `${trip.finalFareBreakdown.total.toFixed(2)} ${trip.finalFareBreakdown.currency}`
                : trip.fareAmount !== undefined
                  ? `$${trip.fareAmount.toFixed(2)}`
                  : "—"}
            </AppText>
            {trip.actualDistanceMeters !== undefined &&
              trip.actualDurationSeconds !== undefined && (
                <AppText variant="muted">
                  {(trip.actualDistanceMeters / 1000).toFixed(1)} km ·{" "}
                  {formatDuration(trip.actualDurationSeconds)}
                </AppText>
              )}
          </View>
        )}

        {trip.status === TripStatus.EN_ROUTE_TO_PICKUP && (
          <AppText variant="muted" style={locationNotice ? styles.warning : undefined}>
            {locationNotice ?? t("driverSpace.currentRide.locationSharing")}
          </AppText>
        )}
      </AppCard>

      <View style={styles.actions}>
        {!isCompleted && (
          <AppButton
            label={t("driverSpace.currentRide.navigateCta")}
            variant="outline"
            onPress={() => void handleNavigate()}
          />
        )}
        {isCompleted ? (
          <AppButton label={t("common.back")} onPress={() => router.replace("/home")} />
        ) : (
          next && (
            <AppButton
              label={t(next.ctaKey)}
              isLoading={busy}
              onPress={() => void handleAdvance()}
            />
          )
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.md },
  card: { gap: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  statBlock: { flex: 1, gap: 2 },
  completedBlock: { gap: 2, marginTop: spacing.sm },
  warning: { color: colors.danger },
  actions: { gap: spacing.sm, marginTop: "auto" },
});
