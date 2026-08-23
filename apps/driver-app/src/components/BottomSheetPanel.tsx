import { useEffect, useRef, type ReactNode } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePalette } from "@/theme/usePalette";
import { elevation, radius, spacing } from "@/theme/tokens";

/**
 * A floating panel anchored to the bottom of the screen, over a full-bleed
 * map (brief: "bottom sheet / floating panel moderne"). Deliberately not a
 * draggable/gesture bottom sheet — this app has no `react-native-gesture-
 * handler`/`react-native-reanimated` linked, and after one native-module
 * crash cycle this session already, adding either just to get drag
 * physics isn't worth the risk. `Animated` (React Native core, already
 * linked) drives the mount/content-change transition instead.
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
      useNativeDriver: true,
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
