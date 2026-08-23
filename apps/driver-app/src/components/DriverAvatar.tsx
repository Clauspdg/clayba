import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { radius } from "@/theme/tokens";

import { AppText } from "./AppText";

function getInitials(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Real photo when one loads successfully; an honest initials circle
 * otherwise — never a placeholder silhouette pretending to be a real
 * photo, and never React Native's broken-image glyph either: a stale or
 * invalid `photoURL` (deleted Storage object, bad seed data, expired
 * link) falls back to initials via `onError` rather than rendering a
 * visibly broken image.
 */
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
  const [failed, setFailed] = useState(false);
  const dimension = { width: size, height: size, borderRadius: radius.full };

  if (photoURL && !failed) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={dimension}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.fallback, dimension, { backgroundColor: palette.surfaceElevated }]}>
      <AppText variant="subheading" tone="brand">
        {getInitials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
});
