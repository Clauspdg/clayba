import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, I18nProvider, ThemeProvider, type ResolvedTheme } from "@the-ride/hooks";
import { Stack } from "expo-router";
import { Appearance } from "react-native";

import { driverAuthAdapter } from "@/lib/firebase-client";

const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};

function getSystemTheme(): ResolvedTheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

export default function RootLayout() {
  return (
    <ThemeProvider storage={storage} getSystemTheme={getSystemTheme}>
      <I18nProvider storage={storage}>
        <AuthProvider adapter={driverAuthAdapter}>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
