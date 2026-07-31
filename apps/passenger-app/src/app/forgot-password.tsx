import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { Screen } from "@/components/Screen";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <AppText variant="heading">{t("auth.forgotPasswordTitle")}</AppText>
      <AppText variant="muted" style={styles.subtitle}>
        {t("auth.forgotPasswordSubtitle")}
      </AppText>
      <View style={styles.form}>
        <AppTextField label={t("auth.emailLabel")} placeholder={t("auth.emailPlaceholder")} keyboardType="email-address" autoCapitalize="none" />
        <AppButton label={t("auth.sendResetLink")} onPress={() => router.push("/login")} />
        <AppButton label={t("auth.backToLogin")} variant="outline" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 4, marginBottom: 24 },
  form: { gap: 16 },
});
