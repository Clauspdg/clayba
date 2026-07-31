import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

export interface AppStatusViewProps {
  state: "loading" | "empty" | "error";
  title: string;
  description?: string;
}

/** Shared loading/empty/error layout — see docs/design-system.md and docs/ride-request.md ("Empty/Loading/Error states"). */
export function AppStatusView({ state, title, description }: AppStatusViewProps) {
  return (
    <View style={styles.container}>
      {state === "loading" && <ActivityIndicator color={colors.brand} size="large" />}
      <AppText variant="subheading" style={styles.title}>
        {title}
      </AppText>
      {description && (
        <AppText variant="muted" style={styles.description}>
          {description}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.lg },
  title: { textAlign: "center" },
  description: { textAlign: "center" },
});
