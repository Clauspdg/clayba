import { LOCALES, LOCALE_LABELS, useAuth, useTheme, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ListDivider, ListRow } from "@/components/ListRow";
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
      <AppText variant="title">{t("settings.title")}</AppText>

      <View style={styles.section}>
        <AppText variant="caption" tone="muted">
          {t("settings.appearance")}
        </AppText>
        <View style={[styles.segmented, { backgroundColor: palette.surfaceElevated }]}>
          {(["light", "dark", "system"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setMode(option)}
              style={[styles.segment, mode === option && { backgroundColor: palette.primary }]}
            >
              <AppText
                variant="caption"
                style={mode === option ? { color: palette.primaryForeground } : undefined}
              >
                {t(`common.${option}`)}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="caption" tone="muted">
          {t("settings.language")}
        </AppText>
        <View style={[styles.segmented, { backgroundColor: palette.surfaceElevated }]}>
          {LOCALES.map((code) => (
            <Pressable
              key={code}
              onPress={() => setLocale(code)}
              style={[styles.segment, locale === code && { backgroundColor: palette.primary }]}
            >
              <AppText
                variant="caption"
                style={locale === code ? { color: palette.primaryForeground } : undefined}
              >
                {LOCALE_LABELS[code]}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppCard style={styles.list}>
          <ListRow
            icon="help-circle-outline"
            label={t("settings.help")}
            onPress={() => router.push("/help")}
          />
          <ListDivider />
          <ListRow
            icon="information-circle-outline"
            label={t("settings.about")}
            onPress={() => router.push("/about")}
          />
        </AppCard>

        <AppCard style={styles.list}>
          <ListRow
            icon="log-out-outline"
            label={t("settings.logOut")}
            tone="danger"
            showChevron={false}
            onPress={() => void handleLogOut()}
          />
        </AppCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  segmented: { flexDirection: "row", borderRadius: radius.full, padding: 3 },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  list: { gap: 0, paddingVertical: spacing.xs, marginBottom: spacing.sm },
});
