import { useTranslation } from "@the-ride/hooks";
import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { usePalette } from "@/theme/usePalette";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);

  const rows = [
    { label: t("settings.pushNotifications"), value: push, onChange: setPush },
    { label: t("settings.emailNotifications"), value: email, onChange: setEmail },
    { label: t("settings.smsNotifications"), value: sms, onChange: setSms },
  ];

  return (
    <Screen>
      <AppText variant="heading">{t("settings.notifications")}</AppText>
      <View style={styles.list}>
        {rows.map((row) => (
          <AppCard key={row.label} style={styles.row}>
            <AppText variant="body">{row.label}</AppText>
            <Switch
              value={row.value}
              onValueChange={row.onChange}
              trackColor={{ true: palette.primary, false: palette.border }}
            />
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 20, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
