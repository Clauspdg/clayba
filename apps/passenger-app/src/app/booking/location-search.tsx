import type { AddressSuggestion } from "@the-ride/types";
import { useTranslation } from "@the-ride/hooks";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";

import { AppStatusView } from "@/components/AppStatusView";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { Screen } from "@/components/Screen";
import { getMapProvider } from "@/lib/map-provider";
import { useBookingStore } from "@/stores/booking-store";
import { colors, spacing } from "@/theme/tokens";

type SearchTarget = "pickup" | "destination" | "stop";
type SearchStatus = "idle" | "loading" | "empty" | "error";

/**
 * One reusable Location Search screen (Sprint 3, Part 1/2/8) serving
 * pickup, destination, and stop selection via a `target` param — rather
 * than three near-identical screens, per this sprint's "no duplicated
 * code" rule.
 */
export default function LocationSearchScreen() {
  const { t } = useTranslation();
  const { target } = useLocalSearchParams<{ target: SearchTarget }>();
  const { setPickup, setDestination, addStop } = useBookingStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 3) {
      setResults([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    try {
      const suggestions = await getMapProvider().autocomplete(text);
      setResults(suggestions);
      setStatus(suggestions.length === 0 ? "empty" : "idle");
    } catch {
      setResults([]);
      setStatus("error");
    }
  }

  async function handleSelect(suggestion: AddressSuggestion) {
    setStatus("loading");
    try {
      const geocoded = await getMapProvider().geocode(suggestion.description);
      const location = { ...geocoded.location, address: geocoded.formattedAddress };

      if (target === "pickup") setPickup(location);
      else if (target === "destination") setDestination(location);
      else addStop(location);

      router.back();
    } catch {
      setStatus("error");
    }
  }

  const title = target === "pickup" ? t("booking.choosePickup") : target === "destination" ? t("booking.chooseDestination") : t("booking.chooseStop");

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{title}</AppText>
      <AppTextField label={t("common.search")} placeholder={t("booking.searchAddressPlaceholder")} value={query} onChangeText={handleSearch} autoFocus />

      {status === "loading" && <AppStatusView state="loading" title={t("common.loading")} />}
      {status === "empty" && <AppStatusView state="empty" title={t("common.noResults")} />}
      {status === "error" && <AppStatusView state="error" title={t("booking.searchErrorTitle")} description={t("booking.searchErrorBody")} />}

      {status === "idle" && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.placeId}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleSelect(item)} style={styles.resultRow} accessibilityRole="button" accessibilityLabel={item.description}>
              <AppText variant="body">{item.mainText}</AppText>
              {item.secondaryText && <AppText variant="muted">{item.secondaryText}</AppText>}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  resultRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.neutral200 },
});
