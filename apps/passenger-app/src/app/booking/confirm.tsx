import { createTripRequest } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppFareBreakdown } from "@/components/AppFareBreakdown";
import { AppStatusView } from "@/components/AppStatusView";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { passengerFirestore } from "@/lib/firebase-client";
import { useBookingStore } from "@/stores/booking-store";
import { spacing } from "@/theme/tokens";

/** Booking Confirmation — final review before submitting a real ride request. */
export default function ConfirmBookingScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const {
    pickup,
    destination,
    stops,
    route,
    vehicleCategoryId,
    selectedCategory,
    fareEstimate,
    confirm,
    cancel,
  } = useBookingStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pickup || !destination || !vehicleCategoryId || !fareEstimate || !route) {
    return (
      <AppStatusView
        state="error"
        title={t("booking.missingEstimateTitle")}
        description={t("booking.missingEstimateBody")}
      />
    );
  }

  async function handleConfirm() {
    if (!session || !pickup || !destination || !vehicleCategoryId || !fareEstimate || !route)
      return;
    setSubmitting(true);
    setError(null);
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
      router.push("/booking/searching");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("booking.permissionErrorBody"));
      setSubmitting(false);
    }
  }

  function handleCancel() {
    cancel();
    router.dismissAll();
    router.replace("/(tabs)/home");
  }

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("booking.confirmTitle")}</AppText>

      <View style={styles.section}>
        <AppText variant="caption" tone="muted">
          {t("booking.pickupLabel")}
        </AppText>
        <AppText variant="body">{pickup.address}</AppText>
      </View>
      <View style={styles.section}>
        <AppText variant="caption" tone="muted">
          {t("booking.destinationLabel")}
        </AppText>
        <AppText variant="body">{destination.address}</AppText>
      </View>
      <View style={styles.section}>
        <AppText variant="caption" tone="muted">
          {t("booking.vehicleLabel")}
        </AppText>
        <AppText variant="body">{selectedCategory?.name}</AppText>
      </View>

      <AppFareBreakdown
        breakdown={fareEstimate}
        labels={{
          baseFare: t("booking.fareBase"),
          distanceFare: t("booking.fareDistance"),
          timeFare: t("booking.fareTime"),
          bookingFee: t("booking.fareBookingFee"),
          serviceFee: t("booking.fareServiceFee"),
          total: t("booking.fareTotal"),
        }}
      />

      {error && (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      )}

      <View style={styles.actions}>
        <AppButton
          label={t("booking.confirmBooking")}
          isLoading={submitting}
          onPress={() => void handleConfirm()}
        />
        <AppButton
          label={t("booking.cancelBooking")}
          variant="outline"
          disabled={submitting}
          onPress={handleCancel}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  section: { gap: 2 },
  actions: { marginTop: "auto", gap: spacing.sm },
});
