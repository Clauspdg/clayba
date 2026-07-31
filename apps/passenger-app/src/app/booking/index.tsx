import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppLocationRow } from "@/components/AppLocationRow";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { useBookingStore } from "@/stores/booking-store";
import { spacing } from "@/theme/tokens";

/** Booking Screen (Sprint 3, Part 1/8): pickup, destination, and optional stops. */
export default function BookingScreen() {
  const { t } = useTranslation();
  const { pickup, destination, stops, removeStop } = useBookingStore();

  const canChooseVehicle = Boolean(pickup && destination);

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("booking.title")}</AppText>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <AppLocationRow
          label={t("booking.pickupLabel")}
          value={pickup?.address}
          placeholder={t("booking.choosePickup")}
          onPress={() => router.push({ pathname: "/booking/location-search", params: { target: "pickup" } })}
        />
        <AppLocationRow
          label={t("booking.destinationLabel")}
          value={destination?.address}
          placeholder={t("booking.chooseDestination")}
          onPress={() => router.push({ pathname: "/booking/location-search", params: { target: "destination" } })}
        />

        {stops.map((stop, index) => (
          <View key={`${stop.lat}-${stop.lng}-${index}`} style={styles.stopRow}>
            <View style={styles.stopText}>
              <AppText variant="muted">{t("booking.stopLabel", { number: index + 1 })}</AppText>
              <AppText variant="body" numberOfLines={1}>
                {stop.address}
              </AppText>
            </View>
            <AppButton label={t("common.delete")} variant="outline" onPress={() => removeStop(index)} style={styles.removeStopButton} />
          </View>
        ))}

        <AppButton
          label={t("booking.addStop")}
          variant="outline"
          onPress={() => router.push({ pathname: "/booking/location-search", params: { target: "stop" } })}
          style={styles.addStopButton}
        />
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label={t("booking.chooseVehicle")} disabled={!canChooseVehicle} onPress={() => router.push("/booking/vehicle")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  list: { flex: 1 },
  listContent: { gap: 4 },
  addStopButton: { marginTop: spacing.sm, alignSelf: "flex-start", height: 40, paddingHorizontal: spacing.md },
  stopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.sm },
  stopText: { flex: 1, gap: 2 },
  removeStopButton: { height: 32, paddingHorizontal: spacing.sm },
  footer: { paddingTop: spacing.sm },
});
