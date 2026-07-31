import { DEFAULT_OFFER_TIMEOUT_SECONDS, DriverAvailabilityStatus } from "@the-ride/types";
import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { useDriverStore } from "@/stores/driver-store";
import { colors, spacing } from "@/theme/tokens";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

/**
 * Incoming Ride Offer (Sprint 4, Part 8) — countdown, Accept/Decline, and
 * offer details. `DEFAULT_OFFER_TIMEOUT_SECONDS` (15s) is the same
 * constant `@the-ride/firebase`'s `DispatchService` uses for real offers
 * — see docs/ride-offers.md. No navigation/trip-execution screens follow
 * Accept this sprint (out of scope).
 */
export default function IncomingOfferScreen() {
  const { t } = useTranslation();
  const { currentOffer, setAvailabilityStatus, clearOffer } = useDriverStore();
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_OFFER_TIMEOUT_SECONDS);

  useEffect(() => {
    if (!currentOffer) return;

    const interval = setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentOffer]);

  useEffect(() => {
    if (currentOffer && secondsLeft === 0) {
      handleExpire();
    }
    // Deliberately keyed only on `secondsLeft`: this fires once when the countdown reaches zero, not on every re-render `handleExpire`'s closure changes.
  }, [secondsLeft]);

  function returnHome() {
    clearOffer();
    setAvailabilityStatus(DriverAvailabilityStatus.AVAILABLE);
    router.replace("/home");
  }

  function handleExpire() {
    returnHome();
  }

  function handleAccept() {
    setAvailabilityStatus(DriverAvailabilityStatus.ON_TRIP);
    clearOffer();
    router.replace("/home");
  }

  function handleDecline() {
    returnHome();
  }

  if (!currentOffer) {
    return (
      <Screen style={styles.emptyContainer}>
        <AppText variant="subheading">{t("driverOffer.noOffer")}</AppText>
        <AppButton label={t("common.back")} variant="outline" onPress={() => router.replace("/home")} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <AppText variant="heading">{t("driverOffer.title")}</AppText>
        <AppText variant="heading" style={styles.countdown}>
          {t("driverOffer.countdown", { seconds: secondsLeft })}
        </AppText>
      </View>

      <AppCard style={styles.detailsCard}>
        <DetailRow label={t("booking.pickupLabel")} value={currentOffer.pickupAddress} />
        <DetailRow label={t("booking.destinationLabel")} value={currentOffer.destinationAddress} />
        <DetailRow label={t("driverOffer.distance")} value={t("booking.estimatedDistance", { km: (currentOffer.distanceMeters / 1000).toFixed(1) })} />
        <DetailRow label={t("driverOffer.estimatedEarnings")} value={`$${currentOffer.estimatedEarnings.toFixed(2)}`} />
        <DetailRow label={t("driverOffer.passengerRating")} value={`★ ${currentOffer.passengerRating.toFixed(1)}`} />
      </AppCard>

      <View style={styles.actions}>
        <AppButton label={t("driverOffer.accept")} onPress={handleAccept} />
        <AppButton label={t("driverOffer.decline")} variant="danger" onPress={handleDecline} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  emptyContainer: { alignItems: "center", justifyContent: "center", gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  countdown: { color: colors.danger },
  detailsCard: { gap: spacing.sm },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  actions: { gap: spacing.sm, marginTop: "auto" },
});
