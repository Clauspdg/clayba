import { Image, StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { radius } from "@/theme/tokens";

import { AppText } from "./AppText";

function getInitial(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

/** Real photo when the session has one (`session.photoURL`); an honest initials circle otherwise — never a placeholder silhouette pretending to be a real photo. */
export function DriverAvatar({
  photoURL,
  name,
  size = 44,
}: {
  photoURL?: string | null;
  name?: string | null;
  size?: number;
}) {
  const palette = usePalette();
  const dimension = { width: size, height: size, borderRadius: radius.full };

  if (photoURL) {
    return <Image source={{ uri: photoURL }} style={dimension} />;
  }

  return (
    <View style={[styles.fallback, dimension, { backgroundColor: palette.surfaceElevated }]}>
      <AppText variant="subheading" tone="brand">
        {getInitial(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
});
