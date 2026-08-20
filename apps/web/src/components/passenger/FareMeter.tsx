"use client";

import { webFirestore } from "@/lib/firebase-client";
import { getGlobalSettings, getTripRequest } from "@the-ride/firebase/client";
import { Card, CardContent, Text, useTranslation } from "@the-ride/ui";
import {
  TripStatus,
  type PlatformSettings,
  type Trip,
  type VehicleCategory,
} from "@the-ride/types";
import { calculateFare } from "@the-ride/utils";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

function formatDuration(seconds: number | undefined): string {
  const total = Math.max(0, Math.round(seconds ?? 0));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

/**
 * CLAYBA P1, Part B — Progressive Fare Meter. Three distinct numbers,
 * never conflated:
 * - `estimatedFare` — the pre-booking estimate, untouched (`tripRequest.fareEstimate`).
 * - `liveFare` — this component, `in_progress` only, computed client-side
 *   for display purposes via the exact same centralized `calculateFare`
 *   engine (`@the-ride/utils`) the estimate and the server-side freeze
 *   both use — no second formula. Fed real, live inputs:
 *   `trip.actualDistanceMeters` (server-accumulated, pushed by the
 *   realtime `trips` subscription) and elapsed time since `startedAt`
 *   (ticking client-side). This is a *preview*, not authoritative — the
 *   real, tamper-resistant number is `finalFareBreakdown`, computed
 *   server-side by the `completeTrip` Cloud Function.
 * - `finalFare` — `trip.finalFareBreakdown`, frozen at `completed`, never
 *   recomputed here.
 */
export function FareMeter({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<VehicleCategory | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    if (trip.status !== TripStatus.IN_PROGRESS || !trip.tripRequestId) return;
    let cancelled = false;
    void (async () => {
      const request = await getTripRequest(webFirestore, trip.tripRequestId!);
      if (cancelled) return;
      if (!request?.vehicleCategoryId) {
        setCategory(null);
        return;
      }
      const [categorySnapshot, globalSettings] = await Promise.all([
        getDoc(doc(webFirestore, "vehicleCategories", request.vehicleCategoryId)),
        getGlobalSettings(webFirestore),
      ]);
      if (cancelled) return;
      setCategory(
        categorySnapshot.exists()
          ? ({ id: categorySnapshot.id, ...categorySnapshot.data() } as VehicleCategory)
          : null,
      );
      setSettings(globalSettings);
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.status, trip.tripRequestId]);

  // Live-ticking clock so "Time"/"Current fare" advance every second while
  // in progress, without waiting for the next Firestore location push.
  useEffect(() => {
    if (trip.status !== TripStatus.IN_PROGRESS) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [trip.status]);

  if (trip.status !== TripStatus.IN_PROGRESS && trip.status !== TripStatus.COMPLETED) {
    return null;
  }

  if (trip.status === TripStatus.COMPLETED) {
    const fare = trip.finalFareBreakdown;
    return (
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <Text size="sm" weight="medium">
            {t("rideHistory.fareMeter.finalFare")}
          </Text>
          {fare ? (
            <>
              <Text size="lg" weight="bold">
                {fare.total.toFixed(2)} {fare.currency}
              </Text>
              {trip.actualDistanceMeters != null && (
                <Text size="xs" tone="muted">
                  {(trip.actualDistanceMeters / 1000).toFixed(1)} km ·{" "}
                  {formatDuration(trip.actualDurationSeconds)}
                </Text>
              )}
            </>
          ) : trip.fareAmount != null ? (
            <Text size="lg" weight="bold">
              ${trip.fareAmount.toFixed(2)}
            </Text>
          ) : (
            <Text tone="muted">—</Text>
          )}
        </CardContent>
      </Card>
    );
  }

  const actualDistanceMeters = trip.actualDistanceMeters ?? 0;
  const elapsedSeconds = trip.startedAt
    ? Math.max(0, (Date.now() - trip.startedAt.getTime()) / 1000)
    : 0;
  const liveFare =
    category && settings
      ? calculateFare({
          distanceMeters: actualDistanceMeters,
          durationSeconds: elapsedSeconds,
          category: {
            baseFare: category.baseFare,
            perKmRate: category.perKmRate,
            perMinuteRate: category.perMinuteRate,
            minimumFare: category.minimumFare,
          },
          settings: {
            bookingFee: settings.bookingFee,
            serviceFeeRate: settings.serviceFeeRate,
            commissionRate: settings.commissionRate,
            taxRate: settings.taxRate,
            surgeMultiplier: settings.surgeMultiplierDefault,
            currency: settings.currency,
          },
        })
      : null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <Text size="sm" weight="medium">
          {t("rideHistory.fareMeter.title")}
        </Text>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Text size="xs" tone="muted">
              {t("rideHistory.fareMeter.distanceTraveled")}
            </Text>
            <Text weight="semibold">{(actualDistanceMeters / 1000).toFixed(2)} km</Text>
          </div>
          <div>
            <Text size="xs" tone="muted">
              {t("rideHistory.fareMeter.time")}
            </Text>
            <Text weight="semibold">{formatDuration(elapsedSeconds)}</Text>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <Text size="sm">{t("rideHistory.fareMeter.currentFare")}</Text>
          <Text size="lg" weight="bold">
            {liveFare ? `${liveFare.total.toFixed(2)} ${liveFare.currency}` : "—"}
          </Text>
        </div>
        {trip.fareAmount != null && (
          <Text size="xs" tone="muted">
            {t("rideHistory.fareMeter.estimatedFinal", { amount: trip.fareAmount.toFixed(2) })}
          </Text>
        )}
      </CardContent>
    </Card>
  );
}
