import { useAuth, useTranslation } from "@the-ride/hooks";
import { subscribeFavoritePlaces, subscribeMyTrips } from "@the-ride/firebase/client";
import { TripStatus, type FavoritePlace, type Trip } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { Avatar } from "@/components/Avatar";
import { BottomSheetPanel } from "@/components/BottomSheetPanel";
import { RideMapView, type RideMapPoint } from "@/components/RideMapView";
import { StatusBadge } from "@/components/StatusBadge";
import { passengerFirestore } from "@/lib/firebase-client";
import {
  getCurrentLocation,
  isLocationGranted,
  requestLocationPermission,
} from "@/lib/location-tracking";
import { getMapProvider } from "@/lib/map-provider";
import { useBookingStore } from "@/stores/booking-store";
import { usePalette } from "@/theme/usePalette";
import { elevation, radius, spacing } from "@/theme/tokens";

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

/**
 * Map-first Home — the premium CLAYBA passenger experience: a small
 * branded top bar over the real map, "Where to?" as the obvious primary
 * action in the bottom sheet, quick chips for saved places, and a live
 * link to any trip already in progress. Booking still routes through the
 * existing `/booking` flow (pickup/destination/vehicle/confirm) — this
 * screen only makes reaching it faster and pre-fills the current-location
 * pickup point, it doesn't reimplement any of it.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { setPickup, setDestination } = useBookingStore();

  const [location, setLocation] = useState<RideMapPoint | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [enablingLocation, setEnablingLocation] = useState(false);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [places, setPlaces] = useState<FavoritePlace[] | null>(null);

  async function applyLocation() {
    const reading = await getCurrentLocation();
    if (!reading) return;
    setLocation(reading);
    if (!useBookingStore.getState().pickup) {
      try {
        const geocoded = await getMapProvider().reverseGeocode(reading);
        setPickup({ ...reading, address: geocoded.formattedAddress });
      } catch {
        // Real coordinates are still useful for the route/fare estimate
        // even without a human-readable address — booking/index.tsx falls
        // back to a placeholder label when `address` is missing.
        setPickup(reading);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;
    isLocationGranted().then((granted) => {
      if (cancelled) return;
      setLocationGranted(granted);
      if (granted) void applyLocation();
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

  useEffect(() => {
    if (!session) return;
    return subscribeFavoritePlaces(passengerFirestore, session.uid, setPlaces, () => setPlaces([]));
  }, [session]);

  async function handleEnableLocation() {
    setEnablingLocation(true);
    try {
      const permission = await requestLocationPermission();
      const granted = permission === "granted";
      setLocationGranted(granted);
      if (granted) await applyLocation();
    } finally {
      setEnablingLocation(false);
    }
  }

  function handleSelectPlace(place: FavoritePlace) {
    setDestination({ lat: place.lat, lng: place.lng, address: place.address });
    router.push("/booking");
  }

  return (
    <View style={styles.root}>
      <RideMapView pickup={location} />

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View style={[styles.brandPill, elevation.card, { backgroundColor: palette.surface }]}>
          {/* eslint-disable-next-line @typescript-eslint/no-require-imports -- RN requires static require() for bundled images */}
          <Image source={require("../../../assets/icon.png")} style={styles.brandIcon} />
          <AppText variant="caption" style={styles.greetingText}>
            {t(greetingKey())}
          </AppText>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/account")}
          style={[styles.avatarButton, elevation.card, { backgroundColor: palette.surface }]}
          accessibilityRole="button"
        >
          <Avatar photoURL={session?.photoURL} name={session?.displayName} size={36} />
        </Pressable>
      </View>

      <BottomSheetPanel contentKey={activeTrip ? "active" : "idle"}>
        {activeTrip ? (
          <>
            <AppText variant="heading">{t("dashboard.continueBookingTitle")}</AppText>
            <Pressable
              onPress={() => router.push("/active-ride")}
              style={[styles.continueCard, { borderColor: palette.border }]}
            >
              <StatusBadge label={t(`admin.tripStatus.${activeTrip.status}`)} tone="brand" />
              <AppButton
                label={t("dashboard.continueBookingCta")}
                size="md"
                onPress={() => router.push("/active-ride")}
              />
            </Pressable>
          </>
        ) : (
          <>
            <AppText variant="heading">{t("dashboard.whereToTitle")}</AppText>

            <Pressable
              onPress={() => router.push("/booking")}
              style={[styles.destinationField, { backgroundColor: palette.surfaceElevated }]}
            >
              <Ionicons name="search" size={18} color={palette.textMuted} />
              <AppText variant="body" tone="muted" style={styles.destinationText}>
                {t("booking.chooseDestination")}
              </AppText>
            </Pressable>

            {locationGranted === false && (
              <View style={[styles.locationPrompt, { backgroundColor: palette.warningBg }]}>
                <AppText variant="caption" style={styles.locationPromptText}>
                  {t("dashboard.enableLocationPrompt")}
                </AppText>
                <View style={styles.locationPromptActions}>
                  <AppButton
                    label={t("dashboard.enableLocationCta")}
                    size="md"
                    isLoading={enablingLocation}
                    onPress={() => void handleEnableLocation()}
                  />
                  <AppButton
                    label={t("dashboard.enterPickupManually")}
                    variant="ghost"
                    size="md"
                    onPress={() => router.push("/booking")}
                  />
                </View>
              </View>
            )}

            {places && places.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                {places.slice(0, 3).map((place) => (
                  <Pressable
                    key={place.id}
                    onPress={() => handleSelectPlace(place)}
                    style={[styles.chip, { borderColor: palette.border }]}
                  >
                    <Ionicons name="location-outline" size={14} color={palette.textSecondary} />
                    <AppText variant="caption" numberOfLines={1}>
                      {place.label}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {places && places.length === 0 && (
              <View style={styles.savePrompt}>
                <AppText variant="caption" tone="muted" style={styles.savePromptText}>
                  {t("dashboard.savePlacesPrompt")}
                </AppText>
                <AppText
                  variant="caption"
                  tone="brand"
                  onPress={() => router.push("/(tabs)/saved")}
                >
                  {t("dashboard.addSavedPlaceCta")}
                </AppText>
              </View>
            )}
          </>
        )}
      </BottomSheetPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
  },
  brandIcon: { width: 22, height: 22, borderRadius: radius.sm },
  greetingText: { fontWeight: "600" },
  avatarButton: { borderRadius: radius.full, padding: 2 },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  destinationField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  destinationText: { flex: 1 },
  locationPrompt: { borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  locationPromptText: { flex: 1 },
  locationPromptActions: { flexDirection: "row", gap: spacing.sm },
  chipsRow: { flexDirection: "row" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    marginRight: spacing.sm,
    maxWidth: 140,
  },
  savePrompt: { gap: 2 },
  savePromptText: {},
});
