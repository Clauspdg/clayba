import { getVehicle, subscribeMyTrips } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { TripStatus, type Trip, type Vehicle } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { BottomSheetPanel } from "@/components/BottomSheetPanel";
import { RideMapView, type RideMapPoint } from "@/components/RideMapView";
import { SafetyPanel } from "@/components/SafetyPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { passengerFirestore } from "@/lib/firebase-client";
import { usePalette } from "@/theme/usePalette";
import { spacing } from "@/theme/tokens";

const ACTIVE_STATUSES: TripStatus[] = [
  TripStatus.MATCHED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED,
  TripStatus.IN_PROGRESS,
];

/**
 * Active Ride — the passenger's live-tracking screen, mobile port of the
 * web dashboard's real-time ride card + `LiveRideTracking`. Reads the same
 * `trips` document (`subscribeMyTrips`, filtered here to active statuses —
 * no passenger-scoped "current trip only" helper exists in the shared
 * package, so filtering happens in this screen rather than adding one for
 * a single caller). The map's driver marker comes straight from
 * `trip.driverLocation`, written by the driver app's own throttled
 * location updates — this screen only ever reads it.
 */
export default function ActiveRideScreen() {
  const { t, locale } = useTranslation();
  const palette = usePalette();
  const { session } = useAuth();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [everFoundTrip, setEverFoundTrip] = useState(false);

  useEffect(() => {
    if (!session) return;
    return subscribeMyTrips(
      passengerFirestore,
      session.uid,
      (trips) => {
        const current = trips.find((t) => ACTIVE_STATUSES.includes(t.status)) ?? null;
        setTrip(current);
        if (current) setEverFoundTrip(true);
      },
      () => setTrip(null),
    );
  }, [session]);

  useEffect(() => {
    if (trip === null && everFoundTrip) router.replace("/(tabs)/home");
  }, [trip, everFoundTrip]);

  useEffect(() => {
    if (!trip?.vehicleId) {
      setVehicle(trip === null ? null : undefined);
      return;
    }
    let cancelled = false;
    getVehicle(passengerFirestore, trip.vehicleId)
      .then((v) => !cancelled && setVehicle(v))
      .catch(() => !cancelled && setVehicle(null));
    return () => {
      cancelled = true;
    };
  }, [trip]);

  if (trip === undefined) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <AppText variant="body">{t("common.loading")}</AppText>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <AppText variant="subheading">{t("dashboard.noCurrentRide")}</AppText>
        <AppButton
          label={t("common.back")}
          variant="outline"
          onPress={() => router.replace("/(tabs)/home")}
        />
      </View>
    );
  }

  const pickup: RideMapPoint = { lat: trip.pickup.lat, lng: trip.pickup.lng };
  const destination: RideMapPoint = { lat: trip.dropoff.lat, lng: trip.dropoff.lng };
  const driver: RideMapPoint | undefined = trip.driverLocation
    ? {
        lat: trip.driverLocation.lat,
        lng: trip.driverLocation.lng,
        heading: trip.driverLocation.heading,
      }
    : undefined;

  return (
    <View style={styles.root}>
      <RideMapView pickup={pickup} destination={destination} driver={driver} />

      <BottomSheetPanel contentKey={trip.status}>
        <View style={styles.headerRow}>
          <AppText variant="heading">{t("dashboard.currentRide")}</AppText>
          <StatusBadge label={t(`admin.tripStatus.${trip.status}`)} tone="brand" />
        </View>

        {trip.status === TripStatus.EN_ROUTE_TO_PICKUP && (
          <AppText variant="body" tone="muted">
            {trip.driverLocationUpdatedAt
              ? t("rideHistory.driverLocationFreshness", {
                  time: trip.driverLocationUpdatedAt.toLocaleTimeString(locale),
                })
              : t("rideHistory.driverLocationUnavailable")}
          </AppText>
        )}
        {trip.status === TripStatus.ARRIVED && (
          <AppText variant="body" tone="success">
            {t("rideHistory.driverArrivedBody")}
          </AppText>
        )}

        <View style={styles.locationBlock}>
          <AppText variant="body" numberOfLines={1}>
            {trip.pickup.address ?? t("rideHistory.pickup")}
          </AppText>
          <AppText variant="body" tone="muted" numberOfLines={1}>
            → {trip.dropoff.address ?? t("rideHistory.destination")}
          </AppText>
        </View>

        <AppText variant="body" tone="muted">
          {vehicle === undefined
            ? t("common.loading")
            : vehicle
              ? `${vehicle.color} ${vehicle.make} ${vehicle.model} · ${vehicle.plateNumber}`
              : t("rideHistory.vehicleUnavailable")}
        </AppText>

        {trip.status === TripStatus.IN_PROGRESS && trip.fareAmount !== undefined && (
          // `estimatedFinal`'s template already has a literal "$" baked in
          // (`"Estimated final fare: ${amount}"`) — pass a bare number, not
          // `formatMoney`'s currency-symbol-prefixed output, or it doubles up.
          <AppText variant="subheading">
            {t("rideHistory.fareMeter.estimatedFinal", { amount: trip.fareAmount.toFixed(2) })}
          </AppText>
        )}

        <SafetyPanel trip={trip} />
      </BottomSheetPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationBlock: { gap: 2 },
});
