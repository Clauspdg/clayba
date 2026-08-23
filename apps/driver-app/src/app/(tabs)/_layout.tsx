import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@the-ride/hooks";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePalette } from "@/theme/usePalette";

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * CLAYBA Driver V3 — persistent bottom navigation (brief section 4): Home,
 * Rides, Earnings, Wallet, Profile. Every one of these is a route that
 * already exists with real backend data behind it (Rides = the existing
 * trip-history screen, Earnings = the existing `useDriverEarningsSummary`
 * hook already used on Home, Wallet = the same `subscribeMyWallet`/
 * `subscribeMyTransactions` client functions the passenger app already
 * uses for real, read-only wallet data) — no new backend, no fabricated
 * fifth destination.
 *
 * V2 used plain glyph characters here specifically to avoid an untested
 * native dependency after the expo-linking white-screen incident. V3
 * upgrades to `@expo/vector-icons` — a first-party Expo package (bundled
 * font assets via `expo-font`, which is already part of the Expo SDK
 * every screen in this app already depends on), not a new,
 * independently-risky native module. Verified via a real device build +
 * `adb logcat` before being treated as safe (see the mission report).
 */
const ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  home: { active: "home", inactive: "home-outline" },
  rides: { active: "list", inactive: "list-outline" },
  earnings: { active: "cash", inactive: "cash-outline" },
  wallet: { active: "wallet", inactive: "wallet-outline" },
  profile: { active: "person", inactive: "person-outline" },
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
          title: t("driverHome.navHome"),
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
          title: t("driverHome.navRides"),
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
        name="earnings"
        options={{
          title: t("driverSpace.nav.earnings"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? ICONS.earnings!.active : ICONS.earnings!.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t("driverSpace.nav.wallet"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? ICONS.wallet!.active : ICONS.wallet!.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.title"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? ICONS.profile!.active : ICONS.profile!.inactive}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
