import { StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "brand";

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  const palette = usePalette();
  const config: Record<StatusTone, { bg: string; fg: string }> = {
    success: { bg: palette.successBg, fg: palette.success },
    warning: { bg: palette.warningBg, fg: palette.warning },
    danger: { bg: palette.dangerBg, fg: palette.danger },
    brand: { bg: palette.surfaceElevated, fg: palette.primary },
    neutral: { bg: palette.surfaceElevated, fg: palette.textSecondary },
  };
  const { bg, fg } = config[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {tone === "success" && <View style={[styles.dot, { backgroundColor: fg }]} />}
      <AppText variant="caption" style={{ color: fg }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
