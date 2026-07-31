import { DriverAvailabilityStatus } from "@the-ride/types";
import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { useDriverStore } from "@/stores/driver-store";
import { spacing } from "@/theme/tokens";

/** A ride offer to simulate — no live dispatch session this sprint (see `driver-store.ts`). */
const SAMPLE_OFFER = {
  id: "offer-demo-1",
  pickupAddress: "123 Main St",
  destinationAddress: "455 Market St",
  distanceMeters: 3200,
  etaSeconds: 480,
  estimatedEarnings: 14.5,
  passengerRating: 4.8,
};

/** Driver dashboard (Sprint 4, Part 1/8) — the online/offline shift toggle. */
export default function HomeScreen() {
  const { t } = useTranslation();
  const { availabilityStatus, setAvailabilityStatus, receiveOffer } = useDriverStore();
  const isOnline = availabilityStatus !== DriverAvailabilityStatus.OFFLINE;
  const isAvailable = availabilityStatus === DriverAvailabilityStatus.AVAILABLE;

  function toggleOnline() {
    setAvailabilityStatus(isOnline ? DriverAvailabilityStatus.OFFLINE : DriverAvailabilityStatus.AVAILABLE);
  }

  function simulateOffer() {
    receiveOffer(SAMPLE_OFFER);
    router.push("/offer");
  }

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("driverHome.title")}</AppText>

      <AppCard style={styles.statusCard}>
        <AppText variant="subheading">{t(`driverHome.status.${availabilityStatus}`)}</AppText>
        <AppText variant="muted">{isOnline ? t("driverHome.onlineHint") : t("driverHome.offlineHint")}</AppText>
      </AppCard>

      <View style={styles.actions}>
        <AppButton label={isOnline ? t("driverHome.goOffline") : t("driverHome.goOnline")} variant={isOnline ? "outline" : "primary"} onPress={toggleOnline} />
        {isAvailable && <AppButton label={t("driverHome.simulateOffer")} variant="outline" onPress={simulateOffer} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  statusCard: { gap: 4 },
  actions: { gap: spacing.sm, marginTop: "auto" },
});
