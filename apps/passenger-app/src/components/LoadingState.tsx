import { ActivityIndicator, StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

export function LoadingState({ label }: { label?: string }) {
  const palette = usePalette();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={palette.primary} />
      {label && (
        <AppText variant="body" tone="muted">
          {label}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
});
