import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AuthHeader } from "@/components/AuthHeader";
import { Screen } from "@/components/Screen";
import { spacing } from "@/theme/tokens";

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <AuthHeader title={t("auth.welcomeTitle")} subtitle={t("auth.welcomeSubtitle")} />
      </View>
      <View style={styles.actions}>
        <AppButton label={t("auth.logIn")} onPress={() => router.push("/login")} />
        <AppButton
          label={t("auth.signUp")}
          variant="outline"
          onPress={() => router.push("/register")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "space-between" },
  content: { flex: 1, justifyContent: "center" },
  actions: { gap: spacing.sm },
});
