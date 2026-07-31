import { uploadPassengerAvatar, uriToBlob } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { Screen } from "@/components/Screen";

export default function CreateProfileScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [avatarUploaded, setAvatarUploaded] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handlePickAvatar() {
    if (!session) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const blob = await uriToBlob(result.assets[0].uri);
      await uploadPassengerAvatar(session.uid, blob);
      setAvatarUploaded(true);
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <Screen>
      <AppText variant="heading">{t("auth.createProfileTitle")}</AppText>
      <AppText variant="muted" style={styles.subtitle}>
        {t("auth.createProfileSubtitle")}
      </AppText>
      <View style={styles.form}>
        <AppTextField label={t("auth.firstNameLabel")} autoCapitalize="words" />
        <AppTextField label={t("auth.lastNameLabel")} autoCapitalize="words" />
        <AppButton
          label={uploadingAvatar ? t("common.loading") : avatarUploaded ? t("becomeDriver.uploaded") : t("profile.uploadAvatar")}
          variant="outline"
          disabled={uploadingAvatar}
          onPress={() => void handlePickAvatar()}
        />
        <AppButton label={t("auth.createProfile")} onPress={() => router.replace("/booking")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: 4, marginBottom: 24 },
  form: { gap: 16 },
});
