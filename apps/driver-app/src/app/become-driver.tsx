import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

export default function BecomeDriverScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
        <AppText variant="heading">{t("becomeDriver.title")}</AppText>
        <AppText variant="body">{t("becomeDriver.subtitle")}</AppText>
      </View>
      <AppButton label={t("becomeDriver.applyNow")} onPress={() => router.push("/driver-application")} />
    </Screen>
  );
}
