import { useDriverSession } from "@/features/drivers/useDriverSession";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { Image, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { colors, radius, spacing } from "@/theme/tokens";

/** CLAYBA P2 — Profile (section 25): real driver name/status/vehicle/plate, no sensitive documents exposed (those already live behind their own gated screen — `upload-documents.tsx`/document review, not duplicated here). */
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

      <AppCard style={styles.identityCard}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <AppText variant="subheading" style={styles.avatarInitial}>
              {(session?.displayName ?? session?.email ?? "?").charAt(0).toUpperCase()}
            </AppText>
          </View>
        )}
        <View style={styles.identityText}>
          <AppText variant="subheading">{session?.displayName ?? session?.email ?? "—"}</AppText>
          {driver && (
            <AppText variant="muted">{t(`driverHome.status.${driver.availabilityStatus}`)}</AppText>
          )}
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <AppText variant="muted">{t("driverSpace.home.vehicleCardTitle")}</AppText>
        {vehicle ? (
          <AppText variant="body">
            {vehicle.color} {vehicle.make} {vehicle.model} · {vehicle.plateNumber}
          </AppText>
        ) : (
          <AppText variant="body">{t("driverSpace.home.noVehicle")}</AppText>
        )}
      </AppCard>

      {driver && (
        <AppCard style={styles.section}>
          <AppText variant="muted">{t("driverSpace.home.ratingLabel")}</AppText>
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
  avatar: { width: 56, height: 56, borderRadius: radius.full },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: colors.brandForeground },
  identityText: { gap: 2 },
  section: { gap: 4 },
  actions: { gap: spacing.sm, marginTop: "auto" },
});
