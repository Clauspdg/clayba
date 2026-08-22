import { useDriverSession } from "@/features/drivers/useDriverSession";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { DriverAvailabilityStatus } from "@the-ride/types";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { DriverAvatar } from "@/components/DriverAvatar";
import { Screen } from "@/components/Screen";
import { StatusBadge } from "@/components/StatusBadge";
import { spacing } from "@/theme/tokens";

/** CLAYBA Driver V2 — Profile tab. Real driver name/status/vehicle/rating, no sensitive documents exposed (those already live behind their own gated screen — upload-documents.tsx/document review, not duplicated here). */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const { driver, vehicle } = useDriverSession();

  const profilePhoto = driver?.documents.find((doc) => doc.type === "profile_photo")?.url;

  async function handleLogOut() {
    await signOut();
    router.replace("/welcome");
  }

  return (
    <Screen style={styles.container}>
      <AppText variant="heading">{t("profile.title")}</AppText>

      <AppCard variant="elevated" style={styles.identityCard}>
        <DriverAvatar
          photoURL={profilePhoto}
          name={session?.displayName ?? session?.email}
          size={64}
        />
        <View style={styles.identityText}>
          <AppText variant="subheading">{session?.displayName ?? session?.email ?? "—"}</AppText>
          {driver && (
            <StatusBadge
              label={t(`driverHome.status.${driver.availabilityStatus}`)}
              tone={
                driver.availabilityStatus === DriverAvailabilityStatus.OFFLINE
                  ? "neutral"
                  : "success"
              }
            />
          )}
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <AppText variant="caption" tone="muted">
          {t("driverSpace.home.vehicleCardTitle")}
        </AppText>
        {vehicle ? (
          <AppText variant="body">
            {vehicle.color} {vehicle.make} {vehicle.model} · {vehicle.plateNumber}
          </AppText>
        ) : (
          <AppText variant="body" tone="muted">
            {t("driverSpace.home.noVehicle")}
          </AppText>
        )}
      </AppCard>

      {driver && (
        <AppCard style={styles.section}>
          <AppText variant="caption" tone="muted">
            {t("driverSpace.home.ratingLabel")}
          </AppText>
          <AppText variant="body">★ {driver.rating.toFixed(1)}</AppText>
        </AppCard>
      )}

      <View style={styles.actions}>
        <AppButton
          label={t("settings.title")}
          variant="outline"
          onPress={() => router.push("/settings")}
        />
        <AppButton
          label={t("settings.logOut")}
          variant="danger"
          onPress={() => void handleLogOut()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  identityCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  identityText: { gap: 6 },
  section: { gap: 4 },
  actions: { gap: spacing.sm, marginTop: "auto" },
});
