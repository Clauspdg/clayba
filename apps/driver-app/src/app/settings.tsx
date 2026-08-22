import { LOCALES, LOCALE_LABELS, useAuth, useTheme, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { mode, setMode } = useTheme();
  const { locale, setLocale } = useTranslation();
  const { signOut } = useAuth();

  async function handleLogOut() {
    await signOut();
    router.replace("/welcome");
  }

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("settings.title")}</AppText>

      <View style={styles.section}>
        <AppText variant="caption" tone="muted">
          {t("settings.appearance")}
        </AppText>
        <AppCard style={styles.row}>
          {(["light", "dark", "system"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setMode(option)}
              style={[
                styles.pill,
                {
                  backgroundColor: mode === option ? palette.primary : palette.surfaceElevated,
                },
              ]}
            >
              <AppText
                variant="body"
                style={mode === option ? { color: palette.primaryForeground } : undefined}
              >
                {t(`common.${option}`)}
              </AppText>
            </Pressable>
          ))}
        </AppCard>
      </View>

      <View style={styles.section}>
        <AppText variant="caption" tone="muted">
          {t("settings.language")}
        </AppText>
        <AppCard style={styles.row}>
          {LOCALES.map((code) => (
            <Pressable
              key={code}
              onPress={() => setLocale(code)}
              style={[
                styles.pill,
                { backgroundColor: locale === code ? palette.primary : palette.surfaceElevated },
              ]}
            >
              <AppText
                variant="body"
                style={locale === code ? { color: palette.primaryForeground } : undefined}
              >
                {LOCALE_LABELS[code]}
              </AppText>
            </Pressable>
          ))}
        </AppCard>
      </View>

      <View style={styles.section}>
        <Pressable onPress={() => router.push("/help")}>
          <AppCard style={styles.linkRow}>
            <AppText variant="body">{t("settings.help")}</AppText>
          </AppCard>
        </Pressable>
        <Pressable onPress={() => router.push("/about")}>
          <AppCard style={styles.linkRow}>
            <AppText variant="body">{t("settings.about")}</AppText>
          </AppCard>
        </Pressable>
        <Pressable onPress={() => void handleLogOut()}>
          <AppCard style={styles.linkRow}>
            <AppText variant="body" tone="danger">
              {t("settings.logOut")}
            </AppText>
          </AppCard>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  linkRow: { paddingVertical: spacing.md },
  pill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full },
});
