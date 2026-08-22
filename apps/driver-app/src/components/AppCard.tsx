import { View, StyleSheet, type ViewProps } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { elevation, radius, spacing } from "@/theme/tokens";

export interface AppCardProps extends ViewProps {
  /** `elevated` uses a real shadow and a lighter border for content meant to stand out (the primary status card); `flat` (default) is the everyday card. */
  variant?: "flat" | "elevated";
}

export function AppCard({ style, variant = "flat", ...props }: AppCardProps) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variant === "elevated" ? palette.surfaceElevated : palette.surface,
          borderColor: palette.border,
        },
        variant === "elevated" && elevation.card,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
