import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { Screen } from "@/components/Screen";

export default function DriverApplicationScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <AppText variant="heading">{t("becomeDriver.applicationTitle")}</AppText>
      <AppText variant="muted" style={styles.subtitle}>
        {t("becomeDriver.applicationSubtitle")}
      </AppText>
      <View style={styles.form}>
        <AppTextField label={t("auth.fullNameLabel")} autoCapitalize="words" />
        <AppTextField label={t("auth.phoneLabel")} keyboardType="phone-pad" />
        <AppButton label={t("common.continue")} onPress={() => router.push("/upload-documents")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 4, marginBottom: 24 },
  form: { gap: 16 },
});
