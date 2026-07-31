import { useTranslation } from "@the-ride/hooks";
import { View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

export default function HelpScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <AppText variant="heading">{t("settings.helpCenter")}</AppText>
      <View style={{ marginTop: 24, gap: 12 }}>
        <AppCard>
          <AppText variant="subheading">{t("settings.faq")}</AppText>
        </AppCard>
        <AppCard>
          <AppText variant="subheading">{t("settings.contactSupport")}</AppText>
        </AppCard>
      </View>
    </Screen>
  );
}
