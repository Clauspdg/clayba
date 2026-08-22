import { StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

/** No icon library in this app (kept out deliberately — see the P0 build report on native-module risk), so the mark is a plain glyph in a soft circle rather than a missing/broken icon. */
export function EmptyState({
  title,
  body,
  glyph = "•",
}: {
  title: string;
  body?: string;
  glyph?: string;
}) {
  const palette = usePalette();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: palette.surfaceElevated }]}>
        <AppText variant="heading" tone="muted">
          {glyph}
        </AppText>
      </View>
      <AppText variant="subheading" style={styles.centerText}>
        {title}
      </AppText>
      {body && (
        <AppText variant="body" tone="muted" style={styles.centerText}>
          {body}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  centerText: { textAlign: "center" },
});
