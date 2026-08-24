import { useAuth, useTranslation } from "@the-ride/hooks";
import { subscribeMyTrips } from "@the-ride/firebase/client";
import { TripStatus, type Trip } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { BottomSheetPanel } from "@/components/BottomSheetPanel";
import { RideMapView, type RideMapPoint } from "@/components/RideMapView";
import { StatusBadge } from "@/components/StatusBadge";
import { passengerFirestore } from "@/lib/firebase-client";
import { getCurrentLocation } from "@/lib/location-tracking";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

const ACTIVE_STATUSES: TripStatus[] = [
  TripStatus.MATCHED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED,
  TripStatus.IN_PROGRESS,
];

function greetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 18) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

/** Map-first Home: current location, "Where to?", and a live link to any trip already in progress. */
export default function HomeScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { session } = useAuth();
  const [location, setLocation] = useState<RideMapPoint | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCurrentLocation().then((reading) => {
      if (!cancelled && reading) setLocation(reading);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    return subscribeMyTrips(
      passengerFirestore,
      session.uid,
      (trips) => setActiveTrip(trips.find((trip) => ACTIVE_STATUSES.includes(trip.status)) ?? null),
      () => setActiveTrip(null),
    );
  }, [session]);

  return (
    <View style={styles.root}>
      <RideMapView pickup={location} />

      <BottomSheetPanel contentKey={activeTrip ? "active" : "idle"}>
        <AppText variant="heading">{t(greetingKey())}</AppText>

        {activeTrip ? (
          <Pressable
            onPress={() => router.push("/active-ride")}
            style={[styles.continueCard, { borderColor: palette.border }]}
          >
            <View style={styles.continueText}>
              <AppText variant="subheading">{t("dashboard.continueBookingTitle")}</AppText>
              <StatusBadge label={t(`admin.tripStatus.${activeTrip.status}`)} tone="brand" />
            </View>
            <AppButton
              label={t("dashboard.continueBookingCta")}
              size="md"
              onPress={() => router.push("/active-ride")}
            />
          </Pressable>
        ) : (
          <>
            <AppText variant="body" tone="muted">
              {t("dashboard.readyPrompt")}
            </AppText>
            <Pressable
              onPress={() => router.push("/booking")}
              style={[styles.whereToRow, { backgroundColor: palette.surfaceElevated }]}
            >
              <AppText variant="body" tone="muted">
                {t("booking.chooseDestination")}
              </AppText>
            </Pressable>
          </>
        )}
      </BottomSheetPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  continueText: { flex: 1, gap: spacing.xs },
  whereToRow: {
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
