"use client";

import { webFirestore, webFunctions } from "@/lib/firebase-client";
import { FareMeter } from "@/components/passenger/FareMeter";
import { useUserExperience } from "@/hooks/useUserExperience";
import {
  advanceTripStatus,
  completeTrip,
  getTripRequest,
  setAvailableAfterTripCompletion,
  subscribeCurrentDriverTrip,
  updateTripDriverLocation,
} from "@the-ride/firebase/client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Heading,
  Icon,
  Illustration,
  LoadingState,
  Text,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import {
  DRIVER_LOCATION_WRITE_THROTTLE_MS,
  TripStatus,
  type Trip,
  type TripRequest,
} from "@the-ride/types";
import {
  canTransitionTrip,
  estimateEtaSeconds,
  getLocationFreshness,
  haversineDistanceMeters,
} from "@the-ride/utils";
import { useEffect, useRef, useState } from "react";

/** Skip a `watchPosition` reading if the last write was more recent than this — avoids writing on every GPS tick. CLAYBA P2 — now a shared constant so the Android driver app reuses the exact same value. */
const LOCATION_WRITE_THROTTLE_MS = DRIVER_LOCATION_WRITE_THROTTLE_MS;

/**
 * DRIVER-E2E-08.1 — extra settle time after the realtime subscription
 * confirms a transition landed, before the NEXT stage's button is allowed
 * to re-enable. Without this, "I've arrived" succeeding and the
 * subscription's `trip.status` update updating `next` to "Start ride" can
 * both happen within the same rapid double-click's two clicks, since
 * Firestore round-trips (write ack + snapshot echo) can resolve in well
 * under typical double-click timing.
 */
const TRANSITION_SETTLE_MS = 500;

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

/** Live position tracked whenever the driver is actually moving with the passenger somewhere — approaching pickup, or en route to the destination. Not `MATCHED`/`ARRIVED` (parked, nothing to track). */
const TRACKED_STATUSES: TripStatus[] = [TripStatus.EN_ROUTE_TO_PICKUP, TripStatus.IN_PROGRESS];

/**
 * UX-3 sprint (Dedicated Driver Space), Part 7 — real stage progression:
 * `trips/{tripId}` is driver-writable for the assigned driver
 * (`firestore.rules`), unlike `rideOffers`/`drivers`, so this page's
 * buttons perform genuine Firestore writes gated by
 * `TRIP_STATUS_TRANSITIONS` (`@the-ride/utils`'s `canTransitionTrip`) —
 * not a disclosed gap like Ride Requests/Go Online.
 */
export default function CurrentRidePage() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const { driver } = useUserExperience();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [request, setRequest] = useState<TripRequest | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  // DRIVER-E2E-08.1 — the status this page is waiting to observe come back
  // through the realtime subscription. Non-null covers BOTH the write
  // in-flight and the "waiting for the echo + settle window" phases, so
  // the lifecycle button stays locked across the whole gap where a rapid
  // second click could otherwise land on the newly-revealed next action.
  const [pendingTarget, setPendingTarget] = useState<TripStatus | null>(null);
  const [pendingCtaKey, setPendingCtaKey] = useState<string | null>(null);
  const [locationSharing, setLocationSharing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const lastLocationWriteAt = useRef(0);
  // CLAYBA P1.1, section 5 — re-render periodically so ETA/freshness stay
  // accurate between location writes, mirroring `LiveRideTracking`'s own
  // tick on the passenger side.
  const [, tick] = useState(0);

  useEffect(() => {
    if (!driver) return;
    return subscribeCurrentDriverTrip(webFirestore, driver.id, setTrip, () => setTrip(null));
  }, [driver]);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  /**
   * DRIVER-E2E-08, extended CLAYBA P1 (Part A) — live position while the
   * driver is actually en route (to pickup, or to the destination once the
   * ride has started; still not while `MATCHED`/`ARRIVED`, both stationary).
   * Stops itself (via the cleanup function) the moment `trip` leaves a
   * tracked status — status advance, trip completion/cancellation, or
   * unmount all naturally end tracking; nothing else has to remember to
   * turn it off. `heading`/`speed`/`accuracy` ride along when the device
   * reports them — `onTripDriverLocationWritten`
   * (functions/src/trips/index.ts) is what actually decides whether a
   * reading is trustworthy enough to count toward the fare meter's
   * `actualDistanceMeters`, this effect just reports what the device saw.
   */
  useEffect(() => {
    setLocationError(null);
    setLocationSharing(false);
    if (!trip || !TRACKED_STATUSES.includes(trip.status)) return;
    if (!("geolocation" in navigator)) {
      setLocationError(t("driverSpace.currentRide.locationUnsupported"));
      return;
    }
    const tripId = trip.id;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocationSharing(true);
        setLocationError(null);
        const now = Date.now();
        if (now - lastLocationWriteAt.current < LOCATION_WRITE_THROTTLE_MS) return;
        lastLocationWriteAt.current = now;
        void updateTripDriverLocation(webFirestore, tripId, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        setLocationSharing(false);
        setLocationError(t("driverSpace.currentRide.locationDenied"));
      },
      { enableHighAccuracy: false, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [trip, t]);

  useEffect(() => {
    if (!trip) {
      setRequest(trip === null ? null : undefined);
      return;
    }
    let cancelled = false;
    // `trip.id` is the trips/{id} doc's own id, not the tripRequests/{id}
    // it was created from (DRIVER-E2E-07 added `tripRequestId` for exactly
    // this lookup) — falls back to `trip.id` only for a hypothetical trip
    // doc predating that field.
    getTripRequest(webFirestore, trip.tripRequestId ?? trip.id)
      .then((result) => !cancelled && setRequest(result))
      .catch(() => !cancelled && setRequest(null));
    return () => {
      cancelled = true;
    };
  }, [trip]);

  // Once the realtime subscription confirms `trip.status` actually reached
  // `pendingTarget`, wait one more settle beat before unlocking the button
  // — this is what stops a rapid second click from ever reaching whichever
  // action the button re-renders as next. Completing a trip is a special
  // case: `subscribeCurrentDriverTrip`'s own query excludes `COMPLETED`
  // (not in `ACTIVE_TRIP_STATUSES`), so `trip` goes straight to `null`
  // rather than ever showing `status: completed` — that IS the expected
  // confirmation for that one transition, not a case to keep waiting on.
  useEffect(() => {
    if (pendingTarget === null) return;
    const confirmed =
      pendingTarget === TripStatus.COMPLETED ? trip === null : trip?.status === pendingTarget;
    if (!confirmed) return;
    const timer = setTimeout(() => {
      setPendingTarget(null);
      setPendingCtaKey(null);
      setBusy(false);
    }, TRANSITION_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [trip, pendingTarget]);

  // CLAYBA P1.1, section 5 — opens the driver's own maps app/site via a
  // universal deep link, same approach the CLAYBA Driver Android app
  // already uses (`active-ride.tsx`'s `handleNavigate`) — no in-app
  // turn-by-turn engine, just a real link to the target the driver is
  // currently heading toward.
  function handleNavigate() {
    if (!trip) return;
    const target = trip.status === TripStatus.IN_PROGRESS ? trip.dropoff : trip.pickup;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleAdvance() {
    if (!trip || !driver || busy || pendingTarget !== null) return;
    const next = NEXT_STAGE[trip.status];
    if (!next || !canTransitionTrip(trip.status, next.to)) return;
    setBusy(true);
    setPendingTarget(next.to);
    setPendingCtaKey(next.ctaKey);
    try {
      // CLAYBA P1, Part B — every stage except the last is still the
      // direct client write `advanceTripStatus` always was; Complete Ride
      // now goes through the `completeTrip` Cloud Function instead, which
      // freezes `finalFareBreakdown`/`fareAmount` server-side from the
      // trip's own accumulated `actualDistanceMeters` — `firestore.rules`
      // no longer lets a driver's client set those fields directly.
      if (next.to === TripStatus.COMPLETED) {
        await completeTrip(webFunctions, trip.id);
      } else {
        await advanceTripStatus(webFirestore, trip.id, next.to);
      }
      // DRIVER-E2E-10 — completing a trip is the one transition that also
      // needs to free the driver: `DRIVER_AVAILABILITY_TRANSITIONS` makes
      // `ON_TRIP -> AVAILABLE` legal, but until now nothing ever performed
      // it (dispatch only ever moves a driver INTO `on_trip`). A failure
      // here is toasted but doesn't undo the trip completion itself, which
      // already succeeded and is the primary, real outcome.
      if (next.to === TripStatus.COMPLETED) {
        try {
          await setAvailableAfterTripCompletion(webFirestore, driver.id);
        } catch (err) {
          toast({
            variant: "danger",
            title: err instanceof Error ? err.message : t("common.error"),
          });
        }
      }
      // Left busy/pendingTarget locked here on purpose — the settle effect
      // above is what clears them, once the realtime echo confirms the
      // write actually landed, not just that the request completed.
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
      setBusy(false);
      setPendingTarget(null);
      setPendingCtaKey(null);
    }
  }

  if (!driver || trip === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Heading level={1}>{t("driverSpace.nav.currentRide")}</Heading>
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("driverSpace.currentRide.emptyTitle")}
        />
      </div>
    );
  }

  const next = NEXT_STAGE[trip.status];

  if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Heading level={1}>{t("driverSpace.nav.currentRide")}</Heading>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Badge tone={trip.status === TripStatus.COMPLETED ? "success" : "danger"}>
              {t(`driverSpace.tripStatus.${trip.status}`)}
            </Badge>
            <Text tone="muted">{t("driverSpace.currentRide.summaryBody")}</Text>
            {trip.fareAmount !== undefined && (
              <Text size="lg" weight="medium">
                ${trip.fareAmount.toFixed(2)}
              </Text>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // CLAYBA P1.1, section 5 — ETA/distance remaining to whatever the driver
  // is currently heading toward, from the same `driverLocation` this page
  // itself writes (the passenger's `LiveRideTracking` computes the
  // identical thing from the same field — one source of truth, not a
  // second formula).
  const navigationTarget = trip.status === TripStatus.IN_PROGRESS ? trip.dropoff : trip.pickup;
  const locationFreshness = getLocationFreshness(trip.driverLocationUpdatedAt);
  const driverLocation = locationFreshness !== "expired" ? trip.driverLocation : undefined;
  const distanceRemainingMeters = driverLocation
    ? haversineDistanceMeters(driverLocation, navigationTarget)
    : null;
  const etaSeconds =
    distanceRemainingMeters !== null ? estimateEtaSeconds(distanceRemainingMeters) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading level={1}>{t("driverSpace.nav.currentRide")}</Heading>
        <Badge tone="brand">{t(`driverSpace.tripStatus.${trip.status}`)}</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          {request === undefined ? (
            <Text size="sm" tone="muted">
              {t("common.loading")}
            </Text>
          ) : request ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Icon name="mapPin" size={16} className="text-success mt-0.5 shrink-0" />
                <Text size="sm">
                  {request.pickup.address ?? `${request.pickup.lat}, ${request.pickup.lng}`}
                </Text>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="flag" size={16} className="text-danger mt-0.5 shrink-0" />
                <Text size="sm">
                  {request.dropoff.address ?? `${request.dropoff.lat}, ${request.dropoff.lng}`}
                </Text>
              </div>
              {request.estimatedDistanceMeters !== undefined && (
                <Text size="sm" tone="muted">
                  {t("driverSpace.requests.distanceLabel")}:{" "}
                  {(request.estimatedDistanceMeters / 1000).toFixed(1)} km
                </Text>
              )}
            </div>
          ) : (
            <Text size="sm" tone="muted">
              {t("driverSpace.requests.detailsUnavailable")}
            </Text>
          )}

          {trip.fareAmount !== undefined && (
            <Text size="sm" tone="muted">
              {t("driverSpace.currentRide.fareLabel")}: ${trip.fareAmount.toFixed(2)}
            </Text>
          )}

          {trip.arrivedAt && (
            <Text size="xs" tone="muted">
              {t("driverSpace.currentRide.arrivedLabel")}:{" "}
              {trip.arrivedAt.toLocaleTimeString(locale)}
            </Text>
          )}

          {trip.startedAt && (
            <Text size="xs" tone="muted">
              {t("driverSpace.currentRide.startedLabel")}:{" "}
              {trip.startedAt.toLocaleTimeString(locale)}
            </Text>
          )}

          {trip.status === TripStatus.EN_ROUTE_TO_PICKUP && (
            <Text size="xs" tone={locationError ? "danger" : "muted"}>
              {locationError
                ? locationError
                : locationSharing
                  ? t("driverSpace.currentRide.locationSharing")
                  : t("driverSpace.currentRide.locationAcquiring")}
            </Text>
          )}

          {TRACKED_STATUSES.includes(trip.status) &&
            distanceRemainingMeters !== null &&
            etaSeconds !== null && (
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <div>
                  <Text size="xs" tone="muted">
                    {t("rideHistory.liveTracking.distanceRemaining")}
                  </Text>
                  <Text weight="semibold">{(distanceRemainingMeters / 1000).toFixed(1)} km</Text>
                </div>
                <div>
                  <Text size="xs" tone="muted">
                    {t("rideHistory.liveTracking.eta")}
                  </Text>
                  <Text weight="semibold">
                    {t("rideHistory.liveTracking.etaMinutes", {
                      minutes: String(Math.max(1, Math.round(etaSeconds / 60))),
                    })}
                  </Text>
                </div>
              </div>
            )}

          <FareMeter trip={trip} />

          <Button variant="outline" onClick={handleNavigate}>
            <Icon name="navigation" size={16} className="mr-1.5" />
            {t("driverSpace.currentRide.navigateCta")}
          </Button>

          {/*
            DRIVER-E2E-08.1 — while a transition is pending/settling, the
            button for the CURRENT stage's action stays put (loading,
            disabled) rather than swapping to the next stage's action the
            instant the realtime echo arrives; the next real action only
            renders once `pendingTarget` clears.
          */}
          {pendingTarget !== null ? (
            <Button size="lg" fullWidth isLoading disabled>
              {t(pendingCtaKey ?? "common.loading")}
            </Button>
          ) : (
            next && (
              <Button size="lg" fullWidth onClick={() => void handleAdvance()}>
                {t(next.ctaKey)}
              </Button>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
