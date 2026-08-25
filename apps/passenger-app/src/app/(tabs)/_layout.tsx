import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@the-ride/hooks";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePalette } from "@/theme/usePalette";

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Persistent bottom navigation: Home, Rides, Saved, Account. Every one of
 * these is a route with real backend data behind it (Rides =
 * `subscribeMyTrips`, Saved = `subscribeFavoritePlaces`, Account's Wallet
 * row = the same `subscribeMyWallet`/`subscribeMyTransactions` client
 * functions CLAYBA Driver already uses) — same pattern as Driver's own
 * `(tabs)/_layout.tsx`, no new bottom-nav architecture invented here.
 */
const ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  home: { active: "home", inactive: "home-outline" },
  rides: { active: "list", inactive: "list-outline" },
  saved: { active: "bookmark", inactive: "bookmark-outline" },
  account: { active: "person", inactive: "person-outline" },
};

export default function TabsLayout() {
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 2 : 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("passengerNav.tabHome"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? ICONS.home!.active : ICONS.home!.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: t("passengerNav.tabRides"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? ICONS.rides!.active : ICONS.rides!.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t("passengerNav.tabSaved"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? ICONS.saved!.active : ICONS.saved!.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("passengerNav.tabProfile"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? ICONS.account!.active : ICONS.account!.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
