import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <AppText variant="heading">{t("auth.welcomeTitle")}</AppText>
        <AppText variant="body" style={styles.subtitle}>
          {t("auth.welcomeSubtitle")}
        </AppText>
      </View>
      <View style={styles.actions}>
        <AppButton label={t("auth.logIn")} onPress={() => router.push("/login")} />
        <AppButton label={t("auth.signUp")} variant="outline" onPress={() => router.push("/register")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "space-between" },
  content: { flex: 1, justifyContent: "center", gap: 12 },
  subtitle: { marginTop: 4 },
  actions: { gap: 12 },
});
