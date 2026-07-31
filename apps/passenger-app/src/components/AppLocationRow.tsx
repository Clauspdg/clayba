import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

export interface AppLocationRowProps {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  accessoryRight?: ReactNode;
}

/** A tappable pickup/destination/stop row — used on the main booking screen. */
export function AppLocationRow({ label, value, placeholder, onPress, accessoryRight }: AppLocationRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`${label}: ${value ?? placeholder}`}>
      <View style={styles.textGroup}>
        <AppText variant="muted">{label}</AppText>
        <AppText variant="body" numberOfLines={1}>
          {value ?? placeholder}
        </AppText>
      </View>
      {accessoryRight}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  pressed: { opacity: 0.7 },
  textGroup: { flex: 1, gap: 2 },
});
