import { uploadDriverDocument, uploadDriverProfilePhoto, uriToBlob, type DriverDocumentType } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";

type UploadStatus = "idle" | "uploading" | "done" | "error";

interface DocumentRow {
  key: string;
  label: string;
  /** `null` means "profile photo" — a driver profile photo, not a `DriverDocumentType`. */
  documentType: DriverDocumentType | null;
}

export default function UploadDocumentsScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [status, setStatus] = useState<Record<string, UploadStatus>>({});

  const rows: DocumentRow[] = [
    { key: "drivers_license", label: t("becomeDriver.license"), documentType: "drivers_license" },
    { key: "vehicle_insurance", label: t("becomeDriver.insurance"), documentType: "vehicle_insurance" },
    { key: "vehicle_registration", label: t("becomeDriver.registration"), documentType: "vehicle_registration" },
    { key: "profile_photo", label: t("becomeDriver.profilePhoto"), documentType: null },
  ];

  async function handleUpload(row: DocumentRow) {
    if (!session) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    setStatus((previous) => ({ ...previous, [row.key]: "uploading" }));
    try {
      const blob = await uriToBlob(result.assets[0].uri);
      if (row.documentType) {
        await uploadDriverDocument(session.uid, row.documentType, blob);
      } else {
        await uploadDriverProfilePhoto(session.uid, blob);
      }
      setStatus((previous) => ({ ...previous, [row.key]: "done" }));
    } catch {
      setStatus((previous) => ({ ...previous, [row.key]: "error" }));
    }
  }

  function uploadLabel(key: string): string {
    switch (status[key]) {
      case "uploading":
        return t("common.loading");
      case "done":
        return t("becomeDriver.uploaded");
      case "error":
        return t("becomeDriver.uploadFailed");
      default:
        return t("becomeDriver.upload");
    }
  }

  return (
    <Screen>
      <AppText variant="heading">{t("becomeDriver.uploadDocumentsTitle")}</AppText>
      <AppText variant="muted" style={styles.subtitle}>
        {t("becomeDriver.uploadDocumentsSubtitle")}
      </AppText>
      <View style={styles.list}>
        {rows.map((row) => (
          <AppCard key={row.key} style={styles.row}>
            <AppText variant="body">{row.label}</AppText>
            <AppButton
              label={uploadLabel(row.key)}
              variant="outline"
              style={styles.uploadButton}
              disabled={status[row.key] === "uploading"}
              onPress={() => void handleUpload(row)}
            />
          </AppCard>
        ))}
      </View>
      <AppButton label={t("common.continue")} onPress={() => router.push("/application-status")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 4, marginBottom: 24 },
  list: { flex: 1, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  uploadButton: { height: 36, paddingHorizontal: 16 },
});
