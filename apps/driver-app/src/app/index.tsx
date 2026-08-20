import { Role } from "@the-ride/types";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme/tokens";

/** Splash — briefly shows the brand mark, then routes based on the real session (Sprint 5, Part 2): straight to /home if already a signed-in driver, otherwise /welcome. */
export default function SplashScreen() {
  const { t } = useTranslation();
  const { status, session } = useAuth();

  useEffect(() => {
    if (status === "loading") return;

    const timer = setTimeout(() => {
      const isDriver = status === "authenticated" && session?.claims.role === Role.DRIVER;
      router.replace(isDriver ? "/home" : "/welcome");
    }, 1200);
    return () => clearTimeout(timer);
  }, [status, session]);

  return (
    <Screen style={styles.center}>
      <View style={styles.logo}>
        <AppText variant="heading" style={styles.logoText}>
          »
        </AppText>
      </View>
      <AppText variant="subheading" style={styles.appName}>
        {t("common.driverAppName")}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 16 },
  logo: {
    height: 72,
    width: 72,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.brandForeground },
  appName: { marginTop: 4 },
});
