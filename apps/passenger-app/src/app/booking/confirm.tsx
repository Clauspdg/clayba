import { DEFAULT_VEHICLE_CATEGORIES } from "@the-ride/types";
import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppFareBreakdown } from "@/components/AppFareBreakdown";
import { AppStatusView } from "@/components/AppStatusView";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { useBookingStore } from "@/stores/booking-store";
import { spacing } from "@/theme/tokens";

/** Booking Confirmation (Sprint 3, Part 1/8) — final review before requesting a ride. */
export default function ConfirmBookingScreen() {
  const { t } = useTranslation();
  const { pickup, destination, vehicleCategoryId, fareEstimate, confirm, cancel } = useBookingStore();

  if (!pickup || !destination || !vehicleCategoryId || !fareEstimate) {
    return <AppStatusView state="error" title={t("booking.missingEstimateTitle")} description={t("booking.missingEstimateBody")} />;
  }

  const category = DEFAULT_VEHICLE_CATEGORIES.find((c) => c.id === vehicleCategoryId);

  function handleConfirm() {
    confirm();
    router.push("/booking/searching");
  }

  function handleCancel() {
    cancel();
    router.dismissAll();
    router.replace("/booking");
  }

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("booking.confirmTitle")}</AppText>

      <View style={styles.section}>
        <AppText variant="muted">{t("booking.pickupLabel")}</AppText>
        <AppText variant="body">{pickup.address}</AppText>
      </View>
      <View style={styles.section}>
        <AppText variant="muted">{t("booking.destinationLabel")}</AppText>
        <AppText variant="body">{destination.address}</AppText>
      </View>
      <View style={styles.section}>
        <AppText variant="muted">{t("booking.vehicleLabel")}</AppText>
        <AppText variant="body">{category?.name}</AppText>
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

      <View style={styles.actions}>
        <AppButton label={t("booking.confirmBooking")} onPress={handleConfirm} />
        <AppButton label={t("booking.cancelBooking")} variant="outline" onPress={handleCancel} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  section: { gap: 2 },
  actions: { marginTop: "auto", gap: spacing.sm },
});
