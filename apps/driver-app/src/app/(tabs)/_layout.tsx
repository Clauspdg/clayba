import { useTranslation } from "@the-ride/hooks";
import { Tabs } from "expo-router";
import { Text } from "react-native";

import { usePalette } from "@/theme/usePalette";

/**
 * CLAYBA Driver V2 — persistent bottom navigation (brief section 3): Home,
 * Rides, Earnings, Wallet, Profile. Every one of these is a route that
 * already exists with real backend data behind it (Rides = the existing
 * trip-history screen, Earnings = the existing `useDriverEarningsSummary`
 * hook already used on Home, Wallet = the same `subscribeMyWallet`/
 * `subscribeMyTransactions` client functions the passenger app already
 * uses for real, read-only wallet data) — no new backend, no fabricated
 * fifth destination.
 *
 * Icons are plain glyphs, not an icon library: this app deliberately has
 * zero non-Expo-maintained/non-declared native dependencies beyond what's
 * already proven to autolink correctly (see the P0 report's expo-linking
 * root cause) — adding an icon package now, untested, is exactly the kind
 * of change that already cost a full white-screen debugging cycle once.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const palette = usePalette();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("driverSpace.nav.home"),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⌂</Text>,
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: t("driverSpace.nav.trips"),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>≡</Text>,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: t("driverSpace.nav.earnings"),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>$</Text>,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t("driverSpace.nav.wallet"),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>▭</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.title"),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◍</Text>,
        }}
      />
    </Tabs>
  );
}
