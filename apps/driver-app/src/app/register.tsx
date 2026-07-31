import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { Screen } from "@/components/Screen";

export default function RegisterScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <AppText variant="heading">{t("auth.registerTitle")}</AppText>
      <AppText variant="muted" style={styles.subtitle}>
        {t("auth.registerSubtitle")}
      </AppText>
      <View style={styles.form}>
        <AppTextField label={t("auth.fullNameLabel")} autoCapitalize="words" />
        <AppTextField label={t("auth.emailLabel")} placeholder={t("auth.emailPlaceholder")} keyboardType="email-address" autoCapitalize="none" />
        <AppTextField label={t("auth.phoneLabel")} keyboardType="phone-pad" />
        <AppTextField label={t("auth.passwordLabel")} placeholder={t("auth.passwordPlaceholder")} secureTextEntry />
        <AppButton label={t("auth.createAccount")} onPress={() => router.push("/become-driver")} />
        <AppButton label={t("auth.alreadyHaveAccount")} variant="outline" onPress={() => router.push("/login")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 4, marginBottom: 24 },
  form: { gap: 16 },
});
