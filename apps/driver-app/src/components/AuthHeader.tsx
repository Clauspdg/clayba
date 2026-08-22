import { Image, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

/**
 * CLAYBA Driver — shared branded header for the unauthenticated screens
 * (welcome/login/register). Reuses the real app icon asset (the same
 * validated CLAYBA brand mark used for the launcher icon/splash) rather
 * than inventing a second logo treatment — no new asset, no new
 * dependency, just consistent composition applied where it was missing.
 */
export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports -- RN requires static require() for bundled images */}
        <Image source={require("../../assets/icon.png")} style={styles.icon} resizeMode="cover" />
      </View>
      <AppText variant="heading" style={styles.title}>
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="muted" style={styles.subtitle}>
          {subtitle}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing.xs, marginBottom: spacing.xl },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.sm,
    shadowColor: colors.neutral950,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: { width: "100%", height: "100%" },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", marginTop: 2 },
});
