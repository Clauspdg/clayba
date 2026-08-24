import { ActivityIndicator, StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

export interface AppStatusViewProps {
  state: "loading" | "empty" | "error";
  title: string;
  description?: string;
}

/** Shared loading/empty/error layout. */
export function AppStatusView({ state, title, description }: AppStatusViewProps) {
  const palette = usePalette();
  return (
    <View style={styles.container}>
      {state === "loading" && <ActivityIndicator color={palette.primary} size="large" />}
      <AppText variant="subheading" style={styles.title}>
        {title}
      </AppText>
      {description && (
        <AppText variant="body" tone="muted" style={styles.description}>
          {description}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: { textAlign: "center" },
  description: { textAlign: "center" },
});
