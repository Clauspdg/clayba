import { Role } from "@the-ride/types";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { Screen } from "@/components/Screen";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { status, session, error, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    router.replace(session.claims.role === Role.PASSENGER ? "/booking" : "/create-profile");
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
    <Screen>
      <AppText variant="heading">{t("auth.loginTitle")}</AppText>
      <AppText variant="muted" style={styles.subtitle}>
        {t("auth.loginSubtitle")}
      </AppText>
      <View style={styles.form}>
        <AppTextField
          label={t("auth.emailLabel")}
          placeholder={t("auth.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <AppTextField label={t("auth.passwordLabel")} placeholder={t("auth.passwordPlaceholder")} secureTextEntry value={password} onChangeText={setPassword} />
        {error && (
          <AppText variant="body" style={styles.error}>
            {error}
          </AppText>
        )}
        <AppButton label={t("auth.logIn")} onPress={handleLogIn} disabled={submitting} />
        <AppButton label={t("auth.forgotPasswordTitle")} variant="outline" onPress={() => router.push("/forgot-password")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 4, marginBottom: 24 },
  form: { gap: 16 },
  error: { color: "#DC2626" },
});
