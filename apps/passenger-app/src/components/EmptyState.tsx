import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppButton } from "./AppButton";
import { AppText } from "./AppText";

type IoniconName = keyof typeof Ionicons.glyphMap;

export function EmptyState({
  title,
  body,
  icon = "file-tray-outline",
  action,
}: {
  title: string;
  body?: string;
  icon?: IoniconName;
  action?: { label: string; onPress: () => void };
}) {
  const palette = usePalette();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: palette.surfaceElevated }]}>
        <Ionicons name={icon} size={28} color={palette.textMuted} />
      </View>
      <AppText variant="subheading" style={styles.centerText}>
        {title}
      </AppText>
      {body && (
        <AppText variant="body" tone="muted" style={styles.centerText}>
          {body}
        </AppText>
      )}
      {action && (
        <AppButton
          label={action.label}
          variant="outline"
          onPress={action.onPress}
          style={styles.action}
        />
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
  action: { marginTop: spacing.sm },
});
