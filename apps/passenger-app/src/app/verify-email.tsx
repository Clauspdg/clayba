import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { Screen } from "@/components/Screen";

export default function VerifyEmailScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <AppText variant="heading">{t("auth.verifyEmailTitle")}</AppText>
      <AppText variant="muted" style={styles.subtitle}>
        {t("auth.verifyEmailSubtitle")}
      </AppText>
      <View style={styles.form}>
        <AppTextField label={t("auth.otpLabel")} keyboardType="number-pad" maxLength={6} />
        <AppButton label={t("auth.verify")} onPress={() => router.push("/create-profile")} />
        <AppButton label={t("auth.resendCode")} variant="outline" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 4, marginBottom: 24 },
  form: { gap: 16 },
});
