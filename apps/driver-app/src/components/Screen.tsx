import { useTheme } from "@the-ride/hooks";
import type { ReactNode } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme/tokens";

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { resolvedTheme } = useTheme();
  const backgroundColor = resolvedTheme === "dark" ? colors.neutral950 : colors.neutral0;

  return <SafeAreaView style={[styles.container, { backgroundColor }, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
});
