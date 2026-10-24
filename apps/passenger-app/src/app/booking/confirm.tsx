import {
  cancelTripRequest,
  createTripRequest,
  startPaypalCheckout,
} from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { PaymentMethodType } from "@the-ride/types";
import { router } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppFareBreakdown } from "@/components/AppFareBreakdown";
import { AppPaymentMethodPicker } from "@/components/AppPaymentMethodPicker";
import { AppStatusView } from "@/components/AppStatusView";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { passengerFirestore, passengerFunctions } from "@/lib/firebase-client";
import { isFailedPrecondition } from "@/lib/callable-errors";
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
    paymentMethod,
    setPaymentMethod,
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
    let requestId: string | null = null;
    try {
      requestId = await createTripRequest(passengerFirestore, {
        passengerId: session.uid,
        pickup,
        dropoff: destination,
        stops,
        vehicleCategoryId,
        estimatedDistanceMeters: route.distanceMeters,
        estimatedDurationSeconds: route.durationSeconds,
        fareEstimate,
        paymentMethod,
      });
      confirm(requestId);
      if (paymentMethod === PaymentMethodType.PAYPAL) {
        // PayPal opens in the browser; its return page deep-links back to
        // the `paypal/return` route, which authorizes and then shows the search.
        const { approveUrl } = await startPaypalCheckout(passengerFunctions, requestId, "app");
        await Linking.openURL(approveUrl);
        setSubmitting(false);
        return;
      }
      router.push("/booking/searching");
    } catch (err) {
      // Never leave a PayPal booking stranded at `confirmed` if checkout didn't start.
      if (requestId && paymentMethod === PaymentMethodType.PAYPAL) {
        await cancelTripRequest(passengerFirestore, requestId).catch(() => undefined);
      }
      const notConfigured = isFailedPrecondition(err);
      setError(
        notConfigured
          ? t("payments.notConfigured")
          : err instanceof Error
            ? err.message
            : t("booking.permissionErrorBody"),
      );
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

      <AppPaymentMethodPicker
        value={paymentMethod}
        onChange={setPaymentMethod}
        disabled={submitting}
      />

      {error && (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      )}

      <View style={styles.actions}>
        <AppButton
          label={
            paymentMethod === PaymentMethodType.PAYPAL
              ? t("payments.continueToPaypal")
              : t("booking.confirmBooking")
          }
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
