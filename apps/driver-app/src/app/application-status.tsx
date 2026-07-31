import { DriverApplicationStatus } from "@the-ride/types";
import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

const STATUS_LABEL_KEY: Record<DriverApplicationStatus, string> = {
  [DriverApplicationStatus.DRAFT]: "becomeDriver.statusDraft",
  [DriverApplicationStatus.SUBMITTED]: "becomeDriver.statusSubmitted",
  [DriverApplicationStatus.DOCUMENTS_PENDING]: "becomeDriver.statusDocumentsPending",
  [DriverApplicationStatus.BACKGROUND_CHECK]: "becomeDriver.statusBackgroundCheck",
  [DriverApplicationStatus.VEHICLE_INSPECTION]: "becomeDriver.statusVehicleInspection",
  [DriverApplicationStatus.INTERVIEW]: "becomeDriver.statusInterview",
  [DriverApplicationStatus.APPROVED]: "becomeDriver.statusApproved",
  [DriverApplicationStatus.REJECTED]: "becomeDriver.statusRejected",
  [DriverApplicationStatus.ACTIVATED]: "becomeDriver.statusActivated",
  [DriverApplicationStatus.SUSPENDED]: "becomeDriver.statusSuspended",
  [DriverApplicationStatus.ARCHIVED]: "becomeDriver.statusArchived",
};

/**
 * Static placeholder status — no live application data is wired up this
 * sprint (see docs/ui-architecture.md). `ACTIVATED` so this screen can
 * hand off to the Sprint 4 driver dashboard (`/home`), the same way
 * Sprint 3 wired the passenger app's `create-profile` screen to `/booking`
 * once that feature existed.
 */
const CURRENT_STATUS = DriverApplicationStatus.ACTIVATED;

export default function ApplicationStatusScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <AppText variant="heading">{t("becomeDriver.applicationStatusTitle")}</AppText>
      <AppText variant="muted" style={{ marginTop: 4, marginBottom: 24 }}>
        {t("becomeDriver.applicationStatusSubtitle")}
      </AppText>
      <AppCard>
        <View style={{ gap: 4 }}>
          <AppText variant="subheading">{t(STATUS_LABEL_KEY[CURRENT_STATUS])}</AppText>
        </View>
      </AppCard>
      {CURRENT_STATUS === DriverApplicationStatus.ACTIVATED && (
        <AppButton label={t("driverHome.continueToDashboard")} onPress={() => router.replace("/home")} style={{ marginTop: 24 }} />
      )}
    </Screen>
  );
}
