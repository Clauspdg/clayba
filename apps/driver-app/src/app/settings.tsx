import { LOCALES, LOCALE_LABELS, useAuth, useTheme, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme/tokens";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();
  const { locale, setLocale } = useTranslation();
  const { signOut } = useAuth();

  async function handleLogOut() {
    await signOut();
    router.replace("/welcome");
  }

  return (
    <Screen>
      <AppText variant="heading">{t("settings.title")}</AppText>

      <View style={styles.section}>
        <AppText variant="muted">{t("settings.appearance")}</AppText>
        <AppCard style={styles.row}>
          {(["light", "dark", "system"] as const).map((option) => (
            <Pressable key={option} onPress={() => setMode(option)} style={[styles.pill, mode === option && styles.pillActive]}>
              <AppText variant="body" style={mode === option ? styles.pillActiveLabel : undefined}>
                {t(`common.${option}`)}
              </AppText>
            </Pressable>
          ))}
        </AppCard>
      </View>

      <View style={styles.section}>
        <AppText variant="muted">{t("settings.language")}</AppText>
        <AppCard style={styles.row}>
          {LOCALES.map((code) => (
            <Pressable key={code} onPress={() => setLocale(code)} style={[styles.pill, locale === code && styles.pillActive]}>
              <AppText variant="body" style={locale === code ? styles.pillActiveLabel : undefined}>
                {LOCALE_LABELS[code]}
              </AppText>
            </Pressable>
          ))}
        </AppCard>
      </View>

      <View style={styles.section}>
        <Pressable onPress={() => router.push("/help")}>
          <AppCard style={styles.row}>
            <AppText variant="body">{t("settings.help")}</AppText>
          </AppCard>
        </Pressable>
        <Pressable onPress={() => router.push("/about")}>
          <AppCard style={styles.row}>
            <AppText variant="body">{t("settings.about")}</AppText>
          </AppCard>
        </Pressable>
        <Pressable onPress={() => void handleLogOut()}>
          <AppCard style={styles.row}>
            <AppText variant="body">{t("settings.logOut")}</AppText>
          </AppCard>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20, gap: 8 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9999, backgroundColor: colors.neutral100 },
  pillActive: { backgroundColor: colors.brand },
  pillActiveLabel: { color: colors.brandForeground },
});
