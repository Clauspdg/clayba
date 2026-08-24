import {
  cancelTripRequest,
  createTripRequest,
  subscribeMyTripRequests,
  subscribeMyTrips,
} from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { TripRequestStatus, type Trip, type TripRequest } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppStatusView } from "@/components/AppStatusView";
import { Screen } from "@/components/Screen";
import { passengerFirestore } from "@/lib/firebase-client";
import { useBookingStore } from "@/stores/booking-store";
import { spacing } from "@/theme/tokens";

const TERMINAL_FAILURE: TripRequestStatus[] = [
  TripRequestStatus.EXPIRED,
  TripRequestStatus.CANCELLED,
];

/**
 * Searching Driver — listens to the real `tripRequests`/`trips` documents
 * `createTripRequest` (called from `booking/confirm.tsx`) writes. Dispatch
 * itself (`onTripRequestCreated`, `functions/src/trips/index.ts`) runs
 * server-side and is real and already deployed — this screen never
 * fabricates a driver or a timer-based outcome, only reacts to what the
 * backend actually writes.
 */
export default function SearchingDriverScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const {
    pickup,
    destination,
    stops,
    vehicleCategoryId,
    route,
    fareEstimate,
    tripRequestId,
    confirm,
    cancel,
    reset,
  } = useBookingStore();
  const [request, setRequest] = useState<TripRequest | null | undefined>(undefined);
  const [matchedTrip, setMatchedTrip] = useState<Trip | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!session || !tripRequestId) return;
    return subscribeMyTripRequests(
      passengerFirestore,
      session.uid,
      (requests) => setRequest(requests.find((r) => r.id === tripRequestId) ?? null),
      () => setRequest(null),
    );
  }, [session, tripRequestId]);

  useEffect(() => {
    if (!session || !tripRequestId) return;
    return subscribeMyTrips(
      passengerFirestore,
      session.uid,
      (trips) => setMatchedTrip(trips.find((trip) => trip.tripRequestId === tripRequestId) ?? null),
      () => setMatchedTrip(null),
    );
  }, [session, tripRequestId]);

  useEffect(() => {
    if (matchedTrip) {
      reset();
      router.replace("/active-ride");
    }
  }, [matchedTrip, reset]);

  async function handleCancel() {
    if (!tripRequestId) return;
    setCancelling(true);
    try {
      await cancelTripRequest(passengerFirestore, tripRequestId);
    } finally {
      cancel();
      reset();
      setCancelling(false);
      router.dismissAll();
      router.replace("/(tabs)/home");
    }
  }

  async function handleRetry() {
    if (!session || !pickup || !destination || !vehicleCategoryId || !route || !fareEstimate)
      return;
    setRetrying(true);
    try {
      const requestId = await createTripRequest(passengerFirestore, {
        passengerId: session.uid,
        pickup,
        dropoff: destination,
        stops,
        vehicleCategoryId,
        estimatedDistanceMeters: route.distanceMeters,
        estimatedDurationSeconds: route.durationSeconds,
        fareEstimate,
      });
      confirm(requestId);
    } finally {
      setRetrying(false);
    }
  }

  const failed = request && TERMINAL_FAILURE.includes(request.status);
  const stillSearching = request === undefined || (request && !failed);

  return (
    <Screen style={styles.container}>
      {stillSearching && (
        <AppStatusView
          state="loading"
          title={
            request?.status === TripRequestStatus.DRIVER_ASSIGNED ||
            request?.status === TripRequestStatus.DRIVER_ACCEPTED
              ? t("booking.driverFoundTitle")
              : t("booking.searchingTitle")
          }
          description={
            request?.status === TripRequestStatus.DRIVER_ASSIGNED ||
            request?.status === TripRequestStatus.DRIVER_ACCEPTED
              ? t("booking.driverFoundBody")
              : t("booking.searchingBody")
          }
        />
      )}

      {request === null && (
        <AppStatusView
          state="error"
          title={t("booking.noDriversTitle")}
          description={t("booking.noDriversBody")}
        />
      )}

      {failed && (
        <AppStatusView
          state="error"
          title={t("booking.noDriversTitle")}
          description={t("booking.noDriversBody")}
        />
      )}

      <View style={styles.footer}>
        {(failed || request === null) && (
          <AppButton
            label={t("common.retry")}
            isLoading={retrying}
            onPress={() => void handleRetry()}
          />
        )}
        <AppButton
          label={t("booking.cancelBooking")}
          variant="outline"
          isLoading={cancelling}
          onPress={() => void handleCancel()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "space-between" },
  footer: { paddingBottom: spacing.md, gap: spacing.sm },
});
