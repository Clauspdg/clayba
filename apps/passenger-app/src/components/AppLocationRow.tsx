import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

export interface AppLocationRowProps {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  accessoryRight?: ReactNode;
}

/** A tappable pickup/destination/stop row — used on the main booking screen. */
export function AppLocationRow({
  label,
  value,
  placeholder,
  onPress,
  accessoryRight,
}: AppLocationRowProps) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: palette.border },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
    >
      <View style={styles.textGroup}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
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
  },
  pressed: { opacity: 0.7 },
  textGroup: { flex: 1, gap: 2 },
});
