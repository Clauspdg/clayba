import type { VehicleCategory } from "@the-ride/types";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

export interface AppVehicleCategoryCardProps {
  category: VehicleCategory;
  fareTotal: number;
  currency: string;
  selected: boolean;
  onPress: () => void;
}

/** One selectable ride tier row on the Vehicle Selection screen (Sprint 3, Part 1/3). */
export function AppVehicleCategoryCard({ category, fareTotal, currency, selected, onPress }: AppVehicleCategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${category.name}, ${currency} ${fareTotal.toFixed(2)}`}
    >
      <View style={styles.info}>
        <AppText variant="subheading">{category.name}</AppText>
        {category.description && <AppText variant="muted">{category.description}</AppText>}
      </View>
      <AppText variant="subheading">
        {currency} {fareTotal.toFixed(2)}
      </AppText>
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
    borderColor: colors.neutral200,
  },
  selected: { borderColor: colors.brand, borderWidth: 2 },
  info: { gap: 2, flexShrink: 1 },
});
