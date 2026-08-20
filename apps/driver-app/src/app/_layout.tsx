import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthProvider,
  I18nProvider,
  ThemeProvider,
  useTranslation,
  type ResolvedTheme,
} from "@the-ride/hooks";
import { Stack } from "expo-router";
import { Component, useState, type ReactNode } from "react";
import { Appearance, StyleSheet, View } from "react-native";

import {
  driverAuthAdapter,
  driverFirebaseInitError,
  retryDriverFirebaseInit,
} from "@/lib/firebase-client";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};

function getSystemTheme(): ResolvedTheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

/**
 * CLAYBA Driver P0 — boot-failure screen. Rendered instead of the real app
 * tree whenever Firebase failed to initialize (originally: missing
 * `EXPO_PUBLIC_FIREBASE_*` in the release build; now also the real fallback
 * for any future genuine connectivity/config failure at launch — brief
 * Phase 5, "Jamais écran blanc infini"). "Try again" re-runs the same
 * init the module attempted at import time; if it succeeds, `onRetry`
 * flips the parent's key so the whole provider tree remounts fresh.
 */
function BootFailureScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);

  function handleRetry() {
    setRetrying(true);
    const ok = retryDriverFirebaseInit();
    setRetrying(false);
    if (ok) onRetry();
  }

  return (
    <Screen style={styles.center}>
      <AppText variant="subheading" style={styles.centerText}>
        {t("common.unableToConnect")}
      </AppText>
      <AppButton label={t("common.retry")} isLoading={retrying} onPress={handleRetry} />
    </Screen>
  );
}

/**
 * CLAYBA Driver P0, Phase 3 — global error boundary. Catches any render/
 * lifecycle error anywhere below it (auth adapter throwing inside an
 * effect, a navigation error, an unexpected null dereference) and shows a
 * real "something went wrong" screen instead of letting the app go blank.
 * Deliberately a class component — React only supports error boundaries
 * via `componentDidCatch`/`getDerivedStateFromError`, no hook equivalent.
 */
class GlobalErrorBoundary extends Component<
  { children: ReactNode; fallbackMessage: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[boot] Uncaught error in app tree:", error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.fallback}>
          <AppText variant="subheading" style={styles.centerText}>
            {this.props.fallbackMessage}
          </AppText>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootLayoutContent({ bootAttempt, onRetry }: { bootAttempt: number; onRetry: () => void }) {
  const { t } = useTranslation();

  console.warn(
    "[boot] RootLayout render, attempt",
    bootAttempt,
    "firebaseInitError:",
    driverFirebaseInitError,
  );

  return (
    <GlobalErrorBoundary key={bootAttempt} fallbackMessage={t("common.unexpectedError")}>
      {driverFirebaseInitError ? (
        <BootFailureScreen onRetry={onRetry} />
      ) : (
        <AuthProvider adapter={driverAuthAdapter}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      )}
    </GlobalErrorBoundary>
  );
}

export default function RootLayout() {
  // Bumping this remounts `RootLayoutContent` (via its own `key` below) —
  // including re-reading the (now hopefully null) `driverFirebaseInitError`
  // from firebase-client.ts — after a successful retry.
  const [bootAttempt, setBootAttempt] = useState(0);

  return (
    <ThemeProvider storage={storage} getSystemTheme={getSystemTheme}>
      <I18nProvider storage={storage}>
        <RootLayoutContent bootAttempt={bootAttempt} onRetry={() => setBootAttempt((n) => n + 1)} />
      </I18nProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 16 },
  centerText: { textAlign: "center" },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
});
