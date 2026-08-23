import { StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { elevation, radius, spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

/** Small floating overlay pill on top of the map — "● Online / Available for rides". */
export function MapStatusPill({
  title,
  subtitle,
  tone = "neutral",
}: {
  title: string;
  subtitle?: string;
  tone?: "online" | "neutral";
}) {
  const palette = usePalette();
  const dotColor = tone === "online" ? palette.success : palette.textMuted;

  return (
    <View style={[styles.pill, elevation.card, { backgroundColor: palette.surface }]}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <AppText variant="subheading">{title}</AppText>
      </View>
      {subtitle ? (
        <AppText variant="caption" tone="muted">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
    alignSelf: "flex-start",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: radius.full },
});
