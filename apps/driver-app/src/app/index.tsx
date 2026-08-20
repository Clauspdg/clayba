import { Role } from "@the-ride/types";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet } from "react-native";

import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

/** How long auth-session restore may block the first screen before this splash gives up and falls through to Login anyway (brief Phase 5 — "aucun service secondaire ne doit bloquer indéfiniment le premier rendu"). */
const AUTH_RESTORE_TIMEOUT_MS = 6000;

/** Splash — briefly shows the brand mark, then routes based on the real session (Sprint 5, Part 2): straight to /home if already a signed-in driver, otherwise /welcome. */
export default function SplashScreen() {
  const { t } = useTranslation();
  const { status, session } = useAuth();

  useEffect(() => {
    console.warn("[boot] Splash: auth status =", status);
    if (status === "loading") return;

    const timer = setTimeout(() => {
      const isDriver = status === "authenticated" && session?.claims.role === Role.DRIVER;
      console.warn("[boot] Splash: navigating to", isDriver ? "/home" : "/welcome");
      router.replace(isDriver ? "/home" : "/welcome");
    }, 1200);
    return () => clearTimeout(timer);
  }, [status, session]);

  // CLAYBA Driver P0, Phase 5 — session restore normally resolves almost
  // immediately (from AsyncStorage-backed persistence), but must never be
  // able to strand the app on this splash forever if it doesn't: falling
  // through to Login is always safe (a real session just re-authenticates
  // instantly), unlike waiting indefinitely for a state that never arrives.
  useEffect(() => {
    if (status !== "loading") return;
    const timeout = setTimeout(() => {
      console.warn("[boot] Splash: auth restore timed out, falling through to /welcome");
      router.replace("/welcome");
    }, AUTH_RESTORE_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [status]);

  return (
    <Screen style={styles.center}>
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports -- RN requires static require() for bundled images */}
      <Image source={require("../../assets/splash.png")} style={styles.logo} resizeMode="contain" />
      <AppText variant="subheading" style={styles.appName}>
        {t("common.driverAppName")}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 16 },
  logo: { height: 72, width: 72 },
  appName: { marginTop: 4 },
});
