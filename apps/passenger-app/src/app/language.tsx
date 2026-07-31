import { LOCALES, LOCALE_LABELS, useTranslation } from "@the-ride/hooks";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme/tokens";

export default function LanguageScreen() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <Screen>
      <AppText variant="heading">{t("settings.language")}</AppText>
      <View style={styles.list}>
        {LOCALES.map((code) => (
          <Pressable key={code} onPress={() => setLocale(code)}>
            <AppCard style={[styles.row, locale === code && styles.rowActive]}>
              <AppText variant="body">{LOCALE_LABELS[code]}</AppText>
            </AppCard>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 20, gap: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowActive: { borderColor: colors.brand },
});
