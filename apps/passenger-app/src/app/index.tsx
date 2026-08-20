import { Role } from "@the-ride/types";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet } from "react-native";

import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

/** Splash — briefly shows the brand mark, then routes based on the real session (Sprint 5, Part 2): straight to /booking if already a signed-in passenger, otherwise /welcome. */
export default function SplashScreen() {
  const { t } = useTranslation();
  const { status, session } = useAuth();

  useEffect(() => {
    if (status === "loading") return;

    const timer = setTimeout(() => {
      const isPassenger = status === "authenticated" && session?.claims.role === Role.PASSENGER;
      router.replace(isPassenger ? "/booking" : "/welcome");
    }, 1200);
    return () => clearTimeout(timer);
  }, [status, session]);

  return (
    <Screen style={styles.center}>
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports -- RN requires static require() for bundled images */}
      <Image source={require("../../assets/splash.png")} style={styles.logo} resizeMode="contain" />
      <AppText variant="subheading" style={styles.appName}>
        {t("common.appName")}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 16 },
  logo: { height: 72, width: 72 },
  appName: { marginTop: 4 },
});
