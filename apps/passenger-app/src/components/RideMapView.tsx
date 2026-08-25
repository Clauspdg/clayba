import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@the-ride/hooks";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";

import { usePalette } from "@/theme/usePalette";
import { darkMapStyle, lightMapStyle } from "@/theme/mapStyle";
import { elevation, radius } from "@/theme/tokens";

export interface RideMapHandle {
  /** Fits all currently-provided markers in view, or animates to the single one available. */
  recenter: () => void;
}

export interface RideMapPoint {
  lat: number;
  lng: number;
  heading?: number;
}

const DEFAULT_DELTA = { latitudeDelta: 0.015, longitudeDelta: 0.015 };

/**
 * Whether a real Google Maps API key is configured. On Android,
 * react-native-maps always renders through the native Google Maps SDK
 * regardless of provider — with no key (or an invalid one), the native
 * SDK can throw during MapView init (e.g.
 * `IllegalStateException: API key not found`), which is a NATIVE crash a
 * JS error boundary cannot catch and terminates the app outright — the
 * exact CLAYBA Driver v0.1.6 regression. Rendering the real `<MapView>` is
 * gated on this so a missing key degrades to a placeholder instead of
 * crashing the app — see `.env.example` for how to provision a real key.
 */
const HAS_MAPS_KEY = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

/**
 * Full-bleed ride map — Home's current-location view, the booking flow's
 * route preview, and the active-ride live-tracking view all share this one
 * component rather than each building their own `<MapView>`. Generalizes
 * CLAYBA Driver's `DriverMapView` (single marker) to the passenger's
 * multi-marker needs: pickup pin, destination pin, and a live driver
 * marker, plus an optional route polyline.
 */
export const RideMapView = forwardRef<
  RideMapHandle,
  {
    pickup?: RideMapPoint | null;
    destination?: RideMapPoint | null;
    driver?: RideMapPoint | null;
    polyline?: RideMapPoint[];
  }
>(function RideMapView({ pickup, destination, driver, polyline }, ref) {
  const palette = usePalette();
  const { resolvedTheme } = useTheme();
  const mapRef = useRef<MapView>(null);

  const points = useMemo(
    () => [pickup, destination, driver].filter((p): p is RideMapPoint => Boolean(p)),
    [pickup, destination, driver],
  );

  const primary = driver ?? pickup ?? destination ?? null;
  const region: Region = primary
    ? { latitude: primary.lat, longitude: primary.lng, ...DEFAULT_DELTA }
    : // Real fallback when no location is known yet — not a fabricated
      // "current position", just a neutral starting viewport.
      { latitude: 0, longitude: 0, latitudeDelta: 40, longitudeDelta: 40 };

  function focus() {
    if (points.length > 1) {
      mapRef.current?.fitToCoordinates(
        points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true },
      );
    } else if (points.length === 1) {
      mapRef.current?.animateToRegion(
        { latitude: points[0]!.lat, longitude: points[0]!.lng, ...DEFAULT_DELTA },
        300,
      );
    }
  }

  useImperativeHandle(ref, () => ({ recenter: focus }));

  if (!HAS_MAPS_KEY) {
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.placeholder,
          { backgroundColor: palette.background },
        ]}
      >
        <View style={[styles.placeholderRing, { borderColor: palette.primary }]}>
          <View style={[styles.placeholderDot, { backgroundColor: palette.surfaceElevated }]}>
            <Ionicons name="map-outline" size={28} color={palette.primary} />
          </View>
        </View>
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
        {polyline && polyline.length > 1 && (
          <Polyline
            coordinates={polyline.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={palette.primary}
            strokeWidth={4}
          />
        )}

        {pickup && (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.markerRing, { borderColor: palette.success }]}>
              <View style={[styles.markerDot, { backgroundColor: palette.success }]}>
                <Ionicons name="radio-button-on" size={12} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        )}

        {destination && (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.markerRing, { borderColor: palette.danger }]}>
              <View style={[styles.markerDot, { backgroundColor: palette.danger }]}>
                <Ionicons name="flag" size={12} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        )}

        {driver && (
          <Marker
            coordinate={{ latitude: driver.lat, longitude: driver.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={driver.heading}
          >
            <View style={[styles.markerRing, { borderColor: palette.primary }]}>
              <View style={[styles.markerDot, { backgroundColor: palette.primary }]}>
                <Ionicons name="car" size={14} color={palette.primaryForeground} />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {points.length > 0 && (
        <Pressable
          accessibilityRole="button"
          onPress={focus}
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
  placeholderRing: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderDot: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
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
