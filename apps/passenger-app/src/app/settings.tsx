import { useAuth, useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const items: { label: string; href: "/language" | "/notifications" | "/help" | "/privacy" | "/terms" | "/about" }[] = [
    { label: t("settings.language"), href: "/language" },
    { label: t("settings.notifications"), href: "/notifications" },
    { label: t("settings.help"), href: "/help" },
    { label: t("settings.privacy"), href: "/privacy" },
    { label: t("settings.terms"), href: "/terms" },
    { label: t("settings.about"), href: "/about" },
  ];

  async function handleLogOut() {
    await signOut();
    router.replace("/welcome");
  }

  return (
    <Screen>
      <AppText variant="heading">{t("settings.title")}</AppText>
      <View style={styles.list}>
        {items.map((item) => (
          <Pressable key={item.href} onPress={() => router.push(item.href)}>
            <AppCard>
              <AppText variant="body">{item.label}</AppText>
            </AppCard>
          </Pressable>
        ))}
        <Pressable onPress={() => void handleLogOut()}>
          <AppCard>
            <AppText variant="body">{t("settings.logOut")}</AppText>
          </AppCard>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 20, gap: 12 },
});
