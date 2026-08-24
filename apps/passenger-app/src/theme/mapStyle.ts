/**
 * Google Maps custom style JSON (the `customMapStyle` prop react-native-maps
 * passes straight to the native Google Maps SDK on Android). Light mode
 * uses a desaturated variant of Google's default rather than the raw
 * default — matching the app's "not clinically white" light background.
 * Dark mode is a real graphite map, not an inverted light map, matching
 * `theme/tokens.ts`'s dark palette (background ~#0B0C0E, roads/labels in
 * warm greys, no pure black/pure white anywhere). Same styles as
 * `apps/driver-app/src/theme/mapStyle.ts` — one CLAYBA map look, not a
 * second one invented for Passenger.
 */
export const lightMapStyle: Array<{
  elementType?: string;
  featureType?: string;
  stylers: Array<{ color?: string; visibility?: string }>;
}> = [
  { elementType: "geometry", stylers: [{ color: "#f6f7f8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f6f7f8" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#dcdcdc" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e3e3e3" }] },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f0d9c8" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9dce5" }] },
];

export const darkMapStyle: typeof lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0e1013" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8f98" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0e1013" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#26292e" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c1f24" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0e1013" }] },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7a7f87" }],
  },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a2a1d" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#0e1013" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#06090c" }] },
];
