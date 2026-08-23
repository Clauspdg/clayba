import { useDriverSession } from "@/features/drivers/useDriverSession";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { DriverAvailabilityStatus } from "@the-ride/types";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { DriverAvatar } from "@/components/DriverAvatar";
import { ListDivider, ListRow } from "@/components/ListRow";
import { Screen } from "@/components/Screen";
import { StatusBadge } from "@/components/StatusBadge";
import { spacing } from "@/theme/tokens";

/** "jean phylippe" / "black nissan sirena" -> "Jean Phylippe" / "Black Nissan Sirena" — Firestore/user-entered strings arrive in arbitrary case; the profile header and vehicle mini-card must not visibly repeat that. */
function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** CLAYBA Driver V3 — Profile tab. A premium identity header (avatar, name, status, rating) followed by a list of sections, not a stack of separate cards (brief section 8). Real driver/vehicle/rating data only. */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const { driver, vehicle } = useDriverSession();

  const profilePhoto = driver?.documents.find((doc) => doc.type === "profile_photo")?.url;
  const displayName = session?.displayName ? toTitleCase(session.displayName) : "—";

  async function handleLogOut() {
    await signOut();
    router.replace("/welcome");
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <DriverAvatar photoURL={profilePhoto} name={displayName} size={72} />
        <AppText variant="title">{displayName}</AppText>
        <View style={styles.headerMeta}>
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
          {driver && (
            <AppText variant="body" tone="muted">
              ★ {driver.rating.toFixed(1)}
            </AppText>
          )}
        </View>
      </View>

      {vehicle && (
        <AppCard variant="elevated" style={styles.vehicleCard}>
          <AppText variant="subheading">{toTitleCase(`${vehicle.make} ${vehicle.model}`)}</AppText>
          <AppText variant="body" tone="muted">
            {toTitleCase(vehicle.color)} • {vehicle.plateNumber}
          </AppText>
        </AppCard>
      )}

      <AppCard style={styles.list}>
        <ListRow
          icon="car-outline"
          label={t("driverSpace.home.vehicleCardTitle")}
          onPress={() => router.push("/upload-documents")}
        />
        <ListDivider />
        <ListRow
          icon="document-text-outline"
          label={t("settings.documents")}
          onPress={() => router.push("/upload-documents")}
        />
        <ListDivider />
        <ListRow
          icon="person-outline"
          label={t("profile.personalInfo")}
          onPress={() => router.push("/personal-info")}
        />
        <ListDivider />
        <ListRow
          icon="shield-checkmark-outline"
          label={t("profile.driverStatus")}
          onPress={() => router.push("/application-status")}
        />
        <ListDivider />
        <ListRow
          icon="settings-outline"
          label={t("settings.title")}
          onPress={() => router.push("/settings")}
        />
        <ListDivider />
        <ListRow
          icon="help-circle-outline"
          label={t("settings.help")}
          onPress={() => router.push("/help")}
        />
      </AppCard>

      <AppCard style={styles.list}>
        <ListRow
          icon="log-out-outline"
          label={t("settings.logOut")}
          tone="danger"
          showChevron={false}
          onPress={() => void handleLogOut()}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  header: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  vehicleCard: { gap: 2 },
  list: { gap: 0, paddingVertical: spacing.xs },
});
