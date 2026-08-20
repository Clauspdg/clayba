"use client";

import { Alert, Badge, Icon, Progress, Text, useTranslation } from "@the-ride/ui";
import { TripStatus, type Trip } from "@the-ride/types";
import { estimateEtaSeconds, getLocationFreshness, haversineDistanceMeters } from "@the-ride/utils";
import { useEffect, useState } from "react";

const TRACKED_STATUSES: TripStatus[] = [
  TripStatus.MATCHED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED,
  TripStatus.IN_PROGRESS,
];

/**
 * CLAYBA P1, Part A — Live Driver Tracking. Renders only while `trip` is
 * in one of the tracked statuses; returns nothing before/after (dispatch
 * hasn't assigned anyone yet, or the ride already ended — see the brief's
 * "after completed/cancelled, tracking must stop").
 *
 * No real map tiles/SDK exist anywhere in this app (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
 * unset — see `apps/web/src/lib/map-provider.ts`), so this deliberately
 * does not draw a literal map with a pin on it — that would mean either a
 * fake background or a real geographic projection this app has no tiles
 * to render onto. Instead it shows a real, live, data-driven progress
 * bar (genuine pickup→destination fraction, not a decorative animation)
 * plus real distance-remaining/ETA figures, both computed from the
 * driver's actual reported position — same "honest schematic, not a
 * fabricated visual" choice `MapPreview.tsx` already makes on the
 * marketing homepage.
 */
export function LiveRideTracking({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  // Re-render periodically so the freshness tier (fresh/stale/expired) and
  // ETA stay accurate even between incoming location writes, not only when
  // Firestore pushes a new one.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!TRACKED_STATUSES.includes(trip.status)) return null;

  const freshness = getLocationFreshness(trip.driverLocationUpdatedAt);
  const location = freshness !== "expired" ? trip.driverLocation : undefined;

  const target = trip.status === TripStatus.IN_PROGRESS ? trip.dropoff : trip.pickup;
  const distanceRemainingMeters = location ? haversineDistanceMeters(location, target) : null;
  const etaSeconds =
    distanceRemainingMeters !== null ? estimateEtaSeconds(distanceRemainingMeters) : null;

  const totalLegMeters =
    trip.status === TripStatus.IN_PROGRESS
      ? haversineDistanceMeters(trip.pickup, trip.dropoff)
      : null;
  const progressPercent =
    location && totalLegMeters && totalLegMeters > 0 && distanceRemainingMeters !== null
      ? Math.min(100, Math.max(0, (1 - distanceRemainingMeters / totalLegMeters) * 100))
      : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="navigation" size={16} className="text-brand" />
          <Text size="sm" weight="medium">
            {t("rideHistory.liveTracking.title")}
          </Text>
        </div>
        {freshness === "fresh" && location && (
          <Badge tone="success">{t("rideHistory.liveTracking.live")}</Badge>
        )}
      </div>

      {progressPercent !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Icon name="mapPin" size={14} className="text-neutral-400" />
            <Icon name="flag" size={14} className="text-brand" />
          </div>
          <Progress value={progressPercent} label={t("rideHistory.liveTracking.title")} />
          <Text size="xs" tone="muted">
            {t("rideHistory.liveTracking.schematicLabel")}
          </Text>
        </div>
      )}

      {location && distanceRemainingMeters !== null && etaSeconds !== null ? (
        <div className="grid grid-cols-2 gap-3">
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
      ) : freshness === "stale" ? (
        <Alert tone="warning" title={t("rideHistory.liveTracking.updatingLocation")} />
      ) : (
        <Alert tone="neutral" title={t("rideHistory.liveTracking.locationUnavailable")} />
      )}
    </div>
  );
}
