import { Role } from "@the-ride/types";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { AuthHeader } from "@/components/AuthHeader";
import { Screen } from "@/components/Screen";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

export default function LoginScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { status, session, error, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    router.replace(session.claims.role === Role.DRIVER ? "/home" : "/application-status");
  }, [status, session]);

  async function handleLogIn() {
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      // `error` from useAuth() already carries the message; the form re-renders with it below.
    } finally {
      setSubmitting(false);
    }
  }

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
          <AuthHeader title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")} />

          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <View style={styles.form}>
              <AppTextField
                label={t("auth.emailLabel")}
                placeholder={t("auth.emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <AppTextField
                label={t("auth.passwordLabel")}
                placeholder={t("auth.passwordPlaceholder")}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {error && (
                <View style={[styles.errorBanner, { backgroundColor: palette.dangerBg }]}>
                  <AppText variant="body" tone="danger">
                    {error}
                  </AppText>
                </View>
              )}
              <AppButton
                label={t("auth.logIn")}
                onPress={handleLogIn}
                disabled={submitting}
                isLoading={submitting}
              />
            </View>
          </View>

          <AppButton
            label={t("auth.noAccount")}
            variant="outline"
            onPress={() => router.push("/register")}
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
  errorBanner: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  secondaryAction: { marginTop: spacing.lg },
});
