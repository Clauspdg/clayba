import { useTranslation } from "@the-ride/hooks";
import type { VehicleCategory } from "@the-ride/types";
import { Pressable, StyleSheet, View } from "react-native";

import { formatMoney } from "@/lib/currency";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

export interface AppVehicleCategoryCardProps {
  category: VehicleCategory;
  fareTotal: number;
  currency: string;
  selected: boolean;
  onPress: () => void;
}

/** One selectable ride tier row on the Vehicle Selection screen. */
export function AppVehicleCategoryCard({
  category,
  fareTotal,
  currency,
  selected,
  onPress,
}: AppVehicleCategoryCardProps) {
  const palette = usePalette();
  const { locale } = useTranslation();
  const priceLabel = formatMoney(fareTotal, currency, locale);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { borderColor: selected ? palette.primary : palette.border },
        selected && styles.selected,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${category.name}, ${priceLabel}`}
    >
      <View style={styles.info}>
        <AppText variant="subheading">{category.name}</AppText>
        {category.description && (
          <AppText variant="caption" tone="muted">
            {category.description}
          </AppText>
        )}
      </View>
      <AppText variant="subheading">{priceLabel}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  selected: { borderWidth: 2 },
  info: { gap: 2, flexShrink: 1 },
});
