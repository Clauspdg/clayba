import type { ReactNode } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePalette } from "@/theme/usePalette";

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const palette = usePalette();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
});
