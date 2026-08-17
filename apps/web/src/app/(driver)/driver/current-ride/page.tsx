"use client";

import { webFirestore } from "@/lib/firebase-client";
import { useUserExperience } from "@/hooks/useUserExperience";
import {
  advanceTripStatus,
  getTripRequest,
  subscribeCurrentDriverTrip,
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
import { TripStatus, type Trip, type TripRequest } from "@the-ride/types";
import { canTransitionTrip } from "@the-ride/utils";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!driver) return;
    return subscribeCurrentDriverTrip(webFirestore, driver.id, setTrip, () => setTrip(null));
  }, [driver]);

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

  async function handleAdvance() {
    if (!trip) return;
    const next = NEXT_STAGE[trip.status];
    if (!next || !canTransitionTrip(trip.status, next.to)) return;
    setBusy(true);
    try {
      await advanceTripStatus(webFirestore, trip.id, next.to);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
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

          {trip.startedAt && (
            <Text size="xs" tone="muted">
              {t("driverSpace.currentRide.startedLabel")}:{" "}
              {trip.startedAt.toLocaleTimeString(locale)}
            </Text>
          )}

          {next && (
            <Button size="lg" fullWidth onClick={() => void handleAdvance()} isLoading={busy}>
              {t(next.ctaKey)}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
