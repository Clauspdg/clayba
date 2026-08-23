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
 * Whether a real Google Maps API key is configured. On Android,
 * react-native-maps always renders through the native Google Maps SDK
 * regardless of provider — with no key (or an invalid one), the native
 * SDK can throw during MapView init (e.g.
 * `IllegalStateException: API key not found`), which is a NATIVE crash
 * a JS error boundary cannot catch and terminates the app outright
 * (confirmed on a real device: "Something went wrong with CLAYBA
 * Driver... closed because this app has a bug", specifically when
 * opening Home). Rendering the real `<MapView>` is gated on this so a
 * missing key degrades to a placeholder instead of crashing the app —
 * see `.env.example` for how to provision a real key.
 */
const HAS_MAPS_KEY = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

/**
 * Full-bleed map behind the Home screen's status overlay/bottom sheet.
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

  if (!HAS_MAPS_KEY) {
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.placeholder,
          { backgroundColor: palette.surface },
        ]}
      >
        <Ionicons name="map-outline" size={40} color={palette.textMuted} />
      </View>
    );
  }

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
  placeholder: { alignItems: "center", justifyContent: "center" },
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
