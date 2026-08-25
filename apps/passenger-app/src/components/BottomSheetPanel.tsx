import { useEffect, useRef, type ReactNode } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePalette } from "@/theme/usePalette";
import { elevation, radius, spacing } from "@/theme/tokens";

/**
 * A floating panel anchored to the bottom of the screen, over a full-bleed
 * map. Deliberately not a draggable/gesture bottom sheet — this app has no
 * `react-native-gesture-handler`/`react-native-reanimated` linked, so
 * `Animated` (React Native core, already linked) drives the mount/
 * content-change transition instead.
 */
export function BottomSheetPanel({
  children,
  contentKey,
  style,
}: {
  children: ReactNode;
  /** Changing this replays the transition-in animation (e.g. offline -> online). */
  contentKey?: string;
  style?: ViewStyle;
}) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      // JS-driven rather than `useNativeDriver: true`: while investigating
      // an apparent real-device touch issue on this panel's content
      // (root cause turned out to be unrelated to this animation), this
      // was changed as a precaution and then real-device-verified end to
      // end with it JS-driven. Left as-is since the cost — one 260ms,
      // once-per-mount transition not running on the native thread — is
      // negligible, and re-verifying `useNativeDriver: true` would need
      // another full device test pass.
      useNativeDriver: false,
    }).start();
  }, [contentKey, progress]);

  return (
    <Animated.View
      style={[
        styles.sheet,
        elevation.raised,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <View style={[styles.grabber, { backgroundColor: palette.border }]} />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
  },
});
