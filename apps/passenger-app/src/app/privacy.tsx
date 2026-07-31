import { useTranslation } from "@the-ride/hooks";

import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <AppText variant="heading">{t("website.privacyPolicy.title")}</AppText>
      <AppText variant="body" style={{ marginTop: 12 }}>
        {t("website.privacyPolicy.body")}
      </AppText>
    </Screen>
  );
}
