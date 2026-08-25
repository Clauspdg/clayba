import type { AddressSuggestion } from "@the-ride/types";
import { useTranslation } from "@the-ride/hooks";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppStatusView } from "@/components/AppStatusView";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { Screen } from "@/components/Screen";
import { getMapProvider } from "@/lib/map-provider";
import { getCurrentLocation } from "@/lib/location-tracking";
import { useBookingStore } from "@/stores/booking-store";
import { usePalette } from "@/theme/usePalette";
import { spacing } from "@/theme/tokens";

type SearchTarget = "pickup" | "destination" | "stop" | "favorite";
type SearchStatus = "idle" | "loading" | "empty" | "error";

const SEARCH_DEBOUNCE_MS = 350;

/**
 * One reusable Location Search screen serving pickup, destination, and
 * stop selection via a `target` param. Debounced (Nominatim's public
 * usage policy caps requests to ~1/sec — firing on every keystroke would
 * throttle real usage now that it's a real active fallback, not just a
 * dev convenience). Biases toward the passenger's current location when
 * known — "bias, don't restrict" (`AutocompleteOptions.bias`, already
 * supported by every provider) so nearby real places rank first without
 * excluding farther matches.
 */
export default function LocationSearchScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { target } = useLocalSearchParams<{ target: SearchTarget }>();
  const { setPickup, setDestination, addStop, setFavoriteDraft } = useBookingStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const biasRef = useRef<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void getCurrentLocation().then((reading) => {
      if (reading) biasRef.current = { lat: reading.lat, lng: reading.lng };
    });
  }, []);

  async function runSearch(text: string) {
    setStatus("loading");
    try {
      const suggestions = await getMapProvider().autocomplete(
        text,
        biasRef.current ? { bias: biasRef.current } : undefined,
      );
      setResults(suggestions);
      setStatus(suggestions.length === 0 ? "empty" : "idle");
    } catch {
      setResults([]);
      setStatus("error");
    }
  }

  function handleSearch(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 3) {
      setResults([]);
      setStatus("idle");
      return;
    }

    debounceRef.current = setTimeout(() => void runSearch(text), SEARCH_DEBOUNCE_MS);
  }

  async function handleSelect(suggestion: AddressSuggestion) {
    setStatus("loading");
    try {
      const geocoded = await getMapProvider().geocode(suggestion.description);
      const location = { ...geocoded.location, address: geocoded.formattedAddress };

      if (target === "pickup") setPickup(location);
      else if (target === "destination") setDestination(location);
      else if (target === "favorite") setFavoriteDraft(location);
      else addStop(location);

      router.back();
    } catch {
      setStatus("error");
    }
  }

  const title =
    target === "pickup"
      ? t("booking.choosePickup")
      : target === "destination"
        ? t("booking.chooseDestination")
        : target === "favorite"
          ? t("savedPlaces.searchAddressTitle")
          : t("booking.chooseStop");

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{title}</AppText>
      <AppTextField
        label={t("common.search")}
        placeholder={t("booking.searchAddressPlaceholder")}
        value={query}
        onChangeText={handleSearch}
        autoFocus
      />

      {status === "loading" && <AppStatusView state="loading" title={t("common.loading")} />}
      {status === "empty" && <AppStatusView state="empty" title={t("booking.noPlacesFound")} />}
      {status === "error" && (
        <>
          <AppStatusView state="error" title={t("booking.searchErrorTitle")} />
          <AppButton
            label={t("common.retry")}
            variant="outline"
            style={styles.retryButton}
            onPress={() => void runSearch(query)}
          />
        </>
      )}

      {status === "idle" && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              style={[styles.resultRow, { borderBottomColor: palette.border }]}
              accessibilityRole="button"
              accessibilityLabel={item.description}
            >
              <AppText variant="body">{item.mainText}</AppText>
              {item.secondaryText && (
                <AppText variant="caption" tone="muted">
                  {item.secondaryText}
                </AppText>
              )}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  resultRow: { paddingVertical: spacing.sm, borderBottomWidth: 1 },
  retryButton: { alignSelf: "center" },
});
