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
  type TripSettlementSummary,
} from "@the-ride/firebase/client";
import { useTranslation } from "@the-ride/hooks";
import {
  DRIVER_LOCATION_WRITE_THROTTLE_MS,
  PaymentMethodType,
  PaymentStatus,
  TripStatus,
  type Trip,
  type TripRequest,
} from "@the-ride/types";
import { canTransitionTrip, driverEarningsFromFare } from "@the-ride/utils";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { SafetyPanel } from "@/components/SafetyPanel";
import { Screen } from "@/components/Screen";
import { StatusBadge } from "@/components/StatusBadge";
import { useNetworkStatus } from "@/lib/network-status";
import { spacing } from "@/theme/tokens";

const STATUS_TONE: Partial<Record<TripStatus, "success" | "brand" | "neutral">> = {
  [TripStatus.MATCHED]: "brand",
  [TripStatus.EN_ROUTE_TO_PICKUP]: "brand",
  [TripStatus.ARRIVED]: "brand",
  [TripStatus.IN_PROGRESS]: "success",
  [TripStatus.COMPLETED]: "success",
};

/**
 * GPS Tracking sprint — widened from `[EN_ROUTE_TO_PICKUP, IN_PROGRESS]`:
 * the passenger should see their driver the moment one is found
 * (`MATCHED`) and while waiting at pickup (`ARRIVED`), not only while the
 * driver is actively navigating. Safe to widen — the fare-meter's
 * `accumulateDistanceFromLocationDelta` (functions/src/trips/index.ts via
 * `packages/firebase/src/firestore/trips.repository.ts`) already ignores
 * every status except `IN_PROGRESS`, so publishing more often here cannot
 * inflate `actualDistanceMeters`.
 */
const TRACKED_STATUSES: TripStatus[] = [
  TripStatus.MATCHED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED,
  TripStatus.IN_PROGRESS,
];

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
  const { isConnected } = useNetworkStatus();
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

  // Real GPS tracking — active from the moment a driver is matched through
  // in-progress; stops itself the instant the trip leaves a tracked status.
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
        // Fire-and-forget: a real write failure must never crash or stall
        // the ride — Firestore already queues writes locally while
        // offline and resolves once reconnected, so this only guards
        // against a genuine rejection (e.g. permission-denied).
        void updateTripDriverLocation(driverFirestore, tripId, reading).catch(() => {});
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
    if (!trip || !driver || busy || !isConnected) return;
    const next = NEXT_STAGE[trip.status];
    if (!next || !canTransitionTrip(trip.status, next.to)) return;
    setBusy(true);
    try {
      if (next.to === TripStatus.COMPLETED) {
        const { settlement } = await completeTrip(driverFunctions, trip.id);
        // Payments — this screen unmounts as soon as the trip leaves the
        // active set, so the cash/PayPal instruction goes in an Alert that
        // survives the redirect to Home.
        Alert.alert(t("payments.rideCompletedTitle"), describeSettlement(settlement, trip, t));
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
      <View style={styles.headerRow}>
        <AppText variant="heading">{t("driverSpace.nav.currentRide")}</AppText>
        <View style={styles.headerActions}>
          <StatusBadge
            label={t(`driverSpace.tripStatus.${trip.status}`)}
            tone={STATUS_TONE[trip.status] ?? "neutral"}
          />
          <SafetyPanel trip={trip} />
        </View>
      </View>

      <AppCard variant="elevated" style={styles.card}>
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
          <AppText variant="caption" tone={locationNotice ? "danger" : "muted"}>
            {locationNotice ?? t("driverSpace.currentRide.locationSharing")}
          </AppText>
        )}
      </AppCard>

      <View style={styles.actions}>
        {!isCompleted && (
          <AppButton
            label={t("driverSpace.currentRide.navigateCta")}
            variant="outline"
            size="lg"
            onPress={() => void handleNavigate()}
          />
        )}
        {isCompleted ? (
          <AppButton label={t("common.back")} size="lg" onPress={() => router.replace("/home")} />
        ) : (
          next && (
            <AppButton
              label={t(next.ctaKey)}
              size="lg"
              isLoading={busy}
              disabled={!isConnected}
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  card: { gap: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  statBlock: { flex: 1, gap: 2 },
  completedBlock: { gap: 2, marginTop: spacing.sm },
  actions: { gap: spacing.sm, marginTop: "auto" },
});

/** Payments — the driver's after-ride instruction: cash to collect, or PayPal confirmation. */
function describeSettlement(
  settlement: TripSettlementSummary | null,
  trip: Trip,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (settlement?.paymentStatus === PaymentStatus.FAILED) return t("payments.settlementFailed");
  const method = settlement?.paymentMethod ?? trip.paymentMethod ?? PaymentMethodType.CASH;
  if (method === PaymentMethodType.PAYPAL) {
    const earnings =
      settlement?.driverEarnings ??
      (trip.finalFareBreakdown ? driverEarningsFromFare(trip.finalFareBreakdown) : undefined);
    return t("payments.paidByPaypal", {
      amount: earnings !== undefined ? `$${earnings.toFixed(2)}` : "—",
    });
  }
  const cash = settlement?.cashToCollect ?? trip.fareAmount;
  return t("payments.collectCash", { amount: cash !== undefined ? `$${cash.toFixed(2)}` : "—" });
}
