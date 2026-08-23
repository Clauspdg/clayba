import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@the-ride/hooks";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";

import { usePalette } from "@/theme/usePalette";
import { darkMapStyle, lightMapStyle } from "@/theme/mapStyle";
import { elevation, radius } from "@/theme/tokens";

export interface DriverMapHandle {
  recenter: () => void;
}

const DEFAULT_DELTA = { latitudeDelta: 0.015, longitudeDelta: 0.015 };

/**
 * Full-bleed map behind the Home screen's status overlay/bottom sheet.
 * Wraps `react-native-maps` (Android always renders through the native
 * Google Maps SDK regardless of provider — there's no non-Google fallback
 * on this platform). Real device rendering depends on
 * `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` actually being set to a valid,
 * Android-enabled key (see app.json's react-native-maps plugin config);
 * that key is currently empty in this repo, so tiles will not render
 * until one is provisioned — the marker/overlay/layout logic below is
 * otherwise complete and does not depend on the key.
 */
export const DriverMapView = forwardRef<
  DriverMapHandle,
  { location: { lat: number; lng: number } | null }
>(function DriverMapView({ location }, ref) {
  const palette = usePalette();
  const { resolvedTheme } = useTheme();
  const mapRef = useRef<MapView>(null);

  const region: Region = location
    ? { latitude: location.lat, longitude: location.lng, ...DEFAULT_DELTA }
    : // Real fallback when the driver's location isn't known yet — not a
      // fabricated "current position", just a neutral starting viewport.
      { latitude: 0, longitude: 0, latitudeDelta: 40, longitudeDelta: 40 };

  useImperativeHandle(ref, () => ({
    recenter() {
      if (!location) return;
      mapRef.current?.animateToRegion(
        { latitude: location.lat, longitude: location.lng, ...DEFAULT_DELTA },
        300,
      );
    },
  }));

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={resolvedTheme === "dark" ? darkMapStyle : lightMapStyle}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.lat, longitude: location.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.markerRing, { borderColor: palette.primary }]}>
              <View style={[styles.markerDot, { backgroundColor: palette.primary }]}>
                <Ionicons name="car" size={14} color={palette.primaryForeground} />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {location && (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            mapRef.current?.animateToRegion(
              { latitude: location.lat, longitude: location.lng, ...DEFAULT_DELTA },
              300,
            )
          }
          style={({ pressed }) => [
            styles.recenterButton,
            elevation.card,
            { backgroundColor: palette.surface, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="locate" size={20} color={palette.textPrimary} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  markerRing: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  markerDot: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  recenterButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
