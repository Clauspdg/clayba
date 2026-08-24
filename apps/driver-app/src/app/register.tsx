import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppTextField } from "@/components/AppTextField";
import { AuthHeader } from "@/components/AuthHeader";
import { Screen } from "@/components/Screen";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

export default function RegisterScreen() {
  const { t } = useTranslation();
  const palette = usePalette();

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader title={t("auth.registerTitle")} subtitle={t("auth.registerSubtitle")} />

          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <View style={styles.form}>
              <AppTextField label={t("auth.fullNameLabel")} autoCapitalize="words" />
              <AppTextField
                label={t("auth.emailLabel")}
                placeholder={t("auth.emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AppTextField label={t("auth.phoneLabel")} keyboardType="phone-pad" />
              <AppTextField
                label={t("auth.passwordLabel")}
                placeholder={t("auth.passwordPlaceholder")}
                secureTextEntry
              />
              <AppButton
                label={t("auth.createAccount")}
                onPress={() => router.push("/become-driver")}
              />
            </View>
          </View>

          <AppButton
            label={t("auth.alreadyHaveAccount")}
            variant="outline"
            onPress={() => router.push("/login")}
            style={styles.secondaryAction}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  form: { gap: spacing.md },
  secondaryAction: { marginTop: spacing.lg },
});
