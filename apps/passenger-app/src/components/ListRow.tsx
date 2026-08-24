import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * A single tappable row inside a list-style section (account/settings) —
 * spacing/dividers/typography instead of one big card per item.
 */
export function ListRow({
  icon,
  label,
  value,
  tone = "default",
  onPress,
  showChevron = true,
}: {
  icon: IoniconName;
  label: string;
  value?: string;
  tone?: "default" | "danger";
  onPress: () => void;
  showChevron?: boolean;
}) {
  const palette = usePalette();
  const color = tone === "danger" ? palette.danger : palette.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={tone === "danger" ? palette.danger : palette.textSecondary}
      />
      <AppText variant="body" style={[styles.label, { color }]}>
        {label}
      </AppText>
      {value && (
        <AppText variant="body" tone="muted" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      )}
      {showChevron && <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />}
    </Pressable>
  );
}

/** A thin divider between rows in the same section. */
export function ListDivider() {
  const palette = usePalette();
  return <View style={[styles.divider, { backgroundColor: palette.border }]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  label: { flex: 1 },
  value: { maxWidth: 140 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 28 },
});
