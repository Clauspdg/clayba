import { useAuth, useTranslation } from "@the-ride/hooks";
import {
  addFavoritePlace,
  deleteFavoritePlace,
  getOrCreatePassengerProfile,
  subscribeFavoritePlaces,
} from "@the-ride/firebase/client";
import type { FavoritePlace } from "@the-ride/types";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { passengerFirestore } from "@/lib/firebase-client";
import { getCurrentLocation } from "@/lib/location-tracking";
import { spacing } from "@/theme/tokens";

/** Saved Places — real `passengers/{uid}/favoritePlaces`, same functions the web passenger app uses. */
export default function SavedPlacesScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [places, setPlaces] = useState<FavoritePlace[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    // `favoritePlaces` lives under `passengers/{uid}` — that profile doc may
    // not exist yet, so ensure it exists before subscribing into it.
    getOrCreatePassengerProfile(passengerFirestore, session.uid)
      .then(() => {
        if (cancelled) return;
        unsubscribe = subscribeFavoritePlaces(passengerFirestore, session.uid, setPlaces, setError);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [session]);

  function openAdd() {
    setLabel("");
    setAddress("");
    setCoords(null);
    setAdding(true);
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const reading = await getCurrentLocation();
      if (reading) setCoords({ lat: reading.lat, lng: reading.lng });
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    if (!session || !coords) return;
    setSaving(true);
    try {
      await addFavoritePlace(passengerFirestore, session.uid, { label, address, ...coords });
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(placeId: string) {
    if (!session) return;
    setBusyId(placeId);
    try {
      await deleteFavoritePlace(passengerFirestore, session.uid, placeId);
    } finally {
      setBusyId(null);
    }
  }

  if (adding) {
    return (
      <Screen style={styles.container}>
        <AppText variant="title">{t("savedPlaces.addPlace")}</AppText>
        <AppText variant="body" tone="muted">
          {t("savedPlaces.addPlaceDescription")}
        </AppText>

        <AppTextField
          label={t("savedPlaces.labelField")}
          placeholder={t("savedPlaces.labelPlaceholder")}
          value={label}
          onChangeText={setLabel}
        />
        <AppTextField
          label={t("savedPlaces.addressField")}
          placeholder={t("savedPlaces.addressPlaceholder")}
          value={address}
          onChangeText={setAddress}
        />
        <AppButton
          label={t("savedPlaces.useCurrentLocation")}
          variant="outline"
          isLoading={locating}
          onPress={() => void handleUseCurrentLocation()}
        />
        {coords && (
          <AppText variant="caption" tone="success">
            {t("savedPlaces.locationCaptured")} ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
          </AppText>
        )}

        <View style={styles.formActions}>
          <AppButton
            label={t("common.save")}
            disabled={!label.trim() || !address.trim() || !coords}
            isLoading={saving}
            onPress={() => void handleSave()}
          />
          <AppButton
            label={t("common.cancel")}
            variant="outline"
            onPress={() => setAdding(false)}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">{t("passengerNav.savedPlaces")}</AppText>
        <AppButton label={t("savedPlaces.addPlace")} size="md" onPress={openAdd} />
      </View>
      <AppText variant="body" tone="muted">
        {t("savedPlaces.description")}
      </AppText>

      {error ? (
        <ErrorState title={t("common.error")} message={error} />
      ) : places === null ? (
        <LoadingState label={t("common.loading")} />
      ) : places.length === 0 ? (
        <EmptyState icon="bookmark-outline" title={t("savedPlaces.noPlaces")} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {places.map((place) => (
            <AppCard key={place.id} style={styles.placeCard}>
              <View style={styles.placeText}>
                <AppText variant="subheading">{place.label}</AppText>
                <AppText variant="body" tone="muted" numberOfLines={1}>
                  {place.address}
                </AppText>
              </View>
              <AppButton
                label={t("common.delete")}
                variant="ghost"
                size="md"
                isLoading={busyId === place.id}
                onPress={() => void handleDelete(place.id)}
              />
            </AppCard>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  placeCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  placeText: { flex: 1, gap: 2 },
  formActions: { gap: spacing.sm, marginTop: spacing.sm },
});
