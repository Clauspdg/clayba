import { useTranslation } from "@the-ride/hooks";

import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

export default function TermsScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <AppText variant="heading">{t("website.termsOfService.title")}</AppText>
      <AppText variant="body" style={{ marginTop: 12 }}>
        {t("website.termsOfService.body")}
      </AppText>
    </Screen>
  );
}
